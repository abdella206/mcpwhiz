import { GenerateServerCodeParams, ResourceData, ToolData, PromptData } from "./types"

// Extended interfaces for additional properties not in base types
interface CompletionConfig {
  type: string
  conditions?: Array<{
    when: Record<string, string>
    values: string[]
  }>
  values?: string[]
  default?: string[]
}

interface ExtendedResourceData extends Omit<ResourceData, 'uri'> {
  uri?: string
  static_content?: string
  completion_config?: {
    complete: Record<string, CompletionConfig>
  }
}

interface ExtendedPromptData extends PromptData {
  completion_config?: {
    complete: Record<string, CompletionConfig>
  }
}

export function generateServerCodePY({
  serverName,
  serverVersion,
  resources,
  tools,
  prompts,
  sessionManagement = false,
  isRemoteServer = true,
}: GenerateServerCodeParams): string {
  // Check if we have context-aware prompts to determine imports
  const hasContextAwarePrompts = prompts.some(prompt => prompt.prompt_type === "context_aware")
  const hasDynamicResources = resources.some(resource => resource.resource_type === "dynamic" || resource.resource_type === "context_aware")
  
  if (!isRemoteServer) {
    // Local server (stdio) mode - Use traditional MCP Server approach
    let code = `# ${serverName} MCP Server
# This server implements the Model Context Protocol (MCP)
# using StdioServerTransport for local communication.

import asyncio
from typing import Dict, Any, Optional${hasContextAwarePrompts ? `, List` : ''}${hasDynamicResources || tools.some(t => t.tool_type === 'api') ? `
import httpx` : ''}${resources.some(r => r.resource_type === 'static' && r.static_content) || tools.some(t => t.tool_type === 'static') ? `
import json` : ''}

from mcp.server import McpServer${hasContextAwarePrompts ? `
from mcp.server.completable import completable` : ''}${hasDynamicResources ? `
from mcp.server.resource import ResourceTemplate` : ''}
from mcp.server.stdio import StdioServerTransport

# Create MCP server
server = McpServer(
    name="${serverName}",
    version="${serverVersion}"
)

`

    // Add server setup for stdio mode using traditional approach
    code += generateTraditionalServerSetup(resources, tools, prompts, "")
    
    code += `

async def main():
    # Create stdio transport and connect
    transport = StdioServerTransport()
    await server.connect(transport)

if __name__ == "__main__":
    asyncio.run(main())
`

    return code
  }

  // Remote server (HTTP) mode - Use FastMCP approach
  let code = `# ${serverName} MCP Server
# This server implements the Model Context Protocol (MCP)
# using FastMCP with ${sessionManagement ? 'stateful session management' : 'stateless HTTP transport'}.

from typing import Dict, Any, Optional${hasContextAwarePrompts ? `, List` : ''}${hasDynamicResources || tools.some(t => t.tool_type === 'api') ? `
import httpx` : ''}${resources.some(r => r.resource_type === 'static' && r.static_content) || tools.some(t => t.tool_type === 'static') ? `
import json` : ''}

from mcp.server.fastmcp import FastMCP

# ${sessionManagement ? 'Stateful server (session persistence by default)' : 'Stateless server (no session persistence)'}
mcp = FastMCP("${serverName}"${sessionManagement ? '' : ', stateless_http=True'})

`

  // Add resources using FastMCP decorators
  if (resources.length > 0) {
    code += `# Set up resources
${resources.map(resource => {
  const resourceName = resource.name.toLowerCase().replace(/\s+/g, '_')
  const paramKeys = Object.keys(resource.parameters || {})
  
  // Convert camelCase to snake_case for resource parameters
  const pythonParams = paramKeys.map(key => {
    const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const paramType = resource.parameters?.[key]?.type === 'number' ? 'float' : 'str'
    return `${snakeCase}: ${paramType}`
  })
  const paramSignature = pythonParams.join(', ')
  
  // Generate snake_case parameter names for function body
  const snakeCaseParams = paramKeys.reduce((acc, key) => {
    acc[key] = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return acc
  }, {} as Record<string, string>)
  
  // Determine the resource URI - use the uri field if available, otherwise use name
  const resourceUri = (resource as ExtendedResourceData).uri || resource.name
  
  if (resource.resource_type === 'context_aware' && (resource as ExtendedResourceData).completion_config) {
    // Context-aware resource with completion logic
    const completionConfig = (resource as ExtendedResourceData).completion_config?.complete || {}
    
    let completionHelpers = ''
    
    // Generate completion helper functions and data structures
    Object.entries(completionConfig).forEach(([paramName, completion]: [string, CompletionConfig]) => {
      if (completion.type === "conditional" && completion.conditions) {
        const snakeParamName = paramName.replace(/([A-Z])/g, '_$1').toLowerCase()
        const dependentParam = Object.keys(completion.conditions[0].when)[0]
        const snakeDependentParam = dependentParam.replace(/([A-Z])/g, '_$1').toLowerCase()
        
        // Generate mapping dictionary
        const mappingEntries = completion.conditions.map((condition: {
          when: Record<string, string>
          values: string[]
        }) => {
          const whenValue = condition.when[dependentParam]
          const values = condition.values.map((v: string) => `"${v}"`).join(', ')
          return `    "${whenValue}": [${values}]`
        }).join(',\n')
        
        const defaultValues = completion.default ? 
          `[${completion.default.map((v: string) => `"${v}"`).join(', ')}]` : 
          '["default-repo", "sample-repo"]'
        
        completionHelpers += `
# ---- Context-aware completion helper (mirrors your completion_config) ----
_${snakeDependentParam.toUpperCase()}_TO_${snakeParamName.toUpperCase()}S = {
${mappingEntries}
}
_DEFAULT = ${defaultValues}

@mcp.tool()
def complete_${snakeParamName}(${snakeDependentParam}: str, value: str = "") -> list[str]:
    """
    Return ${snakeParamName} suggestions for a given ${snakeDependentParam}, filtered by an optional prefix \`value\`.
    This mirrors the TypeScript ResourceTemplate \`complete.${paramName}\` behavior.
    """
    candidates = _${snakeDependentParam.toUpperCase()}_TO_${snakeParamName.toUpperCase()}S.get(${snakeDependentParam}, _DEFAULT)
    if not value:
        return candidates
    prefix = value.strip()
    return [r for r in candidates if r.startswith(prefix)]`
      }
    })
    
    return `@mcp.resource("${resourceUri}")
def ${resourceName}(${paramSignature}) -> str:
    """${resource.description} (static demo)."""
    ${(resource as ExtendedResourceData).static_content ? 
      `return f"${(resource as ExtendedResourceData).static_content?.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)?.replace(/"/g, '\\"')}"` : 
      `return f"${resource.description}: {${paramKeys.map(key => `${snakeCaseParams[key]}`).join('}/{')}}"`
    }
${completionHelpers}`
    
  } else if (resource.resource_type === 'dynamic' && resource.parameters) {
    // Dynamic resource with parameters
    return `@mcp.resource("${resourceUri}")
async def ${resourceName}(${paramSignature}):
    """${resource.description}"""
    ${resource.api_url ? `async with httpx.AsyncClient() as client:
        response = await client.get(f"${resource.api_url.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)}")
        data = response.json()
        return f"${resource.name} for {${snakeCaseParams[paramKeys[0]] || 'param'}}: {json.dumps(data)}"` : 
      `return f"Dynamic content for ${resource.name} with parameters: {json.dumps({${paramKeys.map(key => `'${key}': ${snakeCaseParams[key]}`).join(', ')}})}"`
    }`
  } else {
    // Static resource (may have parameters)
    return `@mcp.resource("${resourceUri}")
def ${resourceName}(${paramSignature}) -> str:
    """${resource.description}"""
    ${resource.resource_type === 'static' && (resource as ExtendedResourceData).static_content 
      ? (() => {
          const content = (resource as ExtendedResourceData).static_content
          if (paramKeys.length > 0) {
            // Has parameters - use f-string with parameter substitution
            return `return f"${content?.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)?.replace(/"/g, '\\"')}"`
          } else {
            // No parameters - use single quotes to avoid escaping JSON double quotes
            return `return '${content?.replace(/'/g, "\\'")}'`
          }
        })()
      : paramKeys.length > 0
        ? `return f"Sample content for ${resource.name} with parameters: {${paramKeys.map(key => `${snakeCaseParams[key]}`).join(', ')}}"`
        : `return "Sample content for ${resource.name}"`
    }`
  }
}).join('\n\n')}

`}

  // Add tools using FastMCP decorators
  if (tools.length > 0) {
    code += `# Set up tools
${tools.map(tool => {
  const paramKeys = Object.keys(tool.parameters || {})
  
  // Convert camelCase to snake_case and add proper type hints
  const pythonParams = paramKeys.map(key => {
    const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const paramType = tool.parameters?.[key]?.type === 'number' ? 'float' : 'str'
    return `${snakeCase}: ${paramType}`
  })
  const paramSignature = pythonParams.join(', ')
  
  // Generate snake_case parameter names for function body
  const snakeCaseParams = paramKeys.reduce((acc, key) => {
    acc[key] = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return acc
  }, {} as Record<string, string>)
  
  // Determine if function should be async
  const isAsync = tool.tool_type === 'api'
  const asyncPrefix = isAsync ? 'async ' : ''
  
  // Determine return type annotation
  let returnType = ''
  if (tool.tool_type === 'static' && (tool.name.toLowerCase().includes('bmi') || tool.description.toLowerCase().includes('body mass'))) {
    returnType = ' -> float'
  } else if (tool.tool_type === 'resource_link') {
    returnType = ' -> dict'
  }
  
  return `@mcp.tool()
${asyncPrefix}def ${tool.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}(${paramSignature})${returnType}:
    """
    ${tool.description}${tool.tool_type === 'static' && (tool.name.toLowerCase().includes('bmi') || tool.description.toLowerCase().includes('body mass')) ? `
    BMI = weight_kg / (height_m * height_m)` : ''}
    """
    ${tool.tool_type === 'static' && tool.static_result
      ? (() => {
          // Generate actual calculation logic for static tools
          if (tool.name.toLowerCase().includes('bmi') || tool.description.toLowerCase().includes('body mass')) {
            const weightParam = snakeCaseParams[paramKeys.find(p => p.toLowerCase().includes('weight')) || 'weightKg'] || 'weight_kg'
            const heightParam = snakeCaseParams[paramKeys.find(p => p.toLowerCase().includes('height')) || 'heightM'] || 'height_m'
            return `return ${weightParam} / (${heightParam} * ${heightParam})`
          } else {
            // Default static result with parameter substitution - convert camelCase to snake_case in template
            let result = tool.static_result
            paramKeys.forEach(key => {
              const snakeCase = snakeCaseParams[key]
              result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), `{${snakeCase}}`)
            })
            return `return f"${result}"`
          }
        })()
      : tool.tool_type === 'api' && tool.api_url
        ? `async with httpx.AsyncClient() as client:
        ${tool.http_method && tool.http_method !== 'GET' ? 
          `response = await client.${tool.http_method.toLowerCase()}(
            f"${tool.api_url.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)}"${tool.headers ? `,
            headers=${JSON.stringify(tool.headers).replace(/"/g, "'")}` : ''}
        )` :
          `response = await client.get(
            f"${tool.api_url.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)}"${tool.headers ? `,
            headers=${JSON.stringify(tool.headers).replace(/"/g, "'")}` : ''}
        )`}
        
        return response.text`
        : tool.tool_type === 'resource_link' && tool.resource_links
          ? `header = f'${tool.resource_links_header ? tool.resource_links_header.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`) : `Found files matching "{${Object.keys(tool.parameters || {}).length > 0 ? snakeCaseParams[Object.keys(tool.parameters || {})[0]] : 'pattern'}}"`}:'
    links = [
${tool.resource_links.map((link: { uri: string; name: string; mimeType: string; description: string }) => `        {
            "type": "resource_link",
            "uri": "${link.uri}",
            "name": "${link.name}",
            "mimeType": "${link.mimeType}",
            "description": "${link.description}"
        }`).join(',\n')}
    ]
    # You can return any JSON-serializable structure; clients will handle
    # objects of type "resource_link" accordingly.
    return {
        "header": header,
        "links": links
    }`
          : `return f"Tool ${tool.name} executed with args: {json.dumps({${paramKeys.map(key => `'${key}': ${snakeCaseParams[key]}`).join(', ')}})}"`
    }`}).join('\n\n')}

`}

  // Add prompts using FastMCP decorators
  if (prompts.length > 0) {
    code += `# Set up prompts
${prompts.map(prompt => {
  const paramKeys = Object.keys(prompt.arguments || {})
  
  // Convert camelCase to snake_case for prompt parameters
  const pythonParams = paramKeys.map(key => {
    const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const paramType = prompt.arguments?.[key]?.type === 'number' ? 'float' : 'str'
    return `${snakeCase}: ${paramType}`
  })
  const paramSignature = pythonParams.join(', ')
  
  // Generate snake_case parameter names for template substitution
  const snakeCaseParams = paramKeys.reduce((acc, key) => {
    acc[key] = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return acc
  }, {} as Record<string, string>)
  
  // Convert template variables from camelCase to snake_case
  let template = prompt.template
  paramKeys.forEach(key => {
    const snakeCase = snakeCaseParams[key]
    template = template.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `{${snakeCase}}`)
  })
  
  let promptCode = `@mcp.prompt()
def ${prompt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}(${paramSignature}) -> str:
    return f"${template.replace(/\n/g, '\\n')}"`
  
  // Add completion helpers for context-aware prompts
  if (prompt.prompt_type === "context_aware" && (prompt as ExtendedPromptData).completion_config) {
    const completionConfig = (prompt as ExtendedPromptData).completion_config?.complete || {}
    
    promptCode += `\n\n# Helper tools for completion`
    
    Object.entries(completionConfig).forEach(([paramName, completion]: [string, CompletionConfig]) => {
      const snakeParamName = paramName.replace(/([A-Z])/g, '_$1').toLowerCase()
      
      if (completion.type === "static" && completion.values) {
        // Static completion
        const valuesArray = completion.values.map((v: string) => `"${v}"`).join(', ')
        promptCode += `
@mcp.tool()
def complete_${snakeParamName}() -> list[str]:
    return [${valuesArray}]`
      } else if (completion.type === "conditional" && completion.conditions) {
        // Conditional completion
        const dependentParam = Object.keys(completion.conditions[0].when)[0]
        const snakeDependentParam = dependentParam.replace(/([A-Z])/g, '_$1').toLowerCase()
        
        // Generate mapping dictionary
        const mappingEntries = completion.conditions.map((condition: {
          when: Record<string, string>
          values: string[]
        }) => {
          const whenValue = condition.when[dependentParam]
          const values = condition.values.map((v: string) => `"${v}"`).join(', ')
          return `        "${whenValue}": [${values}]`
        }).join(',\n')
        
        const defaultValues = completion.default ? 
          `[${completion.default.map((v: string) => `"${v}"`).join(', ')}]` : 
          '["Guest", "Visitor"]'
        
        promptCode += `
@mcp.tool()
def complete_${snakeParamName}(${snakeDependentParam}: str, value: str = "") -> list[str]:
    mapping = {
${mappingEntries}
    }
    suggestions = mapping.get(${snakeDependentParam}, ${defaultValues})
    return [s for s in suggestions if s.startswith(value)]`
      }
    })
  }
  
  return promptCode
}).join('\n\n')}

`}

  // Add FastMCP startup code with default settings
  code += `
if __name__ == "__main__":
    # Run with FastMCP's default settings
    # FastMCP will use default port 8000 and bind to 0.0.0.0 for external access
    mcp.run(transport="streamable-http")
`

  return code
}

// Helper function to generate server setup code for traditional Python (stdio)
function generateTraditionalServerSetup(resources: ExtendedResourceData[], tools: ToolData[], prompts: ExtendedPromptData[], indent: string): string {
  let setupCode = ''
  
  // Add resources if there are any
  if (resources.length > 0) {
    setupCode += `${indent}# Set up resources
${resources.map(resource => {
  const resourceName = resource.name.toLowerCase().replace(/\s+/g, '_')
  const paramKeys = Object.keys(resource.parameters || {})
  
  // Convert camelCase to snake_case for resource parameters
  const pythonParams = paramKeys.map(key => {
    const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const paramType = resource.parameters?.[key]?.type === 'number' ? 'float' : 'str'
    return `${snakeCase}: ${paramType}`
  })
  const paramSignature = paramKeys.length > 0 ? `, ${pythonParams.join(', ')}` : ''
  
  // Generate snake_case parameter names for function body
  const snakeCaseParams = paramKeys.reduce((acc, key) => {
    acc[key] = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return acc
  }, {} as Record<string, string>)
  
  if (resource.resource_type === 'context_aware' && (resource as ExtendedResourceData).completion_config) {
    // Context-aware resource with completion logic (traditional mode)
    const completionConfig = (resource as ExtendedResourceData).completion_config?.complete || {}
    
    let completionHelpers = ''
    
    // Generate completion helper functions and data structures
    Object.entries(completionConfig).forEach(([paramName, completion]: [string, CompletionConfig]) => {
      if (completion.type === "conditional" && completion.conditions) {
        const snakeParamName = paramName.replace(/([A-Z])/g, '_$1').toLowerCase()
        const dependentParam = Object.keys(completion.conditions[0].when)[0]
        const snakeDependentParam = dependentParam.replace(/([A-Z])/g, '_$1').toLowerCase()
        
        // Generate mapping dictionary
        const mappingEntries = completion.conditions.map((condition: {
          when: Record<string, string>
          values: string[]
        }) => {
          const whenValue = condition.when[dependentParam]
          const values = condition.values.map((v: string) => `"${v}"`).join(', ')
          return `${indent}    "${whenValue}": [${values}]`
        }).join(',\n')
        
        const defaultValues = completion.default ? 
          `[${completion.default.map((v: string) => `"${v}"`).join(', ')}]` : 
          '["default-repo", "sample-repo"]'
        
        completionHelpers += `
${indent}
${indent}# ---- Context-aware completion helper (mirrors your completion_config) ----
${indent}_${snakeDependentParam.toUpperCase()}_TO_${snakeParamName.toUpperCase()}S = {
${mappingEntries}
${indent}}
${indent}_DEFAULT = ${defaultValues}
${indent}
${indent}@server.register_tool("complete_${snakeParamName}")
${indent}def complete_${snakeParamName}(${snakeDependentParam}: str, value: str = "") -> dict:
${indent}    """
${indent}    Return ${snakeParamName} suggestions for a given ${snakeDependentParam}, filtered by an optional prefix \`value\`.
${indent}    This mirrors the TypeScript ResourceTemplate \`complete.${paramName}\` behavior.
${indent}    """
${indent}    candidates = _${snakeDependentParam.toUpperCase()}_TO_${snakeParamName.toUpperCase()}S.get(${snakeDependentParam}, _DEFAULT)
${indent}    if not value:
${indent}        filtered = candidates
${indent}    else:
${indent}        prefix = value.strip()
${indent}        filtered = [r for r in candidates if r.startswith(prefix)]
${indent}    
${indent}    return {
${indent}        "content": [{
${indent}            "type": "text",
${indent}            "text": json.dumps(filtered)
${indent}        }]
${indent}    }`
      }
    })
    
    return `${indent}@server.register_resource("${resourceName}")
${indent}def ${resourceName}(uri: str${paramSignature}):
${indent}    """${resource.description} (static demo)."""
${indent}    ${(resource as ExtendedResourceData).static_content ? 
      `content = f"${(resource as ExtendedResourceData).static_content?.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)?.replace(/"/g, '\\"')}"` : 
      `content = f"${resource.description}: {${paramKeys.map(key => `${snakeCaseParams[key]}`).join('}/{')}}"`
    }
${indent}    return {
${indent}        "contents": [{
${indent}            "uri": uri,
${indent}            "text": content
${indent}        }]
${indent}    }${completionHelpers}`
    
  } else if (resource.resource_type === 'dynamic' && resource.parameters) {
    // Dynamic resource with parameters
    return `${indent}@server.register_resource("${resourceName}")
${indent}async def get_${resourceName}(uri: str${paramSignature}):
${indent}    """${resource.description}"""
${indent}    ${resource.api_url ? `async with httpx.AsyncClient() as client:
${indent}        response = await client.get(f"${resource.api_url.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)}")
${indent}        data = response.json()
${indent}        
${indent}        return {
${indent}            "contents": [{
${indent}                "uri": uri,
${indent}                "text": f"${resource.name} for {${snakeCaseParams[paramKeys[0]] || 'param'}}: {json.dumps(data)}"
${indent}            }]
${indent}        }` : `return {
${indent}        "contents": [{
${indent}            "uri": uri,
${indent}            "text": f"Dynamic content for ${resource.name} with parameters: {json.dumps({${paramKeys.map(key => `"${key}": ${snakeCaseParams[key]}`).join(', ')}}}"
${indent}        }]
${indent}    }`}`
  } else {
    // Static resource
    return `${indent}@server.register_resource("${resourceName}")
${indent}def ${resourceName}(uri: str${paramSignature}):
${indent}    """${resource.description}"""
${indent}    ${(resource as ExtendedResourceData).static_content ? 
      (() => {
        const content = (resource as ExtendedResourceData).static_content
        if (paramKeys.length > 0) {
          // Has parameters - use f-string with parameter substitution
          return `content = f"${content?.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)?.replace(/"/g, '\\"')}"`
        } else {
          // No parameters - use single quotes to avoid escaping JSON double quotes
          return `content = '${content?.replace(/'/g, "\\'")}'`
        }
      })() : 
      `content = "Sample content for ${resource.name}"`
    }
${indent}    return {
${indent}        "contents": [{
${indent}            "uri": uri,
${indent}            "text": content
${indent}        }]
${indent}    }`
  }
}).join('\n\n')}

`}

  // Add tools if there are any
  if (tools.length > 0) {
    setupCode += `${indent}# Set up tools
${tools.map(tool => {
      const paramKeys = Object.keys(tool.parameters || {})
      
      // Convert camelCase to snake_case and add proper type hints for traditional mode too
      const pythonParams = paramKeys.map(key => {
        const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        const paramType = tool.parameters?.[key]?.type === 'number' ? 'float' : 'str'
        return `${snakeCase}: ${paramType}`
      })
      const paramSignature = pythonParams.join(', ')
      
      // Generate snake_case parameter names for function body
      const snakeCaseParams = paramKeys.reduce((acc, key) => {
        acc[key] = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        return acc
      }, {} as Record<string, string>)
      
      // Determine if function should be async in traditional mode
      const isAsyncTraditional = tool.tool_type === 'api'
      const asyncPrefixTraditional = isAsyncTraditional ? 'async ' : ''
      
      return `${indent}@server.register_tool("${tool.name}")
${indent}${asyncPrefixTraditional}def ${tool.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}(${paramSignature}):
${indent}    """
${indent}    ${tool.description}
${indent}    
${indent}    Args:${paramKeys.map(key => `
${indent}        ${snakeCaseParams[key]}: ${tool.parameters?.[key]?.description || 'Parameter'}`).join('')}
${indent}    
${indent}    Returns:
${indent}        Tool execution result
${indent}    """
${indent}    ${tool.tool_type === 'static' && tool.static_result
      ? (() => {
          // Generate actual calculation logic for static tools
          if (tool.name.toLowerCase().includes('bmi') || tool.description.toLowerCase().includes('body mass')) {
            const weightParam = snakeCaseParams[paramKeys.find(p => p.toLowerCase().includes('weight')) || 'weightKg'] || 'weight_kg'
            const heightParam = snakeCaseParams[paramKeys.find(p => p.toLowerCase().includes('height')) || 'heightM'] || 'height_m'
            return `result = ${weightParam} / (${heightParam} * ${heightParam})
${indent}    return {
${indent}        "content": [{
${indent}            "type": "text",
${indent}            "text": str(result)
${indent}        }]
${indent}    }`
          } else {
            // Default static result with parameter substitution - convert camelCase to snake_case
            let result = tool.static_result
            paramKeys.forEach(key => {
              const snakeCase = snakeCaseParams[key]
              result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), `{${snakeCase}}`)
            })
            return `return {
${indent}        "content": [{
${indent}            "type": "text", 
${indent}            "text": f"${result}"
${indent}        }]
${indent}    }`
          }
        })()
      : tool.tool_type === 'api' && tool.api_url
        ? `async with httpx.AsyncClient() as client:
${indent}        ${tool.http_method && tool.http_method !== 'GET' ? 
          `response = await client.${tool.http_method.toLowerCase()}(
${indent}            f"${tool.api_url.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)}"${tool.headers ? `,
${indent}            headers=${JSON.stringify(tool.headers).replace(/"/g, "'")}` : ''}
${indent}        )` :
          `response = await client.get(
${indent}            f"${tool.api_url.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`)}"${tool.headers ? `,
${indent}            headers=${JSON.stringify(tool.headers).replace(/"/g, "'")}` : ''}
${indent}        )`}
${indent}        
${indent}        data = response.text
${indent}        return {
${indent}            "content": [{"type": "text", "text": data}]
${indent}        }`
        : tool.tool_type === 'resource_link' && tool.resource_links
          ? `header = f'${tool.resource_links_header ? tool.resource_links_header.replace(/\{(\w+)\}/g, (match: string, key: string) => `{${snakeCaseParams[key] || key}}`) : `Found files matching "{${Object.keys(tool.parameters || {}).length > 0 ? snakeCaseParams[Object.keys(tool.parameters || {})[0]] : 'pattern'}}"`}:'
${indent}    
${indent}    return {
${indent}        "content": [
${indent}            {"type": "text", "text": header},
${indent}            # ResourceLinks let tools return references without file content
${tool.resource_links.map((link: { uri: string; name: string; mimeType: string; description: string }) => `${indent}            {
${indent}                "type": "resource_link",
${indent}                "uri": "${link.uri}",
${indent}                "name": "${link.name}",
${indent}                "mimeType": "${link.mimeType}",
${indent}                "description": "${link.description}"
${indent}            }`).join(',\n')}
${indent}        ]
${indent}    }`
          : `return {
${indent}        "content": [{
${indent}            "type": "text",
${indent}            "text": f"Tool ${tool.name} executed with args: {json.dumps({${paramKeys.map(key => `'${key}': ${snakeCaseParams[key]}`).join(', ')}})}",
${indent}        }]
${indent}    }`
    }
${indent}}`}).join('\n\n')}

`}

  // Add prompts if there are any
  if (prompts.length > 0) {
    setupCode += `${indent}# Set up prompts
${prompts.map(prompt => {
  const paramKeys = Object.keys(prompt.arguments || {})
  
  // Convert camelCase to snake_case for prompt parameters
  const pythonParams = paramKeys.map(key => {
    const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const paramType = prompt.arguments?.[key]?.type === 'number' ? 'float' : 'str'
    return `${snakeCase}: ${paramType}`
  })
  const paramSignature = pythonParams.join(', ')
  
  // Generate snake_case parameter names for template substitution
  const snakeCaseParams = paramKeys.reduce((acc, key) => {
    acc[key] = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return acc
  }, {} as Record<string, string>)
  
  // Convert template variables from camelCase to snake_case
  let template = prompt.template
  paramKeys.forEach(key => {
    const snakeCase = snakeCaseParams[key]
    template = template.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `{${snakeCase}}`)
  })
  
  let promptCode = `${indent}@server.register_prompt("${prompt.name}")
${indent}def ${prompt.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}(${paramSignature}):
${indent}    """${prompt.description}"""
${indent}    return {
${indent}        "messages": [
${indent}            {
${indent}                "role": "${prompt.role}",
${indent}                "content": {
${indent}                    "type": "text",
${indent}                    "text": f"""${template.replace(/\n/g, '\\n')}"""
${indent}                }
${indent}            }
${indent}        ]
${indent}    }`
  
  // Add completion helpers for context-aware prompts
  if (prompt.prompt_type === "context_aware" && (prompt as ExtendedPromptData).completion_config) {
    const completionConfig = (prompt as ExtendedPromptData).completion_config?.complete || {}
    
    promptCode += `\n${indent}\n${indent}# Helper tools for completion`
    
    Object.entries(completionConfig).forEach(([paramName, completion]: [string, CompletionConfig]) => {
      const snakeParamName = paramName.replace(/([A-Z])/g, '_$1').toLowerCase()
      
      if (completion.type === "static" && completion.values) {
        // Static completion
        const valuesArray = completion.values.map((v: string) => `"${v}"`).join(', ')
        promptCode += `
${indent}@server.register_tool("complete_${snakeParamName}")
${indent}def complete_${snakeParamName}() -> dict:
${indent}    return {
${indent}        "content": [{
${indent}            "type": "text",
${indent}            "text": json.dumps([${valuesArray}])
${indent}        }]
${indent}    }`
      } else if (completion.type === "conditional" && completion.conditions) {
        // Conditional completion
        const dependentParam = Object.keys(completion.conditions[0].when)[0]
        const snakeDependentParam = dependentParam.replace(/([A-Z])/g, '_$1').toLowerCase()
        
        // Generate mapping dictionary
        const mappingEntries = completion.conditions.map((condition: {
          when: Record<string, string>
          values: string[]
        }) => {
          const whenValue = condition.when[dependentParam]
          const values = condition.values.map((v: string) => `"${v}"`).join(', ')
          return `${indent}        "${whenValue}": [${values}]`
        }).join(',\n')
        
        const defaultValues = completion.default ? 
          `[${completion.default.map((v: string) => `"${v}"`).join(', ')}]` : 
          '["Guest", "Visitor"]'
        
        promptCode += `
${indent}@server.register_tool("complete_${snakeParamName}")
${indent}def complete_${snakeParamName}(${snakeDependentParam}: str, value: str = "") -> dict:
${indent}    mapping = {
${mappingEntries}
${indent}    }
${indent}    suggestions = mapping.get(${snakeDependentParam}, ${defaultValues})
${indent}    filtered = [s for s in suggestions if s.startswith(value)]
${indent}    return {
${indent}        "content": [{
${indent}            "type": "text",
${indent}            "text": json.dumps(filtered)
${indent}        }]
${indent}    }`
      }
    })
  }
  
  return promptCode
}).join('\n\n')}

`}
  
  return setupCode
}