"use client"

import Image from "next/image"
import Link from "next/link"

interface FooterProps {
  onShowWizard: () => void
}

export function Footer({ onShowWizard }: FooterProps) {
  return (
    <footer className="border-t border-border bg-card/50 py-8 sm:py-10 md:py-12 px-3 sm:px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
            <Image src="/mcp_logo.png" alt="mcpwhiz Logo" width={50} height={50} className="w-10 h-10 sm:w-[50px] sm:h-[50px]" />
              <span className="font-bold text-sm sm:text-base text-foreground mt-3 sm:mt-4 -ml-1 sm:-ml-2">Whiz Server Builder</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Open-source tool for building Model Context Protocol servers with ease.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">Product</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <button onClick={onShowWizard} className="hover:text-foreground transition-colors text-left">
                  Create Server
                </button>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">Resources</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://github.com/abdella206/mcpwhiz"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">Connect</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link href="https://twitter.com/mcpbuilder" className="hover:text-foreground transition-colors">
                  Twitter
                </Link>
              </li>
              {/* // Might Create A Discord But Not Sure Yet */}
              {/* <li>
                <Link href="https://discord.gg/mcpbuilder" className="hover:text-foreground transition-colors">
                  Discord
                </Link>
              </li> */}
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; 2025 mcpwhiz Server Builder. Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  )
}
