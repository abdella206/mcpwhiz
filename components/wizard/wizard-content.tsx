"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { DynamicCodePreview } from "@/components/dynamic-code/dynamic-code-preview"
import { ResourceForm } from "@/components/resource-form"
import { ToolForm } from "@/components/tool-form"
import { PromptForm } from "@/components/prompt-form"
import { ToolData, ResourceData, PromptData } from "@/components/dynamic-code/types"
import {
  Github,
  Plus,
  Menu,
  Share2,
  Copy,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ServerConfig } from "@/store/server-config-store"

interface WizardContentProps {
  // Config state
  config: ServerConfig
  updateConfig: (updates: Partial<ServerConfig>) => void
  resetConfig: () => void
  addTools: (tools: ToolData[]) => void
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
  currentResourceData: ResourceData | null
  setCurrentResourceData: (data: ResourceData | null) => void
  currentToolData: ToolData | null
  setCurrentToolData: (data: ToolData | null) => void
  currentPromptData: PromptData | null
  setCurrentPromptData: (data: PromptData | null) => void

  // Save handlers
  saveResource: (resourceData: ResourceData) => void
  saveTool: (toolData: ToolData) => void
  savePrompt: (promptData: PromptData) => void
}

interface SidebarContentProps {
  config: ServerConfig
  updateConfig: (updates: Partial<ServerConfig>) => void
  handleRemoteServerToggle: (checked: boolean) => void
  handleSessionManagementToggle: (checked: boolean) => void
  setEditingIndex: (index: number | null) => void
  setCurrentResourceData: (data: ResourceData | null) => void
  setResourceModalOpen: (open: boolean) => void
  setCurrentToolData: (data: ToolData | null) => void
  setToolModalOpen: (open: boolean) => void
  setCurrentPromptData: (data: PromptData | null) => void
  setPromptModalOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
}

// Memoized sidebar content to prevent unnecessary re-renders
const SidebarContent = memo(({
  config,
  updateConfig,
  handleRemoteServerToggle,
  handleSessionManagementToggle,
  setEditingIndex,
  setCurrentResourceData,
  setResourceModalOpen,
  setCurrentToolData,
  setToolModalOpen,
  setCurrentPromptData,
  setPromptModalOpen,
  setSidebarOpen
}: SidebarContentProps) => (
  <div className="p-4 sm:p-6 space-y-6">
    {/* Server Settings */}
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wide">Settings</h2>

      <div className="space-y-3">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Name
          </Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            className="mt-1"
            placeholder="my-mcp-server"
          />
        </div>

        <div>
          <Label htmlFor="version" className="text-sm font-medium">
            Version
          </Label>
          <Input
            id="version"
            value={config.version}
            onChange={(e) => updateConfig({ version: e.target.value })}
            className="mt-1"
            placeholder="1.0.0"
          />
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="remote-server"
            checked={!config.isRemoteServer}
            onCheckedChange={handleRemoteServerToggle}
          />
          <Label htmlFor="remote-server" className="text-sm font-medium">
            {config.isRemoteServer ? "Remote Server (Streamable HTTP)" : "Local Server (stdio)"}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          {config.isRemoteServer
            ? "Uses HTTP transport for remote server connections via network requests."
            : "Uses stdio transport for local server connections via standard input/output."}
        </p>

        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="session-management"
            checked={config.sessionManagement}
            onCheckedChange={handleSessionManagementToggle}
            disabled={!config.isRemoteServer}
          />
          <Label htmlFor="session-management" className={`text-sm font-medium ${!config.isRemoteServer ? 'opacity-50' : ''}`}>
            Enable Session Management
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {config.isRemoteServer
            ? "Enable session management to maintain stateful sessions between requests. If disabled, the server operates statelessly."
            : "Session management is only available for Remote Server (HTTP) mode."}
        </p>
      </div>
    </div>

    <Separator />
    <div className="flex flex-col space-y-2">
      {/* Add Buttons */}
      <Button
        onClick={() => {
          setEditingIndex(null)
          setCurrentResourceData(null)
          setResourceModalOpen(true)
          setSidebarOpen(false) // Close mobile sidebar
        }}
        variant="outline"
        size="sm"
        className="border-orange-200 text-orange-600 hover:bg-orange-50 relative flex items-center justify-center"
      >
        <Plus className="h-4 w-4 absolute left-[calc(50%-3rem)]" />
        <span className="ml-10">Add Resource</span>
      </Button>
      <Button
        onClick={() => {
          setEditingIndex(null)
          setCurrentToolData(null)
          setToolModalOpen(true)
          setSidebarOpen(false) // Close mobile sidebar
        }}
        variant="outline"
        size="sm"
        className="border-orange-200 text-orange-600 hover:bg-orange-50 relative flex items-center justify-center"
      >
        <Plus className="h-4 w-4 absolute left-[calc(50%-3rem)]" />
        <span className="ml-2">Add Tool</span>
      </Button>
      <Button
        onClick={() => {
          setEditingIndex(null)
          setCurrentPromptData(null)
          setPromptModalOpen(true)
          setSidebarOpen(false) // Close mobile sidebar
        }}
        variant="outline"
        size="sm"
        className="border-orange-200 text-orange-600 hover:bg-orange-50 relative flex items-center justify-center"
      >
        <Plus className="h-4 w-4 absolute left-[calc(50%-3rem)]" />
        <span className="ml-7">Add Prompt</span>
      </Button>
    </div>
  </div>
))

SidebarContent.displayName = 'SidebarContent'

export function WizardContent({
  config,
  updateConfig,
  resetConfig,
  updateCustomCode,
  setSelectedLanguage,
  resourceModalOpen,
  setResourceModalOpen,
  toolModalOpen,
  setToolModalOpen,
  promptModalOpen,
  setPromptModalOpen,
  editingIndex,
  setEditingIndex,
  setCurrentResourceData,
  setCurrentToolData,
  setCurrentPromptData,
  saveResource,
  saveTool,
  savePrompt
}: WizardContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is properly mounted before enabling client-side features
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Stable callback functions to prevent infinite re-renders
  const handleRemoteServerToggle = useCallback((checked: boolean) => {
    updateConfig({ isRemoteServer: !checked })
  }, [updateConfig])

  const handleSessionManagementToggle = useCallback((checked: boolean) => {
    updateConfig({ sessionManagement: checked })
  }, [updateConfig])

  const generateShareUrl = () => {
    const encodedConfig = btoa(JSON.stringify(config))
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/wizard?config=${encodedConfig}`
    }
    // Fallback for SSR - will be replaced when component mounts on client
    return `/wizard?config=${encodedConfig}`
  }

  const shareConfig = async (event?: React.MouseEvent) => {
    // Prevent any default behavior that might trigger system sharing
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Ensure we're running on the client side and component is mounted
    if (typeof window === 'undefined' || !isMounted) {
      console.warn('Share functionality not available during SSR or before mount')
      return
    }

    // Always open custom share modal instead of using Web Share API
    setShareModalOpen(true)
  }

  const copyToClipboard = async (text: string, successMessage: string) => {
    // Ensure we're running on the client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.warn('Clipboard functionality not available during SSR')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard!",
        description: successMessage
      })
    } catch {
      // Fallback for older browsers
      if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          toast({
            title: "Copied to clipboard!",
            description: successMessage
          })
        } catch {
          toast({
            title: "Copy failed",
            description: "Please manually copy the link.",
            variant: "destructive"
          })
        }
        document.body.removeChild(textArea)
      } else {
        toast({
          title: "Copy failed",
          description: "Clipboard not available.",
          variant: "destructive"
        })
      }
    }
  }

  const shareToSocialMedia = (platform: string) => {
    // Ensure we're running on the client side
    if (typeof window === 'undefined') {
      console.warn('Social media sharing not available during SSR')
      return
    }

    const shareUrl = generateShareUrl()
    const title = `${config.name} - MCP Server Configuration`
    const text = `Check out my MCP server configuration: ${config.description}. Built with mcpwhiz!`
    
    let socialUrl = ''
    
    switch (platform) {
      case 'twitter':
        socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'email':
        socialUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`
        break
    }
    
    if (socialUrl) {
      window.open(socialUrl, '_blank', 'noopener,noreferrer')
      setShareModalOpen(false)
      toast({
        title: "Opening share dialog...",
        description: `Sharing to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`
      })
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
             {/* Mobile Menu Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden p-2">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
            </Sheet>
          <Link href="/" className="flex items-center space-x-2">
              <Image src="/mcp_logo.png" alt="mcpwhiz Logo" width={50} height={50} className="mt-2" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate mt-4 -ml-3"> Whiz Server Builder</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => shareConfig(event)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 p-2 sm:px-3"
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share Link</span>
            </Button>
            <Button variant="outline" size="sm" asChild className="p-2 sm:px-3">
              <a href="https://github.com/abdella206/mcpwhiz" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 border-r border-border bg-sidebar overflow-y-auto">
          <SidebarContent
            config={config}
            updateConfig={updateConfig}
            handleRemoteServerToggle={handleRemoteServerToggle}
            handleSessionManagementToggle={handleSessionManagementToggle}
            setEditingIndex={setEditingIndex}
            setCurrentResourceData={setCurrentResourceData}
            setResourceModalOpen={setResourceModalOpen}
            setCurrentToolData={setCurrentToolData}
            setToolModalOpen={setToolModalOpen}
            setCurrentPromptData={setCurrentPromptData}
            setPromptModalOpen={setPromptModalOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        {/* Mobile Sidebar - Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <SheetTitle className="sr-only">Server Configuration</SheetTitle>
            <div className="h-full overflow-y-auto">
              <SidebarContent
                config={config}
                updateConfig={updateConfig}
                handleRemoteServerToggle={handleRemoteServerToggle}
                handleSessionManagementToggle={handleSessionManagementToggle}
                setEditingIndex={setEditingIndex}
                setCurrentResourceData={setCurrentResourceData}
                setResourceModalOpen={setResourceModalOpen}
                setCurrentToolData={setCurrentToolData}
                setToolModalOpen={setToolModalOpen}
                setCurrentPromptData={setCurrentPromptData}
                setPromptModalOpen={setPromptModalOpen}
                setSidebarOpen={setSidebarOpen}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Right Panel - Code Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Code Preview */}
          <div className="flex-1 min-h-0">
            <div className="h-full code-preview">
              <DynamicCodePreview
                serverName={config.name}
                serverVersion={config.version}
                serverDescription={config.description}
                resources={config.resources}
                tools={config.tools}
                prompts={config.prompts}
                sessionManagement={config.sessionManagement}
                isRemoteServer={config.isRemoteServer}
                onReset={resetConfig}
                customCode={config.customCode}
                selectedLanguage={config.selectedLanguage || 'typescript'}
                updateCustomCode={updateCustomCode}
                setSelectedLanguage={setSelectedLanguage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>

          <ResourceForm
            initialData={editingIndex !== null ? config.resources[editingIndex] : undefined}
            onResourceChange={(resourceData) => {
              setCurrentResourceData(resourceData)
            }}
            onResourcesImported={(resources) => {
              // Add multiple resources at once (for Import from API mode)
              resources.forEach(resource => saveResource(resource))
              setResourceModalOpen(false)
              setCurrentResourceData(null)
              toast({ title: `Added ${resources.length} resource(s) successfully!` })
            }}
            onSave={(resourceData) => {
              if (resourceData && resourceData.name?.trim()) {
                saveResource(resourceData)
                setResourceModalOpen(false)
                setCurrentResourceData(null)
                toast({ title: editingIndex !== null ? "Resource updated successfully!" : "Resource added successfully!" })
              }
            }}
            isEditing={editingIndex !== null}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={toolModalOpen} onOpenChange={setToolModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Tool" : "Add Tool"}</DialogTitle>
          </DialogHeader>
          <ToolForm
            initialData={editingIndex !== null ? config.tools[editingIndex] : undefined}
            onToolChange={(toolData) => {
              setCurrentToolData(toolData)
            }}
            onToolsImported={(tools) => {
              // Add multiple tools at once (for Import from API mode)
              tools.forEach(tool => saveTool(tool))
              setToolModalOpen(false)
              setCurrentToolData(null)
              toast({ title: `Added ${tools.length} tool(s) successfully!` })
            }}
            onSave={(toolData) => {
              if (toolData && toolData.name?.trim()) {
                saveTool(toolData)
                setToolModalOpen(false)
                setCurrentToolData(null)
                toast({ title: editingIndex !== null ? "Tool updated successfully!" : "Tool added successfully!" })
              }
            }}
            isEditing={editingIndex !== null}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Prompt" : "Add Prompt"}</DialogTitle>
          </DialogHeader>
          <PromptForm
            initialData={editingIndex !== null ? config.prompts[editingIndex] : undefined}
            onPromptChange={(promptData) => {
              setCurrentPromptData(promptData)
            }}
            onPromptsImported={(prompts) => {
              // Add multiple prompts at once (for JSON array mode)
              prompts.forEach(prompt => savePrompt(prompt))
              setPromptModalOpen(false)
              setCurrentPromptData(null)
              toast({ title: `Added ${prompts.length} prompt(s) successfully!` })
            }}
            onSave={(promptData) => {
              if (promptData && promptData.name?.trim()) {
                savePrompt(promptData)
                setPromptModalOpen(false)
                setCurrentPromptData(null)
                toast({ title: editingIndex !== null ? "Prompt updated successfully!" : "Prompt added successfully!" })
              }
            }}
            isEditing={editingIndex !== null}
          />
        </DialogContent>
      </Dialog>

      {/* Enhanced Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share your <strong>{config.name}</strong> server configuration with others
            </p>
            
            {/* Copy Link Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Direct Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={generateShareUrl()} 
                  readOnly 
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateShareUrl(), "Share link copied to clipboard!")}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Social Media Sharing */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Share on Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocialMedia('twitter')}
                  className="flex items-center gap-2 justify-start"
                >
                  <Twitter className="h-4 w-4 text-blue-500" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocialMedia('linkedin')}
                  className="flex items-center gap-2 justify-start"
                >
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocialMedia('facebook')}
                  className="flex items-center gap-2 justify-start"
                >
                  <Facebook className="h-4 w-4 text-blue-700" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocialMedia('email')}
                  className="flex items-center gap-2 justify-start"
                >
                  <Mail className="h-4 w-4 text-gray-600" />
                  Email
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Configuration Summary */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">What&apos;s Being Shared</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Server Name:</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resources:</span>
                  <span className="font-medium">{config.resources.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tools:</span>
                  <span className="font-medium">{config.tools.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prompts:</span>
                  <span className="font-medium">{config.prompts.length}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
