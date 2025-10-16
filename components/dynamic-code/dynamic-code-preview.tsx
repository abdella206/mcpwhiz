"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Download, RefreshCw, Check, Terminal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Editor from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { generateServerCodeTS } from "./generateServerCodeTS"
import { generateServerCodePY } from "./generateServerCodePY"
import { DynamicCodePreviewProps } from "./types"
import { Badge } from "../ui/badge"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { CodeExecutorConsole } from "./code-executor-console"
import { CodeExecutionManager } from "./code-execution-manager"

type Language = 'typescript' | 'python'

const DynamicCodePreviewComponent: React.FC<DynamicCodePreviewProps> = ({
  serverName,
  serverVersion,
  serverDescription,
  resources,
  tools,
  prompts,
  sessionManagement = false,
  isRemoteServer = true,
  onReset,
}) => {
  const { toast } = useToast()
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('typescript')
  const [copySuccess, setCopySuccess] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [executionStatus, setExecutionStatus] = useState<'starting' | 'running' | 'stopped' | 'error'>('stopped')
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [urlCopySuccess, setUrlCopySuccess] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Memoize sanitized server name to prevent unnecessary recalculations
  const sanitizedName = useMemo(() => 
    serverName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_"),
    [serverName]
  )

  // Generate initial code immediately - this ensures it's available on first render
  const initialCode = useMemo(() => {
    const params = {
      serverName,
      serverVersion,
      serverDescription,
      resources,
      tools,
      prompts,
      sessionManagement,
      isRemoteServer,
    }
    return selectedLanguage === 'typescript' 
      ? generateServerCodeTS(params)
      : generateServerCodePY(params)
  }, [serverName, serverVersion, serverDescription, resources, tools, prompts, sessionManagement, isRemoteServer, selectedLanguage])

  const serverCodeRef = useRef(initialCode)

  // Generate and update code directly in editor (no React state)
  const updateEditorCode = useCallback(() => {
    const params = {
      serverName,
      serverVersion,
      serverDescription,
      resources,
      tools,
      prompts,
      sessionManagement,
      isRemoteServer,
    }

    let code: string
    if (selectedLanguage === 'typescript') {
      code = generateServerCodeTS(params)
    } else {
      code = generateServerCodePY(params)
    }

    // Only update if code actually changed
    if (code === serverCodeRef.current) {
      return
    }

    serverCodeRef.current = code

    // Update editor directly without triggering React re-render
    if (editorRef.current) {
      const editor = editorRef.current
      const model = editor.getModel()
      
      if (model && model.getValue() !== code) {
        // Save cursor position
        const position = editor.getPosition()
        const scrollTop = editor.getScrollTop()
        
        // Update content using Monaco's internal API (most efficient)
        model.setValue(code)
        
        // Restore position
        if (position && position.lineNumber <= model.getLineCount()) {
          editor.setPosition(position)
        }
        editor.setScrollTop(scrollTop)
      }
    }
  }, [serverName, serverVersion, serverDescription, resources, tools, prompts, sessionManagement, isRemoteServer, selectedLanguage])

  // Update editor code with debouncing for name/version changes
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce updates to reduce flickering while typing
    debounceTimerRef.current = setTimeout(() => {
      updateEditorCode()
    }, 300) // 300ms debounce for smooth typing experience

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [updateEditorCode])

  // Cleanup resize listener on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('resize', () => {
        if (editorRef.current) {
          editorRef.current.layout()
        }
      })
    }
  }, [])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      // Update ref directly (no state update = no re-render = no blinking)
      serverCodeRef.current = value
    }
  }, [])

  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor
    isInitializedRef.current = true
    
    // Configure TypeScript to suppress all import and type errors
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monacoInstance.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monacoInstance.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      skipLibCheck: true,
      noImplicitAny: false,
      strict: false,
      allowSyntheticDefaultImports: true,
    })

    // Suppress import and process errors, but keep "Declared but never used" warnings
    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,  // Enable semantic validation to show unused variables
      noSyntaxValidation: false,    // Enable syntax validation
      noSuggestionDiagnostics: false, // Enable suggestions
      diagnosticCodesToIgnore: [
        2307, // Cannot find module
        2304, // Cannot find name (for imports like 'process')
        2305, // Module has no exported member
        2339, // Property does not exist
        2580, // Cannot find name 'require'
        2591, // Cannot find name 'process'
        2792, // Cannot find module. Did you mean to set the 'moduleResolution' option
        7016, // Could not find a declaration file
        7006, // Parameter implicitly has an 'any' type
        8010, // Type annotations can only be used in TypeScript files
        8016, // Type assertion expressions can only be used in TypeScript files
        1378, // Top-level await
        1208, // All others
        // Removed 6133 to allow "Declared but never used" warnings to show
      ],
    })

    // Configure JavaScript diagnostics as well
    monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
      diagnosticCodesToIgnore: [
        2307, 2304, 2305, 2339, 2580, 2591, 2792, 7016, 7006, 8010, 8016, 1378, 1208,
      ],
    })

    // Set initial code
    updateEditorCode()
    
    // Add resize listener to ensure editor adjusts to window changes
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout()
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateEditorCode])

  const copyToClipboard = useCallback(() => {
    const code = editorRef.current?.getValue() || serverCodeRef.current
    navigator.clipboard.writeText(code)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000) // Reset after 2 seconds
  }, [])

  const downloadCode = useCallback(() => {
    const code = editorRef.current?.getValue() || serverCodeRef.current
    const extension = selectedLanguage === 'typescript' ? 'ts' : 'py'
    const filename = `${sanitizedName}-server.${extension}`
    
    const element = document.createElement("a")
    const file = new Blob([code], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast({
      title: "Download started",
      description: `${filename} has been downloaded.`,
    })
  }, [selectedLanguage, sanitizedName, toast])

  const copyServerUrl = useCallback(() => {
    if (!serverUrl) return
    
    const urlWithMcp = `${serverUrl}/mcp`
    navigator.clipboard.writeText(urlWithMcp)
    setUrlCopySuccess(true)
    setTimeout(() => setUrlCopySuccess(false), 2000) // Reset after 2 seconds
    toast({
      title: "URL Copied",
      description: "Server URL with /mcp endpoint copied to clipboard",
    })
  }, [serverUrl, toast])

  // Memoize editor options to prevent unnecessary re-renders and blinking
  const editorOptions = useMemo(() => ({
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    padding: { top: 16, bottom: 16 },
    wordWrap: 'off' as const,
    lineNumbers: 'on' as const,
    renderLineHighlight: 'line' as const,
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line' as const,
    cursorBlinking: 'solid' as const, // Changed from 'blink' to 'solid' to prevent cursor blinking
    folding: true,
    foldingStrategy: 'indentation' as const,
    showFoldingControls: 'always' as const,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    quickSuggestionsDelay: 500, // Increase delay to reduce autocomplete flickering
    parameterHints: { enabled: true },
    hover: { enabled: true },
    contextmenu: true,
    mouseWheelZoom: true,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'off' as const, // Changed to 'off' to reduce animation artifacts
    renderWhitespace: 'selection' as const,
    renderControlCharacters: false,
    fontLigatures: true,
    disableLayerHinting: false, // Changed to false for better rendering
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    fixedOverflowWidgets: true, // Prevent widgets from causing reflows
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  }), [])

  return (
    <Card className="w-full border-gray-200 dark:border-[#3c3c3c] bg-white dark:bg-[#252526]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-[#cccccc]">
          <RefreshCw className="h-5 w-5 text-gray-700 dark:text-[#cccccc]" />
          Generated MCP Server Code
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-[#9d9d9d]">
          This {selectedLanguage === 'typescript' ? 'TypeScript' : 'Python'} code is automatically generated based on your server configuration. 
          It uses {isRemoteServer 
            ? (selectedLanguage === 'typescript' ? 'StreamableHTTPServerTransport' : 'HTTPXServerTransport') + (sessionManagement ? ' with session management' : ' in stateless mode')
            : (selectedLanguage === 'typescript' ? 'StdioServerTransport' : 'StdioServerTransport') + ' for local communication'
          } and includes all your configured resources, tools, and prompts.
        </CardDescription>
               <div className="flex items-center flex-wrap gap-2">
                <Badge variant="outline" className="border-orange-200 text-orange-600 text-xs">
                  {serverName}
                </Badge>
                <Badge variant="outline" className="border-orange-200 text-orange-600 text-xs">
                  v{serverVersion}
                </Badge>
                {tools.length > 0 && (
                  <Badge variant="outline" className="border-green-200 text-orange-600 text-xs">
                    {tools.length} tools
                  </Badge>
                )}
                {resources.length > 0 && (
                  <Badge variant="outline" className="border-green-200 text-orange-600 text-xs">
                    {resources.length} resources
                  </Badge>
                )}
                {prompts.length > 0 && (
                  <Badge variant="outline" className="border-green-200 text-orange-600 text-xs">
                    {prompts.length} prompts
                  </Badge>
                )}
              </div>
        {serverUrl && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Server Running
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={`${serverUrl}/mcp`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-mono font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {serverUrl}/mcp →
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyServerUrl}
                  className={`h-7 w-7 p-0 ${urlCopySuccess ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : ""}`}
                  title="Copy server URL"
                >
                  {urlCopySuccess ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3 -mt-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-orange-600 dark:text-[#9d9d9d]">Language:</span>
                <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as Language)}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="flex items-center flex-wrap gap-2">
                <Badge variant="outline" className="border-orange-200 text-orange-600 text-xs">
                  {serverName}
                </Badge>
                <Badge variant="outline" className="border-orange-200 text-orange-600 text-xs">
                  v{serverVersion}
                </Badge>
                {tools.length > 0 && (
                  <Badge variant="outline" className="border-green-200 text-orange-600 text-xs">
                    {tools.length} tools
                  </Badge>
                )}
                {resources.length > 0 && (
                  <Badge variant="outline" className="border-green-200 text-orange-600 text-xs">
                    {resources.length} resources
                  </Badge>
                )}
                {prompts.length > 0 && (
                  <Badge variant="outline" className="border-green-200 text-orange-600 text-xs">
                    {prompts.length} prompts
                  </Badge>
                )}
              </div> */}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={onReset} className="flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToClipboard}
                className={`flex-1 sm:flex-none ${copySuccess ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : ""}`}
              >
                {copySuccess ? (
                  <>
                    <Check className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCode}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <CodeExecutionManager
                getCode={() => editorRef.current?.getValue() || serverCodeRef.current}
                language={selectedLanguage}
                onLogsUpdate={setConsoleLogs}
                onStatusUpdate={(status) => {
                  setExecutionStatus(status)
                  if (status === 'starting' || status === 'running') {
                    setShowConsole(true)
                  }
                }}
                onServerUrlUpdate={(url) => {
                  setServerUrl(url)
                  if (url) setShowConsole(true)
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConsole(!showConsole)}
                className="flex-1 sm:flex-none"
              >
                <Terminal className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showConsole ? 'Hide' : 'Show'} Console</span>
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-[#3c3c3c] shadow-sm dark:shadow-lg">
              <div className="h-[calc(100vh-20rem)] sm:h-[calc(100vh-16rem)] min-h-[20rem] sm:min-h-[25rem]">
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={showConsole ? 60 : 100} minSize={30}>
                    <Editor
                      key={`monaco-editor-${selectedLanguage}`}
                      height="100%"
                      language={selectedLanguage}
                      value={editorRef.current?.getValue() || serverCodeRef.current}
                      onChange={handleEditorChange}
                      onMount={handleEditorDidMount}
                      theme="vs-dark"
                      options={editorOptions}
                      loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
                    />
                  </ResizablePanel>
                  {showConsole && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={40} minSize={25}>
                        <CodeExecutorConsole
                          logs={consoleLogs}
                          onClose={() => setShowConsole(false)}
                          onClearLogs={() => setConsoleLogs([])}
                          serverUrl={serverUrl || undefined}
                          status={executionStatus}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize component to prevent unnecessary re-renders and eliminate blinking
export const DynamicCodePreview = memo(DynamicCodePreviewComponent)