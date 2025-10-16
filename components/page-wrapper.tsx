"use client"

import { usePathname } from "next/navigation"

interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname()
  const isDashboardPage = pathname.startsWith("/dashboard")
  const isAuthPage = pathname.startsWith("/auth")

  // Don't show footer on dashboard or auth pages
  if (isDashboardPage || isAuthPage) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
     
    </div>
  )
} 