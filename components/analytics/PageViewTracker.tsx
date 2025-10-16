"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackPageView } from "@/lib/analytics/gtag"

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Track initial page view
    trackPageView(window.location.href)
  }, [])

  useEffect(() => {
    // Track page views on route changes
    if (pathname) {
      trackPageView(window.location.href)
    }
  }, [pathname])

  return null
}
