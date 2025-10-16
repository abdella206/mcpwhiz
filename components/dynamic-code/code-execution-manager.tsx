"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square, Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CodeExecutionManagerProps {
  getCode: () => string  // Changed from string to function
  language: 'typescript' | 'python'
  onLogsUpdate: (logs: string[]) => void
  onStatusUpdate: (status: 'starting' | 'running' | 'stopped' | 'error') => void
  onServerUrlUpdate: (url: string | null) => void
}

export function CodeExecutionManager({
  getCode,
  language,
  onLogsUpdate,
  onStatusUpdate,
  onServerUrlUpdate
}: CodeExecutionManagerProps) {
  const { toast } = useToast()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const startExecution = useCallback(async () => {
    setIsLoading(true)
    onStatusUpdate('starting')
    onLogsUpdate([`[${new Date().toISOString()}] 🚀 Preparing to execute code...`])

    try {
      // Get the current code from editor at the moment of execution
      const currentCode = getCode()
      
      console.log('📝 Executing code from editor:', currentCode.substring(0, 100) + '...')
      onLogsUpdate([
        `[${new Date().toISOString()}] 🚀 Preparing to execute code...`,
        `[${new Date().toISOString()}] 📝 Code length: ${currentCode.length} characters`
      ])
      
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: currentCode, language }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start execution')
      }

      setSessionId(data.sessionId)
      setIsExecuting(true)
      onLogsUpdate(data.logs || [])
      onStatusUpdate(data.status)
      onServerUrlUpdate(data.serverUrl)

      toast({
        title: "Server Started",
        description: `Server is now running at ${data.serverUrl}`,
      })

      // Start polling for logs
      startLogPolling(data.sessionId)

    } catch (error) {
      console.error('Error starting execution:', error)
      onStatusUpdate('error')
      onLogsUpdate([
        `[${new Date().toISOString()}] ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ])
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : 'Failed to start server',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [getCode, language, onLogsUpdate, onStatusUpdate, onServerUrlUpdate, toast])

  const stopExecution = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/execute?sessionId=${sessionId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop execution')
      }

      setIsExecuting(false)
      setSessionId(null)
      onStatusUpdate('stopped')
      onServerUrlUpdate(null)

      toast({
        title: "Server Stopped",
        description: "Server execution has been terminated",
      })

    } catch (error) {
      console.error('Error stopping execution:', error)
      toast({
        title: "Stop Failed",
        description: error instanceof Error ? error.message : 'Failed to stop server',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, onStatusUpdate, onServerUrlUpdate, toast])

  const startLogPolling = (sid: string) => {
    // In a real implementation, you'd use SSE or WebSocket here
    // For now, we'll just keep the initial logs
    console.log('Log polling started for session:', sid)
  }

  // Cleanup on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // Send cleanup request (fire and forget)
        fetch(`/api/execute?sessionId=${sessionId}`, {
          method: 'DELETE',
          keepalive: true // Keep the request alive even after page unload
        }).catch(() => {
          // Ignore errors - this is cleanup
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionId])

  // Handle click outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false)
      }
    }

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen])

  return (
    <div className="flex items-center gap-2">
      {!isExecuting ? (
        <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <AlertDialogTrigger asChild>
            <Button
              disabled={isLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Server
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent ref={modalRef}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Test MCP Server
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    This will start a test <strong className="text-orange-500">&quot;Remote MCP Server&quot;</strong> for development and testing purposes only.
                  </p>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      ⏰ Auto-timeout: The server will automatically stop after 5 minutes
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      💡 This is for testing only - not for production use
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click &quot;Start Server&quot; to begin testing your MCP server, or &quot;Cancel&quot; to go back.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsModalOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsModalOpen(false)
                  startExecution()
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Server
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          onClick={stopExecution}
          disabled={isLoading}
          size="sm"
          variant="destructive"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop Server
            </>
          )}
        </Button>
      )}
    </div>
  )
}
