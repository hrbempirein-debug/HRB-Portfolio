import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { initPointer } from './lib/pointer'
import { Navigation } from './components/layout/Navigation'
import { Hero } from './components/hero/Hero'
import { CapabilitiesSection } from './components/sections/CapabilitiesSection'
import { SelectedWorkSection } from './components/sections/SelectedWorkSection'
import { ResultsSection } from './components/sections/ResultsSection'
import { CommitmentSection } from './components/sections/CommitmentSection'
import { AboutSection } from './components/sections/AboutSection'
import { AutomationsSection } from './components/sections/AutomationsSection'
import { ContactSection } from './components/sections/ContactSection'
import { Footer } from './components/layout/Footer'
import { Chatbot } from './components/chat/Chatbot'

export default function App() {
  useEffect(() => initPointer(), [])

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>
      <Navigation />
      <main>
        <Hero />
        <CapabilitiesSection />
        <SelectedWorkSection />
        <ResultsSection />
        <CommitmentSection />
        <AboutSection />
        <AutomationsSection />
        <ContactSection />
      </main>
      <Footer />
      <Chatbot />
    </MotionConfig>
  )
}