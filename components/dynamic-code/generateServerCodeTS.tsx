import { GenerateServerCodeParams, ResourceData, ToolData, PromptData, ParameterDefinition, ArgumentDefinition } from "./types"

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

export function generateServerCodeTS({
  serverName,
  serverVersion,
  resources,
  tools,
  prompts,
  sessionManagement = false,
  isRemoteServer = true,
  transportType,
}: GenerateServerCodeParams): string {
  // Check if we have context-aware prompts to determine imports
  const hasContextAwarePrompts = prompts.some(prompt => prompt.prompt_type === "context_aware")
  const hasDynamicResources = resources.some(resource => resource.resource_type === "dynamic" || resource.resource_type === "context_aware")

  // Determine effective transport type
  const effectiveTransport = transportType || (isRemoteServer ? 'streamable' : 'stdio')

  if (effectiveTransport === 'stdio') {
    // Local server (stdio) mode
    let code = `// ${serverName} MCP Server
// This server implements the Model Context Protocol (MCP)
// using StdioServerTransport for local communication.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";${hasContextAwarePrompts ? `
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";` : ''}${hasDynamicResources ? `
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/resource.js";` : ''}
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create MCP server
const server = new McpServer({
  name: "${serverName}",
  version: "${serverVersion}"
});

`

    // Add server setup for stdio mode
    code += generateServerSetup(resources, tools, prompts, "")

    code += `
// Create stdio transport and connect
const transport = new StdioServerTransport();
await server.connect(transport);
`

    return code
  }

  // SSE transport mode
  if (effectiveTransport === 'sse') {
    let code = `// ${serverName} MCP Server
// This server implements the Model Context Protocol (MCP)
// using SSEServerTransport for Server-Sent Events communication.

import { createServer } from "node:http";
import { URL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,${prompts.length > 0 ? `
  ListPromptsRequestSchema,
  GetPromptRequestSchema,` : ''}
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

`

    // Generate resource, tool, and prompt definitions
    if (resources.length > 0) {
      code += `// Resource definitions
const resources = [
${resources.map(r => `  {
    uri: "${r.uri}",
    name: "${r.name}",
    description: "${r.description}",
    mimeType: "${r.mime_type || 'text/plain'}"
  }`).join(',\n')}
];

`
    }

    if (tools.length > 0) {
      code += `// Tool definitions
const tools = [
${tools.map(t => `  {
    name: "${t.name}",
    description: "${t.description}",
    inputSchema: {
      type: "object",
      properties: {${Object.entries(t.parameters || {}).map(([key, param]) => `
        ${key}: {
          type: "${param.type}",
          description: "${param.description}"
        }`).join(',')}
      },
      required: [${Object.entries(t.parameters || {}).filter(([, p]) => p.required).map(([k]) => `"${k}"`).join(', ')}]
    }
  }`).join(',\n')}
];

`
    }

    if (prompts.length > 0) {
      code += `// Prompt definitions
const prompts = [
${prompts.map(p => `  {
    name: "${p.name}",
    description: "${p.description}",
    arguments: [${Object.entries(p.arguments || {}).map(([key, arg]) => `
      {
        name: "${key}",
        description: "${arg.description}",
        required: ${arg.required}
      }`).join(',')}
    ]
  }`).join(',\n')}
];

`
    }

    // Generate the server creation function
    code += `function createMCPServer() {
  const server = new Server(
    {
      name: "${serverName}",
      version: "${serverVersion}"
    },
    {
      capabilities: {${resources.length > 0 ? `
        resources: {},` : ''}${tools.length > 0 ? `
        tools: {},` : ''}${prompts.length > 0 ? `
        prompts: {}` : ''}
      }
    }
  );

`

    // Add request handlers
    if (resources.length > 0) {
      code += `  server.setRequestHandler(ListResourcesRequestSchema, async (_request) => ({
    resources
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = resources.find(r => r.uri === request.params.uri);
    if (!resource) {
      throw new Error(\`Unknown resource: \${request.params.uri}\`);
    }
    return {
      contents: [{
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: \`Content for \${resource.name}\`
      }]
    };
  });

`
    }

    if (tools.length > 0) {
      code += `  server.setRequestHandler(ListToolsRequestSchema, async (_request) => ({
    tools
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find(t => t.name === request.params.name);
    if (!tool) {
      throw new Error(\`Unknown tool: \${request.params.name}\`);
    }
    // Tool implementation placeholder
    return {
      content: [{
        type: "text",
        text: \`Tool \${request.params.name} executed with args: \${JSON.stringify(request.params.arguments)}\`
      }]
    };
  });

`
    }

    if (prompts.length > 0) {
      code += `  server.setRequestHandler(ListPromptsRequestSchema, async (_request) => ({
    prompts
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = prompts.find(p => p.name === request.params.name);
    if (!prompt) {
      throw new Error(\`Unknown prompt: \${request.params.name}\`);
    }
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: \`Prompt \${prompt.name} with args: \${JSON.stringify(request.params.arguments)}\`
        }
      }]
    };
  });

`
    }

    code += `  return server;
}

// Session record: { server, transport }
const sessions = new Map();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createMCPServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(req, res, url) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

const port = Number(process.env.PORT ?? 8000);

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, \`http://\${req.headers.host ?? "localhost"}\`);

  // Handle CORS preflight
  if (req.method === "OPTIONS" && (url.pathname === ssePath || url.pathname === postPath)) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type"
    });
    res.end();
    return;
  }

  // SSE connection endpoint
  if (req.method === "GET" && url.pathname === ssePath) {
    await handleSseRequest(res);
    return;
  }

  // Message posting endpoint
  if (req.method === "POST" && url.pathname === postPath) {
    await handlePostMessage(req, res, url);
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.on("clientError", (err, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\\r\\n\\r\\n");
});

httpServer.listen(port, () => {
  console.log(\`${serverName} MCP server (SSE) listening on http://localhost:\${port}\`);
  console.log(\`  SSE stream: GET http://localhost:\${port}\${ssePath}\`);
  console.log(\`  Message endpoint: POST http://localhost:\${port}\${postPath}?sessionId=...\`);
});
`

    return code
  }

  // Remote server (Streamable HTTP) mode
  let code = `// ${serverName} MCP Server
// This Express.js server implements the Model Context Protocol (MCP)
// using StreamableHTTPServerTransport${sessionManagement ? ' with session management' : ' in stateless mode'}.

import express from "express";${sessionManagement ? `
import { randomUUID } from "node:crypto";` : ''}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";${hasContextAwarePrompts ? `
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";` : ''}${hasDynamicResources ? `
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/resource.js";` : ''}
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";${sessionManagement ? `
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";` : ''}

// Create Express app
const app = express();
app.use(express.json());

`
  if (sessionManagement) {
    // Session management mode
    code += `// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    
    const server = new McpServer({
      name: "${serverName}",
      version: "${serverVersion}"
    });

`

    // Add comment and server setup for session management mode
    if (resources.length > 0 || tools.length > 0 || prompts.length > 0) {
      code += `    // ... set up server resources, tools, and prompts ...
`
    }
    code += generateServerSetup(resources, tools, prompts, "    ")

    code += `
    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`MCP Server listening on port \${PORT}\`);
});`

  } else {
    // Stateless mode
    code += `// Function to create a new server instance

  const server = new McpServer({
    name: "${serverName}",
    version: "${serverVersion}"
  });

`

    // Add server setup for stateless mode
    code += generateServerSetup(resources, tools, prompts, "  ")

    code += `  

app.post('/mcp', async (req: express.Request, res: express.Response) => {
  // In stateless mode, create a new instance of transport and server for each request
  // to ensure complete isolation. A single instance would cause request ID collisions
  // when multiple clients connect concurrently.
  try { 
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// SSE notifications not supported in stateless mode
app.get('/mcp', async (req: express.Request, res: express.Response) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Session termination not needed in stateless mode
app.delete('/mcp', async (req: express.Request, res: express.Response) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

const PORT = process.env.PORT || 8000;
const setupServer = async () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`MCP Stateless Streamable HTTP Server listening on port \${PORT}\`);
  });
};

setupServer().catch((error: Error) => {
  console.error('Failed to set up the server:', error);
  process.exit(1);
});`
  }

  return code
}

// Helper function to generate server setup code
function generateServerSetup(resources: ExtendedResourceData[], tools: ToolData[], prompts: ExtendedPromptData[], indent: string): string {
  let setupCode = ''

  // Add resources if there are any
  if (resources.length > 0) {
    setupCode += `${indent}// Set up resources
${resources.map(resource => {
      const resourceName = resource.name.toLowerCase().replace(/\s+/g, '-')

      if (resource.resource_type === 'context_aware' && (resource as ExtendedResourceData).completion_config) {
        // Context-aware resource with ResourceTemplate and completion logic
        const paramKeys = Object.keys(resource.parameters || {})
        const paramDestructuring = paramKeys.length > 0 ? `{ ${paramKeys.join(', ')} }` : '{}'
        const completionConfig = (resource as ExtendedResourceData).completion_config?.complete || {}

        // Generate completion functions
        const completionEntries = Object.entries(completionConfig).map(([key, completion]: [string, CompletionConfig]) => {
          if (completion.type === "conditional" && completion.conditions) {
            const conditionsCode = completion.conditions.map((condition: {
              when: Record<string, string>
              values: string[]
            }, index: number) => {
              const whenConditions = Object.entries(condition.when).map(([whenKey, whenValue]) =>
                `context?.arguments?.["${whenKey}"] === "${whenValue}"`
              ).join(' && ')

              const valuesArray = condition.values.map((v: string) => `"${v}"`).join(', ')
              const prefix = index === 0 ? 'if' : 'else if'
              return `${prefix} (${whenConditions}) {
          return [${valuesArray}].filter(r => r.startsWith(value));
        }`
            }).join(' ')

            const defaultValues = completion.default ?
              `[${completion.default.map((v: string) => `"${v}"`).join(', ')}]` :
              '["default-repo"]'

            return `      ${key}: (value, context) => {
        ${conditionsCode}
        return ${defaultValues}.filter(r => r.startsWith(value));
      }`
          }
          return `      ${key}: (value) => [].filter(r => r.startsWith(value))`
        }).join(',\n')

        return `${indent}server.registerResource(
${indent}  "${resourceName}",
${indent}  new ResourceTemplate("${resource.uri}", {
${indent}    list: undefined,
${indent}    complete: {
${indent}      // Provide intelligent completions based on previously resolved parameters
${completionEntries}
${indent}    }
${indent}  }),
${indent}  {
${indent}    title: "${resource.title || resource.name}",
${indent}    description: "${resource.description}"
${indent}  },
${indent}  async (uri, ${paramDestructuring}) => ({
${indent}    contents: [{
${indent}      uri: uri.href,
${indent}      text: \`${(resource as ExtendedResourceData).static_content ? (resource as ExtendedResourceData).static_content?.replace(/\{(\w+)\}/g, '${$1}') : `Content for ${resource.name}`}\`
${indent}    }]
${indent}  })
${indent});`
      } else if (resource.resource_type === 'dynamic' && resource.parameters) {
        // Dynamic resource with ResourceTemplate
        const paramKeys = Object.keys(resource.parameters || {})
        const paramDestructuring = paramKeys.length > 0 ? `{ ${paramKeys.join(', ')} }` : '{}'

        return `${indent}server.registerResource(
${indent}  "${resourceName}",
${indent}  new ResourceTemplate("${resource.uri}", { list: undefined }),
${indent}  {
${indent}    title: "${resource.title || resource.name}",
${indent}    description: "${resource.description}"
${indent}  },
${indent}  async (uri, ${paramDestructuring}) => {
${indent}    ${resource.api_url ? `const response = await fetch(
${indent}      \`${resource.api_url.replace(/\{(\w+)\}/g, '${$1}')}\`,
${indent}      { method: "GET" }  // enforce GET
${indent}    );

${indent}    if (!response.ok) {
${indent}      throw new Error(\`Failed to fetch data: \${response.status}\`);
${indent}    }

${indent}    const data = await response.json();

${indent}    return {
${indent}      contents: [{
${indent}        uri: uri.href,
${indent}        text: \`${resource.name} for \${${paramKeys[0] || 'param'}}: \${JSON.stringify(data)}\`
${indent}      }]
${indent}    };` : `return {
${indent}      contents: [{
${indent}        uri: uri.href,
${indent}        text: \`Dynamic content for ${resource.name} with parameters: \${JSON.stringify(${paramDestructuring})}\`
${indent}      }]
${indent}    };`}
${indent}  }
${indent});`
      } else {
        // Static resource
        return `${indent}server.registerResource(
${indent}  "${resourceName}",
${indent}  "${resource.uri}",
${indent}  {
${indent}    title: "${resource.title || resource.name}",
${indent}    description: "${resource.description}",
${indent}    mimeType: "${resource.mime_type || 'text/plain'}"
${indent}  },
${indent}  async (uri) => ({
${indent}    contents: [{
${indent}      uri: uri.href,
${indent}      ${resource.resource_type === 'static' && resource.static_content
            ? `text: \`${resource.static_content.replace(/\n/g, '\\n').replace(/"/g, '\\"')}\``
            : `text: "Sample content for ${resource.name}"`
          }
${indent}    }]
${indent}  })
${indent});`
      }
    }).join('\n\n')}

`}

  // Add tools if there are any
  if (tools.length > 0) {
    setupCode += `${indent}// Set up tools
${tools.map(tool => `${indent}server.registerTool(
${indent}  "${tool.name}",
${indent}  {
${indent}    title: "${tool.title || tool.name}",
${indent}    description: "${tool.description}"${tool.parameters && Object.keys(tool.parameters).length > 0 ? `,
${indent}    inputSchema: {${Object.entries(tool.parameters).map(([key, param]: [string, ParameterDefinition]) => ` ${key}: z.${param.type}()`).join(',')}}` : ''}
${indent}  },
${indent}  async (${tool.parameters && Object.keys(tool.parameters).length > 0 ? `{ ${Object.keys(tool.parameters).join(', ')} }` : 'args'}) => {
${indent}    ${tool.tool_type === 'static' && tool.static_result
        ? (() => {
          // Generate actual calculation logic for static tools
          if (tool.name.toLowerCase().includes('bmi') || tool.description.toLowerCase().includes('body mass')) {
            const params = Object.keys(tool.parameters || {})
            const weightParam = params.find(p => p.toLowerCase().includes('weight')) || 'weightKg'
            const heightParam = params.find(p => p.toLowerCase().includes('height')) || 'heightM'
            return `return {
${indent}      content: [{
${indent}        type: "text",
${indent}        text: String(${weightParam} / (${heightParam} * ${heightParam}))
${indent}      }]
${indent}    };`
          } else {
            // Default static result with parameter substitution
            return `return {
${indent}      content: [{
${indent}        type: "text",
${indent}        text: \`${tool.static_result.replace(/\{(\w+)\}/g, '${$1}')}\`
${indent}      }]
${indent}    };`
          }
        })()
        : tool.tool_type === 'api' && tool.api_url
          ? `const response = await fetch(\`${tool.api_url.replace(/\{(\w+)\}/g, '${$1}')}\`${tool.http_method && tool.http_method !== 'GET' ? `, {
${indent}      method: "${tool.http_method}",
${indent}      headers: ${tool.headers ? JSON.stringify(tool.headers) : '{}'}
${indent}    }` : tool.headers ? `, {
${indent}      headers: ${JSON.stringify(tool.headers)}
${indent}    }` : ''});
${indent}    const data = await response.text();
${indent}    return {
${indent}      content: [{ type: "text", text: data }]
${indent}    };`
          : tool.tool_type === 'resource_link' && tool.resource_links
            ? `return {
${indent}      content: [
${indent}        { type: "text", text: \`${tool.resource_links_header ? tool.resource_links_header.replace(/\{(\w+)\}/g, '${$1}') : `Found files matching "${Object.keys(tool.parameters || {}).length > 0 ? Object.keys(tool.parameters || {})[0] : 'pattern'}"`}\` },
${indent}        // ResourceLinks let tools return references without file content
${tool.resource_links.map((link: { uri: string; name: string; mimeType: string; description: string }) => `${indent}        {
${indent}          type: "resource_link",
${indent}          uri: "${link.uri}",
${indent}          name: "${link.name}",
${indent}          mimeType: "${link.mimeType}",
${indent}          description: '${link.description}'
${indent}        }`).join(',\n')}
${indent}      ]
${indent}    };`
            : `return {
${indent}      content: [
${indent}        {
${indent}          type: "text",
${indent}          text: \`Tool ${tool.name} executed with args: \${JSON.stringify(${tool.parameters && Object.keys(tool.parameters).length > 0 ? `{ ${Object.keys(tool.parameters).join(', ')} }` : 'args'})}\`,
${indent}        },
${indent}      ],
${indent}    };`
      }
${indent}  }
${indent});`).join('\n\n')}

`}

  // Add prompts if there are any
  if (prompts.length > 0) {
    setupCode += `${indent}// Set up prompts
${prompts.map(prompt => {
      const isContextAware = prompt.prompt_type === "context_aware"

      if (isContextAware && prompt.completion_config?.complete) {
        // Generate context-aware prompt with completable functions
        const completionConfig = prompt.completion_config.complete

        // Generate argsSchema with completable functions
        const argsSchemaEntries = Object.entries(prompt.arguments || {}).map(([key, arg]: [string, ArgumentDefinition]) => {
          const completion = completionConfig[key]

          if (completion) {
            if (completion.type === "static" && completion.values) {
              // Static completion
              const valuesArray = completion.values.map((v: string) => `"${v}"`).join(', ')
              return `${indent}    ${key}: completable(z.${arg.type}(), (value) => {
${indent}      // ${arg.description}
${indent}      return [${valuesArray}].filter(d => d.startsWith(value));
${indent}    })`
            } else if (completion.type === "conditional" && completion.conditions) {
              // Conditional completion
              const conditionsCode = completion.conditions.map((condition: {
                when: Record<string, string>
                values: string[]
              }, index: number) => {
                const whenConditions = Object.entries(condition.when).map(([whenKey, whenValue]) =>
                  `${whenKey} === "${whenValue}"`
                ).join(' && ')

                const valuesArray = condition.values.map((v: string) => `"${v}"`).join(', ')
                const prefix = index === 0 ? 'if' : 'else if'
                return `${prefix} (${whenConditions}) {
${indent}        return [${valuesArray}].filter(n => n.startsWith(value));
${indent}      }`
              }).join(' ')

              const defaultValues = completion.default ?
                `[${completion.default.map((v: string) => `"${v}"`).join(', ')}]` :
                '["Guest", "Visitor"]'

              return `${indent}    ${key}: completable(z.${arg.type}(), (value, context) => {
${indent}      // ${arg.description}
${indent}      const ${Object.keys(completion.conditions[0].when)[0]} = context?.arguments?.["${Object.keys(completion.conditions[0].when)[0]}"];
${indent}      ${conditionsCode}
${indent}      return ${defaultValues}.filter(n => n.startsWith(value));
${indent}    })`
            }
          }

          // Fallback to regular z schema if no completion config
          return `${indent}    ${key}: z.${arg.type}()${arg.required ? '' : '.optional()'}.describe("${arg.description}")`
        })

        // Determine parameter destructuring for the prompt function
        const paramKeys = Object.keys(prompt.arguments || {})
        const paramDestructuring = paramKeys.length > 0 ? `{ ${paramKeys.join(', ')} }` : 'args'

        return `${indent}server.registerPrompt(
${indent}  "${prompt.name}",
${indent}  {
${indent}    title: "${prompt.title || prompt.name}",
${indent}    description: "${prompt.description}"${prompt.arguments && Object.keys(prompt.arguments).length > 0 ? `,
${indent}    argsSchema: {
${argsSchemaEntries.join(',\n')}
${indent}    }` : ''}
${indent}  },
${indent}  (${paramDestructuring}) => ({
${indent}    messages: [
${indent}      {
${indent}        role: "${prompt.role}",
${indent}        content: {
${indent}          type: "text",
${indent}          text: \`${prompt.template.replace(/\{\{(\w+)\}\}/g, '${$1}').replace(/\n/g, '\\n')}\`
${indent}        }
${indent}      }
${indent}    ]
${indent}  })
${indent});`
      } else {
        // Generate basic prompt
        const paramKeys = Object.keys(prompt.arguments || {})
        const paramDestructuring = paramKeys.length > 0 ? `{ ${paramKeys.join(', ')} }` : 'args'

        // Generate simplified argsSchema
        const argsSchemaEntries = Object.entries(prompt.arguments || {}).map(([key, arg]: [string, ArgumentDefinition]) => {
          return `${key}: z.${arg.type}()${arg.required ? '' : '.optional()'}`
        })

        return `${indent}server.registerPrompt(
${indent}  "${prompt.name}",
${indent}  {
${indent}    title: "${prompt.title || prompt.name}",
${indent}    description: "${prompt.description}"${prompt.arguments && Object.keys(prompt.arguments).length > 0 ? `,
${indent}    argsSchema: {
${indent}      ${argsSchemaEntries.join(',\n      ')}
${indent}    }` : ''}
${indent}  },
${indent}  (${paramDestructuring}) => ({
${indent}    messages: [
${indent}      {
${indent}        role: "${prompt.role}",
${indent}        content: {
${indent}          type: "text",
${indent}          text: \`${prompt.template.replace(/\{\{(\w+)\}\}/g, '${$1}').replace(/\n/g, '\\n')}\`
${indent}        }
${indent}      }
${indent}    ]
${indent}  })
${indent});`
      }
    }).join('\n\n')}

`}

  return setupCode
}