"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Github, Menu } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"

interface NavigationProps {
  onTestModalOpen?: () => void
}

export function Navigation({ onTestModalOpen }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Responsive sizing */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
              <Image 
                src="/mcp_logo.png" 
                alt="mcpwhiz Logo" 
                width={50} 
                height={50} 
                className="object-contain w-10 h-10 sm:w-[50px] sm:h-[50px]" 
              />
            </Link>
            <span className="-ml-1 sm:-ml-2 mt-3 sm:mt-4 text-base sm:text-xl font-bold text-foreground truncate">
              Whiz Server Builder
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link href="#import" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
              Import APIs
            </Link>
            <Link href="#features" className="text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="https://github.com/abdella206/mcpwhiz" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span className="hidden lg:inline">GitHub</span>
              </Link>
            </Button>
            <ThemeToggle />
          </nav>
          
          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetTitle className="text-left mb-6">Menu</SheetTitle>
                <nav className="flex flex-col gap-4">
                  <SheetClose asChild>
                    <Link 
                      href="#import" 
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Import APIs
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link 
                      href="#features" 
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Features
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link 
                      href="https://github.com/abdella206/mcpwhiz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-lg text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Github className="h-5 w-5" />
                      GitHub
                    </Link>
                  </SheetClose>
                  {onTestModalOpen && (
                    <Button 
                      onClick={() => {
                        onTestModalOpen()
                        setMobileMenuOpen(false)
                      }} 
                      variant="outline" 
                      className="justify-start"
                    >
                      Test Modal
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Test Modal Button */}
          {onTestModalOpen && (
            <Button onClick={onTestModalOpen} variant="outline" size="sm" className="hidden md:inline-flex ml-4">
              Test Modal
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
