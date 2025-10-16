import { Suspense } from 'react'
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { HomePageClient } from '@/app/home-client'
import { HomeSections } from '@/app/home-sections'

// Server component for initial render with SEO content
export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Navigation */}
      <Navigation />

      {/* Static SEO-optimized content */}
      <section
        id="import"
        className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-br from-white via-orange-50/30 to-zinc-50 dark:from-background dark:via-orange-950/5 dark:to-zinc-950/20"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <HeroSection />
          </div>

          {/* Interactive client component */}
          <Suspense fallback={<div className="text-center py-8">Loading import tools...</div>}>
            <HomePageClient />
          </Suspense>
        </div>
      </section>

      {/* Features and Footer with client navigation */}
      <HomeSections />
    </div>
  )
}
