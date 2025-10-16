"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Terminal, X, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CodeExecutorConsoleProps {
  logs: string[]
  onClose?: () => void
  onClearLogs?: () => void
  serverUrl?: string
  status?: 'starting' | 'running' | 'stopped' | 'error'
}

export function CodeExecutorConsole({ 
  logs, 
  onClose,
  onClearLogs, 
  serverUrl,
  status = 'stopped' 
}: CodeExecutorConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoscroll] = useState(true)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoscroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoscroll])

  const getStatusColor = () => {
    switch (status) {
      case 'starting':
        return 'text-yellow-500'
      case 'running':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'starting':
        return '⏳ Starting...'
      case 'running':
        return '✅ Running'
      case 'error':
        return '❌ Error'
      default:
        return '⚪ Stopped'
    }
  }

  const clearLogs = () => {
    if (onClearLogs) {
      onClearLogs()
    }
  }

  return (
    <Card className="h-full flex flex-col border-[#3c3c3c] bg-[#1e1e1e]">
      <CardHeader className="py-3 px-4 border-b border-[#3c3c3c] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#cccccc]" />
            <CardTitle className="text-sm font-semibold text-[#cccccc]">
              Console
            </CardTitle>
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-7 w-7 p-0 bg-white"
              title="Clear console"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0 bg-white"
                title="Close console"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {serverUrl && (
          <div className="mt-2 text-xs bg-orange-950/20 p-2 rounded border border-orange-800">
            <div className="flex items-center gap-2">
              <span className="text-[#cccccc] font-semibold">🌐 Server URL:</span>
              <a 
                href={`${serverUrl}/mcp`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline font-mono font-semibold"
              >
                {serverUrl}/mcp
              </a>
            </div>
            <div className="text-[#9d9d9d] mt-1 text-[10px]">
              Click the URL above to test your MCP server in a new tab
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div 
            ref={scrollRef}
            className="p-4 font-mono text-xs space-y-1 bg-[#1e1e1e] min-h-full"
          >
            {logs.length === 0 ? (
              <div className="text-[#6a6a6a] italic">
                No logs yet. Click &quot;Run Server&quot; to start.
              </div>
            ) : (
              logs.map((log, index) => {
                // Parse log level and add color
                const isError = log.includes('❌') || log.includes('⚠️') || log.toLowerCase().includes('error')
                const isSuccess = log.includes('✅') || log.toLowerCase().includes('success')
                const isWarning = log.includes('⚠️') || log.toLowerCase().includes('warning')
                
                let className = 'text-[#cccccc]'
                if (isError) className = 'text-red-400'
                else if (isSuccess) className = 'text-green-400'
                else if (isWarning) className = 'text-yellow-400'

                return (
                  <div key={index} className={className}>
                    {log}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
