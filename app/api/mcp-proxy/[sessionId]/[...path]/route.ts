import { NextRequest, NextResponse } from 'next/server'
import { activeSessions } from '@/lib/session-store'

/**
 * Catch-all proxy route to forward requests to spawned MCP servers
 * This handles all paths under /api/mcp-proxy/{sessionId}/*
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; path: string[] }> }
) {
  const { sessionId, path } = await params
  
  try {
    // Get the session to find the correct port
    const session = activeSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      )
    }
    
    // Build the target path
    const targetPath = path ? `/${path.join('/')}` : ''
    const url = new URL(request.url)
    const queryString = url.search
    
    // Forward the request to the spawned server on its dynamic port
    const targetUrl = `http://localhost:${session.port}${targetPath}${queryString}`
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: request.headers,
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to MCP server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; path: string[] }> }
) {
  const { sessionId, path } = await params
  
  try {
    // Get the session to find the correct port
    const session = activeSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      )
    }
    
    // Build the target path
    const targetPath = path ? `/${path.join('/')}` : ''
    const url = new URL(request.url)
    const queryString = url.search
    
    const body = await request.text()
    
    // Forward the request to the spawned server on its dynamic port
    const targetUrl = `http://localhost:${session.port}${targetPath}${queryString}`
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: request.headers,
      body,
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to MCP server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; path: string[] }> }
) {
  const { sessionId, path } = await params
  
  try {
    // Get the session to find the correct port
    const session = activeSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      )
    }
    
    // Build the target path
    const targetPath = path ? `/${path.join('/')}` : ''
    const url = new URL(request.url)
    const queryString = url.search
    
    // Forward the request to the spawned server on its dynamic port
    const targetUrl = `http://localhost:${session.port}${targetPath}${queryString}`
    
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: request.headers,
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to MCP server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    )
  }
}

