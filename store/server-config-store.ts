import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from '@/hooks/use-toast'

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
  // Custom code fields
  customCode?: {
    typescript?: string
    python?: string
  }
  selectedLanguage?: 'typescript' | 'python'
}

interface ServerConfigStore {
  // State
  config: ServerConfig
  
  // Actions
  updateConfig: (updates: Partial<ServerConfig>) => void
  addTools: (tools: any[]) => void
  resetConfig: () => void
  updateCustomCode: (language: 'typescript' | 'python', code: string) => void
  setSelectedLanguage: (language: 'typescript' | 'python') => void
  
  // Modal states
  resourceModalOpen: boolean
  setResourceModalOpen: (open: boolean) => void
  toolModalOpen: boolean
  setToolModalOpen: (open: boolean) => void
  promptModalOpen: boolean
  setPromptModalOpen: (open: boolean) => void
  editingIndex: number | null
  setEditingIndex: (index: number | null) => void
  
  // Form data states
  currentResourceData: any
  setCurrentResourceData: (data: any) => void
  currentToolData: any
  setCurrentToolData: (data: any) => void
  currentPromptData: any
  setCurrentPromptData: (data: any) => void
  
  // Save handlers
  saveResource: (resourceData: any) => void
  saveTool: (toolData: any) => void
  savePrompt: (promptData: any) => void
}

const defaultConfig: ServerConfig = {
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
}

export const useServerConfigStore = create<ServerConfigStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: defaultConfig,
      
      // Modal states
      resourceModalOpen: false,
      toolModalOpen: false,
      promptModalOpen: false,
      editingIndex: null,
      
      // Form data states
      currentResourceData: null,
      currentToolData: null,
      currentPromptData: null,
      
      // Actions
      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates }
        }))
      },
      
      addTools: (tools) => {
        console.log('Zustand addTools called with:', tools)
        const currentConfig = get().config
        console.log('Current tools in store:', currentConfig.tools)
        
        set((state) => ({
          config: {
            ...state.config,
            tools: [...state.config.tools, ...tools]
          }
        }))
        
        console.log('Tools added to store, new count:', get().config.tools.length)
        toast({ title: `Added ${tools.length} tool(s) successfully!` })
      },
      
      resetConfig: () => {
        set({
          config: defaultConfig,
          resourceModalOpen: false,
          toolModalOpen: false,
          promptModalOpen: false,
          editingIndex: null,
          currentResourceData: null,
          currentToolData: null,
          currentPromptData: null,
        })
      },

      updateCustomCode: (language, code) => {
        set((state) => ({
          config: {
            ...state.config,
            customCode: {
              ...state.config.customCode,
              [language]: code
            }
          }
        }))
      },

      setSelectedLanguage: (language) => {
        set((state) => ({
          config: {
            ...state.config,
            selectedLanguage: language
          }
        }))
      },
      
      // Modal setters
      setResourceModalOpen: (open) => set({ resourceModalOpen: open }),
      setToolModalOpen: (open) => set({ toolModalOpen: open }),
      setPromptModalOpen: (open) => set({ promptModalOpen: open }),
      setEditingIndex: (index) => set({ editingIndex: index }),
      
      // Form data setters
      setCurrentResourceData: (data) => set({ currentResourceData: data }),
      setCurrentToolData: (data) => set({ currentToolData: data }),
      setCurrentPromptData: (data) => set({ currentPromptData: data }),
      
      // Save handlers
      saveResource: (resourceData) => {
        const { config, editingIndex } = get()
        if (editingIndex !== null) {
          const newResources = [...config.resources]
          newResources[editingIndex] = resourceData
          set({ 
            config: { ...config, resources: newResources },
            resourceModalOpen: false,
            editingIndex: null
          })
        } else {
          set({
            config: { ...config, resources: [...config.resources, resourceData] },
            resourceModalOpen: false,
            editingIndex: null
          })
        }
      },
      
      saveTool: (toolData) => {
        const { config, editingIndex } = get()
        if (editingIndex !== null) {
          const newTools = [...config.tools]
          newTools[editingIndex] = toolData
          set({ 
            config: { ...config, tools: newTools },
            toolModalOpen: false,
            editingIndex: null
          })
        } else {
          set({
            config: { ...config, tools: [...config.tools, toolData] },
            toolModalOpen: false,
            editingIndex: null
          })
        }
      },
      
      savePrompt: (promptData) => {
        const { config, editingIndex } = get()
        if (editingIndex !== null) {
          const newPrompts = [...config.prompts]
          newPrompts[editingIndex] = promptData
          set({ 
            config: { ...config, prompts: newPrompts },
            promptModalOpen: false,
            editingIndex: null
          })
        } else {
          set({
            config: { ...config, prompts: [...config.prompts, promptData] },
            promptModalOpen: false,
            editingIndex: null
          })
        }
      },
    }),
    {
      name: 'mcp-server-config', // unique name for localStorage
      // Only persist the config, not modal states
      partialize: (state) => ({ config: state.config }),
    }
  )
)
