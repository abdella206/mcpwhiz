#!/bin/bash

# Test Production Environment Locally
# This script helps verify the MCP URL generation before deploying to Railway

echo "🧪 Testing Production Environment Locally"
echo "=========================================="
echo ""

# Kill any existing Next.js processes
echo "🧹 Cleaning up existing processes..."
pkill -f "next" 2>/dev/null || true
sleep 2

# Start production server in background
echo "🚀 Starting production server..."
NODE_ENV=production pnpm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test home page
echo ""
echo "📍 Testing home page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Home page: OK"
else
    echo "❌ Home page: FAILED (HTTP $RESPONSE)"
fi

# Test /mcp route
echo ""
echo "📍 Testing /mcp route..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/mcp)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ /mcp route: OK"
else
    echo "❌ /mcp route: FAILED (HTTP $RESPONSE)"
fi

# Test wizard page
echo ""
echo "📍 Testing wizard page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wizard)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Wizard page: OK"
else
    echo "❌ Wizard page: FAILED (HTTP $RESPONSE)"
fi

# Test non-existent session
echo ""
echo "📍 Testing MCP proxy with non-existent session..."
RESPONSE=$(curl -s http://localhost:3000/api/mcp-proxy/test-session-id/mcp)
if echo "$RESPONSE" | grep -q "Session not found"; then
    echo "✅ MCP proxy error handling: OK"
else
    echo "❌ MCP proxy error handling: FAILED"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "🎉 Basic tests completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Go to /wizard"
echo "   3. Create a test MCP server"
echo "   4. Click 'Run Server'"
echo "   5. Verify the URL format is:"
echo "      http://localhost:3000/api/mcp-proxy/{sessionId}"
echo "   6. NOT: .../mcp/mcp (no duplicate)"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

# Keep script running
wait $SERVER_PID

