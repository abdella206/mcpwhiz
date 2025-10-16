"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { X, Plus, FileJson, Globe, Zap, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImportFromAPI, ImportableItem } from "./import-from-api"
import { validateResource } from "@/lib/validation/schemas"

interface ParameterDefinition {
  description: string
  type: string
  required: boolean
}

interface CompletionCondition {
  when: Record<string, string>
  values: string[]
}

interface CompletionConfig {
  complete: Record<string, {
    type: string
    conditions?: CompletionCondition[]
    default?: string[]
  }>
}

interface ResourceData {
  name: string
  resource_type: "static" | "dynamic" | "context_aware"
  uri: string
  title: string
  description: string
  mime_type?: string
  static_content?: string
  api_url?: string
  headers?: Record<string, string>
  parameters?: Record<string, ParameterDefinition>
  completion_config?: CompletionConfig
}

interface ResourceFormProps {
  onResourceChange?: (resource: ResourceData) => void
  onResourcesImported?: (resources: ResourceData[]) => void
  initialData?: ResourceData
  isEditing?: boolean
  onSave?: (resource?: ResourceData) => void
  onCancel?: () => void
}

export function ResourceForm({ onResourceChange, onResourcesImported, initialData, isEditing = false, onSave, onCancel }: ResourceFormProps) {
  // Mode state for tabs
  const [mode, setMode] = useState<"form" | "json" | "import">("form")
  const [resourceJson, setResourceJson] = useState<string>("")
  const [resourceJsonError, setResourceJsonError] = useState<string | null>(null)


  const [resourceData, setResourceData] = useState<ResourceData>({
    name: "",
    resource_type: "static",
    uri: "",
    title: "",
    description: "",
    mime_type: "application/json",
  })

  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [parameters, setParameters] = useState<Record<string, ParameterDefinition>>({})
  const [completionConfig, setCompletionConfig] = useState<CompletionConfig>({ complete: {} })
  const [completionConfigText, setCompletionConfigText] = useState("")
  const [completionConfigValid, setCompletionConfigValid] = useState(true)
  
  // Form inputs
  const [newHeaderKey, setNewHeaderKey] = useState("")
  const [newHeaderValue, setNewHeaderValue] = useState("")
  const [newParamKey, setNewParamKey] = useState("")
  const [newParamDesc, setNewParamDesc] = useState("")
  const [newParamType, setNewParamType] = useState("string")
  const [newParamRequired, setNewParamRequired] = useState(true)

  // Drag and drop state
  // const [isDragOver, setIsDragOver] = useState(false) // Removed unused variables

  // Sync JSON textarea when switching to JSON mode
  useEffect(() => {
    if (mode === "json") {
      setResourceJson(JSON.stringify(resourceData || { name: "", resource_type: "static", uri: "", title: "", description: "" }, null, 2))
      setResourceJsonError(null)
    }
  }, [mode, resourceData])

  useEffect(() => {
    if (initialData) {
      setResourceData(initialData)
      setHeaders(initialData.headers || {})
      setParameters(initialData.parameters || {})
      setCompletionConfig(initialData.completion_config || { complete: {} })
      // Only set text if there's actual completion config data
      if (initialData.completion_config && Object.keys(initialData.completion_config.complete || {}).length > 0) {
        setCompletionConfigText(JSON.stringify(initialData.completion_config, null, 2))
      } else {
        setCompletionConfigText("")
      }
    } else {
      // Reset to empty when no initial data
      setCompletionConfigText("")
    }
  }, [initialData])

  const updateResource = (updates: Partial<ResourceData>) => {
    const newData = { ...resourceData, ...updates }
    
    // Always maintain current headers
    newData.headers = Object.keys(headers).length > 0 ? headers : undefined
    
    // Clean up data based on resource type
    if (newData.resource_type === "static") {
      delete newData.parameters
      delete newData.completion_config
    } else if (newData.resource_type === "dynamic") {
      delete newData.static_content
      delete newData.completion_config
      newData.parameters = Object.keys(parameters).length > 0 ? parameters : undefined
    } else if (newData.resource_type === "context_aware") {
      newData.parameters = Object.keys(parameters).length > 0 ? parameters : undefined
      // Only update completion_config if it's explicitly passed in updates
      if (!('completion_config' in updates)) {
        newData.completion_config = completionConfig
      }
      // context_aware can have static_content, so don't delete it
    }
    
    // Clean up undefined fields
    Object.keys(newData).forEach(key => {
      if (newData[key as keyof ResourceData] === undefined) {
        delete newData[key as keyof ResourceData]
      }
    })
    
    setResourceData(newData)
    onResourceChange?.(newData)
  }

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      const newHeaders = { ...headers, [newHeaderKey]: newHeaderValue }
      setHeaders(newHeaders)
      setNewHeaderKey("")
      setNewHeaderValue("")
      // Force update with new headers
      const updatedData = { ...resourceData, headers: newHeaders }
      setResourceData(updatedData)
      onResourceChange?.(updatedData)
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers }
    delete newHeaders[key]
    setHeaders(newHeaders)
    // Force update, removing headers if empty
    const updatedData = { ...resourceData }
    if (Object.keys(newHeaders).length > 0) {
      updatedData.headers = newHeaders
    } else {
      delete updatedData.headers
    }
    setResourceData(updatedData)
    onResourceChange?.(updatedData)
  }

  const addParameter = () => {
    if (newParamKey) {
      const newParams = {
        ...parameters,
        [newParamKey]: {
          description: newParamDesc || `Parameter ${newParamKey}`,
          type: newParamType,
          required: newParamRequired
        }
      }
      setParameters(newParams)
      setNewParamKey("")
      setNewParamDesc("")
      setNewParamType("string")
      setNewParamRequired(true)
      // Force update with new parameters
      const updatedData = { ...resourceData, parameters: newParams }
      setResourceData(updatedData)
      onResourceChange?.(updatedData)
    }
  }

  const removeParameter = (key: string) => {
    const newParams = { ...parameters }
    delete newParams[key]
    setParameters(newParams)
    // Force update, removing parameters if empty
    const updatedData = { ...resourceData }
    if (Object.keys(newParams).length > 0) {
      updatedData.parameters = newParams
    } else {
      delete updatedData.parameters
    }
    setResourceData(updatedData)
    onResourceChange?.(updatedData)
  }

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "static":
        return <FileJson className="h-4 w-4" />
      case "dynamic":
        return <Globe className="h-4 w-4" />
      case "context_aware":
        return <Zap className="h-4 w-4" />
      default:
        return null
    }
  }

  const getResourceTypeDescription = (type: string) => {
    switch (type) {
      case "static":
        return "Fixed content or simple API calls without parameters"
      case "dynamic":
        return "Resources with parameters that modify the request"
      case "context_aware":
        return "Resources with intelligent completion suggestions"
      default:
        return ""
    }
  }


  const handleJSONSave = () => {
    setResourceJsonError(null)
    try {
      const parsed = JSON.parse(resourceJson)
      
      if (Array.isArray(parsed)) {
        // Validate each resource in the array
        const validationResults = parsed.map(item => validateResource(item))
        const firstError = validationResults.find(result => !result.success)
        
        if (firstError) {
          setResourceJsonError(`Validation failed: ${firstError.errors?.[0]?.message || 'Unknown error'}`)
          return
        }
        
        const validatedResources = validationResults.map(result => result.data!)
        onResourcesImported?.(validatedResources)
    } else {
        const validation = validateResource(parsed)
        
        if (!validation.success) {
          setResourceJsonError(`Validation failed: ${validation.errors?.[0]?.message || 'Unknown error'}`)
        return
      }

        // For single resource, use the direct approach like the old code
        setResourceData(validation.data)
        onResourceChange?.(validation.data)
        
        // Call onSave to close modal and reset state
        if (onSave) {
          onSave(validation.data)
        }
      }
    } catch {
      setResourceJsonError("Invalid JSON format")
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant={mode === "form" ? "default" : "outline"} onClick={() => setMode("form")}>Form</Button>
        <Button variant={mode === "json" ? "default" : "outline"} onClick={() => {
          setMode("json")
          const jsonData = resourceData.name || resourceData.title || resourceData.description ? 
            resourceData : 
            { name: "", resource_type: "static", uri: "", title: "", description: "" }
          setResourceJson(JSON.stringify(jsonData, null, 2))
          setResourceJsonError(null)
        }}>JSON</Button>
        {/* <Button variant={mode === "import" ? "default" : "outline"} onClick={() => setMode("import")}>Import from API</Button> */}
      </div>

      {mode === "form" ? (
        <>
          {/* Resource Type Selection */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
              <CardTitle className="text-orange-900 dark:text-orange-100">Resource Type</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">Choose the type of resource you want to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["static", "dynamic", "context_aware"] as const).map((type) => (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      resourceData.resource_type === type
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                    }`}
                    onClick={() => {
                      updateResource({ resource_type: type })
                      // Reset completion config text when switching away from context_aware
                      if (type !== 'context_aware' && resourceData.resource_type === 'context_aware') {
                        setCompletionConfigText("")
                        setCompletionConfig({ complete: {} })
                        setCompletionConfigValid(true)
                      }
                      // Initialize empty text when switching to context_aware
                      if (type === 'context_aware' && resourceData.resource_type !== 'context_aware') {
                        setCompletionConfigText("")
                        setCompletionConfig({ complete: {} })
                        setCompletionConfigValid(true)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getResourceTypeIcon(type)}
                      <span className="font-medium capitalize">{type.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getResourceTypeDescription(type)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
              <CardTitle className="text-orange-900 dark:text-orange-100">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Resource Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., User Profile"
                    value={resourceData.name}
                    onChange={(e) => updateResource({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uri">URI Pattern</Label>
                  <Input
                    id="uri"
                    placeholder={
                      resourceData.resource_type === "dynamic"
                        ? "e.g., github://users/{username}"
                        : "e.g., resource://config.json"
                    }
                    value={resourceData.uri}
                    onChange={(e) => updateResource({ uri: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., GitHub User Profile"
                    value={resourceData.title}
                    onChange={(e) => updateResource({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mime_type">MIME Type</Label>
                  <Select
                    value={resourceData.mime_type || "application/json"}
                    onValueChange={(value: string) => updateResource({ mime_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application/json">application/json</SelectItem>
                      <SelectItem value="text/plain">text/plain</SelectItem>
                      <SelectItem value="text/html">text/html</SelectItem>
                      <SelectItem value="application/xml">application/xml</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this resource provides..."
                    value={resourceData.description}
                    onChange={(e) => updateResource({ description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Configuration */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
              <CardTitle className="text-orange-900 dark:text-orange-100">Content Configuration</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                {resourceData.resource_type === "static" && "Configure static content or API endpoint"}
                {resourceData.resource_type === "dynamic" && "Configure API endpoint with parameters"}
                {resourceData.resource_type === "context_aware" && "Configure API endpoint with completion support"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="api" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="api">API Configuration</TabsTrigger>
                  {(resourceData.resource_type === "static" || resourceData.resource_type === "context_aware") && (
                    <TabsTrigger value="static">Static Content</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="api" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_url">API URL</Label>
                    <Input
                      id="api_url"
                      placeholder={
                        resourceData.resource_type === "dynamic"
                          ? "e.g., https://api.github.com/users/{username}"
                          : "e.g., https://api.example.com/data"
                      }
                      value={resourceData.api_url || ""}
                      onChange={(e) => updateResource({ api_url: e.target.value })}
                    />
                    {resourceData.resource_type === "dynamic" && (
                      <p className="text-xs text-muted-foreground">
                        Use {"{parameterName}"} syntax for dynamic parameters
                      </p>
                    )}
                  </div>

                  {/* Headers */}
                  <div className="space-y-2">
                    <Label>Headers (Optional)</Label>
                    <div className="space-y-2">
                      {Object.entries(headers).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Input value={key} readOnly className="flex-1 bg-muted" />
                          <Input value={value} readOnly className="flex-1 bg-muted" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHeader(key)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Header name"
                          value={newHeaderKey}
                          onChange={(e) => setNewHeaderKey(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Header value"
                          value={newHeaderValue}
                          onChange={(e) => setNewHeaderValue(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={addHeader} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {(resourceData.resource_type === "static" || resourceData.resource_type === "context_aware") && (
                  <TabsContent value="static" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="static_content">Static Content</Label>
                      <Textarea
                        id="static_content"
                        placeholder={
                          resourceData.resource_type === "context_aware" 
                            ? 'e.g., Repository: {owner}/{repo}'
                            : 'e.g., {"version": "1.0", "features": {"auth": true}}'
                        }
                        value={resourceData.static_content || ""}
                        onChange={(e) => updateResource({ static_content: e.target.value })}
                        rows={6}
                        className="font-mono text-sm"
                      />
                      {resourceData.resource_type === "context_aware" && (
                        <p className="text-xs text-muted-foreground">
                          Use {"{parameterName}"} syntax to reference parameters in static content
                        </p>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* Parameters (for dynamic and context_aware) */}
          {(resourceData.resource_type === "dynamic" || resourceData.resource_type === "context_aware") && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
                <CardTitle className="text-orange-900 dark:text-orange-100">Parameters</CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">Define the parameters that can be passed to this resource</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(parameters).map(([key, param]) => (
                  <div key={key} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{key}</Badge>
                        <Badge variant={param.required ? "default" : "outline"}>
                          {param.required ? "Required" : "Optional"}
                        </Badge>
                        <Badge variant="outline">{param.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{param.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/30 dark:bg-orange-950/20">
                  <div className="space-y-2">
                    <Label>Parameter Name</Label>
                    <Input
                      placeholder="e.g., username"
                      value={newParamKey}
                      onChange={(e) => setNewParamKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newParamType} onValueChange={setNewParamType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g., GitHub username"
                      value={newParamDesc}
                      onChange={(e) => setNewParamDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Required</Label>
                    <Select 
                      value={newParamRequired ? "true" : "false"} 
                      onValueChange={(v: string) => setNewParamRequired(v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Required</SelectItem>
                        <SelectItem value="false">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" onClick={addParameter} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Configuration (for context_aware) */}
          {resourceData.resource_type === "context_aware" && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
                <CardTitle className="text-orange-900 dark:text-orange-100">Completion Configuration</CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">Configure intelligent completions for parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Completion configuration requires advanced setup. This feature allows conditional
                    suggestions based on other parameter values.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="completion-config">JSON Configuration</Label>
                  <Textarea
                    id="completion-config"
                    placeholder={`{
  "complete": {
    "repo": {
      "type": "conditional",
      "conditions": [
        {
          "when": {
            "owner": "microsoft"
          },
          "values": [
            "vscode",
            "typescript",
            "playwright",
            "terminal"
          ]
        },
        {
          "when": {
            "owner": "facebook"
          },
          "values": [
            "react",
            "react-native",
            "jest"
          ]
        }
      ],
      "default": [
        "default-repo",
        "sample-repo"
      ]
    }
  }
}`}
                    value={completionConfigText}
                    onChange={(e) => {
                      const newText = e.target.value
                      setCompletionConfigText(newText)
                      
                      // If empty, that's valid - use default empty config
                      if (newText.trim() === "") {
                        const defaultConfig = { complete: {} }
                        setCompletionConfig(defaultConfig)
                        setCompletionConfigValid(true)
                        
                        const updatedData = { 
                          ...resourceData, 
                          completion_config: defaultConfig,
                          parameters: parameters,
                          headers: Object.keys(headers).length > 0 ? headers : undefined
                        }
                        setResourceData(updatedData)
                        onResourceChange?.(updatedData)
                        return
                      }
                      
                      try {
                        const config = JSON.parse(newText)
                        setCompletionConfig(config)
                        setCompletionConfigValid(true)
                        
                        // Update the resource data with the new completion config
                        const updatedData = { 
                          ...resourceData, 
                          completion_config: config,
                          // Preserve other context_aware fields
                          parameters: parameters,
                          headers: Object.keys(headers).length > 0 ? headers : undefined
                        }
                        setResourceData(updatedData)
                        onResourceChange?.(updatedData)
                      } catch {
                        // Invalid JSON, just update the text but not the config
                        setCompletionConfigValid(false)
                      }
                    }}
                    rows={10}
                    className={`font-mono text-sm ${!completionConfigValid ? 'border-red-500' : ''}`}
                  />
                  {!completionConfigValid && (
                    <p className="text-xs text-red-500">Invalid JSON format. Please check your syntax.</p>
                  )}
                  {completionConfigValid && completionConfigText.trim() !== "" && (
                    <p className="text-xs text-green-600">✓ Valid JSON configuration</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons for Form Mode */}
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              onClick={() => {
                if (onSave) {
                  onSave(resourceData)
                } else {
                // Default behavior if no onSave provided
                if (resourceData.name?.trim()) {
                  onResourceChange?.(resourceData)
                }
                }
              }} 
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!resourceData.name?.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Add Resource'}
            </Button>
          </div>
        </>
      ) : mode === "json" ? (
        <>
          <Textarea
            className="w-full h-48 bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-black dark:text-white"
            value={resourceJson}
            onChange={(e) => setResourceJson(e.target.value)}
          />
          {resourceJsonError && <div className="text-red-600 text-sm mt-1">{resourceJsonError}</div>}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            You can supply a single resource object or an array of resource objects to add multiple resources at once.
          </div>
          <Button 
            onClick={handleJSONSave}
            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4 mr-1" /> {isEditing ? 'Save Changes' : 'Add Resource'}
          </Button>
        </>
      ) : (
        // IMPORT MODE - Using reusable ImportFromAPI component
        <ImportFromAPI
          itemType="resource"
          onItemsImported={(items: ImportableItem[]) => {
            // Convert ImportableItem[] to ResourceData[]
            const resources: ResourceData[] = items.map(item => ({
              name: item.name,
              title: item.title,
              description: item.description,
              resource_type: item.resource_type || "dynamic",
              uri: item.uri || item.api_url || "",
              mime_type: item.mime_type,
              static_content: item.static_content,
              api_url: item.api_url,
              headers: item.headers,
              parameters: item.parameters,
              completion_config: item.completion_config
            }))
            onResourcesImported?.(resources)
          }}
          importModes={["swagger", "postman", "har", "wsdl"]}
        />
      )}
    </div>
  )
}
