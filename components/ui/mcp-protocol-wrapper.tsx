"use client"

import dynamic from "next/dynamic"

const MCPProtocolAnimation = dynamic(
  () => import("./mcp-protocol-animation"),
  { ssr: false }
)

export default function MCPProtocolWrapper() {
  return <MCPProtocolAnimation />
} 