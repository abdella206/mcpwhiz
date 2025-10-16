"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Check, Globe, X, RefreshCw, Search } from "lucide-react"
import { ToolData } from "@/components/dynamic-code/types"

interface SwaggerImportModalProps {
  isOpen: boolean
  onClose: () => void
  swaggerImportedItems: ToolData[]
  swaggerSelectedItems: Set<number>
  onSelectionChange: (selectedItems: Set<number>) => void
  onImport: (updatedItems?: ToolData[]) => void
}

export function SwaggerImportModal({ 
  isOpen, 
  onClose, 
  swaggerImportedItems, 
  swaggerSelectedItems, 
  onSelectionChange,
  onImport 
}: SwaggerImportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // URL editor state
  const [showUrlEditor, setShowUrlEditor] = useState(false)
  const [baseUrlToUpdate, setBaseUrlToUpdate] = useState("")
  const [newBaseUrl, setNewBaseUrl] = useState("")
  const [updatedItems, setUpdatedItems] = useState(swaggerImportedItems)

  // Update local items when props change
  useEffect(() => {
    setUpdatedItems(swaggerImportedItems)
  }, [swaggerImportedItems])

  // URL editor functions
  const detectBaseUrl = () => {
    if (updatedItems.length === 0) return
    
    const urls = updatedItems.map(item => item.api_url).filter((url): url is string => Boolean(url))
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
    
    const updatedItemsList = updatedItems.map(item => {
      if (item.api_url && item.api_url.startsWith(baseUrlToUpdate)) {
        return {
          ...item,
          api_url: item.api_url.replace(baseUrlToUpdate, newBaseUrl)
        }
      }
      return item
    })
    
    setUpdatedItems(updatedItemsList)
    setShowUrlEditor(false)
    setBaseUrlToUpdate("")
    setNewBaseUrl("")
  }

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      // Disable background scrolling
      document.body.style.overflow = 'hidden'
      // Add padding to prevent layout shift when scrollbar disappears
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      // Re-enable background scrolling
      document.body.style.overflow = 'auto'
      document.body.style.paddingRight = '0px'
    }

    // Cleanup function to reset styles when component unmounts
    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.paddingRight = '0px'
    }
  }, [isOpen])

  // Handle click outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectAll = () => {
    onSelectionChange(new Set(updatedItems.map((_, i) => i)))
  }

  const handleSelectNone = () => {
    onSelectionChange(new Set())
  }

  const handleItemToggle = (index: number, checked: boolean) => {
    const newSelected = new Set(swaggerSelectedItems)
    if (checked) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    onSelectionChange(newSelected)
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
      onClick={onClose}
          >
        <div 
          ref={modalRef}
          style={{
            position: 'relative',
            backgroundColor: 'white',
            padding: window.innerWidth < 640 ? '16px' : '24px',
            borderRadius: window.innerWidth < 640 ? '12px' : '16px',
            maxWidth: window.innerWidth < 640 ? '100%' : window.innerWidth < 1024 ? '90vw' : '60vw',
            width: '100%',
            maxHeight: '95vh',
            overflow: 'hidden',
            color: 'black',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '2px solid #4ade80',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}

        >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: window.innerWidth < 640 ? '12px' : '16px',
            right: window.innerWidth < 640 ? '12px' : '16px',
            width: window.innerWidth < 640 ? '32px' : '36px',
            height: window.innerWidth < 640 ? '32px' : '36px',
            borderRadius: '50%',
            border: '2px solid #4ade80',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Close modal"
        >
          <X style={{ width: '18px', height: '18px', color: '#166534' }} />
        </button>

        {/* Header - matching the card style */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            height: '10px',
            width: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            //backgroundColor: '#dcfce7'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={{ width: '32px', height: '32px' }}>
              <path fill="#85ea2d" d="M63.999 124.945c-33.607 0-60.95-27.34-60.95-60.949C3.05 30.388 30.392 3.048 64 3.048s60.95 27.342 60.95 60.95c0 33.607-27.343 60.946-60.95 60.946z"/>
              <path fill="#173647" d="M40.3 43.311c-.198 2.19.072 4.454-.073 6.668-.173 2.217-.444 4.407-.888 6.596-.615 3.126-2.56 5.489-5.24 7.458 5.218 3.396 5.807 8.662 6.152 14.003.172 2.88.098 5.785.394 8.638.221 2.215 1.082 2.782 3.372 2.854.935.025 1.894 0 2.978 0v6.842c-6.768 1.156-12.354-.762-13.734-6.496a39.329 39.329 0 0 1-.836-6.4c-.148-2.287.097-4.577-.074-6.864-.492-6.277-1.305-8.393-7.308-8.689v-7.8c.441-.1.86-.174 1.302-.223 3.298-.172 4.701-1.182 5.414-4.43a37.512 37.512 0 0 0 .616-5.536c.247-3.569.148-7.21.763-10.754.86-5.094 4.01-7.556 9.254-7.852 1.476-.074 2.978 0 4.676 0v6.99c-.714.05-1.33.147-1.969.147-4.258-.148-4.48 1.304-4.8 4.848zm8.195 16.193h-.099c-2.462-.123-4.578 1.796-4.702 4.258-.122 2.485 1.797 4.603 4.259 4.724h.295c2.436.148 4.527-1.724 4.676-4.16v-.245c.05-2.486-1.944-4.527-4.43-4.577zm15.43 0c-2.386-.074-4.38 1.796-4.454 4.159 0 .149 0 .271.024.418 0 2.684 1.821 4.406 4.578 4.406 2.707 0 4.406-1.772 4.406-4.553-.025-2.682-1.823-4.455-4.554-4.43Zm15.801 0a4.596 4.596 0 0 0-4.676 4.454 4.515 4.515 0 0 0 4.528 4.528h.05c2.264.394 4.553-1.796 4.701-4.429.122-2.437-2.092-4.553-4.604-4.553Zm21.682.369c-2.855-.123-4.284-1.083-4.996-3.79a27.444 27.444 0 0 1-.811-5.292c-.198-3.298-.174-6.62-.395-9.918-.516-7.826-6.177-10.557-14.397-9.205v6.792c1.304 0 2.313 0 3.322.025 1.748.024 3.077.69 3.249 2.634.172 1.772.172 3.568.344 5.365.346 3.57.542 7.187 1.157 10.706.542 2.904 2.536 5.07 5.02 6.841-4.355 2.929-5.636 7.113-5.857 11.814-.122 3.223-.196 6.472-.368 9.721-.148 2.953-1.181 3.913-4.16 3.987-.835.024-1.648.098-2.583.148v6.964c1.748 0 3.347.1 4.946 0 4.971-.295 7.974-2.706 8.96-7.531.417-2.658.662-5.34.737-8.023.171-2.46.148-4.946.394-7.382.369-3.815 2.116-5.389 5.93-5.636a5.161 5.161 0 0 0 1.06-.245v-7.801c-.64-.074-1.084-.148-1.552-.173zM64 6.1c31.977 0 57.9 25.92 57.9 57.898 0 31.977-25.923 57.899-57.9 57.899-31.976 0-57.898-25.922-57.898-57.9C6.102 32.023 32.024 6.101 64 6.101m0-6.1C28.71 0 0 28.71 0 64c0 35.288 28.71 63.998 64 63.998 35.289 0 64-28.71 64-64S99.289.002 64 .002Z"/>
            </svg>
          </div>
          <h2 style={{ 
            fontSize: '22px', 
            fontWeight: '700', 
            margin: '0 0 6px 0',
            color: '#166534'
          }}>
            🚀 Swagger/OpenAPI
          </h2>
          <p style={{ 
            fontSize: '13px', 
            color: '#15803d',
            margin: '0 0 6px 0'
          }}>
            🔎 Import REST APIs from OpenAPI specifications
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0px' }}>
            <CheckCircle style={{ width: '18px', height: '18px', color: '#16a34a' }} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#166534' }}>
              Import Successful! Found {swaggerImportedItems.length} endpoint{swaggerImportedItems.length !== 1 ? 's' : ''} from your OpenAPI specification
            </span>
          </div>
        </div>

        {/* URL Editor Section */}
        <div style={{ 
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: 'rgba(244, 244, 245, 0.5)',
          borderRadius: '8px',
          border: '1px solid #e4e4e7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h5 style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>Update Base URL</h5>
            <div style={{ display: 'flex', gap: '8px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', 
                gap: '10px' 
              }}>
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
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '8px' }}>
                <Button
                  size="sm"
                  onClick={updateImportedItemsBaseUrl}
                  disabled={!baseUrlToUpdate || !newBaseUrl}
                  style={{ 
                    backgroundColor: '#16a34a', 
                    color: 'white',
                    border: 'none',
                    width: window.innerWidth < 640 ? '100%' : 'auto'
                  }}
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
                  style={{ 
                    width: window.innerWidth < 640 ? '100%' : 'auto'
                  }}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Auto-detect
                </Button>
              </div>
              <p style={{ 
                fontSize: '11px', 
                color: '#71717a', 
                margin: 0 
              }}>
                This will update the base URL for all imported endpoints. For example, changing from &quot;http://localhost:3000&quot; to &quot;https://api.example.com&quot; will update all URLs accordingly.
              </p>
            </div>
          )}
        </div>

        {/* Content area - no scroll, but flexible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, overflow: 'auto' }}>
          {/* Selection Controls */}
          <div style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            alignItems: window.innerWidth < 640 ? 'stretch' : 'center', 
            justifyContent: 'space-between',
            gap: window.innerWidth < 640 ? '12px' : '0'
          }}>
            <h4 style={{ 
              fontSize: window.innerWidth < 640 ? '14px' : '16px', 
              fontWeight: '600', 
              margin: 0, 
              color: '#166534' 
            }}>
              Select endpoints to import as MCP tools:
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                style={{ 
                  borderColor: '#4ade80', 
                  color: '#166534',
                  flex: window.innerWidth < 640 ? 1 : 'initial'
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNone}
                style={{ 
                  borderColor: '#4ade80', 
                  color: '#166534',
                  flex: window.innerWidth < 640 ? 1 : 'initial'
                }}
              >
                Select None
              </Button>
            </div>
          </div>

          {/* Endpoints List - with scroll */}
          <div 
            style={{
              border: '2px solid #4ade80',
              borderRadius: '12px',
              padding: window.innerWidth < 640 ? '12px' : '20px',
              maxHeight: '70vh',
              overflow: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }}

          >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {updatedItems.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    backgroundColor: swaggerSelectedItems.has(index) ? '#f0fdf4' : 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={swaggerSelectedItems.has(index)}
                      onChange={(e) => handleItemToggle(index, e.target.checked)}
                      style={{ marginTop: '2px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.http_method}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#166534' }}>
                          {item.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>{item.description}</p>
                      <p style={{ fontSize: '12px', color: '#16a34a', fontFamily: 'monospace', backgroundColor: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' }}>{item.api_url}</p>
                      {item.parameters && Object.keys(item.parameters).length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>Parameters:</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Object.keys(item.parameters).map((param) => (
                              <span key={param} style={{
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {param}: {item.parameters?.[param]?.type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Sticky Action Button - always at bottom */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          paddingTop: '0px', 
         // borderTop: '2px solid #bbf7d0',
         // backgroundColor: 'rgba(240, 253, 244, 0.9)',
          marginTop: '10px',
          paddingBottom: '0px',
          flexShrink: 0
        }}>
          <Button
            onClick={() => onImport(updatedItems)}
            disabled={swaggerSelectedItems.size === 0}
            style={{ 
              backgroundColor: '#16a34a', 
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              cursor: swaggerSelectedItems.size === 0 ? 'not-allowed' : 'pointer',
              opacity: swaggerSelectedItems.size === 0 ? 0.5 : 1
            }}
          >
            <Check style={{ width: '18px', height: '18px', marginRight: '8px' }} />
            Import {swaggerSelectedItems.size} Selected Endpoint{swaggerSelectedItems.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
