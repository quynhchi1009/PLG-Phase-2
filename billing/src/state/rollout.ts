import { useSyncExternalStore } from 'react'

/* Prototype only. In the product the messaging follows the calendar; here the panel picks the moment so
   each stage can be looked at (PRD 5.2). Only the messaging changes: Growth keeps the Phase 2 rules in every
   stage (the manual $249 top-ups that exist until rollout are not modelled).

   off        before T-30 and after T+14: nothing
   pre        T-30 to the day before rollout: banner and pop-up A, and the checkout disclosure
   post       rollout day to T+14: banner and pop-up B
   returning  a customer who did not log in between T-21 and T+14: pop-up B on first login, no banner

   The pop-up opens when a stage starts, as it does on a first login. "Got it" minimises it to the banner (in
   pre and post the banner is already there), and the banner's "Learn more" opens it again. */
export type RolloutPhase = 'off' | 'pre' | 'post' | 'returning'

/** T-30 (PRD 5.2 table; the heading says Sunday 21 Feb, an open question for the PM). */
export const PRE_ROLLOUT_FROM = '2027-02-22'
/** T: Auto top up is on for every Growth account, manual top-ups are gone. */
export const ROLLOUT_ON = '2027-03-23'
/** T+14: the post-rollout banner goes. */
export const POST_ROLLOUT_UNTIL = '2027-04-06'
/** T-21: from here a customer who never logs in gets pop-up B only on their first login. */
export const RETURNING_FROM = '2027-03-02'

let phase = 'off' as RolloutPhase
let popupOpen = false
const listeners = new Set<() => void>()
let snapshot = { phase, popupOpen }

function emit() {
  snapshot = { phase, popupOpen }
  listeners.forEach((l) => l())
}

/** Starts a stage as if the customer had just logged in: the pop-up opens. */
function setPhase(next: RolloutPhase) {
  phase = next
  popupOpen = next !== 'off'
  emit()
}

function openPopup() {
  if (phase === 'off') return
  popupOpen = true
  emit()
}

function closePopup() {
  popupOpen = false
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useRollout() {
  const current = useSyncExternalStore(subscribe, () => snapshot)
  return { ...current, setPhase, openPopup, closePopup }
}
