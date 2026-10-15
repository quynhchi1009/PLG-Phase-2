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
