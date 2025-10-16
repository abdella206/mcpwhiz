import { NextRequest, NextResponse } from 'next/server'

// Minimal shape to validate OpenAPI/Swagger specs without over-typing
interface OpenAPISpecMinimal {
  swagger?: string
  openapi?: string
  paths?: Record<string, unknown>
}

function isOpenAPISpec(value: unknown): value is OpenAPISpecMinimal {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    (typeof v.swagger === 'string' || typeof v.openapi === 'string') &&
    typeof v.paths === 'object'
  )
}

// Helper function to normalize URL - adds https:// if missing
function normalizeUrl(url: string): string {
  const trimmedUrl = url.trim()
  // Check if URL already has a protocol
  if (trimmedUrl.match(/^https?:\/\//i)) {
    return trimmedUrl
  }
  // Add https:// by default
  return `https://${trimmedUrl}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { url } = body
    const { authHeader } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Normalize URL to ensure it has a protocol
    url = normalizeUrl(url)

    // Helper function to try fetching from multiple common Swagger/OpenAPI endpoints
    const tryMultipleEndpoints = async (
      baseUrl: string
    ): Promise<{ spec: OpenAPISpecMinimal; fetchUrl: string; baseUrl: string } | NextResponse> => {
      // Remove trailing slash for consistency
      baseUrl = baseUrl.replace(/\/$/, '')
      
      // Special handling for known APIs with different patterns
      const specialCases: Record<string, string[]> = {
        'dragonball-api.com': [
          '/swagger.json',
          '/api-docs.json',
          '/api-docs',
          '/swagger-ui.json',
          '/docs.json'
        ]
      }
      
      // Get domain from URL for special case handling
      const domain = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
      
      // Start with special case patterns if available
      let endpointPatterns: string[] = []
      if (specialCases[domain]) {
        endpointPatterns = [...specialCases[domain]]
      }
      
      // Add common OpenAPI/Swagger endpoint patterns
      endpointPatterns.push(
        '/swagger.json',
        '/openapi.json',
        '/docs/swagger.json',
        '/docs/openapi.json',
        '/api-docs/swagger.json',
        '/api-docs/openapi.json',
        '/swagger/v1/swagger.json',
        '/swagger/v2/swagger.json',
        '/swagger/v3/swagger.json',
        '/v1/swagger.json',
        '/v2/swagger.json',
        '/v3/swagger.json',
        '/api/swagger.json',
        '/api/openapi.json',
        '/swagger.yaml',
        '/openapi.yaml',
        '/docs/swagger.yaml',
        '/docs/openapi.yaml',
        // Additional common patterns
        '/api/docs/swagger.json',
        '/swagger-json',
        '/spec.json',
        '/openapi-spec.json'
      )

      // If the URL already contains a specific endpoint, try it first
      if (url.includes('.json') || url.includes('.yaml')) {
        endpointPatterns.unshift('')
      }
      
      // Special handling for Swagger UI documentation pages
      if (url.includes('api-docs') || url.includes('swagger-ui') || url.includes('/docs')) {
        // Try to extract JSON endpoint from Swagger UI page
        try {
          console.log(`[Swagger Import] Attempting to extract spec URL from Swagger UI page: ${url}`)
          const htmlResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'User-Agent': 'MCP-Deploy-Bot/1.0 (+https://mcpwhiz.com)',
            },
            signal: AbortSignal.timeout(10000),
          })
          
          if (htmlResponse.ok) {
            const htmlText = await htmlResponse.text()
            
            // Look for swagger-ui-init.js which might contain embedded spec
            if (htmlText.includes('swagger-ui-init.js')) {
              const initJsMatch = htmlText.match(/src=["']([^"']*swagger-ui-init\.js)["']/);
              if (initJsMatch) {
                let initJsUrl = initJsMatch[1];
                if (initJsUrl.startsWith('./')) {
                  initJsUrl = url + '/' + initJsUrl.slice(2);
                } else if (initJsUrl.startsWith('/')) {
                  const baseHost = url.split('/').slice(0, 3).join('/');
                  initJsUrl = baseHost + initJsUrl;
                }
                
                console.log(`[Swagger Import] Found swagger-ui-init.js at: ${initJsUrl}`);
                
                try {
                  const jsResponse = await fetch(initJsUrl, {
                    method: 'GET',
                    headers: {
                      'Accept': 'application/javascript, text/javascript, */*',
                      'User-Agent': 'MCP-Deploy-Bot/1.0 (+https://mcpwhiz.com)',
                    },
                    signal: AbortSignal.timeout(10000),
                  });
                  
                  if (jsResponse.ok) {
                    const jsText = await jsResponse.text();
                    
                    // Look for embedded swaggerDoc in the JavaScript
                    const swaggerDocMatch = jsText.match(/"swaggerDoc"\s*:\s*(\{[\s\S]*?\}),?\s*"customOptions"/);
                    if (swaggerDocMatch) {
                      try {
                        const specText = swaggerDocMatch[1];
                        const spec = JSON.parse(specText);
                        if (isOpenAPISpec(spec)) {
                          console.log(`[Swagger Import] Found embedded spec in JavaScript`);
                          return {
                            spec: spec,
                            fetchUrl: initJsUrl,
                            baseUrl: baseUrl
                          };
                        }
                      } catch (e) {
                        console.log(`[Swagger Import] Failed to parse embedded spec: ${e}`);
                      }
                    }
                  }
                } catch (error) {
                  console.log(`[Swagger Import] Failed to fetch swagger-ui-init.js: ${String(error)}`);
                }
              }
            }
            
            // Look for common Swagger UI patterns that contain the spec URL
            const specUrlPatterns = [
              /"url"\s*:\s*"([^"]+)"/,
              /'url'\s*:\s*'([^']+)'/,
              /url:\s*["']([^"']+)["']/,
              /spec-url["']\s*:\s*["']([^"']+)["']/,
              /swagger\.json/,
              /openapi\.json/
            ]
            
            for (const pattern of specUrlPatterns) {
              const match = htmlText.match(pattern)
              if (match && match[1]) {
                const specUrl = match[1]
                // If it's a relative URL, make it absolute
                if (specUrl.startsWith('/')) {
                  const baseHost = url.split('/').slice(0, 3).join('/')
                  endpointPatterns.unshift(specUrl.replace(baseHost, ''))
                } else if (specUrl.startsWith('http')) {
                  // Try the absolute URL
                  try {
                    const absoluteUrl = new URL(specUrl)
                    if (absoluteUrl.hostname === domain) {
                      endpointPatterns.unshift(absoluteUrl.pathname)
                    }
                  } catch {
                    // Invalid URL, skip
                  }
                }
              }
            }
          }
        } catch (error) {
          console.log(`[Swagger Import] Failed to parse Swagger UI page: ${String(error)}`)
          // Continue with normal patterns
        }
      }

      let lastError: Error | null = null
      
      const headers: HeadersInit = {
        'Accept': 'application/json, application/yaml, text/yaml, text/plain, */*',
        'User-Agent': 'MCP-Deploy-Bot/1.0 (+https://mcpwhiz.com)',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
      
      if (authHeader) {
        headers['Authorization'] = authHeader
      }

      // Try each endpoint pattern
      for (const pattern of endpointPatterns) {
        const fetchUrl = baseUrl + pattern
        
        try {
          console.log(`[Swagger Import] Trying to fetch: ${fetchUrl}`)
          
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers,
            // Add timeout and improved options for better CORS handling
            signal: AbortSignal.timeout(10000), // 10 second timeout
            redirect: 'follow',
            mode: 'cors' // Explicitly handle CORS
          })
          
          if (response.ok) {
            const contentType = response.headers.get('content-type') || ''
            let data: unknown
            
            if (contentType.includes('yaml') || fetchUrl.includes('.yaml')) {
              // Handle YAML response
              const yamlText = await response.text()
              try {
                // Try to parse as JSON first (sometimes YAML endpoints return JSON)
                data = JSON.parse(yamlText)
              } catch {
                return NextResponse.json(
                  { error: 'YAML format is not yet supported. Please use a JSON endpoint.' },
                  { status: 400 }
                )
              }
            } else {
              data = await response.json()
            }
            
            // Validate that this looks like an OpenAPI spec
            if (isOpenAPISpec(data)) {
              console.log(`[Swagger Import] Successfully fetched spec from: ${fetchUrl}`)
              return {
                spec: data,
                fetchUrl: fetchUrl,
                baseUrl: extractBaseUrlFromSwaggerUrl(fetchUrl)
              }
            } else {
              console.log(`[Swagger Import] Invalid spec format from: ${fetchUrl}`)
              continue
            }
          } else {
            console.log(`[Swagger Import] Failed to fetch ${fetchUrl}: ${response.status}`)
            lastError = new Error(`HTTP ${response.status} from ${fetchUrl}`)
          }
        } catch (error) {
          console.log(`[Swagger Import] Fetch failed for ${fetchUrl}:`, error)
          lastError = error instanceof Error ? error : new Error(String(error))
        }
      }

      // If all attempts failed, throw the last error
      if (lastError) {
        throw lastError
      } else {
        throw new Error('No valid OpenAPI/Swagger specification found at any common endpoints')
      }
    }

    // Helper function to extract base URL from Swagger/OpenAPI documentation URL
    const extractBaseUrlFromSwaggerUrl = (url: string): string => {
      // Remove trailing slash
      url = url.replace(/\/$/, '')
      
      // List of common documentation paths to remove
      const docPaths = [
        '/docs/openapi.json',
        '/docs/swagger.json', 
        '/docs/openapi.yaml',
        '/docs/swagger.yaml',
        '/api-docs/swagger.json',
        '/api-docs/openapi.json',
        '/swagger.json',
        '/openapi.json',
        '/swagger.yaml',
        '/openapi.yaml',
        '/swagger/v1/swagger.json',
        '/swagger/v2/swagger.json',
        '/swagger/v3/swagger.json',
        '/v1/swagger.json',
        '/v2/swagger.json',
        '/v3/swagger.json',
        '/api/swagger.json',
        '/api/openapi.json'
      ]
      
      // Check if URL ends with any of the documentation paths
      for (const docPath of docPaths) {
        if (url.endsWith(docPath)) {
          return url.slice(0, -docPath.length)
        }
      }
      
      // If no known documentation path found, return the URL as-is
      return url
    }

    // Fetch the spec
    const result = await tryMultipleEndpoints(url)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Swagger Import] Error:', error)
    
    // Return more detailed error information
    if (error instanceof Error) {
      // Better CORS error detection
      if (error.message.includes('CORS') || 
          error.message.includes('cross-origin') ||
          error.message.includes('Access-Control-Allow-Origin') ||
          error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          { 
            error: 'Network Error: Unable to access the API documentation. This might be due to CORS restrictions or the API being temporarily unavailable.',
            details: `The server at the provided URL may not allow direct access from our service. Error: ${error.message}`,
            suggestion: 'Try using a different Swagger/OpenAPI endpoint URL, or contact the API provider about CORS configuration.'
          },
          { status: 500 }
        )
      } else if (error.message.includes('HTTP 40')) {
        return NextResponse.json(
          { 
            error: 'Authentication or authorization error. Please check if the URL requires authentication.',
            details: error.message 
          },
          { status: 401 }
        )
      } else if (error.message.includes('HTTP 50')) {
        return NextResponse.json(
          { 
            error: 'Server error when fetching the Swagger/OpenAPI specification.',
            details: error.message 
          },
          { status: 502 }
        )
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout: The API took too long to respond.',
            details: 'The server did not respond within 10 seconds. Please try again or check if the URL is correct.',
            suggestion: 'Verify the URL is accessible and try again.'
          },
          { status: 408 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch Swagger/OpenAPI specification',
        details: 'Please verify the URL is correct and accessible.'
      },
      { status: 500 }
    )
  }
}
