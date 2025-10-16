"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowRight, 
  Code, 
  Settings, 
  Zap, 
  ChevronRight
} from "lucide-react"

interface FeaturesSectionProps {
  onShowWizard: () => void
}

export function FeaturesSection({ onShowWizard }: FeaturesSectionProps) {
  return (
    <>
      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Everything You Need to Build MCP Servers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              From simple configurations to complex integrations, our tool handles it all
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Visual Configuration</CardTitle>
                <CardDescription>
                  Configure resources, tools, and prompts through an intuitive interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Drag & drop interface
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Real-time validation
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Import from APIs
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-zinc-600" />
                </div>
                <CardTitle>Code Generation</CardTitle>
                <CardDescription>Generate production-ready TypeScript code with Express.js</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    TypeScript/Python support
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Session management
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Error handling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Advanced Features</CardTitle>
                <CardDescription>Context-aware resources and intelligent completions</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Dynamic parameters
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Smart completions
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Resource templates
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 px-2">
                From Configuration to Code in Seconds
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
                Our intelligent code generator creates clean, maintainable TypeScript/Python code that follows MCP best
                practices. No more boilerplate - just focus on your server&apos;s functionality.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-orange-600 rounded-full"></div>
                  <span className="text-foreground">Express.js with TypeScript</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                  <span className="text-foreground">StreamableHTTPServerTransport</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-orange-600 rounded-full"></div>
                  <span className="text-foreground">Zod validation schemas</span>
                </div>
              </div>
              <Button className="mt-8 bg-orange-600 hover:bg-orange-700 text-white" onClick={onShowWizard}>
                Try It Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">server.ts</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <pre className="text-sm text-muted-foreground overflow-x-auto">
                    <code>{`import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
const server = new McpServer({
  name: "My MCP Server",
  version: "1.0.0"
});

server.registerTool("calculate", {
  title: "Calculator",
  description: "Perform calculations"
}, async ({ expression }) => {
  // Generated tool logic
});`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 bg-orange-600 text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">Ready to Build Your MCP Server?</h2>
          <p className="text-base sm:text-lg md:text-xl opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of developers who are already using mcpwhiz Server Builder to create powerful, context-aware
            applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button size="lg" variant="secondary" onClick={onShowWizard} className="w-full sm:w-auto">
              Start Building Now
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
