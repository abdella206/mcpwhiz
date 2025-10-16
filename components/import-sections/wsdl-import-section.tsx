"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileCode, X, Info, Download, Loader2 } from "lucide-react"

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

interface WSDLImportSectionProps {
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

// Simplified WSDL import function - delegates to API route
const importWSDL = async (importUrl: string, importFile: File | null, authHeader: string): Promise<ImportableItem[]> => {
  try {
    console.log(`Importing WSDL via backend API: ${importUrl || importFile?.name}`)
    
    const formData = new FormData()
    
    if (importFile) {
      formData.append('file', importFile)
    } else if (importUrl) {
      formData.append('url', importUrl.trim())
    } else {
      throw new Error("Please provide a URL or upload a WSDL file")
    }
    
    if (authHeader) {
      formData.append('authHeader', authHeader)
    }

    const response = await fetch('/api/import/wsdl', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to import WSDL`)
    }

    const data = await response.json()
    console.log(`Successfully imported ${data.tools?.length || 0} WSDL operations`)
    
    return data.tools || []
  } catch (error) {
    console.error('WSDL import failed:', error)
    throw error
  }
}

export function WSDLImportSection({
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
}: WSDLImportSectionProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleWSDLImport = async () => {
    if (!importUrl && !importFile) {
      setImportError("Please provide a URL or upload a WSDL file")
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const items = await importWSDL(importUrl, importFile, authHeader)
      onImport(items)
    } catch (error) {
      console.error("WSDL import failed:", error)
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
              placeholder="e.g., https://api.example.com/service.wsdl"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              WSDL operations will be imported as {itemType}s
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div className="space-y-2">
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
                      <span className="font-semibold">Click to upload or drag and drop</span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      WSDL (.wsdl, .xml)
                    </p>
                  </div>
                  <input type="file" className="hidden" onChange={onFileUpload} accept=".wsdl,.xml" />
                </label>
              </div>
              {importFile && (
                <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                  <FileCode className="h-4 w-4" />
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
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Authentication Header */}
      <div className="space-y-2">
        <Label>Authentication Header (Optional)</Label>
        <Input
          placeholder="e.g., Bearer your-token-here"
          value={authHeader}
          onChange={(e) => setAuthHeader(e.target.value)}
        />
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Authorization header to include with requests
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          WSDL/SOAP operations will be imported as {itemType}s with XML body structure
        </AlertDescription>
      </Alert>

      {importError && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-wrap">{importError}</AlertDescription>
        </Alert>
      )}

      {/* Import Button */}
      <Button
        onClick={handleWSDLImport}
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
