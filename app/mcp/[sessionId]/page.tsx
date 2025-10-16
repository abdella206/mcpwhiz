import Link from 'next/link'

interface MCPDynamicPageProps {
  params: Promise<{
    sessionId: string
  }>
}

export default async function MCPDynamicPage({ params }: MCPDynamicPageProps) {
  const { sessionId } = await params
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              MCP Server Session Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Session ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{sessionId}</code>
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
              Session Expired or Not Found
            </h2>
            <div className="text-left space-y-3 text-sm text-yellow-800 dark:text-yellow-200">
              <p>This MCP server session may have:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Expired (sessions auto-cleanup after 30 minutes)</li>
                <li>Been stopped manually</li>
                <li>Never been created</li>
                <li>Encountered an error during startup</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <a
              href="/wizard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create New MCP Server
            </a>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Or go back to the <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">home page</Link></p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Need Help?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              If you believe this session should still be active, try creating a new MCP server. 
              Make sure to copy the correct server URL from the wizard after your server starts successfully.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
