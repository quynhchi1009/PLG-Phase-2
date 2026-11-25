import { useSyncExternalStore } from 'react'

/* Prototype only. The product has no such control: a real payment takes however long Stripe takes.
   Here every simulated wait goes through `simulateWait`, so the prototype panel can stretch it, or
   hold it until "Finish payment" is pressed, to give the loading states time to be looked at.

   normal  the wait each flow was written with (about a second)
   slow    10 seconds: long enough to see the "taking longer than usual" message
   hold    waits until "Finish payment" in the panel

   The same panel decides how the next Auto top up charge ends (PRD 3.2: the card on file is charged,
   and the charge can fail):
   success the charge goes through (the default)
   fail    the charge is declined: the payment failed, nothing is added and the plan carries on */
export type PaymentSpeed = 'normal' | 'slow' | 'hold'
export type PaymentOutcome = 'success' | 'fail'

const SLOW_MS = 10_000

let speed = 'normal' as PaymentSpeed
let outcome = 'success' as PaymentOutcome
const held = new Set<() => void>()
const listeners = new Set<() => void>()
let snapshot = { speed, outcome, held: 0 }

function emit() {
  snapshot = { speed, outcome, held: held.size }
  listeners.forEach((l) => l())
}

/** How the next Auto top up charge ends. Read when the simulated wait is over, so it can change mid-wait. */
export function paymentOutcome(): PaymentOutcome {
  return outcome
}

function setOutcome(next: PaymentOutcome) {
  outcome = next
  emit()
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
  const { speed: current, outcome: result, held: waiting } = useSyncExternalStore(subscribe, () => snapshot)
  return { speed: current, outcome: result, waiting, setSpeed, setOutcome, finish }
}
