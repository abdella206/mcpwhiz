"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, FileText, Brain, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validatePrompt } from "@/lib/validation/schemas"

interface ArgumentDefinition {
  type: string
  description: string
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
    values?: string[]
    default?: string[]
  }>
}

interface PromptData {
  name: string
  title: string
  description: string
  prompt_type: "basic" | "context_aware"
  template: string
  role: "user" | "assistant"
  arguments?: Record<string, ArgumentDefinition>
  completion_config?: CompletionConfig
}

interface PromptFormProps {
  onPromptChange?: (prompt: PromptData) => void
  onPromptsImported?: (prompts: PromptData[]) => void
  initialData?: PromptData
  isEditing?: boolean
  onSave?: (prompt?: PromptData) => void
  onCancel?: () => void
}

export function PromptForm({ onPromptChange, onPromptsImported, initialData, isEditing = false, onSave, onCancel }: PromptFormProps) {
  // Mode state for tabs
  const [mode, setMode] = useState<"form" | "json">("form")
  const [promptJson, setPromptJson] = useState<string>("")
  const [promptJsonError, setPromptJsonError] = useState<string | null>(null)

  const [promptData, setPromptData] = useState<PromptData>({
    name: "",
    title: "",
    description: "",
    prompt_type: "basic",
    template: "",
    role: "user",
  })

  const [args, setArgs] = useState<Record<string, ArgumentDefinition>>({})
  const [completionConfig, setCompletionConfig] = useState<CompletionConfig>({ complete: {} })
  const [completionConfigText, setCompletionConfigText] = useState("")
  const [completionConfigValid, setCompletionConfigValid] = useState(true)

  // Form inputs
  const [newArgKey, setNewArgKey] = useState("")
  const [newArgDesc, setNewArgDesc] = useState("")
  const [newArgType, setNewArgType] = useState("string")
  const [newArgRequired, setNewArgRequired] = useState(true)

  // Sync JSON textarea when switching to JSON mode
  useEffect(() => {
    if (mode === "json") {
      setPromptJson(JSON.stringify(promptData || { name: "", title: "", description: "", prompt_type: "basic", template: "", role: "user" }, null, 2))
      setPromptJsonError(null)
    }
  }, [mode, promptData])

  useEffect(() => {
    if (initialData) {
      setPromptData(initialData)
      setArgs(initialData.arguments || {})
      setCompletionConfig(initialData.completion_config || { complete: {} })
      // Only set text if there's actual completion config data
      if (initialData.completion_config && Object.keys(initialData.completion_config.complete || {}).length > 0) {
        setCompletionConfigText(JSON.stringify(initialData.completion_config, null, 2))
      } else {
        setCompletionConfigText("")
      }
    } else {
      // Reset to empty when no initial data
      setPromptData({
        name: "",
        title: "",
        description: "",
        prompt_type: "basic",
        template: "",
        role: "user",
      })
      setArgs({})
      setCompletionConfig({ complete: {} })
      setCompletionConfigText("")
    }
  }, [initialData])

  const updatePrompt = (updates: Partial<PromptData>) => {
    const newData = { ...promptData, ...updates }
    
    // Always maintain current arguments if they exist
    if (Object.keys(args).length > 0) {
      newData.arguments = args
    } else {
      delete newData.arguments
    }

    // Clean up data based on prompt type
    if (newData.prompt_type === "basic") {
      delete newData.completion_config
    } else if (newData.prompt_type === "context_aware") {
      // Only update completion_config if it's explicitly passed in updates
      if (!('completion_config' in updates)) {
        newData.completion_config = completionConfig
      }
    }
    
    // Clean up undefined fields
    Object.keys(newData).forEach(key => {
      if (newData[key as keyof PromptData] === undefined) {
        delete newData[key as keyof PromptData]
      }
    })
    
    setPromptData(newData)
    onPromptChange?.(newData)
  }

  const addArgument = () => {
    if (newArgKey) {
      const newArgs = {
        ...args,
        [newArgKey]: {
          type: newArgType,
          description: newArgDesc || `Argument ${newArgKey}`,
          required: newArgRequired
        }
      }
      setArgs(newArgs)
      setNewArgKey("")
      setNewArgDesc("")
      setNewArgType("string")
      setNewArgRequired(true)
      // Force update with new arguments
      const updatedData = { ...promptData, arguments: newArgs }
      setPromptData(updatedData)
      onPromptChange?.(updatedData)
    }
  }

  const removeArgument = (key: string) => {
    const newArgs = { ...args }
    delete newArgs[key]
    setArgs(newArgs)
    // Force update, removing arguments if empty
    const updatedData = { ...promptData }
    if (Object.keys(newArgs).length > 0) {
      updatedData.arguments = newArgs
    } else {
      delete updatedData.arguments
    }
    setPromptData(updatedData)
    onPromptChange?.(updatedData)
  }

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case "basic":
        return <FileText className="h-4 w-4" />
      case "context_aware":
        return <Brain className="h-4 w-4" />
      default:
        return null
    }
  }

  const getPromptTypeDescription = (type: string) => {
    switch (type) {
      case "basic":
        return "Simple prompts with static templates"
      case "context_aware":
        return "Prompts with intelligent argument completion"
      default:
        return ""
    }
  }

  const handleJSONSave = () => {
    setPromptJsonError(null)
    try {
      const parsed = JSON.parse(promptJson)
      
      if (Array.isArray(parsed)) {
        // Validate each prompt in the array
        const validationResults = parsed.map(item => validatePrompt(item))
        const firstError = validationResults.find(result => !result.success)
        
        if (firstError) {
          setPromptJsonError(`Validation failed: ${firstError.errors?.[0]?.message || 'Unknown error'}`)
          return
        }
        
        const validatedPrompts = validationResults.map(result => result.data!)
        onPromptsImported?.(validatedPrompts)
      } else {
        const validation = validatePrompt(parsed)
        
        if (!validation.success) {
          setPromptJsonError(`Validation failed: ${validation.errors?.[0]?.message || 'Unknown error'}`)
          return
        }
        
        // For single prompt, use the direct approach like the old code
        setPromptData(validation.data)
        onPromptChange?.(validation.data)
        
        // Call onSave to close modal and reset state
        if (onSave) {
          onSave(validation.data)
        }
      }
    } catch {
      setPromptJsonError("Invalid JSON format")
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant={mode === "form" ? "default" : "outline"} onClick={() => setMode("form")}>Form</Button>
        <Button variant={mode === "json" ? "default" : "outline"} onClick={() => {
          setMode("json")
          const jsonData = promptData.name || promptData.title || promptData.description ? 
            promptData : 
            { name: "", title: "", description: "", prompt_type: "basic", template: "", role: "user" }
          setPromptJson(JSON.stringify(jsonData, null, 2))
          setPromptJsonError(null)
        }}>JSON</Button>
      </div>

      {mode === "form" ? (
        <>
          {/* Prompt Type Selection */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
              <CardTitle className="text-orange-900 dark:text-orange-100">Prompt Type</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">Choose the type of prompt you want to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["basic", "context_aware"] as const).map((type) => (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      promptData.prompt_type === type
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                    }`}
                    onClick={() => {
                      updatePrompt({ prompt_type: type })
                      // Reset completion config text when switching away from context_aware
                      if (type !== 'context_aware' && promptData.prompt_type === 'context_aware') {
                        setCompletionConfigText("")
                        setCompletionConfig({ complete: {} })
                        setCompletionConfigValid(true)
                      }
                      // Initialize empty text when switching to context_aware
                      if (type === 'context_aware' && promptData.prompt_type !== 'context_aware') {
                        setCompletionConfigText("")
                        setCompletionConfig({ complete: {} })
                        setCompletionConfigValid(true)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getPromptTypeIcon(type)}
                      <span className="font-medium capitalize">{type.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getPromptTypeDescription(type)}
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
                  <Label htmlFor="name">Prompt Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., review-code"
                    value={promptData.name}
                    onChange={(e) => updatePrompt({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Prompt Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Code Review"
                    value={promptData.title}
                    onChange={(e) => updatePrompt({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={promptData.role}
                    onValueChange={(value: "user" | "assistant") => updatePrompt({ role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Describe what this prompt does..."
                    value={promptData.description}
                    onChange={(e) => updatePrompt({ description: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Configuration */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
              <CardTitle className="text-orange-900 dark:text-orange-100">Prompt Template</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">Define your prompt template using {"{argumentName}"} syntax for variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Textarea
                  id="template"
                  placeholder="e.g., Please review this code:\n\n{{code}}"
                  value={promptData.template}
                  onChange={(e) => updatePrompt({ template: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{argumentName}}"} syntax to insert argument values into your prompt
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Arguments Configuration */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
              <CardTitle className="text-orange-900 dark:text-orange-100">Arguments</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">Define the arguments that can be passed to this prompt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(args).map(([key, arg]) => (
                <div key={key} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{key}</Badge>
                      <Badge variant={arg.required ? "default" : "outline"}>
                        {arg.required ? "Required" : "Optional"}
                      </Badge>
                      <Badge variant="outline">{arg.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{arg.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArgument(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/30 dark:bg-orange-950/20">
                <div className="space-y-2">
                  <Label>Argument Name</Label>
                  <Input
                    placeholder="e.g., code"
                    value={newArgKey}
                    onChange={(e) => setNewArgKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newArgType} onValueChange={setNewArgType}>
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
                    placeholder="e.g., The code to review"
                    value={newArgDesc}
                    onChange={(e) => setNewArgDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required</Label>
                  <Select 
                    value={newArgRequired ? "true" : "false"} 
                    onValueChange={(v: string) => setNewArgRequired(v === "true")}
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
                  <Button type="button" onClick={addArgument} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Argument
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Configuration (for context_aware) */}
          {promptData.prompt_type === "context_aware" && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="bg-orange-50/30 dark:bg-orange-950/20">
                <CardTitle className="text-orange-900 dark:text-orange-100">Completion Configuration</CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">Configure intelligent completions for arguments</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Define static or conditional completion suggestions for your arguments. Static completions provide
                    fixed options, while conditional completions change based on other argument values.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="completion-config">JSON Configuration</Label>
                  <Textarea
                    id="completion-config"
                    placeholder={`{
  "complete": {
    "department": {
      "type": "static",
      "values": [
        "engineering",
        "sales",
        "marketing",
        "support"
      ]
    },
    "name": {
      "type": "conditional",
      "conditions": [
        {
          "when": {
            "department": "engineering"
          },
          "values": [
            "Alice",
            "Bob",
            "Charlie"
          ]
        }
      ],
      "default": [
        "Guest",
        "Visitor"
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
                          ...promptData, 
                          completion_config: defaultConfig,
                          arguments: args
                        }
                        setPromptData(updatedData)
                        onPromptChange?.(updatedData)
                        return
                      }
                      
                      try {
                        const config = JSON.parse(newText)
                        setCompletionConfig(config)
                        setCompletionConfigValid(true)
                        
                        // Update the prompt data with the new completion config
                        const updatedData = { 
                          ...promptData, 
                          completion_config: config,
                          // Preserve other context_aware fields
                          arguments: args
                        }
                        setPromptData(updatedData)
                        onPromptChange?.(updatedData)
                      } catch {
                        // Invalid JSON, just update the text but not the config
                        setCompletionConfigValid(false)
                      }
                    }}
                    rows={15}
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
                  onSave(promptData)
                } else {
                  // Default behavior if no onSave provided
                  if (promptData.name?.trim()) {
                    onPromptChange?.(promptData)
                  }
                }
              }} 
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!promptData.name?.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Add Prompt'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Textarea
            className="w-full h-48 bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-black dark:text-white"
            value={promptJson}
            onChange={(e) => setPromptJson(e.target.value)}
          />
          {promptJsonError && <div className="text-red-600 text-sm mt-1">{promptJsonError}</div>}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            You can supply a single prompt object or an array of prompt objects to add multiple prompts at once.
          </div>
          <Button 
            onClick={handleJSONSave}
            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4 mr-1" /> {isEditing ? 'Save Changes' : 'Add Prompt'}
          </Button>
        </>
      )}
    </div>
  )
}
