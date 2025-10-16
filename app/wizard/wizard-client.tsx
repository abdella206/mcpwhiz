"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { WizardContent } from "@/components/wizard"
import { useServerConfigStore } from "@/store/server-config-store"

export function WizardPageClient() {
  const searchParams = useSearchParams()
  const serverConfig = useServerConfigStore()
  const { updateConfig } = serverConfig
  const hasLoadedFromUrl = useRef(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Wait for hydration to complete before rendering
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Debug: Log store state
  console.log('Wizard page - config from store:', serverConfig.config)
  console.log('Wizard page - tools count:', serverConfig.config.tools.length)
  
  // Load config from URL if present - only once per page load
  useEffect(() => {
    if (hasLoadedFromUrl.current) return
    
    const configParam = searchParams.get('config')
    if (configParam) {
      try {
        const decodedConfig = JSON.parse(atob(configParam))
        console.log('Loading config from URL:', decodedConfig)
        updateConfig(decodedConfig)
        hasLoadedFromUrl.current = true
      } catch (error) {
        console.error('Failed to load config from URL:', error)
      }
    }
  }, [searchParams, updateConfig])
  
  // Don't render until hydrated to prevent Monaco Editor issues
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wizard...</p>
        </div>
      </div>
    )
  }
  
  return <WizardContent {...serverConfig} />
}
