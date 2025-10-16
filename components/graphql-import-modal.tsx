"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Check, Globe, X, RefreshCw, Search } from "lucide-react"

import { ToolData } from "@/components/dynamic-code/types"

interface GraphQLImportModalProps {
  isOpen: boolean
  onClose: () => void
  graphqlImportedItems: ToolData[]
  graphqlSelectedItems: Set<number>
  onSelectionChange: (selectedItems: Set<number>) => void
  onImport: (updatedItems?: ToolData[]) => void
}

export function GraphQLImportModal({ 
  isOpen, 
  onClose, 
  graphqlImportedItems, 
  graphqlSelectedItems, 
  onSelectionChange,
  onImport 
}: GraphQLImportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // URL editor state
  const [showUrlEditor, setShowUrlEditor] = useState(false)
  const [baseUrlToUpdate, setBaseUrlToUpdate] = useState("")
  const [newBaseUrl, setNewBaseUrl] = useState("")
  const [updatedItems, setUpdatedItems] = useState(graphqlImportedItems)

  // Update local items when props change
  useEffect(() => {
    setUpdatedItems(graphqlImportedItems)
  }, [graphqlImportedItems])

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
          border: '2px solid #e535ab',
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
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
            border: '2px solid #e535ab',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fdf2f8'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Close modal"
        >
          <X style={{ width: '18px', height: '18px', color: '#be185d' }} />
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
            //backgroundColor: '#fce7f3'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={{ width: '32px', height: '32px' }}>
              <g fill="#E434AA">
                <path d="M18.39 96.852l-4.6-2.657L65.04 5.434l4.597 2.656zm0 0"/>
                <path d="M12.734 87.105H115.23v5.31H12.734zm0 0"/>
                <path d="M66.031 119.688L14.766 90.09l2.656-4.602 51.266 29.602zm0 0M110.566 42.543L59.301 12.941l2.656-4.597 51.266 29.597zm0 0"/>
                <path d="M17.434 42.523l-2.657-4.601 51.27-29.598 2.656 4.598zm0 0"/>
                <path d="M109.621 96.852L58.375 8.09l4.598-2.656 51.25 88.761zm0 0M16.8 34.398h5.313v59.204h-5.312zm0 0"/>
                <path d="M105.887 34.398h5.312v59.204h-5.312zm0 0"/>
                <path d="M65.129 117.441l-2.32-4.02 44.586-25.745 2.32 4.02zm0 0"/>
                <path d="M118.238 95.328c-3.07 5.344-9.918 7.168-15.261 4.098-5.344-3.074-7.168-9.922-4.098-15.266 3.074-5.344 9.922-7.168 15.266-4.097 5.375 3.105 7.199 9.921 4.093 15.265M29.09 43.84c-3.074 5.344-9.922 7.168-15.266 4.097-5.344-3.074-7.168-9.921-4.097-15.265 3.074-5.344 9.921-7.168 15.265-4.098 5.344 3.106 7.168 9.922 4.098 15.266M9.762 95.328c-3.075-5.344-1.25-12.16 4.093-15.266 5.344-3.07 12.16-1.246 15.266 4.098 3.07 5.344 1.246 12.16-4.098 15.266-5.375 3.07-12.191 1.246-15.261-4.098M98.91 43.84c-3.07-5.344-1.246-12.16 4.098-15.266 5.344-3.07 12.16-1.246 15.265 4.098 3.07 5.344 1.247 12.16-4.097 15.266-5.344 3.07-12.192 1.246-15.266-4.098M64 126.656a11.158 11.158 0 01-11.168-11.168A11.158 11.158 0 0164 104.32a11.158 11.158 0 0111.168 11.168c0 6.145-4.992 11.168-11.168 11.168M64 23.68a11.158 11.158 0 01-11.168-11.168A11.158 11.158 0 0164 1.344a11.158 11.158 0 0111.168 11.168A11.158 11.158 0 0164 23.68"/>
              </g>
            </svg>
          </div>
          <h3 style={{ 
            fontSize: '22px', 
            fontWeight: '700', 
            margin: '0 0 6px 0',
            color: '#be185d'
          }}>
            📈 GraphQL Schema
          </h3>
          <p style={{ 
            fontSize: '13px', 
            color: '#9d174d', 
            margin: '0 0 6px 0',
            fontWeight: '500'
          }}>
            🔎 Import GraphQL queries and mutations
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0px' }}>
            <CheckCircle style={{ width: '18px', height: '18px', color: '#9d174d' }} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#9d174d' }}>
              Import Successful! Found {graphqlImportedItems.length} operation{graphqlImportedItems.length !== 1 ? 's' : ''} from your GraphQL schema
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
                    backgroundColor: '#e535ab', 
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
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
              color: '#be185d' 
            }}>
              Select operations to import as MCP tools:
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                style={{ 
                  borderColor: '#e535ab',
                  color: '#e535ab',
                  fontSize: '12px',
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
                  borderColor: '#e535ab',
                  color: '#e535ab',
                  fontSize: '12px',
                  flex: window.innerWidth < 640 ? 1 : 'initial'
                }}
              >
                Select None
              </Button>
            </div>
          </div>

          {/* Operations List - scrollable */}
          <div style={{ 
            border: '2px solid #e4e4e7',
            borderRadius: '12px',
            padding: window.innerWidth < 640 ? '12px' : '20px',
            maxHeight: '70vh',
            overflow: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {updatedItems.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  border: '1px solid #cb6922',
                  borderRadius: '8px',
                  backgroundColor: graphqlSelectedItems.has(index) ? 'rgba(229, 53, 171, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={graphqlSelectedItems.has(index)}
                    onChange={(e) => {
                      const newSelection = new Set(graphqlSelectedItems)
                      if (e.target.checked) {
                        newSelection.add(index)
                      } else {
                        newSelection.delete(index)
                      }
                      onSelectionChange(newSelection)
                    }}
                    style={{
                      marginTop: '2px',
                      accentColor: '#e535ab'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#be185d'
                      }}>
                        {item.name || `Operation ${index + 1}`}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: item.http_method === 'query' ? '#dbeafe' : 
                                       item.http_method === 'mutation' ? '#fef3c7' :
                                       item.http_method === 'subscription' ? '#f3e8ff' : '#f3f4f6',
                        color: item.http_method === 'query' ? '#1e40af' :
                               item.http_method === 'mutation' ? '#92400e' :
                               item.http_method === 'subscription' ? '#7c3aed' : '#374151'
                      }}>
                        {item.http_method || 'UNKNOWN'}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#6b7280', 
                        margin: '4px 0',
                        lineHeight: '1.4'
                      }}>
                        {item.description}
                      </p>
                    )}
                    {item.api_url && (
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#9ca3af', 
                        margin: '4px 0',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        {item.api_url}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Import Button */}
        <div style={{
          display: 'flex', 
          justifyContent: 'center', 
          paddingTop: '0px',
          //borderTop: '1px solid #e4e4e7',
          //backgroundColor: 'rgba(253, 242, 248, 0.9)',
          marginTop: '10px',
          paddingBottom: '0px',
          flexShrink: 0
        }}>
          <Button
            onClick={() => onImport(updatedItems)}
            disabled={graphqlSelectedItems.size === 0}
            style={{ 
              backgroundColor: '#e535ab', 
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              cursor: graphqlSelectedItems.size === 0 ? 'not-allowed' : 'pointer',
              opacity: graphqlSelectedItems.size === 0 ? 0.5 : 1
            }}
          >
            <Check style={{ width: '18px', height: '18px', marginRight: '8px' }} />
            Import {graphqlSelectedItems.size} Selected Operation{graphqlSelectedItems.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
