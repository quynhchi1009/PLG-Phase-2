import { useSyncExternalStore } from 'react'

/* Prototype only. The product has no such control: a real payment takes however long Stripe takes.
   Here every simulated wait goes through `simulateWait`, so the prototype panel can stretch it, or
   hold it until "Finish payment" is pressed, to give the loading states time to be looked at.

   normal  the wait each flow was written with (about a second)
   slow    10 seconds: long enough to see the "taking longer than usual" message
   hold    waits until "Finish payment" in the panel */
export type PaymentSpeed = 'normal' | 'slow' | 'hold'

const SLOW_MS = 10_000

let speed = 'normal' as PaymentSpeed
const held = new Set<() => void>()
const listeners = new Set<() => void>()
let snapshot = { speed, held: 0 }

function emit() {
  snapshot = { speed, held: held.size }
  listeners.forEach((l) => l())
}

/** Runs `done` after a simulated wait. Returns a function that cancels it. */
export function simulateWait(done: () => void, normalMs = 1200): () => void {
  if (speed === 'hold') {
    const release = () => {
      held.delete(release)
      emit()
      done()
    }
    held.add(release)
    emit()
    return () => {
      if (held.delete(release)) emit()
    }
  }
  const t = window.setTimeout(done, speed === 'slow' ? SLOW_MS : normalMs)
  return () => window.clearTimeout(t)
}

function finish() {
  ;[...held].forEach((release) => release())
}

function setSpeed(next: PaymentSpeed) {
  speed = next
  // Leaving "hold" lets whatever was waiting go through.
  if (next !== 'hold') finish()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePaymentSim() {
  const { speed: current, held: waiting } = useSyncExternalStore(subscribe, () => snapshot)
  return { speed: current, waiting, setSpeed, finish }
}
