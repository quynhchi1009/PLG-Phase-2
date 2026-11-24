import { useEffect, useState } from 'react'

/** How long a payment may run before the wait is acknowledged. */
const LONGER_MS = 8000

/** True once `active` has been on for a while: the cue to say "this is taking longer than usual". */
export function useTakingLonger(active: boolean) {
  const [longer, setLonger] = useState(false)
  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => setLonger(true), LONGER_MS)
    return () => {
      window.clearTimeout(t)
      setLonger(false)
    }
  }, [active])
  return longer
}
