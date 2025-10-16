"use client"

import dynamic from "next/dynamic"

const NetworkGridAnimation = dynamic(
  () => import("./network-grid-animation"),
  { ssr: false }
)

export default function NetworkGridWrapper() {
  return <NetworkGridAnimation />
} 