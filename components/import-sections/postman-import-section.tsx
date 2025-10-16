"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Download, Loader2 } from "lucide-react"
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

interface PostmanImportSectionProps {
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

// Postman import function
const importPostman = async (importFile: File, itemType: "tool" | "resource"): Promise<ImportableItem[]> => {
  if (!importFile) {
    throw new Error("Please upload a Postman collection file")
  }

  const postmanText = await importFile.text()
  let collection: {
    item?: unknown[]
    requests?: unknown[]
  }

  try {
    collection = JSON.parse(postmanText)
  } catch {
    throw new Error("Invalid Postman collection format")
  }

  if (!collection.item && !collection.requests) {
    throw new Error("No requests found in Postman collection")
  }

  const items: ImportableItem[] = []
  const processItems = (collectionItems: unknown[], folderPath: string = '') => {
    collectionItems.forEach((unknownItem: unknown) => {
      const collectionItem = unknownItem as {
        item?: unknown[]
        name?: string
        request?: {
          method?: string
          url?: string | { 
            raw?: string
            query?: Array<{ key: string; description?: string; disabled?: boolean }>
            variable?: Array<{ key: string; description?: string }>
          }
          header?: Array<{ key?: string; value?: string; disabled?: boolean }>
          description?: string
        }
        description?: string
      }
      if (collectionItem.item) {
        processItems(collectionItem.item, folderPath ? `${folderPath}/${collectionItem.name}` : collectionItem.name || '')
      } else if (collectionItem.request) {
        const request = collectionItem.request
        const name = collectionItem.name || 'Unnamed Request'
        const method = request.method || 'GET'
        let url = typeof request.url === 'string' ? request.url : request.url?.raw || ''
        
        if (typeof request.url === 'object' && request.url.raw) {
          url = request.url.raw
        }

        // For resources, only include GET requests
        if (itemType === 'resource' && method.toLowerCase() !== 'get') {
          return
        }

        const parameters: Record<string, ParameterDefinition> = {}
        
        if (typeof request.url === 'object' && request.url?.query) {
          request.url.query.forEach((param) => {
            parameters[param.key] = {
              type: 'string',
              description: param.description || `Query parameter: ${param.key}`,
              required: !param.disabled
            }
          })
        }

        if (typeof request.url === 'object' && request.url?.variable) {
          request.url.variable.forEach((variable) => {
            parameters[variable.key] = {
              type: 'string',
              description: variable.description || `Path parameter: ${variable.key}`,
              required: true
            }
          })
        }

        const headers: Record<string, string> = {}
        if (request.header) {
          request.header.forEach((header) => {
            if (!header.disabled && header.key && header.value) {
              headers[header.key] = header.value
            }
          })
        }

        const itemName = folderPath ? `${folderPath}_${name}` : name
        const importableItem: ImportableItem = {
          name: itemName.replace(/[^a-zA-Z0-9_]/g, '_'),
          title: name,
          description: collectionItem.description || request.description || `${method} request to ${url}`,
          api_url: url,
          http_method: method.toUpperCase(),
          parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        }

        // Set type-specific fields
        if (itemType === 'tool') {
          importableItem.tool_type = "api"
        } else {
          importableItem.resource_type = "dynamic"
          try {
            const urlObj = new URL(url)
            importableItem.uri = urlObj.pathname
          } catch {
            importableItem.uri = url
          }
          importableItem.mime_type = "application/json"
        }
        
        items.push(importableItem)
      }
    })
  }

  processItems(collection.item || collection.requests || [])
  return items
}

export function PostmanImportSection({
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
}: PostmanImportSectionProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handlePostmanImport = async () => {
    if (!importFile) {
      setImportError("Please upload a Postman collection file")
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const items = await importPostman(importFile, itemType)
      onImport(items)
    } catch (error) {
      console.error("Postman import failed:", error)
      setImportError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }
  return (
    <div className="space-y-2">
      <Label>Upload Postman Collection</Label>
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
              Will import GET requests as resources
            </p>
          </div>
          <input type="file" className="hidden" onChange={onFileUpload} accept=".json" />
        </label>
      </div>
      {importFile && (
        <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
          <FileText className="h-4 w-4" />
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
        onClick={handlePostmanImport}
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
