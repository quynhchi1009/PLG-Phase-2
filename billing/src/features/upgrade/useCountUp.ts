import { useEffect, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Counts from `from` to `to` after `delay` ms, decelerating into the final value. */
export function useCountUp(from: number, to: number, { delay = 0, duration = 700 } = {}) {
  const [value, setValue] = useState(() => (reducedMotion() ? to : from))

  useEffect(() => {
    if (reducedMotion() || from === to) {
      setValue(to)
      return
    }
    setValue(from)
    let frame = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(Math.round(from + (to - from) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, delay)
    // Background tabs throttle animation frames; never leave the figure mid-count.
    const settle = window.setTimeout(() => setValue(to), delay + duration + 100)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(settle)
      cancelAnimationFrame(frame)
    }
  }, [from, to, delay, duration])

  return value
}

/** Briefly rings the element the dialog just changed, so the eye lands on it after closing. */
export function flagUpdated(selectors: string[]) {
  requestAnimationFrame(() => {
    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector)
      if (!el) continue
      el.classList.remove('is-updated')
      void el.offsetWidth
      el.classList.add('is-updated')
      el.addEventListener('animationend', () => el.classList.remove('is-updated'), { once: true })
    }
  })
}
