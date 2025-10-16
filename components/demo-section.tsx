"use client"


export function DemoSection() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 md:p-8 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
        <div className="px-2 sm:px-0">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">See the Magic Happen</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
            Watch how your API specifications transform into production-ready MCP tools with intelligent parameter
            detection and error handling.
          </p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="h-8 w-8 sm:h-8 sm:w-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">1</span>
              </div>
              <span className="text-xs sm:text-sm leading-relaxed">Paste your API specification URL or upload file</span>
            </div>
            <div className="flex items-start sm:items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="h-8 w-8 sm:h-8 sm:w-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">2</span>
              </div>
              <span className="text-xs sm:text-sm leading-relaxed">AI analyzes and extracts endpoints automatically</span>
            </div>
            <div className="flex items-start sm:items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="h-8 w-8 sm:h-8 sm:w-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">3</span>
              </div>
              <span className="text-xs sm:text-sm leading-relaxed">Generate production-ready MCP tools instantly</span>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 font-mono text-xs sm:text-sm animate-fade-in overflow-x-auto">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-zinc-400 ml-1 sm:ml-2 text-xs sm:text-sm truncate">Generated MCP Tool</span>
          </div>
          <div className="text-green-400 min-w-[280px] sm:min-w-0">
            <div className="text-zinc-500">{'// Auto-generated from API spec'}</div>
            <div className="text-blue-400">server.registerTool</div>
            <div className="text-white">(</div>
            <div className="ml-2 text-yellow-300">&quot;fetch-weather&quot;</div>
            <div className="text-white">,</div>
            <div className="ml-2 text-white">{"{"}</div>
            <div className="ml-3 sm:ml-4 text-blue-400">
              title: <span className="text-yellow-300">&quot;Weather API&quot;</span>,
            </div>
            <div className="ml-3 sm:ml-4 text-blue-400">
              description: <span className="text-yellow-300">&quot;Get weather data&quot;</span>,
            </div>
            <div className="ml-3 sm:ml-4 text-blue-400">
              inputSchema: {"{"} city: z.string() {"}"}
            </div>
            <div className="ml-2 text-white">{"}"}</div>
            <div className="text-white">);</div>
          </div>
        </div>
      </div>
    </div>
  )
}
