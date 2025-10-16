export interface ResourceData {
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
}

export interface ParameterDefinition {
  description: string
  type: string
  required: boolean
}

export interface ToolData {
  name: string
  title: string
  description: string
  tool_type: "static" | "api" | "resource_link"
  parameters?: Record<string, ParameterDefinition>
  static_result?: string
  api_url?: string
  http_method?: string
  headers?: Record<string, string>
  resource_links_header?: string
  resource_links?: ResourceLink[]
}

export interface ResourceLink {
  uri: string
  name: string
  mimeType: string
  description: string
}

export interface ArgumentDefinition {
  type: string
  description: string
  required: boolean
}

export interface PromptData {
  name: string
  title: string
  description: string
  prompt_type: "basic" | "context_aware"
  template: string
  role: "user" | "assistant"
  arguments?: Record<string, ArgumentDefinition>
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
}

export interface DynamicCodePreviewProps {
  serverName: string
  serverVersion: string
  serverDescription?: string
  resources: ResourceData[]
  tools: ToolData[]
  prompts: PromptData[]
  sessionManagement?: boolean
  isRemoteServer?: boolean
  onReset?: () => void
  // Custom code management
  customCode?: {
    typescript?: string
    python?: string
  }
  selectedLanguage?: 'typescript' | 'python'
  updateCustomCode?: (language: 'typescript' | 'python', code: string) => void
  setSelectedLanguage?: (language: 'typescript' | 'python') => void
}

export interface GenerateServerCodeParams {
  serverName: string
  serverVersion: string
  serverDescription?: string
  resources: ResourceData[]
  tools: ToolData[]
  prompts: PromptData[]
  sessionManagement?: boolean
  isRemoteServer?: boolean
}
