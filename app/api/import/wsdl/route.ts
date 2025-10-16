import { NextRequest, NextResponse } from 'next/server'
import { parseString } from 'xml2js'

interface ParameterDefinition {
  type: string
  description: string
  required: boolean
}

interface ToolData {
  name: string
  title: string
  description: string
  tool_type: "api"
  parameters?: Record<string, ParameterDefinition>
  api_url?: string
  http_method?: string
  headers?: Record<string, string>
}

// Helper function to extract base URL from WSDL endpoint URL
const extractBaseUrlFromWsdlUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    // For WSDL files, typically use the origin + path without the filename
    const pathParts = urlObj.pathname.split('/')
    if (pathParts[pathParts.length - 1].includes('.wsdl') || pathParts[pathParts.length - 1].includes('.xml')) {
      // Remove the filename, keep the directory path
      pathParts.pop()
      return urlObj.origin + pathParts.join('/')
    }
    return urlObj.origin
  } catch {
    // If URL parsing fails, return the original URL
    return url
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const url = formData.get('url') as string
    const authHeader = formData.get('authHeader') as string
    let baseUrl = formData.get('baseUrl') as string

    let wsdlContent: string = ''

    if (file) {
      // Handle file upload
      wsdlContent = await file.text()
      // For file uploads, use empty baseUrl since there's no URL context
      baseUrl = baseUrl || ''
    } else if (url) {
      // Handle URL fetch
      console.log(`[WSDL Import] Fetching WSDL from: ${url}`)
      
      const headers: HeadersInit = {
        'Accept': 'text/xml, application/xml, text/plain, */*',
        'User-Agent': 'MCP-Deploy-Bot/1.0 (+https://mcpwhiz.com)',
        'Cache-Control': 'no-cache'
      }
      
      if (authHeader) {
        headers['Authorization'] = authHeader
      }

      const response = await fetch(url, { 
        headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch WSDL: ${response.status} ${response.statusText}`)
      }
      
      wsdlContent = await response.text()
      
      // Auto-extract base URL if not provided
      if (!baseUrl) {
        baseUrl = extractBaseUrlFromWsdlUrl(url)
        console.log(`[WSDL Import] Extracted base URL: ${baseUrl}`)
      }
    } else {
      return NextResponse.json(
        { error: 'Either file or URL must be provided' },
        { status: 400 }
      )
    }

    // Validate content type before parsing
    const trimmedContent = wsdlContent.trim()
    
    // Check if content is JSON (starts with { or [)
    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      return NextResponse.json(
        { error: 'The provided URL/file contains JSON content, not WSDL XML. Please provide a valid WSDL file or URL that returns XML content.' },
        { status: 400 }
      )
    }
    
    // Check if content is HTML (starts with <!DOCTYPE or <html)
    if (trimmedContent.startsWith('<!DOCTYPE') || trimmedContent.startsWith('<html')) {
      return NextResponse.json(
        { error: 'The provided URL/file contains HTML content, not WSDL XML. Please provide a valid WSDL file or URL that returns XML content.' },
        { status: 400 }
      )
    }
    
    // Check if content is valid XML (starts with <)
    if (!trimmedContent.startsWith('<')) {
      return NextResponse.json(
        { error: 'The provided content does not appear to be valid XML. WSDL files must be in XML format.' },
        { status: 400 }
      )
    }

    // Parse WSDL XML
    const wsdlData = await new Promise<Record<string, unknown>>((resolve, reject) => {
      parseString(wsdlContent, {
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true,
        trim: true,
        normalize: true
      }, (err, result) => {
        if (err) {
          console.error('XML parsing error:', err)
          reject(new Error(`Failed to parse XML: ${err.message}`))
        } else {
          resolve(result as unknown as Record<string, unknown>)
        }
      })
    })

    const tools: ToolData[] = await parseWsdlToTools(wsdlData, baseUrl, authHeader)

    return NextResponse.json({ 
      tools,
      baseUrl: baseUrl || '',
      sourceType: file ? 'file' : 'url'
    })
  } catch (error) {
    console.error('[WSDL Import] Error:', error)
    
    let errorMessage = 'Failed to parse WSDL'
    let statusCode = 500
    
    if (error instanceof Error) {
      // Network and fetch errors
      if (error.message.includes('Failed to fetch WSDL') || 
          error.message.includes('fetch') ||
          error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          { 
            error: 'Network Error: Unable to access the WSDL file. This might be due to CORS restrictions or the service being temporarily unavailable.',
            details: `The server at the provided URL may not allow direct access from our service. Error: ${error.message}`,
            suggestion: 'Try using a different WSDL endpoint URL, or contact the service provider about CORS configuration.'
          },
          { status: 500 }
        )
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout: The WSDL service took too long to respond.',
            details: 'The server did not respond within 10 seconds. Please try again or check if the URL is correct.',
            suggestion: 'Verify the URL is accessible and try again.'
          },
          { status: 408 }
        )
      } else if (error.message.includes('Non-whitespace before first tag')) {
        errorMessage = 'The provided content is not valid XML. Please ensure you are providing a WSDL file or URL that returns XML content.'
        statusCode = 400
      } else if (error.message.includes('Failed to parse XML')) {
        errorMessage = 'The XML content could not be parsed. Please check that the WSDL file is valid and well-formed.'
        statusCode = 400
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: 'Please verify the WSDL file is valid and accessible.'
      },
      { status: statusCode }
    )
  }
}

// Helper function to safely extract string values from XML parser results
function getStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && value !== null) {
    // Handle xml2js parsed attributes
    const obj = value as Record<string, unknown>
    if ('_' in obj && obj._ != null) {
      return String((obj as { _: unknown })._)
    }
    // Handle direct object conversion
    return String(value)
  }
  return String(value || '')
}

// Helper function to safely get attribute values
function getAttributeValue(element: unknown, attrName: string): string {
  if (element == null) return ''
  if (typeof element !== 'object') return ''
  const obj = element as Record<string, unknown>

  // Direct property access
  if (obj[attrName] !== undefined) {
    return getStringValue(obj[attrName])
  }
  
  // Check for attributes object
  const attrs = obj.$ as Record<string, unknown> | undefined
  if (attrs && attrs[attrName] !== undefined) {
    return getStringValue(attrs[attrName])
  }
  
  return ''
}

type XmlNode = Record<string, unknown>

function getNodeProp(node: unknown, key: string): unknown {
  if (node == null || typeof node !== 'object') return undefined
  return (node as Record<string, unknown>)[key]
}

async function parseWsdlToTools(wsdlData: XmlNode, baseUrl?: string, authHeader?: string): Promise<ToolData[]> {
  const tools: ToolData[] = []

  try {
    // Handle WSDL 1.1 and 2.0 structures
    const definitions = getNodeProp(wsdlData, 'definitions') || getNodeProp(wsdlData, 'wsdl:definitions') || wsdlData
    
    if (!definitions) {
      throw new Error('Invalid WSDL: No definitions found')
    }

    // Extract target namespace - handle both object and string values
    const targetNamespace = getStringValue(
      getNodeProp(definitions, 'targetNamespace') || getNodeProp(definitions as XmlNode, 'targetNamespace') || ''
    )
    
    // Find services and ports
    const services = getNodeProp(definitions, 'service') || getNodeProp(definitions, 'wsdl:service')
    const portTypes = getNodeProp(definitions, 'portType') || getNodeProp(definitions, 'wsdl:portType')
    
    if (!services || !portTypes) {
      throw new Error('Invalid WSDL: No services or portTypes found')
    }

    // Convert to arrays if single items
    const serviceArray = Array.isArray(services) ? services : [services]
    const portTypeArray = Array.isArray(portTypes) ? portTypes : [portTypes]

    // Extract endpoint URL from service
    let serviceUrl = baseUrl || ''
    
    for (const service of serviceArray) {
      const ports = getNodeProp(service, 'port') || getNodeProp(service, 'wsdl:port')
      const portArray = Array.isArray(ports) ? ports : [ports]
      
      for (const port of portArray) {
        // Look for SOAP address
        const soapAddress = getNodeProp(port, 'soap:address') || getNodeProp(port, 'soap12:address') || getNodeProp(port, 'address')
        if (soapAddress) {
          const location = getStringValue(getNodeProp(soapAddress, 'location') || getAttributeValue(soapAddress, 'location'))
          if (location) {
            serviceUrl = location
            break
          }
        }
      }
      
      if (serviceUrl && serviceUrl !== baseUrl) break
    }

    // Process each portType (interface)
    for (const portType of portTypeArray) {
      const operations = getNodeProp(portType, 'operation') || getNodeProp(portType, 'wsdl:operation')
      if (!operations) continue

      const operationArray = Array.isArray(operations) ? operations : [operations]

      for (const operation of operationArray) {
        const operationName = getStringValue(getNodeProp(operation, 'name') || getNodeProp(operation, 'name'))
        if (!operationName) continue

        // Get operation documentation
        const documentation = getStringValue(getNodeProp(operation, 'documentation') || getNodeProp(operation, 'wsdl:documentation') || '')
        
        // Extract input/output messages
        const input = getNodeProp(operation, 'input') || getNodeProp(operation, 'wsdl:input')
        
        // Build parameters from input message
        const parameters: Record<string, ParameterDefinition> = {}
        
        if (input && getNodeProp(input, 'message')) {
          // Find the corresponding message definition
          const messages = getNodeProp(definitions, 'message') || getNodeProp(definitions, 'wsdl:message')
          const messageArray = Array.isArray(messages) ? messages : [messages]
          
          const inputMessageName = getStringValue(getNodeProp(input, 'message')).replace(/^tns:/, '').replace(/^.*:/, '')
          const inputMessage = messageArray.find((msg: unknown) => {
            const msgName = getStringValue(getNodeProp(msg, 'name') || getNodeProp(msg, 'name'))
            return msgName === inputMessageName
          })
          
          if (inputMessage) {
            const parts = getNodeProp(inputMessage, 'part') || getNodeProp(inputMessage, 'wsdl:part')
            const partArray = Array.isArray(parts) ? parts : [parts]
            
            for (const part of partArray) {
              const partName = getStringValue(getNodeProp(part, 'name') || getNodeProp(part, 'name'))
              const partType = getStringValue(getNodeProp(part, 'type') || getNodeProp(part, 'type') || 'string')
              
              if (partName) {
                parameters[partName] = {
                  type: convertWsdlTypeToJsonType(partType),
                  description: `SOAP parameter: ${partName}`,
                  required: true // SOAP parameters are typically required
                }
              }
            }
          }
        }

        // Build headers for SOAP request
        const headers: Record<string, string> = {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"${targetNamespace}/${operationName}"`
        }
        
        if (authHeader) {
          headers['Authorization'] = authHeader
        }

        const tool: ToolData = {
          name: operationName.replace(/[^a-zA-Z0-9_]/g, '_'),
          title: operationName,
          description: documentation || `SOAP operation: ${operationName}`,
          tool_type: "api",
          api_url: serviceUrl,
          http_method: "POST", // SOAP always uses POST
          parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
          headers: headers
        }
        
        tools.push(tool)
      }
    }

    return tools
  } catch (error) {
    console.error('Error parsing WSDL structure:', error)
    throw new Error(`Failed to parse WSDL structure: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function convertWsdlTypeToJsonType(wsdlType: string): string {
  // Remove namespace prefixes
  const type = wsdlType.replace(/^.*:/, '').toLowerCase()
  
  // Map WSDL/XSD types to JSON schema types
  const typeMap: Record<string, string> = {
    'string': 'string',
    'int': 'integer',
    'integer': 'integer',
    'long': 'integer',
    'short': 'integer',
    'byte': 'integer',
    'float': 'number',
    'double': 'number',
    'decimal': 'number',
    'boolean': 'boolean',
    'date': 'string',
    'datetime': 'string',
    'time': 'string',
    'base64binary': 'string',
    'hexbinary': 'string',
    'anytype': 'string',
    'anyuri': 'string'
  }
  
  return typeMap[type] || 'string'
} 