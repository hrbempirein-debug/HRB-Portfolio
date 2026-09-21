export interface Testimonial {
  id: string
  quote: string
  name: string
  role: string
}

export interface TestimonialsCopy {
  label: string
  note: string
  items: readonly Testimonial[]
}

/**
 * Illustrative sample quotes — NOT genuine client feedback.
 *
 * These are fictional placeholders, clearly labeled as such on the page, so
 * the portfolio shows the intended layout without claiming real endorsements.
 * Replace with verified, authorized testimonials before treating them as real.
 */
export const testimonialsCopy: TestimonialsCopy = {
  label: 'Client Voices',
  note: 'Illustrative examples — sample quotes, not genuine client feedback.',
  items: [
    {
      id: 'omar',
      quote:
        'The automation framework turned a messy, manual workflow into something we can actually scale. The difference was immediate.',
      name: 'Omar Siddiqui',
      role: 'Operations Director',
    },
    {
      id: 'priya',
      quote:
        'Clear communication and a system that finally connects the tools we already had. It just works the way we expected it to.',
      name: 'Priya Nair',
      role: 'Product Lead',
    },
    {
      id: 'ahmed',
      quote:
        'Intelligent document handling that saves real hours every week. The process went from scattered steps to a single flow.',
      name: 'Ahmed Raza',
      role: 'Head of Legal Operations',
    },
    {
      id: 'sara',
      quote:
        'A rare combination of thoughtful design and solid engineering. The platform feels calm, capable, and built to last.',
      name: 'Sara Khan',
      role: 'Digital Transformation Manager',
    },
  ],
}