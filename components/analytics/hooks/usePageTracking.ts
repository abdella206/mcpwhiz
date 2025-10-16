"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics/gtag'

// Custom hook for tracking specific page interactions
export function usePageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    // Track specific page views with custom events
    switch (pathname) {
      case '/pricing':
        analytics.viewPricing()
        break
      case '/docs':
        analytics.viewDocs()
        break
      case '/contact':
        analytics.viewContact()
        break
      case '/playground':
        analytics.usePlayground()
        break
    }
  }, [pathname])

  return {
    trackCustomEvent: analytics,
    currentPath: pathname
  }
}

// Usage example:
// function MyComponent() {
//   const { trackCustomEvent } = usePageTracking()
//   
//   const handleFeatureUse = () => {
//     trackCustomEvent.configureServer()
//   }
//   
//   return <button onClick={handleFeatureUse}>Configure</button>
// }
