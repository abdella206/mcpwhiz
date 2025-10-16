import { NextRequest, NextResponse } from 'next/server'
import { spawn, execSync, ChildProcess } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { activeSessions } from '@/lib/session-store'
import { createServer } from 'net'

// Server timeout configuration (5 minutes for testing)
const SERVER_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

// Helper function to get the correct temp directory path
function getTempDir(sessionId: string): string {
  // Use /tmp in production (Lambda) or .temp in development
  const baseTempDir = process.env.NODE_ENV === 'production' 
    ? '/tmp' 
    : process.cwd()
  return join(baseTempDir, '.temp', sessionId)
}

// Helper function to get the base URL for server URLs
function getBaseUrl(request: NextRequest): string {
  // Get the host from the request headers
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost'
  }
  
  // In production, use the actual host
  return `${protocol}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // Generate unique session ID
    const sessionId = randomUUID()
    
    // Initialize logging early
    const logs: string[] = []
    const addLog = (message: string) => {
      logs.push(`[${new Date().toISOString()}] ${message}`)
      const session = activeSessions.get(sessionId)
      if (session) {
        session.logs.push(`[${new Date().toISOString()}] ${message}`)
      }
    }
    
    // Store detected Python path for later use
    let detectedPythonPath = 'python3'
    
    // Dynamic port allocation to avoid conflicts
    // Find an available port starting from 8000
    const findAvailablePort = async (startPort: number = 8000): Promise<number> => {
      return new Promise((resolve) => {
        const server = createServer()
        server.listen(startPort, () => {
          const { port } = server.address() as { port: number }
          server.close(() => resolve(port))
        })
        server.on('error', () => {
          // Port is in use, try next one
          resolve(findAvailablePort(startPort + 1))
        })
      })
    }
    
    const port = await findAvailablePort(8000)
    addLog(`🔌 Allocated port: ${port}`)
    
    // For Python servers, ensure only one runs at a time (port 8000)
    if (language === 'python') {
      try {
        // More aggressive cleanup - kill all Python processes and processes on port 8000
        execSync('pkill -f "python" || true', { stdio: 'ignore' })
        execSync('pkill -f "uvicorn" || true', { stdio: 'ignore' })
        execSync('lsof -ti:8000 | xargs kill -9 || true', { stdio: 'ignore' })
        execSync('fuser -k 8000/tcp || true', { stdio: 'ignore' })
        addLog(`🧹 Aggressive cleanup: killed all Python processes and processes on port 8000`)
        
        // Wait longer for processes to terminate
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Simple port check - just verify no processes are using port 8000
        try {
          const portCheck = execSync('lsof -ti:8000', { stdio: 'pipe' })
          if (portCheck.toString().trim()) {
            addLog(`⚠️ Port 8000 still has processes, doing final cleanup`)
            execSync('lsof -ti:8000 | xargs kill -9 || true', { stdio: 'ignore' })
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          addLog(`✅ Port 8000 cleanup completed`)
        } catch {
          // lsof returns non-zero if no processes found - this is good
          addLog(`✅ Port 8000 is free (no processes found)`)
        }
        
      } catch (error) {
        addLog(`❌ Port cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        throw error
      }
    }

    // Create temporary directory for this session
    const tempDir = getTempDir(sessionId)
    mkdirSync(tempDir, { recursive: true })

    // Write the code to a file
    const fileExtension = language === 'python' ? 'py' : 'ts'
    const fileName = `server.${fileExtension}`
    const filePath = join(tempDir, fileName)
    
    // Modify the code to use the dynamic port (TypeScript only)
    let modifiedCode = code
    
    if (language === 'typescript') {
      modifiedCode = code
        .replace(/const PORT = \d+;/, `const PORT = ${port};`)
        .replace(/\.listen\(\d+/g, `.listen(${port}`)
        .replace(/port \d+/g, `port ${port}`)
    }
    // Python uses default port 8000, no modification needed
    
    writeFileSync(filePath, modifiedCode)

    // Create package.json for TypeScript projects
    if (language === 'typescript') {
      const packageJson = {
        name: `mcp-server-${sessionId}`,
        version: '1.0.0',
        type: 'module',
        dependencies: {
          '@modelcontextprotocol/sdk': '^1.17.3',
          'express': '^4.18.2',
          'zod': '^3.24.1'
        }
      }
      writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    }

    // Create requirements.txt for Python projects
    if (language === 'python') {
      const requirements = `mcp>=1.0.0
httpx>=0.27.0
pydantic>=2.0.0`
      writeFileSync(join(tempDir, 'requirements.txt'), requirements)
    }

    if (language === 'typescript') {
      addLog('📦 Installing TypeScript dependencies...')
      addLog('⏳ Running npm install (this may take 30-60 seconds)...')
    } else {
      addLog('🐍 Setting up Python environment...')
      addLog('🔍 Detecting available Python command...')
      addLog('📦 Creating virtual environment...')
      addLog('⏳ This process may take 1-2 minutes for first-time setup...')
    }

    // Install dependencies based on language
    let installCommand: string[]
    let installArgs: string[]

    if (language === 'typescript') {
      installCommand = ['npm']
      installArgs = ['install']
    } else {
      // Python: Create virtual environment and install packages
      // Check which Python command is available - Railway specific
      const pythonCommands = [
        '/opt/venv/bin/python3',  // Our custom symlink
        'python3',
        'python',
        '/nix/store/*/bin/python3',  // Nix store path
        '/nix/store/*/bin/python',
        'python3.11'
      ]
      let pythonCmd = '/opt/venv/bin/python3' // default to our symlink
      let pythonFound = false
      
      // Try to find available Python command
      for (const cmd of pythonCommands) {
        try {
          // Use which to find the actual path if it's not absolute
          if (!cmd.startsWith('/')) {
            const whichResult = execSync(`which ${cmd} 2>/dev/null || echo ""`, { 
              encoding: 'utf8',
              timeout: 5000,
              shell: '/bin/bash'
            }).trim()
            
            if (whichResult) {
              pythonCmd = whichResult
              detectedPythonPath = whichResult  // Store for later use
              pythonFound = true
              addLog(`✅ Found Python at: ${whichResult}`)
              break
            }
          } else {
            // Try the absolute path
            try {
              execSync(`${cmd} --version 2>/dev/null`, { 
                stdio: 'ignore', 
                timeout: 5000,
                shell: '/bin/bash'
              })
              pythonCmd = cmd
              detectedPythonPath = cmd  // Store for later use
              pythonFound = true
              addLog(`✅ Found Python at: ${cmd}`)
              break
            } catch {
              continue
            }
          }
        } catch {
          // Try next command
          continue
        }
      }
      
      if (!pythonFound) {
        addLog(`⚠️ Trying comprehensive Python detection...`)
        try {
          // Try multiple fallback strategies
          const fallbackCommands = [
            // Check common locations
            `test -f /opt/venv/bin/python3 && echo "/opt/venv/bin/python3"`,
            `ls /nix/store/*/bin/python3 2>/dev/null | head -1`,
            `ls /nix/store/*/bin/python 2>/dev/null | head -1`,
            `which python3`,
            `which python`,
            `command -v python3`,
            `command -v python`
          ]
          
          for (const fallbackCmd of fallbackCommands) {
            try {
              const findResult = execSync(fallbackCmd, {
                encoding: 'utf8',
                timeout: 5000,
                shell: '/bin/bash'
              }).trim()
              
              if (findResult && !findResult.includes('not found')) {
                pythonCmd = findResult
                detectedPythonPath = findResult  // Store for later use
                pythonFound = true
                addLog(`✅ Found Python via fallback: ${findResult}`)
                break
              }
            } catch {
              continue
            }
          }
        } catch {
          addLog(`❌ Could not find Python installation`)
          addLog(`💡 Please ensure Python is installed via nixpacks.toml`)
        }
      }
      
      addLog(`🐍 Using Python: ${pythonCmd}`)
      
      // Check if we're in production (Railway/Vercel/etc)
      const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT
      
      if (isProduction) {
        // In production, skip venv creation - packages are pre-installed globally
        addLog(`🚀 Production mode: Using pre-installed Python packages`)
        addLog(`ℹ️  Skipping virtual environment creation`)
        installCommand = ['echo']
        installArgs = ['Python packages already installed in production']
      } else {
        // In development, create virtual environment
        addLog(`💻 Development mode: Creating virtual environment`)
        installCommand = [pythonCmd]
      installArgs = ['-m', 'venv', 'venv']
      }
    }

    const installProcess = spawn(installCommand[0], installArgs, {
      cwd: tempDir,
      shell: true
    })

    installProcess.stdout.on('data', (data) => {
      addLog(data.toString())
    })

    installProcess.stderr.on('data', (data) => {
      addLog(`⚠️ ${data.toString()}`)
    })

    await new Promise<void>((resolve, reject) => {
      installProcess.on('close', async (code) => {
        if (code === 0) {
          if (language === 'python') {
            const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT
            
            if (isProduction) {
              // In production, packages are pre-installed globally
              addLog('✅ Using globally installed Python packages')
              resolve()
            } else {
              // In development, install packages in virtual environment
            addLog('✅ Virtual environment created successfully')
            addLog('📦 Installing Python packages (mcp, httpx, pydantic)...')
            addLog('⏳ Downloading and installing packages (may take 1-2 minutes)...')
              // Determine the correct pip executable path based on OS
              const isWindows = process.platform === 'win32'
              const venvPipDir = isWindows ? 'Scripts' : 'bin'
              const pipExecutable = isWindows ? 'pip.exe' : 'pip'
              const venvPip = join(tempDir, 'venv', venvPipDir, pipExecutable)
              
              const pipInstall = spawn(venvPip, ['install', '-r', 'requirements.txt'], {
              cwd: tempDir,
              shell: true
            })

            pipInstall.stdout.on('data', (data) => {
              addLog(data.toString())
            })

            pipInstall.stderr.on('data', (data) => {
              addLog(`⚠️ ${data.toString()}`)
            })

            pipInstall.on('close', (pipCode) => {
              if (pipCode === 0) {
                addLog('✅ Python packages installed successfully')
                resolve()
              } else {
                addLog(`❌ Failed to install Python packages (exit code: ${pipCode})`)
                reject(new Error(`pip install failed with code ${pipCode}`))
              }
            })
            }
          } else {
            addLog('✅ Dependencies installed successfully')
            resolve()
          }
        } else {
          addLog(`❌ Failed to install dependencies (exit code: ${code})`)
          if (language === 'python') {
            addLog('💡 Virtual environment creation failed. This might be due to:')
            addLog('   - Python not properly installed')
            addLog('   - Insufficient permissions')
            addLog('   - Missing venv module')
            addLog('   - System Python environment restrictions')
            reject(new Error(`Python virtual environment creation failed with code ${code}`))
          } else {
          reject(new Error(`${language === 'typescript' ? 'npm' : 'venv'} install failed with code ${code}`))
          }
        }
      })
    })

    const baseUrl = getBaseUrl(request)
    // In production, use proxy route to avoid port issues
    // In development, connect directly to port
    // Note: The generated server code handles the /mcp endpoint
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? `${baseUrl}/api/mcp-proxy/${sessionId}`
      : `${baseUrl}:${port}`
    
    addLog('🚀 Starting server for testing...')
    addLog(`⏰ Server will auto-stop after 5 minutes`)
    addLog(`💡 This is for testing only - not for production use`)
    addLog(`📡 Server will be available at: ${serverUrl}`)
    if (language === 'python') {
      addLog(`ℹ️  Python servers use FastMCP's default port 8000`)
    }
    addLog(`🔗 Once running, click the URL to test your MCP server`)

    // Start the server
    let serverProcess: ChildProcess
    
    if (language === 'typescript') {
      // Use tsx to run TypeScript directly
      serverProcess = spawn('npx', ['tsx', fileName], {
        cwd: tempDir,
        shell: true,
        env: { ...process.env, PORT: port.toString() }
      })
    } else {
      // Run Python
      const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT
      let pythonCmd = detectedPythonPath  // Use the detected Python path from earlier
      
      if (isProduction) {
        // In production, use system Python (packages are pre-installed)
        addLog(`🐍 Using system Python with globally installed packages: ${detectedPythonPath}`)
        pythonCmd = detectedPythonPath
      } else {
        // In development, try virtual environment first, fallback to system Python
        const isWindows = process.platform === 'win32'
        const venvPythonDir = isWindows ? 'Scripts' : 'bin'
        const pythonExecutable = isWindows ? 'python.exe' : 'python'
        const venvPython = join(tempDir, 'venv', venvPythonDir, pythonExecutable)
        
        try {
          if (existsSync(venvPython)) {
            pythonCmd = venvPython
            addLog('🐍 Using virtual environment Python')
          } else {
            addLog('🐍 Using system Python (virtual environment not available)')
          }
        } catch {
          addLog('🐍 Using system Python (fallback)')
        }
      }
      
      // For Python servers, create a wrapper that uses the allocated port
      // This avoids modifying the generated server file
      const wrapperScript = `
import sys
import os
import socket
sys.path.insert(0, '${tempDir}')

# Import the generated server
import server
import uvicorn

# Get the port from environment variable, or find an available one
def find_available_port():
    """Find an available port by letting the OS assign one"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

port = int(os.environ.get("PORT", find_available_port()))

# Run the FastMCP server with uvicorn on the specified port
uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
`
      
      // Also create an app.py that exposes the FastMCP app for uvicorn
      const appCode = `
import sys
sys.path.insert(0, '.')
from server import mcp
import json

# Create a proper MCP ASGI app wrapper for uvicorn
class MCPApp:
    def __init__(self, mcp_instance):
        self.mcp = mcp_instance
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            await self.handle_http(scope, receive, send)
        else:
            await self.handle_other(scope, receive, send)
    
    async def handle_http(self, scope, receive, send):
        # Get the request
        body = b""
        while True:
            message = await receive()
            if message["type"] == "http.request":
                body += message.get("body", b"")
                if not message.get("more_body", False):
                    break
            elif message["type"] == "http.disconnect":
                return
        
        # Check if this is an MCP request
        if scope["path"] == "/mcp" or scope["path"].endswith("/mcp"):
            # Handle MCP protocol requests
            await self.handle_mcp_request(scope, body, send)
        else:
            # Handle regular HTTP requests
            await self.handle_regular_request(scope, body, send)
    
    async def handle_mcp_request(self, scope, body, send):
        # Check Accept header for text/event-stream
        headers = dict(scope.get("headers", []))
        accept = headers.get(b"accept", b"").decode("utf-8", errors="ignore")
        
        if "text/event-stream" not in accept:
            # Return proper MCP error response
            error_response = {
                "jsonrpc": "2.0",
                "id": "server-error",
                "error": {
                    "code": -32600,
                    "message": "Not Acceptable: Client must accept text/event-stream"
                }
            }
            
            await send({
                "type": "http.response.start",
                "status": 406,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"access-control-allow-origin", b"*"],
                    [b"access-control-allow-methods", b"GET, POST, OPTIONS"],
                    [b"access-control-allow-headers", b"Content-Type, Accept"]
                ],
            })
            await send({
                "type": "http.response.body",
                "body": json.dumps(error_response).encode("utf-8"),
            })
        else:
            # Handle MCP protocol properly
            try:
                # Parse the request body
                if body:
                    request_data = json.loads(body.decode("utf-8"))
                else:
                    request_data = {"jsonrpc": "2.0", "method": "ping", "id": "test"}
                
                # Process the MCP request
                response = await self.process_mcp_request(request_data)
                
                await send({
                    "type": "http.response.start",
                    "status": 200,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"access-control-allow-origin", b"*"],
                        [b"access-control-allow-methods", b"GET, POST, OPTIONS"],
                        [b"access-control-allow-headers", b"Content-Type, Accept"]
                    ],
                })
                await send({
                    "type": "http.response.body",
                    "body": json.dumps(response).encode("utf-8"),
                })
            except Exception as e:
                # Return error response
                error_response = {
                    "jsonrpc": "2.0",
                    "id": "server-error",
                    "error": {
                        "code": -32603,
                        "message": f"Internal error: {str(e)}"
                    }
                }
                
                await send({
                    "type": "http.response.start",
                    "status": 500,
                    "headers": [[b"content-type", b"application/json"]],
                })
                await send({
                    "type": "http.response.body",
                    "body": json.dumps(error_response).encode("utf-8"),
                })
    
    async def handle_regular_request(self, scope, body, send):
        # Handle regular HTTP requests (like health checks)
        response_body = {
            "status": "running",
            "server": "MCP Server",
            "protocol": "MCP",
            "version": "1.0.0"
        }
        
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [
                [b"content-type", b"application/json"],
                [b"access-control-allow-origin", b"*"]
            ],
        })
        await send({
            "type": "http.response.body",
            "body": json.dumps(response_body).encode("utf-8"),
        })
    
    async def process_mcp_request(self, request_data):
        # Process MCP protocol requests
        method = request_data.get("method", "ping")
        request_id = request_data.get("id", "unknown")
        
        if method == "ping":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "status": "running",
                    "server": "MCP Server"
                }
            }
        elif method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "resources": {},
                        "tools": {},
                        "prompts": {}
                    },
                    "serverInfo": {
                        "name": "MCP Server",
                        "version": "1.0.0"
                    }
                }
            }
        else:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }
            }
    
    async def handle_other(self, scope, receive, send):
        # Handle other ASGI types
        pass

# Create the app instance
app = MCPApp(mcp)
`
      
      // Write the wrapper script and app file
      const wrapperFile = join(tempDir, 'run_server.py')
      const appFile = join(tempDir, 'app.py')
      writeFileSync(wrapperFile, wrapperScript)
      writeFileSync(appFile, appCode)
      
      serverProcess = spawn(pythonCmd, [wrapperFile], {
        cwd: tempDir,
        shell: true,
        env: { 
          ...process.env, 
          PORT: port.toString(),
          // Ensure Python is in PATH for Railway
          PATH: `/opt/venv/bin:${process.env.PATH}`
        }
      })
    }

    // Set up 5-minute timeout for testing
    const timeoutId = setTimeout(() => {
      addLog(`⏰ Server timeout reached (5 minutes)`)
      addLog(`🛑 Auto-stopping server for resource management`)
      addLog(`💡 This is for testing only - not for production use`)
      
      // Kill the server process
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM')
        
        // Force kill after 5 seconds if it doesn't stop gracefully
        setTimeout(() => {
          if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGKILL')
            addLog(`🔨 Force killed server process`)
          }
        }, 5000)
      }
      
      // Update session status
      const session = activeSessions.get(sessionId)
      if (session) {
        session.status = 'stopped'
        activeSessions.set(sessionId, session)
      }
    }, SERVER_TIMEOUT)

    // Store session with timeout
    activeSessions.set(sessionId, {
      process: serverProcess,
      port,
      logs,
      status: 'starting',
      timeoutId,
      startTime: Date.now()
    })

    // Capture stdout
    serverProcess.stdout?.on('data', (data: Buffer) => {
      const message = data.toString()
      addLog(message)
      
      // Check if server started (more comprehensive detection)
      const lowerMessage = message.toLowerCase()
      if (
        lowerMessage.includes('listening') || 
        lowerMessage.includes('started') ||
        lowerMessage.includes('uvicorn running') ||
        lowerMessage.includes('application startup complete') ||
        (lowerMessage.includes('server') && lowerMessage.includes('running')) ||
        (lowerMessage.includes('port') && /\d{4}/.test(message))
      ) {
        const session = activeSessions.get(sessionId)
        if (session) {
          session.status = 'running'
          addLog(`✅ Server is now accessible at ${serverUrl}`)
        }
      }
    })

    // Capture stderr
    serverProcess.stderr?.on('data', (data: Buffer) => {
      addLog(`⚠️ ${data.toString()}`)
    })

    // Handle process exit
    serverProcess.on('close', (code: number) => {
      addLog(`🛑 Server stopped (exit code: ${code})`)
      const session = activeSessions.get(sessionId)
      if (session) {
        session.status = code === 0 ? 'stopped' : 'error'
      }
      
      // For Python servers, ensure any remaining processes are killed
      if (language === 'python') {
        try {
          execSync('pkill -f "python.*server" || true', { stdio: 'ignore' })
          execSync('pkill -f "uvicorn" || true', { stdio: 'ignore' })
          execSync('lsof -ti:8000 | xargs kill -9 || true', { stdio: 'ignore' })
        } catch {
          // Ignore errors - this is just cleanup
        }
      }
      
      // Clean up temp directory after a delay
      setTimeout(() => {
        try {
          rmSync(tempDir, { recursive: true, force: true })
          activeSessions.delete(sessionId)
        } catch (error) {
          console.error('Error cleaning up temp directory:', error)
        }
      }, 5000)
    })

    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000))

    const session = activeSessions.get(sessionId)

    return NextResponse.json({
      sessionId,
      serverUrl,
      status: session?.status || 'starting',
      message: 'Server execution started',
      logs: session?.logs || []
    })

  } catch (error) {
    console.error('Error executing code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute code' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = activeSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Clear the timeout first
    if (session.timeoutId) {
      clearTimeout(session.timeoutId)
    }

    // Kill the process
    if (session.process) {
      session.process.kill()
      
      // For Python servers, also kill any remaining processes on port 8000
      try {
        execSync('pkill -f "python.*server" || true', { stdio: 'ignore' })
        execSync('pkill -f "uvicorn" || true', { stdio: 'ignore' })
        execSync('lsof -ti:8000 | xargs kill -9 || true', { stdio: 'ignore' })
      } catch {
        // Ignore errors - this is just cleanup
      }
    }

    // Clean up temp directory using the helper function
    const tempDir = getTempDir(sessionId)
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Error removing temp directory:', error)
    }

    activeSessions.delete(sessionId)

    return NextResponse.json({
      message: 'Session stopped successfully'
    })

  } catch (error) {
    console.error('Error stopping session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop session' },
      { status: 500 }
    )
  }
}