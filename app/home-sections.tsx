"use client"

import { useRouter } from "next/navigation"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export function HomeSections() {
  const router = useRouter()
  
  return (
    <>
      <FeaturesSection onShowWizard={() => router.push('/wizard')} />
      <Footer onShowWizard={() => router.push('/wizard')} />
    </>
  )
}
