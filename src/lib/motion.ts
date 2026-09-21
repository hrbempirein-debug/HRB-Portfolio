export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Spring used for the environment mood — slow and floaty. */
export const ENV_SPRING = { stiffness: 50, damping: 26, mass: 1.2 }

/** Spring used for the cursor light — trails softly like light through air. */
export const CURSOR_SPRING = { stiffness: 260, damping: 30, mass: 0.55 }

/** How far the whole visual layers drift relative to the pointer (px). */
export const PARALLAX = { x: 24, y: 9 }

/** Per-layer depth parallax multipliers used inside each environment (px). */
export const DEPTH_PARALLAX = { bg: 18, fg: 12 }

export const CURSOR_LIGHT_SIZE = 760