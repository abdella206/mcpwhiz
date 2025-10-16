"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Download, Loader2 } from "lucide-react"

// Generic interfaces for both tools and resources
export interface ParameterDefinition {
  type: string
  description: string
  required: boolean
}

export interface ImportableItem {
  name: string
  title: string
  description: string
  // Tool-specific fields
  tool_type?: "static" | "api" | "resource_link"
  static_result?: string
  resource_links_header?: string
  resource_links?: Array<{
    uri: string
    name: string
    mimeType: string
    description: string
  }>
  // Resource-specific fields
  resource_type?: "static" | "dynamic" | "context_aware"
  uri?: string
  mime_type?: string
  static_content?: string
  completion_config?: {
    complete: Record<string, {
      type: string
      conditions?: Array<{
        when: Record<string, string>
        values: string[]
      }>
      values?: string[]
      default?: string[]
    }>
  }
  // Common fields
  api_url?: string
  http_method?: string
  headers?: Record<string, string>
  parameters?: Record<string, ParameterDefinition>
}

interface GraphQLImportSectionProps {
  graphqlEndpoint: string
  setGraphqlEndpoint: (endpoint: string) => void
  authHeader: string
  setAuthHeader: (header: string) => void
  itemType: "tool" | "resource"
  onImport: (items: ImportableItem[]) => void
}

// GraphQL import function
const importGraphQL = async (graphqlEndpoint: string, authHeader: string, itemType: "tool" | "resource"): Promise<ImportableItem[]> => {
  if (!graphqlEndpoint) {
    throw new Error("Please provide a GraphQL endpoint URL")
  }

  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        types {
          ...FullType
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
    }

    fragment InputValue on __InputValue {
      name
      description
      type { ...TypeRef }
      defaultValue
    }

    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  `

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: introspectionQuery,
      variables: {}
    })
  })

  if (!response.ok) {
    throw new Error(`GraphQL introspection failed: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  
  if (result.errors) {
    throw new Error(`GraphQL introspection error: ${result.errors[0].message}`)
  }

  const schema = result.data.__schema
  const items: ImportableItem[] = []

  const processType = (typeName: string | null, operationType: 'query' | 'mutation') => {
    if (!typeName) return

    const type = schema.types.find((t: { name: string }) => t.name === typeName)
    if (!type || !type.fields) return

    type.fields.forEach((field: {
      name: string
      description?: string
      args?: Array<{
        name: string
        description?: string
        type: {
          kind: string
          ofType?: {
            kind: string
            ofType?: {
              kind: string
              ofType?: {
                kind: string
                name?: string
              }
            }
          }
          name?: string
        }
      }>
    }) => {
      if (field.name.startsWith('__')) return

      const parameters: Record<string, ParameterDefinition> = {}
      
      if (field.args && field.args.length > 0) {
        field.args.forEach((arg: {
          name: string
          description?: string
          type: {
            kind: string
            ofType?: {
              kind: string
              ofType?: {
                kind: string
                ofType?: {
                  kind: string
                  name?: string
                }
              }
            }
            name?: string
          }
        }) => {
          parameters[arg.name] = {
            type: getGraphQLType(arg.type),
            description: arg.description || `${operationType} argument: ${arg.name}`,
            required: arg.type.kind === 'NON_NULL'
          }
        })
      }

      const item: ImportableItem = {
        name: `${operationType}_${field.name}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        title: field.name,
        description: field.description || `GraphQL ${operationType}: ${field.name}`,
        api_url: graphqlEndpoint,
        http_method: "POST",
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {})
        }
      }

      // Set type-specific fields
      if (itemType === 'tool') {
        item.tool_type = "api"
      } else {
        // GraphQL doesn't have traditional GET resources
        return
      }
      
      items.push(item)
    })
  }

  processType(schema.queryType?.name, 'query')
  processType(schema.mutationType?.name, 'mutation')

  return items
}

// Helper to get GraphQL type as string
const getGraphQLType = (type: {
  kind: string
  ofType?: {
    kind: string
    ofType?: {
      kind: string
      ofType?: {
        kind: string
        name?: string
      }
    }
  }
  name?: string
}): string => {
  if (type.kind === 'NON_NULL') {
    return getGraphQLType(type.ofType)
  }
  if (type.kind === 'LIST') {
    return `array`
  }
  if (type.name) {
    const scalarTypes: Record<string, string> = {
      'String': 'string',
      'Int': 'number',
      'Float': 'number',
      'Boolean': 'boolean',
      'ID': 'string'
    }
    return scalarTypes[type.name] || 'object'
  }
  return 'string'
}

export function GraphQLImportSection({
  graphqlEndpoint,
  setGraphqlEndpoint,
  authHeader,
  setAuthHeader,
  itemType,
  onImport
}: GraphQLImportSectionProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleGraphQLImport = async () => {
    if (!graphqlEndpoint) {
      setImportError("Please provide a GraphQL endpoint URL")
      return
    }

    if (itemType === 'resource') {
      setImportError("GraphQL doesn't have traditional GET resources. Use Tools import instead.")
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const items = await importGraphQL(graphqlEndpoint, authHeader, itemType)
      onImport(items)
    } catch (error) {
      console.error("GraphQL import failed:", error)
      setImportError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          GraphQL introspection will discover queries and mutations as {itemType}s
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <Label htmlFor="graphql-endpoint">GraphQL Endpoint URL</Label>
        <Input
          id="graphql-endpoint"
          placeholder="e.g., https://api.example.com/graphql"
          value={graphqlEndpoint}
          onChange={(e) => setGraphqlEndpoint(e.target.value)}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Enter the GraphQL endpoint URL for introspection
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="graphql-auth">Authorization Header (Optional)</Label>
        <Input
          id="graphql-auth"
          placeholder="e.g., Bearer YOUR_TOKEN"
          value={authHeader}
          onChange={(e) => setAuthHeader(e.target.value)}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Add if the GraphQL endpoint requires authentication
        </p>
      </div>

      {importError && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-wrap">{importError}</AlertDescription>
        </Alert>
      )}

      {/* Import Button */}
      <Button
        onClick={handleGraphQLImport}
        disabled={isImporting || !graphqlEndpoint}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {isImporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Import
          </>
        )}
      </Button>
    </div>
  )
}
