import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PageWrapper } from "@/components/page-wrapper"
import { ThemeProvider } from "@/components/theme-provider"
import NetworkGridWrapper from "@/components/ui/network-grid-wrapper"
import { OrganizationSchema } from "@/components/layout/OrganizationSchema"
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"
import { PageViewTracker } from "@/components/analytics/PageViewTracker"
//mport MCPProtocolWrapper from "@/components/ui/mcp-protocol-wrapper"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://mcpwhiz.com'),
  title: {
    default: 'mcpwhiz - Turn APIs into MCP Servers Instantly | Free MCP Server Builder',
    template: '%s | mcpwhiz'
  },
  description: 'Convert Swagger/OpenAPI, Postman Collections, and GraphQL APIs into Model Context Protocol (MCP) servers instantly. Free, open-source MCP server builder with TypeScript & Python code generation.',
  keywords: [
    'MCP server',
    'Model Context Protocol',
    'API to MCP',
    'Swagger to MCP',
    'OpenAPI to MCP',
    'Postman to MCP',
    'GraphQL to MCP',
    'MCP server builder',
    'TypeScript MCP',
    'Python MCP',
    'free MCP tools',
    'open source MCP',
    'MCP code generator',
    'AI server builder',
    'context protocol server'
  ],
  authors: [{ name: 'mcpwhiz' }],
  creator: 'mcpwhiz',
  publisher: 'mcpwhiz',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/mcp_logo.png',
    shortcut: '/mcp_logo.png',
    apple: '/mcp_logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mcpwhiz.com',
    siteName: 'mcpwhiz',
    title: 'mcpwhiz - Turn APIs into MCP Servers Instantly',
    description: 'Convert Swagger/OpenAPI, Postman Collections, and GraphQL APIs into Model Context Protocol (MCP) servers instantly. Free, open-source MCP server builder.',
    images: [
      {
        url: '/mcp_logo.png',
        width: 1200,
        height: 630,
        alt: 'mcpwhiz - MCP Server Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mcpwhiz - Turn APIs into MCP Servers Instantly',
    description: 'Convert Swagger/OpenAPI, Postman Collections, and GraphQL APIs into Model Context Protocol (MCP) servers instantly.',
    images: ['/mcp_logo.png'],
    creator: '@mcpwhiz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://mcpwhiz.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // (debug logging removed)
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
      </head>
      <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
      <body className={`${inter.className} min-h-screen bg-white dark:bg-black text-black dark:text-white relative`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
         
            {/* MCP Protocol Animation - only shown in light mode */}
            <div className="block dark:hidden">
              {/* <MCPProtocolWrapper /> */}
            </div>
            {/* Network Grid Animation - only shown in dark mode */}
            <div className="hidden dark:block">
              <NetworkGridWrapper />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
              <PageViewTracker />

              <PageWrapper>{children}</PageWrapper>
            </div>
        
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
