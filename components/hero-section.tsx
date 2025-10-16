import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <div className="max-w-5xl mx-auto mb-12 sm:mb-16 px-2 sm:px-4">
      {/* Main Headline with Gradient */}
      <div className="relative">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 text-center leading-tight px-2">
          <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 bg-clip-text text-transparent animate-gradient-x">
            Turn APIs Into
          </span>
          <br />
          <span className="text-foreground">
            MCP Servers
          </span>
          <span className="ml-2 sm:ml-4 bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent font-black">
             Instantly
          </span>
        </h1>
      </div>

      {/* Subheadline with enhanced styling */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-orange-100 dark:border-orange-900/30 mb-6 sm:mb-8 hover:scale-105 transition-all duration-300">
        <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-4 sm:mb-6 text-center font-medium leading-relaxed">
          Upload your <span className="text-orange-600 font-bold animate-pulse">Swagger/OpenAPI</span>, 
          <span className="text-orange-600 font-bold animate-pulse"> Postman Collection</span>, or 
          <span className="text-orange-600 font-bold animate-pulse"> GraphQL</span> and watch Tools generate in 
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent font-bold"> real-time</span>
        </p>
        
        {/* Language Pills with animations */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-4 sm:p-6 shadow-inner">
          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 font-medium">
            Build your MCP server in any language:
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { name: "TypeScript", color: "from-blue-500 to-blue-600", delay: "0ms" },
              { name: "Python", color: "from-yellow-500 to-yellow-600", delay: "100ms" },
              { name: "Go", color: "from-cyan-500 to-cyan-600", delay: "200ms" },
              { name: "Kotlin", color: "from-purple-500 to-purple-600", delay: "300ms" },
              { name: "Swift", color: "from-orange-500 to-red-500", delay: "400ms" },
              { name: "Java", color: "from-red-500 to-red-600", delay: "500ms" },
              { name: "C#", color: "from-purple-600 to-indigo-600", delay: "600ms" },
              { name: "Ruby", color: "from-red-600 to-pink-600", delay: "700ms" },
              { name: "Rust", color: "from-orange-600 to-amber-600", delay: "800ms" }
            ].map((lang) => (
              <Badge 
                key={lang.name}
                className={`bg-gradient-to-r ${lang.color} text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 cursor-pointer animate-fade-in-up px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold`}
                style={{ animationDelay: lang.delay }}
              >
                {lang.name}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Call to action with glow effect */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-sm sm:text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent px-2">
            🚀 All Open Source • All Yours • All Free
          </p>
        </div>
      </div>
    </div>
  )
}
