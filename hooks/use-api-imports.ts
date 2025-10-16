"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"

export interface ApiImportState {
  // Swagger state
  swaggerUrl: string
  setSwaggerUrl: (url: string) => void
  swaggerFile: File | null
  setSwaggerFile: (file: File | null) => void
  isSwaggerImporting: boolean
  swaggerImportSuccess: boolean
  swaggerImportError: string
  swaggerImportedItems: any[]
  swaggerSelectedItems: Set<number>
  setSwaggerSelectedItems: (items: Set<number>) => void

  // Postman state
  postmanFile: File | null
  setPostmanFile: (file: File | null) => void
  isPostmanImporting: boolean
  postmanImportSuccess: boolean
  postmanImportError: string
  postmanImportedItems: any[]
  postmanSelectedItems: Set<number>
  setPostmanSelectedItems: (items: Set<number>) => void

  // GraphQL state
  graphqlUrl: string
  setGraphqlUrl: (url: string) => void
  isGraphqlImporting: boolean
  graphqlImportSuccess: boolean
  graphqlImportError: string
  graphqlImportedItems: any[]
  graphqlSelectedItems: Set<number>
  setGraphqlSelectedItems: (items: Set<number>) => void

  // Drag and drop states
  isDraggingSwagger: boolean
  setIsDraggingSwagger: (dragging: boolean) => void
  isDraggingPostman: boolean
  setIsDraggingPostman: (dragging: boolean) => void

  // Handlers
  handleSwaggerImport: () => Promise<{ success: boolean; tools: any[] }>
  handlePostmanImport: () => Promise<{ success: boolean; tools: any[] }>
  handleGraphqlImport: () => Promise<{ success: boolean; tools: any[] }>
  resetSwaggerImport: () => void
  handleSwaggerDragOver: (e: React.DragEvent) => void
  handleSwaggerDragLeave: (e: React.DragEvent) => void
  handleSwaggerDrop: (e: React.DragEvent) => void
  handlePostmanDragOver: (e: React.DragEvent) => void
  handlePostmanDragLeave: (e: React.DragEvent) => void
  handlePostmanDrop: (e: React.DragEvent) => void
}

export function useApiImports(): ApiImportState {
  // Swagger state
  const [swaggerUrl, setSwaggerUrl] = useState("")
  const [swaggerFile, setSwaggerFile] = useState<File | null>(null)
  const [isSwaggerImporting, setIsSwaggerImporting] = useState(false)
  const [swaggerImportSuccess, setSwaggerImportSuccess] = useState(false)
  const [swaggerImportError, setSwaggerImportError] = useState("")
  const [swaggerImportedItems, setSwaggerImportedItems] = useState<any[]>([])
  const [swaggerSelectedItems, setSwaggerSelectedItems] = useState<Set<number>>(new Set())

  // Postman state
  const [postmanFile, setPostmanFile] = useState<File | null>(null)
  const [isPostmanImporting, setIsPostmanImporting] = useState(false)
  const [postmanImportSuccess, setPostmanImportSuccess] = useState(false)
  const [postmanImportError, setPostmanImportError] = useState("")
  const [postmanImportedItems, setPostmanImportedItems] = useState<any[]>([])
  const [postmanSelectedItems, setPostmanSelectedItems] = useState<Set<number>>(new Set())

  // GraphQL state
  const [graphqlUrl, setGraphqlUrl] = useState("")
  const [isGraphqlImporting, setIsGraphqlImporting] = useState(false)
  const [graphqlImportSuccess, setGraphqlImportSuccess] = useState(false)
  const [graphqlImportError, setGraphqlImportError] = useState("")
  const [graphqlImportedItems, setGraphqlImportedItems] = useState<any[]>([])
  const [graphqlSelectedItems, setGraphqlSelectedItems] = useState<Set<number>>(new Set())

  // Drag and drop states
  const [isDraggingPostman, setIsDraggingPostman] = useState(false)
  const [isDraggingSwagger, setIsDraggingSwagger] = useState(false)

  // Parse Swagger/OpenAPI spec to tools
  const parseSwaggerSpec = (spec: any, baseUrl?: string): any[] => {
    if (!spec.paths) {
      throw new Error("Invalid API specification: no paths found")
    }

    const tools: any[] = []
    
    // Remove trailing slash from baseUrl
    if (baseUrl) {
      baseUrl = baseUrl.replace(/\/$/, '')
    }
    
    Object.entries(spec.paths).forEach(([path, pathObj]: [string, any]) => {
      Object.entries(pathObj).forEach(([method, operation]: [string, any]) => {
        if (typeof operation !== 'object' || operation === null) return
        
        const operationId = operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`
        const summary = operation.summary || `${method.toUpperCase()} ${path}`
        const description = operation.description || operation.summary || `${method.toUpperCase()} request to ${path}`
        
        // Build parameters from OpenAPI spec
        const parameters: Record<string, any> = {}
        
        // Path parameters
        if (operation.parameters) {
          operation.parameters.forEach((param: any) => {
            if (param.in === 'query' || param.in === 'header' || param.in === 'path') {
              parameters[param.name] = {
                type: param.schema?.type || param.type || 'string',
                description: param.description || `${param.in} parameter: ${param.name}`,
                required: param.required || param.in === 'path'
              }
            }
          })
        }
        
        // Request body parameters (for POST, PUT, PATCH)
        if (operation.requestBody && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
          const content = operation.requestBody.content
          if (content) {
            const contentType = Object.keys(content)[0] // Get first content type
            const schema = content[contentType]?.schema
            
            if (schema && schema.properties) {
              Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
                parameters[propName] = {
                  type: propSchema.type || 'string',
                  description: propSchema.description || `Request body parameter: ${propName}`,
                  required: schema.required?.includes(propName) || false
                }
              })
            } else if (schema && schema.type === 'object') {
              // Generic object parameter
              parameters['requestBody'] = {
                type: 'object',
                description: 'Request body data',
                required: operation.requestBody.required || false
              }
            }
          }
        }
        
        // Build headers
        const headers: Record<string, string> = {}
        if (operation.parameters) {
          operation.parameters.forEach((param: any) => {
            if (param.in === 'header' && param.schema?.default) {
              headers[param.name] = param.schema.default
            }
          })
        }
        
        // Construct full API URL
        const fullUrl = baseUrl ? `${baseUrl}${path}` : path
        
        const tool = {
          name: operationId.replace(/[^a-zA-Z0-9_]/g, '_'),
          title: summary,
          description: description,
          tool_type: "api",
          api_url: fullUrl,
          http_method: method.toUpperCase(),
          parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        }
        
        tools.push(tool)
      })
    })
    
    return tools
  }

  // Helper function to extract base URL from Swagger URL
  const extractBaseUrlFromSwaggerUrl = (url: string): string => {
    url = url.replace(/\/$/, '')
    
    const docPaths = [
      '/docs/openapi.json',
      '/docs/swagger.json', 
      '/docs/openapi.yaml',
      '/docs/swagger.yaml',
      '/api-docs/swagger.json',
      '/api-docs/openapi.json',
      '/swagger.json',
      '/openapi.json',
      '/swagger.yaml',
      '/openapi.yaml',
      '/swagger/v1/swagger.json',
      '/swagger/v2/swagger.json',
      '/swagger/v3/swagger.json',
      '/v1/swagger.json',
      '/v2/swagger.json',
      '/v3/swagger.json',
      '/api/swagger.json',
      '/api/openapi.json'
    ]
    
    for (const docPath of docPaths) {
      if (url.endsWith(docPath)) {
        return url.slice(0, -docPath.length)
      }
    }
    
    return url
  }

  const handleSwaggerImport = async () => {
    if (!swaggerUrl && !swaggerFile) {
      setSwaggerImportError("Please provide a URL or upload a file")
      return { success: false, tools: [] }
    }

    setIsSwaggerImporting(true)
    setSwaggerImportError("")
    setSwaggerImportSuccess(false)
    setSwaggerImportedItems([])
    setSwaggerSelectedItems(new Set())

    try {
      let spec: any = null
      let baseUrl = ''

      if (swaggerFile) {
        // File upload
        const text = await swaggerFile.text()
        try {
          spec = JSON.parse(text)
        } catch {
          throw new Error("Invalid JSON format. YAML support coming soon.")
        }
      } else if (swaggerUrl) {
        // URL import using the backend API
        const response = await fetch('/api/import/swagger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: swaggerUrl.trim()
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
        
        const data = await response.json()
        spec = data.spec
        
        // Extract base URL from the swagger URL
        baseUrl = extractBaseUrlFromSwaggerUrl(swaggerUrl.trim())
      }

      const tools = parseSwaggerSpec(spec, baseUrl)
      
      if (tools.length > 0) {
        setSwaggerImportedItems(tools)
        setSwaggerSelectedItems(new Set(tools.map((_, index) => index)))
        return { success: true, tools }
      } else {
        setSwaggerImportError("No endpoints found in the API specification")
        return { success: false, tools: [] }
      }
    } catch (error) {
      setSwaggerImportError(error instanceof Error ? error.message : "Import failed")
      return { success: false, tools: [] }
    } finally {
      setIsSwaggerImporting(false)
    }
  }

  // Parse Postman collection to tools
  const parsePostmanCollection = (collection: any): any[] => {
    if (!collection.item && !collection.requests) {
      throw new Error("No requests found in Postman collection")
    }

    const tools: any[] = []
    const processItems = (items: any[], folderPath: string = '') => {
      items.forEach((item: any) => {
        if (item.item) {
          // It's a folder, process recursively
          processItems(item.item, folderPath ? `${folderPath}/${item.name}` : item.name)
        } else if (item.request) {
          // It's a request
          const request = item.request
          const name = item.name || 'Unnamed Request'
          const method = request.method || 'GET'
          let url = request.url?.raw || request.url || ''
          
          // Handle Postman URL object format
          if (typeof request.url === 'object' && request.url.raw) {
            url = request.url.raw
          }

          // Extract parameters from URL
          const parameters: Record<string, any> = {}
          
          // Query parameters
          if (request.url?.query) {
            request.url.query.forEach((param: any) => {
              parameters[param.key] = {
                type: 'string',
                description: param.description || `Query parameter: ${param.key}`,
                required: !param.disabled
              }
            })
          }

          // Path variables
          if (request.url?.variable) {
            request.url.variable.forEach((variable: any) => {
              parameters[variable.key] = {
                type: 'string',
                description: variable.description || `Path parameter: ${variable.key}`,
                required: true
              }
            })
          }

          // Headers
          const headers: Record<string, string> = {}
          if (request.header) {
            request.header.forEach((header: any) => {
              if (!header.disabled && header.key && header.value) {
                headers[header.key] = header.value
              }
            })
          }

          const toolName = folderPath ? `${folderPath}_${name}` : name
          const tool = {
            name: toolName.replace(/[^a-zA-Z0-9_]/g, '_'),
            title: name,
            description: item.description || request.description || `${method} request to ${url}`,
            tool_type: "api",
            api_url: url,
            http_method: method.toUpperCase(),
            parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
            headers: Object.keys(headers).length > 0 ? headers : undefined
          }
          
          tools.push(tool)
        }
      })
    }

    processItems(collection.item || collection.requests)
    return tools
  }

  const handlePostmanImport = async () => {
    if (!postmanFile) {
      setPostmanImportError("Please upload a Postman collection file")
      return { success: false, tools: [] }
    }

    setIsPostmanImporting(true)
    setPostmanImportError("")
    setPostmanImportSuccess(false)
    setPostmanImportedItems([])
    setPostmanSelectedItems(new Set())

    try {
      const postmanText = await postmanFile.text()
      let collection: any

      try {
        collection = JSON.parse(postmanText)
      } catch {
        throw new Error("Invalid Postman collection format")
      }

      const tools = parsePostmanCollection(collection)
      
      if (tools.length > 0) {
        setPostmanImportedItems(tools)
        setPostmanSelectedItems(new Set(tools.map((_, index) => index)))
        return { success: true, tools }
      } else {
        setPostmanImportError("No requests found in the Postman collection")
        return { success: false, tools: [] }
      }
    } catch (error) {
      setPostmanImportError(error instanceof Error ? error.message : "Import failed")
      return { success: false, tools: [] }
    } finally {
      setIsPostmanImporting(false)
    }
  }

  // Helper to get GraphQL type as string
  const getGraphQLType = (type: any): string => {
    if (type.kind === 'NON_NULL') {
      return getGraphQLType(type.ofType)
    }
    if (type.kind === 'LIST') {
      return `array`
    }
    if (type.name) {
      const scalarTypes: Record<string, string> = {
        'String': 'string',
        'Int': 'integer',
        'Float': 'number',
        'Boolean': 'boolean',
        'ID': 'string'
      }
      return scalarTypes[type.name] || 'string'
    }
    return 'string'
  }

  // Parse GraphQL schema to tools
  const parseGraphQLSchema = (schema: any, endpoint: string): any[] => {
    const tools: any[] = []

    // Process queries and mutations
    const processType = (typeName: string | null, operationType: 'query' | 'mutation') => {
      if (!typeName) return

      const type = schema.types.find((t: any) => t.name === typeName)
      if (!type || !type.fields) return

      type.fields.forEach((field: any) => {
        const parameters: Record<string, any> = {}
        
        // Process field arguments
        if (field.args && field.args.length > 0) {
          field.args.forEach((arg: any) => {
            parameters[arg.name] = {
              type: getGraphQLType(arg.type),
              description: arg.description || `${operationType} argument: ${arg.name}`,
              required: arg.type.kind === 'NON_NULL'
            }
          })
        }

        const tool = {
          name: `${operationType}_${field.name}`.replace(/[^a-zA-Z0-9_]/g, '_'),
          title: field.name,
          description: field.description || `GraphQL ${operationType}: ${field.name}`,
          tool_type: "api",
          api_url: endpoint,
          http_method: "POST",
          parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
          headers: {
            'Content-Type': 'application/json'
          }
        }
        
        tools.push(tool)
      })
    }

    processType(schema.queryType?.name, 'query')
    processType(schema.mutationType?.name, 'mutation')

    return tools
  }

  const handleGraphqlImport = async () => {
    if (!graphqlUrl) {
      setGraphqlImportError("Please provide a GraphQL endpoint URL")
      return { success: false, tools: [] }
    }

    setIsGraphqlImporting(true)
    setGraphqlImportError("")
    setGraphqlImportSuccess(false)
    setGraphqlImportedItems([])
    setGraphqlSelectedItems(new Set())

    try {
      // Normalize URL to ensure it has a protocol
      const normalizedUrl = graphqlUrl.trim().match(/^https?:\/\//i) 
        ? graphqlUrl.trim() 
        : `https://${graphqlUrl.trim()}`

      // GraphQL introspection query
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
          }
        }

        fragment InputValue on __InputValue {
          name
          description
          type { ...TypeRef }
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

      const response = await fetch(normalizedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
      const tools = parseGraphQLSchema(schema, normalizedUrl)
      
      if (tools.length > 0) {
        setGraphqlImportedItems(tools)
        setGraphqlSelectedItems(new Set(tools.map((_, index) => index)))
        return { success: true, tools }
      } else {
        setGraphqlImportError("No queries or mutations found in the GraphQL schema")
        return { success: false, tools: [] }
      }
    } catch (error) {
      setGraphqlImportError(error instanceof Error ? error.message : "Import failed")
      return { success: false, tools: [] }
    } finally {
      setIsGraphqlImporting(false)
    }
  }

  // Drag and drop handlers for Postman
  const handlePostmanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingPostman(true)
  }

  const handlePostmanDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingPostman(false)
  }

  const handlePostmanDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingPostman(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setPostmanFile(file)
        toast({ title: `Selected file: ${file.name}` })
      } else {
        toast({ 
          title: "Invalid file type", 
          description: "Please select a JSON file",
          variant: "destructive"
        })
      }
    }
  }

  // Drag and drop handlers for Swagger
  const handleSwaggerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSwagger(true)
  }

  const handleSwaggerDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSwagger(false)
  }

  const handleSwaggerDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSwagger(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const validTypes = ['application/json', 'text/yaml', 'application/x-yaml']
      const validExtensions = ['.json', '.yaml', '.yml']
      
      if (validTypes.includes(file.type) || validExtensions.some(ext => file.name.endsWith(ext))) {
        setSwaggerFile(file)
        toast({ title: `Selected file: ${file.name}` })
      } else {
        toast({ 
          title: "Invalid file type", 
          description: "Please select a JSON or YAML file",
          variant: "destructive"
        })
      }
    }
  }

  // Reset swagger import state
  const resetSwaggerImport = () => {
    setSwaggerImportedItems([])
    setSwaggerSelectedItems(new Set())
    setSwaggerImportError("")
    setSwaggerImportSuccess(false)
  }

  return {
    // Swagger state
    swaggerUrl,
    setSwaggerUrl,
    swaggerFile,
    setSwaggerFile,
    isSwaggerImporting,
    swaggerImportSuccess,
    swaggerImportError,
    swaggerImportedItems,
    swaggerSelectedItems,
    setSwaggerSelectedItems,

    // Postman state
    postmanFile,
    setPostmanFile,
    isPostmanImporting,
    postmanImportSuccess,
    postmanImportError,
    postmanImportedItems,
    postmanSelectedItems,
    setPostmanSelectedItems,

    // GraphQL state
    graphqlUrl,
    setGraphqlUrl,
    isGraphqlImporting,
    graphqlImportSuccess,
    graphqlImportError,
    graphqlImportedItems,
    graphqlSelectedItems,
    setGraphqlSelectedItems,

    // Drag and drop states
    isDraggingSwagger,
    setIsDraggingSwagger,
    isDraggingPostman,
    setIsDraggingPostman,

    // Handlers
    handleSwaggerImport,
    handlePostmanImport,
    handleGraphqlImport,
    resetSwaggerImport,
    handleSwaggerDragOver,
    handleSwaggerDragLeave,
    handleSwaggerDrop,
    handlePostmanDragOver,
    handlePostmanDragLeave,
    handlePostmanDrop
  }
}
