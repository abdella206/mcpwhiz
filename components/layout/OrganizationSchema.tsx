export function OrganizationSchema() {
  // Server-side component for SEO schema
  const orgData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "mcpwhiz - MCP Server Builder",
    "url": "https://mcpwhiz.com",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Free, open-source tool to convert Swagger/OpenAPI, Postman Collections, and GraphQL APIs into Model Context Protocol (MCP) servers. Generate TypeScript and Python code instantly.",
    "screenshot": "https://mcpwhiz.com/mcp_logo.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    },
    "author": {
      "@type": "Organization",
      "name": "mcpwhiz"
    },
    "featureList": [
      "Convert Swagger/OpenAPI to MCP servers",
      "Convert Postman Collections to MCP servers",
      "Convert GraphQL to MCP servers",
      "TypeScript code generation",
      "Python code generation",
      "Real-time code preview",
      "Session management support",
      "Free and open source"
    ],
    "applicationSubCategory": "API Development Tools",
    "softwareVersion": "1.0.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString()
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(orgData) }}
    />
  )
}
