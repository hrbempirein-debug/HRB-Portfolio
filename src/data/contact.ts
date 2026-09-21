export interface ContactCopy {
  sectionNumber: string
  sectionLabel: string
  heading: string
  statement: string
  emailLabel: string
  /** The public contact address — single source of truth. */
  email: string
  availabilityLabel: string
  availability: string
}

export const contactCopy: ContactCopy = {
  sectionNumber: '07',
  sectionLabel: 'Contact',
  heading: "LET'S BUILD WHAT'S NEXT.",
  statement:
    'For digital products, intelligent systems, and software that needs to move beyond the ordinary.',
  emailLabel: 'Email',
  email: 'hrbempirein@gmail.com',
  availabilityLabel: 'Open for',
  availability: 'Selected projects and thoughtful collaborations.',
}