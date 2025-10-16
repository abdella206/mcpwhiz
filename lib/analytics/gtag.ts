// Google Analytics tracking utilities

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void
    dataLayer: unknown[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""

// Track page views
export function trackPageView(url: string, title?: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return
  
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: title || document.title,
    page_location: url,
  })
}

// Track custom events
interface EventParams {
  action: string
  category?: string
  label?: string
  value?: number
}

export function trackEvent({ action, category = "engagement", label, value }: EventParams) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return
  
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Predefined event tracking functions for mcpwhiz
export const analytics = {
  // User engagement
  signUp: () => trackEvent({ action: "sign_up", category: "auth" }),
  login: () => trackEvent({ action: "login", category: "auth" }),
  logout: () => trackEvent({ action: "logout", category: "auth" }),
  
  // MCP Server actions
  createServer: () => trackEvent({ action: "create_mcp_server", category: "mcp" }),
  deployServer: () => trackEvent({ action: "deploy_mcp_server", category: "mcp" }),
  deleteServer: () => trackEvent({ action: "delete_mcp_server", category: "mcp" }),
  
  // Pricing/Subscription
  viewPricing: () => trackEvent({ action: "view_pricing", category: "pricing" }),
  selectPlan: (planName: string) => 
    trackEvent({ action: "select_plan", category: "pricing", label: planName }),
  upgradePlan: (planName: string) => 
    trackEvent({ action: "upgrade_plan", category: "pricing", label: planName }),
  
  // Feature usage
  usePlayground: () => trackEvent({ action: "use_playground", category: "features" }),
  configureServer: () => trackEvent({ action: "configure_server", category: "features" }),
  viewDocs: () => trackEvent({ action: "view_documentation", category: "features" }),
  
  // Contact/Support
  contactSubmit: () => trackEvent({ action: "contact_form_submit", category: "support" }),
  viewContact: () => trackEvent({ action: "view_contact", category: "support" }),
  
  // External links
  externalLink: (url: string) => 
    trackEvent({ action: "external_link_click", category: "outbound", label: url }),
}
