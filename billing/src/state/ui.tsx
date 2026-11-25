import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type Route = 'billing' | 'plans' | 'report' | 'checkout'
export type Theme = 'light' | 'dark'

interface Toast {
  id: number
  message: string
}

interface UiContextValue {
  route: Route
  /** Opens a page. With `anchor` (an element id) it also scrolls that element to the top once the page is shown. */
  navigate: (route: Route, anchor?: string) => void
  theme: Theme
  toggleTheme: () => void
  toasts: Toast[]
  toast: (message: string) => void
  dismissToast: (id: number) => void
}

const UiContext = createContext<UiContextValue | null>(null)

function readRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, '')
  return h === 'plans' || h === 'report' || h === 'checkout' ? h : 'billing'
}

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('av-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage unavailable: fall through to the OS setting */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(readRoute)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  // A page change scrolls to the top. When the caller named a section, this holds it until the new
  // page has rendered, then the effect below scrolls to it. `jump` re-runs that effect when the
  // page does not change (already on it, so no hashchange fires).
  const anchor = useRef<{ id: string; smooth: boolean } | null>(null)
  const [jump, setJump] = useState(0)

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      // Instant: the page's CSS makes scrolling smooth, and a smooth run to the top would still be
      // going when the jump to a section below starts.
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const target = anchor.current
    if (!target) return
    anchor.current = null
    document.getElementById(target.id)?.scrollIntoView({ behavior: target.smooth ? 'smooth' : 'instant', block: 'start' })
  }, [route, jump])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const navigate = useCallback((next: Route, to?: string) => {
    // Products & Pricing always opens on the "Choose your plan" cards (the estimator stays one scroll up).
    const target = to ?? (next === 'plans' ? 'choose-title' : undefined)
    const here = window.location.hash === `#/${next}`
    if (target) anchor.current = { id: target, smooth: here }
    window.location.hash = `/${next}`
    if (target && here) setJump((n) => n + 1)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('av-theme', next)
      } catch {
        /* non-essential preference */
      }
      return next
    })
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-2), { id, message }])
      window.setTimeout(() => dismissToast(id), 5000)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({
      route,
      navigate,
      theme,
      toggleTheme,
      toasts,
      toast,
      dismissToast,
    }),
    [route, navigate, theme, toggleTheme, toasts, toast, dismissToast],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
