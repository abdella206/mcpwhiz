"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Globe, X, Info, Download, Loader2 } from "lucide-react"

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

interface HARImportSectionProps {
  importFile: File | null
  setImportFile: (file: File | null) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDragOver: boolean
  itemType: "tool" | "resource"
  onImport: (items: ImportableItem[]) => void
}

// HAR import function
const importHAR = async (importFile: File, itemType: "tool" | "resource"): Promise<ImportableItem[]> => {
  if (!importFile) {
    throw new Error("Please upload a HAR file")
  }

  const harText = await importFile.text()
  let har: {
    log?: {
      entries?: Array<{
        request: {
          method: string
          url: string
          queryString?: Array<{ name: string; value: string }>
          headers?: Array<{ name: string; value: string }>
          postData?: {
            text?: string
            mimeType?: string
          }
        }
        response?: {
          status?: number
        }
      }>
    }
  }

  try {
    har = JSON.parse(harText)
  } catch {
    throw new Error("Invalid HAR file format")
  }

  if (!har.log || !har.log.entries) {
    throw new Error("No entries found in HAR file")
  }

  const items: ImportableItem[] = []
  const seenUrls = new Set<string>()

  har.log.entries.forEach((entry) => {
    const request = entry.request
    let url: URL
    
    try {
      url = new URL(request.url)
    } catch {
      return
    }
    
    const method = request.method
    
    const skipExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.map', '.html', '.htm']
    if (skipExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
      return
    }

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      const apiPatterns = ['/api/', '/v1/', '/v2/', '/v3/', '/graphql', '/rest/', '/endpoint']
      if (!apiPatterns.some(pattern => url.pathname.includes(pattern))) {
        return
      }
    }

    // For resources, only include GET requests
    if (itemType === 'resource' && method.toLowerCase() !== 'get') {
      return
    }

    const urlKey = `${method}_${url.origin}${url.pathname}`
    if (seenUrls.has(urlKey)) {
      return
    }
    seenUrls.add(urlKey)

    const parameters: Record<string, ParameterDefinition> = {}
    
    url.searchParams.forEach((value, key) => {
      parameters[key] = {
        type: 'string',
        description: `Query parameter: ${key}`,
        required: false
      }
    })

    if (request.postData && request.postData.text) {
      try {
        const bodyData = JSON.parse(request.postData.text)
        if (typeof bodyData === 'object' && bodyData !== null) {
          Object.keys(bodyData).forEach(key => {
            parameters[key] = {
              type: typeof bodyData[key] === 'number' ? 'number' : 
                    typeof bodyData[key] === 'boolean' ? 'boolean' : 'string',
              description: `Body parameter: ${key}`,
              required: method === 'POST' || method === 'PUT'
            }
          })
        }
      } catch {
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          parameters['body'] = {
            type: 'string',
            description: `Request body (${request.postData.mimeType || 'raw'})`,
            required: true
          }
        }
      }
    }

    const headers: Record<string, string> = {}
    request.headers?.forEach((header) => {
      const skipHeaders = ['user-agent', 'accept', 'accept-language', 'accept-encoding', 'connection', 'host', 'referer', 'origin']
      if (!skipHeaders.includes(header.name.toLowerCase())) {
        headers[header.name] = header.value
      }
    })

    const pathName = url.pathname.replace(/^\/|\/$/g, '') || 'root'
    const item: ImportableItem = {
      name: `${method}_${pathName}`.replace(/[^a-zA-Z0-9_]/g, '_'),
      title: `${method} ${url.pathname}`,
      description: `${method} request to ${url.pathname}`,
      api_url: `${url.origin}${url.pathname}`,
      http_method: method.toUpperCase(),
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined
    }

    // Set type-specific fields
    if (itemType === 'tool') {
      item.tool_type = "api"
    } else {
      item.resource_type = "dynamic"
      item.uri = url.pathname
      item.mime_type = "application/json"
    }
    
    items.push(item)
  })

  return items
}

export function HARImportSection({
  importFile,
  setImportFile,
  onFileUpload,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  isDragOver,
  itemType,
  onImport
}: HARImportSectionProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleHARImport = async () => {
    if (!importFile) {
      setImportError("Please upload a HAR file")
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const items = await importHAR(importFile, itemType)
      onImport(items)
    } catch (error) {
      console.error("HAR import failed:", error)
      setImportError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }
  return (
    <div className="space-y-2">
      <Label>Upload HAR File</Label>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Export from your browser&apos;s DevTools Network tab - imports all HTTP methods as tools
        </AlertDescription>
      </Alert>
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
              HTTP Archive Format (.har)
            </p>
          </div>
          <input type="file" className="hidden" onChange={onFileUpload} accept=".har" />
        </label>
      </div>
      {importFile && (
        <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
          <Globe className="h-4 w-4" />
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

      {importError && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-wrap">{importError}</AlertDescription>
        </Alert>
      )}

      {/* Import Button */}
      <Button
        onClick={handleHARImport}
        disabled={isImporting || !importFile}
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
