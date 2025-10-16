"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Calculator, Globe, Link as LinkIcon } from "lucide-react"
import { ImportFromAPI, ImportableItem } from "./import-from-api"
import { validateTool } from "@/lib/validation/schemas"

interface ParameterDefinition {
  type: string
  description: string
  required: boolean
}

interface ResourceLink {
  uri: string
  name: string
  mimeType: string
  description: string
}

interface ToolData {
  name: string
  title: string
  description: string
  tool_type: "static" | "api" | "resource_link"
  parameters?: Record<string, ParameterDefinition>
  // For static type
  static_result?: string
  // For api type
  api_url?: string
  http_method?: string
  headers?: Record<string, string>
  // For resource_link type
  resource_links_header?: string
  resource_links?: ResourceLink[]
}

interface ToolFormProps {
  onToolChange?: (tool: ToolData) => void
  onToolsImported?: (tools: ToolData[]) => void
  initialData?: ToolData
  isEditing?: boolean
  onSave?: (tool?: ToolData) => void
  onCancel?: () => void
}

export function ToolForm({ 
  onToolChange, 
  onToolsImported,
  initialData, 
  isEditing = false,
  onSave,
  onCancel
}: ToolFormProps) {
  // Mode state for tabs
  const [mode, setMode] = useState<"form" | "json" | "import">("form")
  const [toolJson, setToolJson] = useState<string>("")
  const [toolJsonError, setToolJsonError] = useState<string | null>(null)


  // Existing tool form state
  const [toolData, setToolData] = useState<ToolData>({
    name: "",
    title: "",
    description: "",
    tool_type: "static",
  })

  const [parameters, setParameters] = useState<Record<string, ParameterDefinition>>({})
  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [resourceLinks, setResourceLinks] = useState<ResourceLink[]>([])

  // Form inputs
  const [newParamKey, setNewParamKey] = useState("")
  const [newParamDesc, setNewParamDesc] = useState("")
  const [newParamType, setNewParamType] = useState("string")
  const [newParamRequired, setNewParamRequired] = useState(true)
  const [newHeaderKey, setNewHeaderKey] = useState("")
  const [newHeaderValue, setNewHeaderValue] = useState("")
  const [newResourceLink, setNewResourceLink] = useState<ResourceLink>({
    uri: "",
    name: "",
    mimeType: "text/plain",
    description: ""
  })


  // Sync JSON textarea when switching to JSON mode
  useEffect(() => {
    if (mode === "json") {
      setToolJson(JSON.stringify(toolData || { name: "", title: "", description: "", tool_type: "static" }, null, 2))
      setToolJsonError(null)
    }
  }, [mode, toolData])

  useEffect(() => {
    if (initialData) {
      setToolData(initialData)
      setParameters(initialData.parameters || {})
      setHeaders(initialData.headers || {})
      setResourceLinks(initialData.resource_links || [])
    } else {
      setToolData({
        name: "",
        title: "",
        description: "",
        tool_type: "static",
      })
      setParameters({})
      setHeaders({})
      setResourceLinks([])
    }
  }, [initialData])

  const updateTool = (updates: Partial<ToolData>) => {
    const newData = { ...toolData, ...updates }
    
    if (Object.keys(parameters).length > 0) {
      newData.parameters = parameters
    } else {
      delete newData.parameters
    }

    if (newData.tool_type === "static") {
      delete newData.api_url
      delete newData.http_method
      delete newData.headers
      delete newData.resource_links_header
      delete newData.resource_links
    } else if (newData.tool_type === "api") {
      delete newData.static_result
      delete newData.resource_links_header
      delete newData.resource_links
      newData.headers = Object.keys(headers).length > 0 ? headers : undefined
      newData.http_method = newData.http_method || "GET"
    } else if (newData.tool_type === "resource_link") {
      delete newData.static_result
      delete newData.api_url
      delete newData.http_method
      delete newData.headers
      newData.resource_links = resourceLinks.length > 0 ? resourceLinks : undefined
    }
    
    Object.keys(newData).forEach(key => {
      if (newData[key as keyof ToolData] === undefined) {
        delete newData[key as keyof ToolData]
      }
    })
    
    setToolData(newData)
    onToolChange?.(newData)
  }

  // All the existing form methods (addParameter, removeParameter, etc.) remain the same
  const addParameter = () => {
    if (newParamKey) {
      const newParams = {
        ...parameters,
        [newParamKey]: {
          type: newParamType,
          description: newParamDesc || `Parameter ${newParamKey}`,
          required: newParamRequired
        }
      }
      setParameters(newParams)
      setNewParamKey("")
      setNewParamDesc("")
      setNewParamType("string")
      setNewParamRequired(true)
      const updatedData = { ...toolData, parameters: newParams }
      setToolData(updatedData)
      onToolChange?.(updatedData)
    }
  }

  const removeParameter = (key: string) => {
    const newParams = { ...parameters }
    delete newParams[key]
    setParameters(newParams)
    const updatedData = { ...toolData }
    if (Object.keys(newParams).length > 0) {
      updatedData.parameters = newParams
    } else {
      delete updatedData.parameters
    }
    setToolData(updatedData)
    onToolChange?.(updatedData)
  }

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      const newHeaders = { ...headers, [newHeaderKey]: newHeaderValue }
      setHeaders(newHeaders)
      setNewHeaderKey("")
      setNewHeaderValue("")
      const updatedData = { ...toolData, headers: newHeaders }
      setToolData(updatedData)
      onToolChange?.(updatedData)
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers }
    delete newHeaders[key]
    setHeaders(newHeaders)
    const updatedData = { ...toolData }
    if (Object.keys(newHeaders).length > 0) {
      updatedData.headers = newHeaders
    } else {
      delete updatedData.headers
    }
    setToolData(updatedData)
    onToolChange?.(updatedData)
  }

  const addResourceLink = () => {
    if (newResourceLink.uri && newResourceLink.name) {
      const newLinks = [...resourceLinks, newResourceLink]
      setResourceLinks(newLinks)
      setNewResourceLink({
        uri: "",
        name: "",
        mimeType: "text/plain",
        description: ""
      })
      const updatedData = { ...toolData, resource_links: newLinks }
      setToolData(updatedData)
      onToolChange?.(updatedData)
    }
  }

  const removeResourceLink = (index: number) => {
    const newLinks = resourceLinks.filter((_, i) => i !== index)
    setResourceLinks(newLinks)
    const updatedData = { ...toolData }
    if (newLinks.length > 0) {
      updatedData.resource_links = newLinks
    } else {
      delete updatedData.resource_links
    }
    setToolData(updatedData)
    onToolChange?.(updatedData)
  }

  const getToolTypeIcon = (type: string) => {
    switch (type) {
      case "static":
        return <Calculator className="h-4 w-4" />
      case "api":
        return <Globe className="h-4 w-4" />
      case "resource_link":
        return <LinkIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getToolTypeDescription = (type: string) => {
    switch (type) {
      case "static":
        return "Simple calculations or transformations with static results"
      case "api":
        return "Tools that make external API calls"
      case "resource_link":
        return "Tools that return links to resources"
      default:
        return ""
    }
  }

  const handleJSONSave = () => {
    setToolJsonError(null)
    try {
      const parsed = JSON.parse(toolJson)
      
      if (Array.isArray(parsed)) {
        // Validate each tool in the array
        const validationResults = parsed.map(item => validateTool(item))
        const firstError = validationResults.find(result => !result.success)
        
        if (firstError) {
          setToolJsonError(`Validation failed: ${firstError.errors?.[0]?.message || 'Unknown error'}`)
          return
        }
        
        const validatedTools = validationResults.map(result => result.data!)
        onToolsImported?.(validatedTools)
      } else {
        const validation = validateTool(parsed)
        
        if (!validation.success) {
          setToolJsonError(`Validation failed: ${validation.errors?.[0]?.message || 'Unknown error'}`)
          return
        }
        
        // For single tool, use the direct approach like the old code
        setToolData(validation.data)
        onToolChange?.(validation.data)
        
        // Call onSave to close modal and reset state
        if (onSave) {
          onSave(validation.data)
        }
      }
    } catch {
      setToolJsonError("Invalid JSON format")
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant={mode === "form" ? "default" : "outline"} onClick={() => setMode("form")}>Form</Button>
        <Button variant={mode === "json" ? "default" : "outline"} onClick={() => {
          setMode("json")
          const jsonData = toolData.name || toolData.title || toolData.description ? 
            toolData : 
            { name: "", title: "", description: "", tool_type: "static" }
          setToolJson(JSON.stringify(jsonData, null, 2))
          setToolJsonError(null)
        }}>JSON</Button>
        <Button variant={mode === "import" ? "default" : "outline"} onClick={() => setMode("import")}>Import from API</Button>
      </div>


      {mode === "form" ? (
        <div className="space-y-6">
      {/* Tool Type Selection */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
          <CardTitle className="text-orange-900 dark:text-orange-100">Tool Type</CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">Choose the type of tool you want to create</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["static", "api", "resource_link"] as const).map((type) => (
              <div
                key={type}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  toolData.tool_type === type
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                }`}
                onClick={() => {
                  updateTool({ tool_type: type })
                  if (type === "static") {
                    setHeaders({})
                    setResourceLinks([])
                  } else if (type === "api") {
                    setResourceLinks([])
                  } else if (type === "resource_link") {
                    setHeaders({})
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getToolTypeIcon(type)}
                  <span className="font-medium capitalize">{type.replace("_", " ")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getToolTypeDescription(type)}
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
              <Label htmlFor="name">Tool Name</Label>
              <Input
                id="name"
                placeholder="e.g., calculate-bmi"
                value={toolData.name}
                onChange={(e) => updateTool({ name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Tool Title</Label>
              <Input
                id="title"
                placeholder="e.g., BMI Calculator"
                value={toolData.title}
                onChange={(e) => updateTool({ title: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this tool does..."
                value={toolData.description}
                onChange={(e) => updateTool({ description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters Configuration */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
          <CardTitle className="text-orange-900 dark:text-orange-100">Parameters</CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">Define the input parameters for this tool</CardDescription>
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
                placeholder="e.g., weightKg"
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
                placeholder="e.g., Weight in kilograms"
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

          {/* Tool Type Specific Configuration - Static */}
      {toolData.tool_type === "static" && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
            <CardTitle className="text-orange-900 dark:text-orange-100">Static Result Configuration</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">Define the static result template for this tool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="static_result">Result Template</Label>
              <Textarea
                id="static_result"
                placeholder="e.g., BMI calculation: {weightKg} / ({heightM} * {heightM}) = result"
                value={toolData.static_result || ""}
                onChange={(e) => updateTool({ static_result: e.target.value })}
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{parameterName}"} syntax to reference parameters in the result
              </p>
            </div>
          </CardContent>
        </Card>
      )}

          {/* Tool Type Specific Configuration - API */}
      {toolData.tool_type === "api" && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
            <CardTitle className="text-orange-900 dark:text-orange-100">API Configuration</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">Configure the API endpoint and request details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_url">API URL</Label>
                <Input
                  id="api_url"
                  placeholder="e.g., https://api.example.com/data/{parameter}"
                  value={toolData.api_url || ""}
                  onChange={(e) => updateTool({ api_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{parameterName}"} syntax for dynamic parameters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="http_method">HTTP Method</Label>
                <Select
                  value={toolData.http_method || "GET"}
                  onValueChange={(value: string) => updateTool({ http_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
          </CardContent>
        </Card>
      )}

          {/* Tool Type Specific Configuration - Resource Link */}
      {toolData.tool_type === "resource_link" && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
            <CardTitle className="text-orange-900 dark:text-orange-100">Resource Links Configuration</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">Configure the resource links this tool will return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource_links_header">Links Header</Label>
                <Input
                  id="resource_links_header"
                  placeholder='e.g., Found files matching "{pattern}":'
                  value={toolData.resource_links_header || ""}
                  onChange={(e) => updateTool({ resource_links_header: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Header text shown before the list of resources. Use {"{parameterName}"} for parameters.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Resource Links</Label>
                <div className="space-y-2">
                  {resourceLinks.map((link, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{link.name}</Badge>
                            <Badge variant="outline">{link.mimeType}</Badge>
                          </div>
                          <p className="text-sm font-mono">{link.uri}</p>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResourceLink(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-lg space-y-4 bg-orange-50/30 dark:bg-orange-950/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Resource Name</Label>
                      <Input
                        placeholder="e.g., README.md"
                        value={newResourceLink.name}
                        onChange={(e) => setNewResourceLink({ ...newResourceLink, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>MIME Type</Label>
                      <Select
                        value={newResourceLink.mimeType}
                        onValueChange={(value: string) => setNewResourceLink({ ...newResourceLink, mimeType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text/plain">text/plain</SelectItem>
                          <SelectItem value="text/markdown">text/markdown</SelectItem>
                          <SelectItem value="text/typescript">text/typescript</SelectItem>
                          <SelectItem value="text/javascript">text/javascript</SelectItem>
                          <SelectItem value="application/json">application/json</SelectItem>
                          <SelectItem value="text/html">text/html</SelectItem>
                          <SelectItem value="text/css">text/css</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>URI</Label>
                      <Input
                        placeholder="e.g., file:///project/README.md"
                        value={newResourceLink.uri}
                        onChange={(e) => setNewResourceLink({ ...newResourceLink, uri: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Project documentation"
                        value={newResourceLink.description}
                        onChange={(e) => setNewResourceLink({ ...newResourceLink, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={addResourceLink} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource Link
                  </Button>
                </div>
              </div>
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
                  onSave(toolData)
                } else {
                  // Default behavior if no onSave provided
                  if (toolData.name?.trim()) {
                    onToolChange?.(toolData)
                  }
                }
              }} 
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!toolData.name?.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Add Tool'}
            </Button>
          </div>
        </div>

      ) : mode === "json" ? (
        <>
                <Textarea
            className="w-full h-48 bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-black dark:text-white"
            value={toolJson}
            onChange={(e) => setToolJson(e.target.value)}
          />
          {toolJsonError && <div className="text-red-600 text-sm mt-1">{toolJsonError}</div>}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            You can supply a single tool object or an array of tool objects to add multiple tools at once.
              </div>
              <Button 
            onClick={handleJSONSave}
            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 flex items-center justify-center gap-2"
              >
            <Plus className="h-4 w-4 mr-1" /> {isEditing ? 'Save Changes' : 'Add Tool'}
              </Button>
        </>
      ) : (
        // IMPORT MODE - Using reusable ImportFromAPI component
        <ImportFromAPI
          itemType="tool"
          onItemsImported={(items: ImportableItem[]) => {
            // Convert ImportableItem[] to ToolData[]
            const tools: ToolData[] = items.map(item => ({
              name: item.name,
              title: item.title,
              description: item.description,
              tool_type: item.tool_type || "api",
              api_url: item.api_url,
              http_method: item.http_method,
              parameters: item.parameters,
              headers: item.headers,
              static_result: item.static_result,
              resource_links_header: item.resource_links_header,
              resource_links: item.resource_links
            }))
            onToolsImported?.(tools)
          }}
          importModes={["swagger", "postman", "har", "graphql", "wsdl"]}
        />
      )}
    </div>
  )
}