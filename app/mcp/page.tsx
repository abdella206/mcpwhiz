import Link from 'next/link'

export default function MCPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              MCP Server Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              The MCP server you&apos;re looking for is not currently running.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              How to Access Your MCP Server
            </h2>
            <div className="text-left space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">1</span>
                <span>Go to the <strong>Wizard</strong> page to create your MCP server</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">2</span>
                <span>Choose your API source (Swagger, Postman, GraphQL, etc.)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">3</span>
                <span>Generate and run your MCP server code</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">4</span>
                <span>Use the provided server URL to access your MCP server</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <a
              href="/wizard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Wizard
            </a>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Or go back to the <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">home page</Link></p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              About MCP Servers
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              MCP (Model Context Protocol) servers are dynamically created and run on-demand. 
              Each server gets a unique session ID and runs on a temporary port. 
              Once you create a server through the wizard, you&apos;ll get a direct URL to access it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
