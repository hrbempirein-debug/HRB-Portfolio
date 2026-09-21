/**
 * Module-level pointer store.
 *
 * Values live outside React so high-frequency pointer events never trigger
 * re-renders. React hooks read the store on `requestAnimationFrame` and push
 * values into Framer Motion values (see `hooks/usePointerPosition`).
 *
 * Controls on touch: a horizontal drag maps to normalized X (swipe between
 * WEB / AI / SYSTEMS). On fine pointers the cursor position maps directly.
 */

export interface PointerState {
  x: number
  y: number
  /** Normalized 0..1 across the viewport width (left → right). */
  nx: number
  /** Normalized 0..1 across the viewport height (top → bottom). */
  ny: number
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/** A full-width swipe is enough to traverse all three states. */
const TOUCH_GAIN = 1.5

let state: PointerState = {
  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  nx: 0.5,
  ny: 0.5,
}

let finePointer: boolean | null = null

function hasFinePointer(): boolean {
  if (finePointer === null) {
    finePointer =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches
  }
  return finePointer
}

let dragging = false
let touchStartX = 0
let baseNx = 0.5
let bound = false

function onPointerDown(event: PointerEvent): void {
  if (event.pointerType === 'touch') {
    dragging = true
    touchStartX = event.clientX
    baseNx = state.nx
  }
}

function onPointerMove(event: PointerEvent): void {
  const width = window.innerWidth
  const height = window.innerHeight

  if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
    state.x = event.clientX
    state.y = event.clientY
    state.nx = clamp01(event.clientX / width)
    state.ny = clamp01(event.clientY / height)
  } else if (event.pointerType === 'touch' && dragging) {
    state.x = event.clientX
    state.y = event.clientY
    state.nx = clamp01(baseNx + ((event.clientX - touchStartX) / width) * TOUCH_GAIN)
    state.ny = clamp01(event.clientY / height)
  }
}

function onPointerEnd(): void {
  dragging = false
}

export function initPointer(): () => void {
  if (bound) return () => undefined
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerEnd)
  window.addEventListener('pointercancel', onPointerEnd)
  bound = true
  return () => {
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerEnd)
    window.removeEventListener('pointercancel', onPointerEnd)
    bound = false
  }
}

export function readPointer(): PointerState {
  return { ...state }
}

export function isFinePointer(): boolean {
  return hasFinePointer()
}