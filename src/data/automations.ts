export interface AutomationStage {
  id: string
  index: string
  title: string
  note: string
}

/** Animated "0 → n" counter that plays when the section enters view. */
export interface AutomationCounter {
  /** Value the count starts at (`0`). */
  from: number
  /** Value the count animates up to (`100`). Adjust this to change the target. */
  to: number
  /** How long the count takes, in seconds. */
  duration: number
}

export interface AutomationsCopy {
  /** Static prefix before the animated target numeral, e.g. `0 →`. */
  headingMain: string
  headingSub: string
  supporting: string
  sequence: string
  caption: string
  counter: AutomationCounter
  stages: readonly AutomationStage[]
}

/**
 * SECTION — 0 → 100 AUTOMATION.
 *
 * A visual framework, not a results claim. "0 → 100" describes the journey
 * from a raw workflow to a scalable system; it is never a count of delivered
 * automations. Copy is intentionally minimal — the visual carries the story.
 * `counter` controls the animated heading numeral (target + speed).
 */
export const automationsCopy: AutomationsCopy = {
  headingMain: '0 →',
  headingSub: 'AUTOMATION',
  supporting: 'From workflow friction to intelligent systems.',
  sequence: 'Map. Build. Connect. Automate. Scale.',
  caption: '0 → 100 is the framework — not a delivery count.',
  counter: { from: 0, to: 100, duration: 2.6 },
  stages: [
    { id: 'understand', index: '00', title: 'Understand', note: 'Map the workflow' },
    { id: 'design', index: '01', title: 'Design', note: 'Define the logic' },
    { id: 'build', index: '02', title: 'Build', note: 'Build the automation' },
    { id: 'connect', index: '03', title: 'Connect', note: 'Wire the systems' },
    { id: 'validate', index: '04', title: 'Validate', note: 'Test and review' },
    { id: 'deploy', index: '05', title: 'Deploy', note: 'Roll out safely' },
    { id: 'optimize', index: '06', title: 'Optimize', note: 'Refine continuously' },
    { id: 'scale', index: '100', title: 'Scale', note: 'Extend the framework' },
  ],
}
