"use client"

import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"

export interface ServerConfig {
  name: string
  version: string
  description: string
  author: string
  license: string
  tags: string[]
  resources: any[]
  tools: any[]
  prompts: any[]
  sessionManagement: boolean
  sessionTimeout: number
  isRemoteServer: boolean
}

export function useServerConfig() {
  const [config, setConfig] = useState<ServerConfig>({
    name: "my-mcp-server",
    version: "1.0.0",
    description: "A custom MCP server",
    author: "",
    license: "MIT",
    tags: [],
    resources: [],
    tools: [],
    prompts: [],
    sessionManagement: false,
    sessionTimeout: 30,
    isRemoteServer: true,
  })

  // Modal states
  const [resourceModalOpen, setResourceModalOpen] = useState(false)
  const [toolModalOpen, setToolModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Current form data states for modals
  const [currentResourceData, setCurrentResourceData] = useState<any>(null)
  const [currentToolData, setCurrentToolData] = useState<any>(null)
  const [currentPromptData, setCurrentPromptData] = useState<any>(null)

  // Auto-disable session management when switching to local server
  useEffect(() => {
    if (!config.isRemoteServer && config.sessionManagement) {
      setConfig((prev) => ({ ...prev, sessionManagement: false }))
    }
  }, [config.isRemoteServer])

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('mcp-server-config')
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
      } catch (error) {
        console.error('Failed to parse saved config:', error)
      }
    }
  }, [])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving config to localStorage:', config)
    localStorage.setItem('mcp-server-config', JSON.stringify(config))
    console.log('Config saved to localStorage')
  }, [config])

  const updateConfig = (updates: Partial<ServerConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const saveResource = (resourceData: any) => {
    if (editingIndex !== null) {
      const newResources = [...config.resources]
      newResources[editingIndex] = resourceData
      updateConfig({ resources: newResources })
    } else {
      updateConfig({ resources: [...config.resources, resourceData] })
    }
    setResourceModalOpen(false)
    setEditingIndex(null)
  }

  const saveTool = (toolData: any) => {
    if (editingIndex !== null) {
      const newTools = [...config.tools]
      newTools[editingIndex] = toolData
      updateConfig({ tools: newTools })
    } else {
      updateConfig({ tools: [...config.tools, toolData] })
    }
    setToolModalOpen(false)
    setEditingIndex(null)
  }

  const savePrompt = (promptData: any) => {
    if (editingIndex !== null) {
      const newPrompts = [...config.prompts]
      newPrompts[editingIndex] = promptData
      updateConfig({ prompts: newPrompts })
    } else {
      updateConfig({ prompts: [...config.prompts, promptData] })
    }
    setPromptModalOpen(false)
    setEditingIndex(null)
  }

  const addTools = (tools: any[]) => {
    console.log('addTools called with:', tools)
    console.log('Current config.tools:', config.tools)
    console.log('New tools to add:', tools)
    
    updateConfig({ tools: [...config.tools, ...tools] })
    console.log('Config updated, new tools array:', [...config.tools, ...tools])
    
    toast({ title: `Added ${tools.length} tool(s) successfully!` })
  }

  const resetConfig = () => {
    setConfig({
      name: "my-mcp-server",
      version: "1.0.0",
      description: "A custom MCP server",
      author: "",
      license: "MIT",
      tags: [],
      resources: [],
      tools: [],
      prompts: [],
      sessionManagement: false,
      sessionTimeout: 30,
      isRemoteServer: true,
    })
    localStorage.removeItem('mcp-server-config')
  }

  return {
    // Config state
    config,
    updateConfig,
    resetConfig,
    addTools,

    // Modal states
    resourceModalOpen,
    setResourceModalOpen,
    toolModalOpen,
    setToolModalOpen,
    promptModalOpen,
    setPromptModalOpen,
    editingIndex,
    setEditingIndex,

    // Form data states
    currentResourceData,
    setCurrentResourceData,
    currentToolData,
    setCurrentToolData,
    currentPromptData,
    setCurrentPromptData,

    // Save handlers
    saveResource,
    saveTool,
    savePrompt,
  }
}
