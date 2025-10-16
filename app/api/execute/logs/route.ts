import { NextRequest, NextResponse } from 'next/server'

// This would ideally be shared with the execute route
// For now, we'll use a simple in-memory store
// In production, you'd use Redis or similar

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    )
  }

  // Set up SSE (Server-Sent Events)
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Send initial connection message
      sendEvent({ type: 'connected', sessionId })

      // Poll for logs every second
      const interval = setInterval(async () => {
        try {
          // In a real implementation, you'd fetch logs from a shared store
          // For now, we'll just send a heartbeat
          sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() })
        } catch (error) {
          console.error('Error streaming logs:', error)
          clearInterval(interval)
          controller.close()
        }
      }, 1000)

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
