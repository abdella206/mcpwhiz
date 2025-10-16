"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function NotFoundContent() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || "unknown page"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6 text-zinc-400">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <p className="mb-8 text-zinc-500">You came from: {from}</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  )
} 