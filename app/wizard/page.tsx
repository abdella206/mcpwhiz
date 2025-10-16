import { Suspense } from 'react'
import { WizardPageClient } from '@/app/wizard/wizard-client'
import { Metadata } from 'next'

// Server-side metadata for SEO
export const metadata: Metadata = {
  title: 'MCP Server Builder Wizard',
  description: 'Build your Model Context Protocol (MCP) server with our interactive wizard. Configure resources, tools, and prompts, then generate production-ready TypeScript or Python code instantly.',
  openGraph: {
    title: 'MCP Server Builder Wizard | mcpwhiz',
    description: 'Build your Model Context Protocol (MCP) server with our interactive wizard. Configure resources, tools, and prompts instantly.',
    url: 'https://mcpwhiz.com/wizard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Server Builder Wizard | mcpwhiz',
    description: 'Build your Model Context Protocol (MCP) server with our interactive wizard.',
  },
  alternates: {
    canonical: 'https://mcpwhiz.com/wizard',
  },
}

// Server component wrapper
export default function WizardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <WizardPageClient />
    </Suspense>
  )
}
