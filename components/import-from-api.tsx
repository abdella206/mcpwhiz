"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, FileCode, Zap, Send, Layers, Check, RefreshCw, Search, Globe } from "lucide-react"
import Link from "next/link"
import { SwaggerImportSection } from "./import-sections/swagger-import-section"
import { PostmanImportSection } from "./import-sections/postman-import-section"
import { HARImportSection } from "./import-sections/har-import-section"
import { GraphQLImportSection } from "./import-sections/graphql-import-section"
import { WSDLImportSection } from "./import-sections/wsdl-import-section"

// Generic interfaces for both tools and resources
export interface ImportableItem {
  name: string
  title: string
  description: string
  // Tool-specific fields
  tool_type?: "static" | "api" | "resource_link"
  api_url?: string
  http_method?: string
  headers?: Record<string, string>
  parameters?: Record<string, ParameterDefinition>
  static_result?: string
  resource_links_header?: string
  resource_links?: ResourceLink[]
  // Resource-specific fields
  resource_type?: "static" | "dynamic" | "context_aware"
  uri?: string
  mime_type?: string
  static_content?: string
  completion_config?: CompletionConfig
}

export interface ParameterDefinition {
      type: string
  description: string
  required: boolean
}

export interface ResourceLink {
  uri: string
  name: string
  mimeType: string
  description: string
}

export interface CompletionCondition {
        when: Record<string, string>
        values: string[]
}

export interface CompletionConfig {
  complete: Record<string, {
    type: string
    conditions?: CompletionCondition[]
      default?: string[]
    }>
}

export type ImportMode = "swagger" | "postman" | "har" | "graphql" | "wsdl"

export interface ImportFromAPIProps {
  itemType: 'tool' | 'resource'
  onItemsImported: (items: ImportableItem[]) => void
  importModes?: ImportMode[]
  className?: string
}

export function ImportFromAPI({
  itemType,
  onItemsImported, 
  importModes = ["swagger", "postman", "har", "graphql", "wsdl"],
  className = ""
}: ImportFromAPIProps) {
  // Import state
  const [importMode, setImportMode] = useState<ImportMode>("swagger")
  const [importUrl, setImportUrl] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [authHeader, setAuthHeader] = useState("")
  const [graphqlEndpoint, setGraphqlEndpoint] = useState("")
  const [importedItems, setImportedItems] = useState<ImportableItem[]>([])
  const [selectedImportedItems, setSelectedImportedItems] = useState<Set<number>>(new Set())
  const [showUrlEditor, setShowUrlEditor] = useState(false)
  const [baseUrlToUpdate, setBaseUrlToUpdate] = useState("")
  const [newBaseUrl, setNewBaseUrl] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  // Filter available import modes based on item type
  const availableModes = importModes.filter(mode => {
    if (itemType === 'resource' && mode === 'graphql') {
      return false // GraphQL doesn't have traditional GET resources
    }
    return true
  })

  // Set default mode to first available
  if (availableModes.length > 0 && !availableModes.includes(importMode)) {
    setImportMode(availableModes[0])
  }


  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportUrl("")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      setImportFile(file)
      setImportUrl("")
    }
  }

  // Import selected items
  const importSelectedItems = () => {
    const selectedItems = importedItems.filter((_, index) => selectedImportedItems.has(index))
    onItemsImported(selectedItems)
    setImportedItems([])
    setSelectedImportedItems(new Set())
    setImportUrl("")
    setImportFile(null)
  }

  // URL editor functions
  const detectBaseUrl = () => {
    if (importedItems.length === 0) return
    
    const urls = importedItems.map(item => item.api_url).filter((url): url is string => Boolean(url))
    if (urls.length === 0) return
    
    const baseUrls = urls.map(url => {
      try {
        const urlObj = new URL(url)
        return `${urlObj.protocol}//${urlObj.host}`
      } catch {
        return null
      }
    }).filter((url): url is string => url !== null)
    
    if (baseUrls.length > 0) {
      const urlCounts = baseUrls.reduce((acc, url) => {
        acc[url] = (acc[url] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const mostCommonUrl = Object.entries(urlCounts).sort(([,a], [,b]) => b - a)[0]?.[0]
      if (mostCommonUrl) {
        setBaseUrlToUpdate(mostCommonUrl)
        setNewBaseUrl(mostCommonUrl)
      }
    }
  }

  const updateImportedItemsBaseUrl = () => {
    if (!baseUrlToUpdate || !newBaseUrl) return
    
    const updatedItems = importedItems.map(item => {
      if (item.api_url && item.api_url.startsWith(baseUrlToUpdate)) {
        return {
          ...item,
          api_url: item.api_url.replace(baseUrlToUpdate, newBaseUrl)
        }
      }
      return item
    })
    
    setImportedItems(updatedItems)
    setShowUrlEditor(false)
    setBaseUrlToUpdate("")
    setNewBaseUrl("")
  }

  // Helper to get HTTP method badge colors
  const getHttpMethodBadgeClass = (method: string): string => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
      case 'POST':
        return 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
      case 'PUT':
        return 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300'
      case 'PATCH':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300'
      case 'DELETE':
        return 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Help text */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        💡 Need help? Check out our{" "}
        <Link href="/docs#import-from-api" className="text-orange-600 dark:text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">
          Import from API documentation
        </Link>
      </div>

      {/* Import Type Selection */}
      <div className="space-y-2">
        <Label>Import Type</Label>
        <Select value={importMode} onValueChange={(value: ImportMode) => setImportMode(value)}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                {importMode === "swagger" && <Zap className="h-4 w-4 text-green-600" />}
                {importMode === "postman" && <Send className="h-4 w-4 text-orange-500" />}
                {importMode === "graphql" && <Layers className="h-4 w-4 text-pink-500" />}
                {importMode === "har" && <Globe className="h-4 w-4" />}
                {importMode === "wsdl" && <FileCode className="h-4 w-4" />}
                {importMode === "swagger" && "Swagger/OpenAPI"}
                {importMode === "postman" && "Postman Collection"}
                {importMode === "graphql" && "GraphQL"}
                {importMode === "har" && "HAR File"}
                {importMode === "wsdl" && "WSDL/SOAP"}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableModes.map((mode) => (
              <SelectItem key={mode} value={mode}>
              <div className="flex items-center gap-2">
                  {mode === "swagger" && <Zap className="h-4 w-4 text-green-600" />}
                  {mode === "postman" && <Send className="h-4 w-4 text-orange-500" />}
                  {mode === "graphql" && <Layers className="h-4 w-4 text-pink-500" />}
                  {mode === "har" && <Globe className="h-4 w-4" />}
                  {mode === "wsdl" && <FileCode className="h-4 w-4" />}
                  {mode === "swagger" && "Swagger/OpenAPI"}
                  {mode === "postman" && "Postman Collection"}
                  {mode === "graphql" && "GraphQL"}
                  {mode === "har" && "HAR File"}
                  {mode === "wsdl" && "WSDL/SOAP"}
              </div>
            </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {itemType === 'tool' 
            ? "All HTTP methods will be imported as tools"
            : "Only GET endpoints will be imported as resources"
          }
        </div>
      </div>

      {/* Swagger/OpenAPI Import */}
      {importMode === "swagger" && (
        <SwaggerImportSection
          importUrl={importUrl}
          setImportUrl={setImportUrl}
          importFile={importFile}
          setImportFile={setImportFile}
          authHeader={authHeader}
          setAuthHeader={setAuthHeader}
          onFileUpload={handleFileUpload}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
          isDragOver={isDragOver}
          itemType={itemType}
          onImport={(items) => {
            setImportedItems(items)
            setSelectedImportedItems(new Set(items.map((_, index) => index)))
          }}
        />
      )}

      {/* Postman Collection Import */}
      {importMode === "postman" && (
        <PostmanImportSection
          importFile={importFile}
          setImportFile={setImportFile}
          onFileUpload={handleFileUpload}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
          isDragOver={isDragOver}
          itemType={itemType}
          onImport={(items) => {
            setImportedItems(items)
            setSelectedImportedItems(new Set(items.map((_, index) => index)))
          }}
        />
      )}

      {/* HAR File Import */}
      {importMode === "har" && (
        <HARImportSection
          importFile={importFile}
          setImportFile={setImportFile}
          onFileUpload={handleFileUpload}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
          isDragOver={isDragOver}
          itemType={itemType}
          onImport={(items) => {
            setImportedItems(items)
            setSelectedImportedItems(new Set(items.map((_, index) => index)))
          }}
        />
      )}

      {/* GraphQL Import */}
      {importMode === "graphql" && (
        <GraphQLImportSection
          graphqlEndpoint={graphqlEndpoint}
          setGraphqlEndpoint={setGraphqlEndpoint}
          authHeader={authHeader}
          setAuthHeader={setAuthHeader}
          itemType={itemType}
          onImport={(items) => {
            setImportedItems(items)
            setSelectedImportedItems(new Set(items.map((_, index) => index)))
          }}
        />
      )}

      {/* WSDL/SOAP Import */}
      {importMode === "wsdl" && (
        <WSDLImportSection
          importUrl={importUrl}
          setImportUrl={setImportUrl}
          importFile={importFile}
          setImportFile={setImportFile}
          authHeader={authHeader}
          setAuthHeader={setAuthHeader}
          onFileUpload={handleFileUpload}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
          isDragOver={isDragOver}
          itemType={itemType}
          onImport={(items) => {
            setImportedItems(items)
            setSelectedImportedItems(new Set(items.map((_, index) => index)))
          }}
        />
      )}


      {/* Imported Items List */}
      {importedItems.length > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Found {importedItems.length} {itemType}s</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImportedItems(new Set(importedItems.map((_, i) => i)))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImportedItems(new Set())}
              >
                Select None
              </Button>
            </div>
          </div>

          {/* URL Editor Section */}
            <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">Update Base URL</h5>
                <div className="flex gap-2">
                {!showUrlEditor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      detectBaseUrl()
                      setShowUrlEditor(true)
                    }}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Edit URLs
                  </Button>
                )}
                {showUrlEditor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUrlEditor(false)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                </div>
              </div>
              
            {showUrlEditor && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Current Base URL</Label>
                    <Input
                      value={baseUrlToUpdate}
                      onChange={(e) => setBaseUrlToUpdate(e.target.value)}
                      placeholder="e.g., http://localhost:3000"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">New Base URL</Label>
                    <Input
                      value={newBaseUrl}
                      onChange={(e) => setNewBaseUrl(e.target.value)}
                      placeholder="e.g., https://api.example.com"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={updateImportedItemsBaseUrl}
                    disabled={!baseUrlToUpdate || !newBaseUrl}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Update All URLs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      detectBaseUrl()
                    }}
                  >
                    <Search className="h-3 w-3 mr-1" />
                    Auto-detect
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This will update the base URL for all imported {itemType}s. For example, changing from &quot;http://localhost:3000&quot; to &quot;https://api.example.com&quot; will update all URLs accordingly.
                </p>
            </div>
          )}
          </div>

          <ScrollArea className="h-96 border rounded-lg p-4">
            <div className="space-y-2">
              {importedItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Checkbox
                    checked={selectedImportedItems.has(index)}
                    onCheckedChange={(checked: boolean) => {
                      const newSelected = new Set(selectedImportedItems)
                      if (checked) {
                        newSelected.add(index)
                      } else {
                        newSelected.delete(index)
                      }
                      setSelectedImportedItems(newSelected)
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.http_method && (
                        <Badge 
                          variant="outline" 
                          className={`shrink-0 ${getHttpMethodBadgeClass(item.http_method)}`}
                        >
                          {item.http_method}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono truncate mt-1">{item.api_url}</p>
                    {item.parameters && Object.keys(item.parameters).length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-zinc-500">
                          Parameters: {Object.entries(item.parameters)
                            .slice(0, 3)
                            .map(([key, param]) => `${key}${param.required ? '*' : ''}`)
                            .join(", ")}
                          {Object.keys(item.parameters).length > 3 && ` +${Object.keys(item.parameters).length - 3} more`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Button
            onClick={importSelectedItems}
            disabled={selectedImportedItems.size === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4 mr-1" />
            Import {selectedImportedItems.size} Selected {itemType === 'tool' ? 'Tool' : 'Resource'}{selectedImportedItems.size !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
