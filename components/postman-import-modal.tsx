"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Check, Globe, X, RefreshCw, Search } from "lucide-react"
import { ToolData } from "@/components/dynamic-code/types"

interface PostmanImportModalProps {
  isOpen: boolean
  onClose: () => void
  postmanImportedItems: ToolData[]
  postmanSelectedItems: Set<number>
  onSelectionChange: (selectedItems: Set<number>) => void
  onImport: (updatedItems?: ToolData[]) => void
}

export function PostmanImportModal({ 
  isOpen, 
  onClose, 
  postmanImportedItems, 
  postmanSelectedItems, 
  onSelectionChange,
  onImport 
}: PostmanImportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // URL editor state
  const [showUrlEditor, setShowUrlEditor] = useState(false)
  const [baseUrlToUpdate, setBaseUrlToUpdate] = useState("")
  const [newBaseUrl, setNewBaseUrl] = useState("")
  const [updatedItems, setUpdatedItems] = useState(postmanImportedItems)

  // Update local items when props change
  useEffect(() => {
    setUpdatedItems(postmanImportedItems)
  }, [postmanImportedItems])

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
          border: '2px solid #ff6c37',
          background: 'linear-gradient(135deg, #fff5f2 0%, #ffe8e0 100%)',
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
            border: '2px solid #ff6c37',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fff5f2'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Close modal"
        >
          <X style={{ width: '18px', height: '18px', color: '#c2410c' }} />
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
            //backgroundColor: '#ffe8e0'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style={{ width: '32px', height: '32px' }}>
              <path fill="#ff6c37" d="M91.078 24.164a10.038 10.038 0 0 0-5.781 2.426 10.028 10.028 0 0 0-1.54 13.465 10.028 10.028 0 0 0 13.276 2.715h.002v.001l.156.155a10.63 10.63 0 0 0 1.965-1.45A10.341 10.341 0 0 0 99 27.107v-.002l-8.844 8.789-.156-.155 8.844-8.793a10.038 10.038 0 0 0-7.766-2.78zM79.434 38.551c-4.24-.007-11.163 4.799-28.067 21.703l.084.086c-.092-.032-.185-.035-.185-.035l-6.364 6.308a1.035 1.035 0 0 0 .93 1.762l10.914-2.328a.307.307 0 0 0 .092-.17l.242.25-3.72 3.69h-.18l-22.086 22.26 7.086 6.824a1.254 1.254 0 0 0 1.476.149 1.327 1.327 0 0 0 .645-1.356l-1.035-4.5a.534.534 0 0 1 0-.62 117.285 117.285 0 0 0 26.738-17.583l-4.535-4.537.086-.014-2.69-2.689.172-.174.182.186-.094.091 7.137 7.293v-.003c13.68-12.954 23.39-23.367 20.865-30.375a3.83 3.83 0 0 0-1.107-2.208v.004a3.778 3.778 0 0 0-.483-.306c-.083-.088-.156-.178-.244-.264l-.066.066a3.778 3.778 0 0 0-.582-.29l.289-.292c-1.796-1.6-3.28-2.924-5.5-2.93zM30.94 92.21l-5.171 5.172v.004a1.03 1.03 0 0 0-.457 1.125 1.035 1.035 0 0 0 .921.789l12.672.875-7.965-7.965z"/>
              <path fill="#f37036" d="M91.95 23.31a11.047 11.047 0 0 0-7.759 3.17 10.988 10.988 0 0 0-2.39 11.641c-4.741-2.03-11.155 1.51-31.106 21.457a.932.932 0 0 0-.037.094 1.242 1.242 0 0 0-.119.062l-6.309 6.364a1.97 1.97 0 0 0-.363 2.324 2.012 2.012 0 0 0 1.707.984l.313-.203 8.424-1.797-4.03 4.067a.873.873 0 0 0-.054.166l-19.75 19.799a.798.798 0 0 0-.192.238l-5.086 5.09a1.967 1.967 0 0 0-.414 2.043 1.995 1.995 0 0 0 1.656 1.265l12.618.88a1.01 1.01 0 0 0 .52-.415.886.886 0 0 0 0-1.035l-.026-.025a2.243 2.243 0 0 0 .705-.58 2.237 2.237 0 0 0 .406-1.876l-.984-4.187a126.725 126.725 0 0 0 26.334-16.861 1.091 1.091 0 0 0 .248.103c.254-.019.492-.128.672-.308 13.55-12.83 21.515-21.622 21.515-28.602a8.03 8.03 0 0 0-.431-2.85 10.957 10.957 0 0 0 3.845.83l-.015.004a11.219 11.219 0 0 0 5.183-1.45.775.775 0 0 0 .004.001.835.835 0 0 0 .617-.055 9.398 9.398 0 0 0 2.07-1.652 10.873 10.873 0 0 0 3.258-7.758 10.873 10.873 0 0 0-3.257-7.758.93.93 0 0 0-.118-.091 11.045 11.045 0 0 0-7.656-3.078zm-.087 1.772a9.27 9.27 0 0 1 5.586 1.914l-8.068 8.117a.84.84 0 0 0-.076.098.83.83 0 0 0-.239.55.832.832 0 0 0 .313.65h.002l6.1 6.1a9.044 9.044 0 0 1-10.028-1.913c-2.586-2.6-3.336-6.504-1.953-9.891 1.383-3.39 4.68-5.605 8.363-5.625zm7.12 3.432a8.87 8.87 0 0 1 2.033 5.674 9.15 9.15 0 0 1-2.688 6.464 9.989 9.989 0 0 1-1.098.895L92.307 36.7l-.963-.963.265-.265 7.373-6.96zm-.366 4.193a.777.777 0 0 0-.55.031.731.731 0 0 0-.36.426.73.73 0 0 0 .05.559 2.226 2.226 0 0 1-.257 2.328.64.64 0 0 0-.195.488c.004.184.07.36.195.492a.58.58 0 0 0 .414 0 .68.68 0 0 0 .672-.207 3.573 3.573 0 0 0 .465-3.777v.004a.777.777 0 0 0-.434-.344zM79.34 39.43a5.584 5.584 0 0 1 3.31 1.226 4.756 4.756 0 0 0-2.681 1.34L57.162 64.701l-4.476-4.476c11.828-11.772 19.06-17.921 23.556-19.936a5.584 5.584 0 0 1 3.098-.86zm3.965 2.96a2.895 2.895 0 0 1 2.043.844 2.786 2.786 0 0 1 .879 2.121 2.869 2.869 0 0 1-.985 2.07l-24.25 21.106-2.617-2.617 22.887-22.68a2.895 2.895 0 0 1 2.043-.843zm2.994 6.698c-1.69 6.702-10.647 15.783-19.987 24.607l-3.777-3.773L86.3 49.088zM51.367 61.547l.274.27 3.513 3.513-9.63 2.06 5.843-5.843zm5.793 5.84.004.004 1.168 1.195a1.086 1.086 0 0 0 .018.084l.078.012.248.254.82.84-5.385.66 3.05-3.05zm3.867 4.076 3.578 3.576A126.992 126.992 0 0 1 38.75 91.695a1.44 1.44 0 0 0-.777 1.653l1.035 4.5a.31.31 0 0 1 0 .363.31.31 0 0 1-.414 0l-6.102-6.152L51.3 72.975l9.728-1.512zm-29.933 21.94.869.814 4.492 4.492-10.016-.648 4.655-4.659z"/>
            </svg>
          </div>
          <h3 style={{ 
            fontSize: '22px', 
            fontWeight: '700', 
            margin: '0 0 6px 0',
            color: '#c2410c'
          }}>
            📮 Postman Collection
          </h3>
          <p style={{ 
            fontSize: '13px', 
            color: '#7c2d12', 
            margin: '0 0 6px 0',
            fontWeight: '500'
          }}>
            🔎 Import REST APIs from Postman collections
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0px' }}>
            <CheckCircle style={{ width: '18px', height: '18px', color: '#7c2d12' }} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#7c2d12' }}>
              Import Successful! Found {postmanImportedItems.length} endpoint{postmanImportedItems.length !== 1 ? 's' : ''} from your Postman collection
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
                    backgroundColor: '#ff6c37', 
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
              color: '#c2410c' 
            }}>
              Select endpoints to import as MCP tools:
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                style={{ 
                  borderColor: '#ff6c37',
                  color: '#ff6c37',
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
                  borderColor: '#ff6c37',
                  color: '#ff6c37',
                  fontSize: '12px',
                  flex: window.innerWidth < 640 ? 1 : 'initial'
                }}
              >
                Select None
              </Button>
            </div>
          </div>

          {/* Endpoints List - scrollable */}
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
                  backgroundColor: postmanSelectedItems.has(index) ? 'rgba(255, 108, 55, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease' //borderBottom: index < updatedItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={postmanSelectedItems.has(index)}
                    onChange={(e) => {
                      const newSelection = new Set(postmanSelectedItems)
                      if (e.target.checked) {
                        newSelection.add(index)
                      } else {
                        newSelection.delete(index)
                      }
                      onSelectionChange(newSelection)
                    }}
                    style={{
                      marginTop: '2px',
                      accentColor: '#ff6c37'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#c2410c'
                      }}>
                        {item.name || `Endpoint ${index + 1}`}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: item.http_method === 'GET' ? '#dcfce7' : 
                                       item.http_method === 'POST' ? '#fef3c7' :
                                       item.http_method === 'PUT' ? '#dbeafe' :
                                       item.http_method === 'DELETE' ? '#fee2e2' : '#f3f4f6',
                        color: item.http_method === 'GET' ? '#166534' :
                               item.http_method === 'POST' ? '#92400e' :
                               item.http_method === 'PUT' ? '#1e40af' :
                               item.http_method === 'DELETE' ? '#dc2626' : '#374151'
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
          //backgroundColor: 'rgba(255, 245, 242, 0.9)',
          marginTop: '10px',
          paddingBottom: '0px',
          flexShrink: 0
        }}>
          <Button
            onClick={() => onImport(updatedItems)}
            disabled={postmanSelectedItems.size === 0}
            style={{ 
              backgroundColor: '#ff6c37', 
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              cursor: postmanSelectedItems.size === 0 ? 'not-allowed' : 'pointer',
              opacity: postmanSelectedItems.size === 0 ? 0.5 : 1
            }}
          >
            <Check style={{ width: '18px', height: '18px', marginRight: '8px' }} />
            Import {postmanSelectedItems.size} Selected Endpoint{postmanSelectedItems.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
