/**
 * Shared session store for managing active MCP server sessions
 * This allows the execute route and proxy route to share session data
 */

import { ChildProcess, execSync } from 'child_process'

export interface SessionData {
  process: ChildProcess
  port: number
  logs: string[]
  status: 'starting' | 'running' | 'stopped' | 'error'
  timeoutId?: NodeJS.Timeout
  startTime?: number
}

// Global session store
export const activeSessions = new Map<string, SessionData>()

// Clean up old sessions after 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.process && session.startTime && now - session.startTime > 30 * 60 * 1000) {
        try {
          // Clear timeout if it exists
          if (session.timeoutId) {
            clearTimeout(session.timeoutId)
          }
          
          session.process.kill()
          
          // For Python servers, also kill any remaining processes on port 8000
          try {
            execSync('pkill -f "python.*server" || true', { stdio: 'ignore' })
            execSync('pkill -f "uvicorn" || true', { stdio: 'ignore' })
            execSync('lsof -ti:8000 | xargs kill -9 || true', { stdio: 'ignore' })
          } catch {
            // Ignore errors - this is cleanup
          }
          
          activeSessions.delete(sessionId)
        } catch (error) {
          console.error('Error cleaning up session:', error)
        }
      }
    }
  }, 5 * 60 * 1000) // Check every 5 minutes
}

