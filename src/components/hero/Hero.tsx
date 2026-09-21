import { useSmoothPointer } from '../../hooks/useSmoothPointer'
import { HeroVisual } from './HeroVisual'
import { HeroContent } from './HeroContent'

/**
 * Full-viewport hero. Owns the single pointer pipeline and fans it out to
 * the interactive environment and the content layer above it.
 */
export function Hero() {
  const pointer = useSmoothPointer()

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-screen min-h-[100svh] overflow-hidden"
    >
      <HeroVisual pointer={pointer} />
      <HeroContent smoothNx={pointer.smoothNx} interactive={pointer.interactive} />
    </section>
  )
}