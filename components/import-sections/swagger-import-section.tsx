"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileJson, X, Download, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface SwaggerImportSectionProps {
  importUrl: string
  setImportUrl: (url: string) => void
  importFile: File | null
  setImportFile: (file: File | null) => void
  authHeader: string
  setAuthHeader: (header: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDragOver: boolean
  itemType: "tool" | "resource"
  onImport: (items: ImportableItem[]) => void
}

// Simplified Swagger import function - delegates to API route
const fetchSwaggerFromUrl = async (url: string, authHeader: string): Promise<{ spec: unknown, baseUrl: string }> => {
  try {
    console.log(`Fetching Swagger spec via backend API: ${url}`)
    
    const response = await fetch('/api/import/swagger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url.trim(),
        authHeader
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`Successfully fetched spec via backend API from: ${data.fetchUrl}`)
    
    return {
      spec: data.spec,
      baseUrl: data.baseUrl
    }
  } catch (error) {
    console.error('Backend API fetch failed:', error)
    throw error
  }
}

const parseSwaggerSpec = (spec: unknown, baseUrl?: string, itemType?: "tool" | "resource"): ImportableItem[] => {
  const specObj = spec as { paths?: Record<string, unknown> }
  if (!specObj.paths) {
    throw new Error("Invalid API specification: no paths found")
  }

  const items: ImportableItem[] = []
  
  if (baseUrl) {
    baseUrl = baseUrl.replace(/\/$/, '')
  }

  Object.entries(specObj.paths).forEach(([path, pathItem]: [string, unknown]) => {
    const pathItemObj = pathItem as Record<string, unknown>
    Object.entries(pathItemObj).forEach(([method, operation]: [string, unknown]) => {
      const operationObj = operation as {
        operationId?: string
        summary?: string
        description?: string
        parameters?: Array<{
          name: string
          in: string
          description?: string
          required?: boolean
          schema?: { type?: string; default?: string }
          type?: string
        }>
        requestBody?: {
          required?: boolean
          content?: Record<string, {
            schema?: {
              type?: string
              properties?: Record<string, { type?: string; description?: string }>
              required?: string[]
            }
          }>
        }
      }
      if (typeof operation !== 'object' || !operation) return
      
      // For resources, only include GET requests
      if (itemType === 'resource' && method.toLowerCase() !== 'get') {
        return
      }
      
      const operationId = operationObj.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`
      const summary = operationObj.summary || `${method.toUpperCase()} ${path}`
      const description = operationObj.description || operationObj.summary || `${method.toUpperCase()} request to ${path}`
      
      // Build parameters from OpenAPI spec
      const parameters: Record<string, ParameterDefinition> = {}
      
      if (operationObj.parameters) {
        operationObj.parameters.forEach((param) => {
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
      if (operationObj.requestBody && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        const content = operationObj.requestBody.content
        if (content) {
          const contentType = Object.keys(content)[0]
          const schema = content[contentType]?.schema
          
          if (schema && schema.properties) {
            Object.entries(schema.properties).forEach(([propName, propSchema]) => {
              parameters[propName] = {
                type: propSchema.type || 'string',
                description: propSchema.description || `Request body parameter: ${propName}`,
                required: schema.required?.includes(propName) || false
              }
            })
          } else if (schema && schema.type === 'object') {
            parameters['requestBody'] = {
              type: 'object',
              description: 'Request body data',
              required: operationObj.requestBody.required || false
            }
          }
        }
      }
      
      // Build headers
      const headers: Record<string, string> = {}
      if (operationObj.parameters) {
        operationObj.parameters.forEach((param) => {
          if (param.in === 'header' && param.schema?.default) {
            headers[param.name] = param.schema.default
          }
        })
      }
      
      const fullUrl = baseUrl ? `${baseUrl}${path}` : path
      
      const item: ImportableItem = {
        name: operationId.replace(/[^a-zA-Z0-9_]/g, '_'),
        title: summary,
        description: description,
        api_url: fullUrl,
        http_method: method.toUpperCase(),
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined
      }
      
      // Set type-specific fields
      if (itemType === 'tool') {
        item.tool_type = "api"
      } else {
        item.resource_type = "dynamic"
        item.uri = path
        item.mime_type = "application/json"
      }
      
      items.push(item)
    })
  })
  
  return items
}

export function SwaggerImportSection({
  importUrl,
  setImportUrl,
  importFile,
  setImportFile,
  authHeader,
  setAuthHeader,
  onFileUpload,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  isDragOver,
  itemType,
  onImport
}: SwaggerImportSectionProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleSwaggerImport = async () => {
    setIsImporting(true)
    setImportError(null)

    try {
      let spec: unknown = null
      let baseUrl = ''

      if (importFile) {
        const text = await importFile.text()
        try {
          spec = JSON.parse(text)
        } catch {
          throw new Error("Invalid JSON format. YAML support coming soon.")
        }
      } else if (importUrl) {
        const result = await fetchSwaggerFromUrl(importUrl, authHeader)
        spec = result.spec
        baseUrl = result.baseUrl
      } else {
        throw new Error("Please provide a URL or upload a file")
      }

      const items = parseSwaggerSpec(spec, baseUrl, itemType)
      onImport(items)
    } catch (error) {
      console.error("Swagger import failed:", error)
      setImportError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Import Method</Label>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="border-2 border-transparent data-[state=active]:border-orange-500">URL</TabsTrigger>
            <TabsTrigger value="file" className="border-2 border-transparent data-[state=active]:border-orange-500">File Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-2">
            <Input
              placeholder="e.g., https://petstore.swagger.io/v2/swagger.json"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Will import GET endpoints as resources
            </div>
          </TabsContent>
          <TabsContent value="file" className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label 
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragOver 
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30" 
                    : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                  <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    JSON files only (YAML coming soon)
                  </p>
                </div>
                <input type="file" className="hidden" onChange={onFileUpload} accept=".json" />
              </label>
            </div>
            {importFile && (
              <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                <FileJson className="h-4 w-4" />
                <span className="text-sm truncate">{importFile.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setImportFile(null)}
                  className="ml-auto h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Advanced Options */}
      <div className="space-y-2">
        <Label>Advanced Options</Label>
        <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm">Authorization Header</Label>
            <Input
              placeholder="e.g., Bearer YOUR_TOKEN"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-zinc-500">
              Optional: Add if the API requires authentication
            </p>
          </div>
        </div>
      </div>

      {importError && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-wrap">{importError}</AlertDescription>
        </Alert>
      )}

      {/* Import Button */}
      <Button
        onClick={handleSwaggerImport}
        disabled={isImporting || (!importUrl && !importFile)}
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