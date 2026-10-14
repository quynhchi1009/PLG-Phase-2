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
  navigate: (route: Route) => void
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

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const navigate = useCallback((next: Route) => {
    window.location.hash = `/${next}`
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
    () => ({ route, navigate, theme, toggleTheme, toasts, toast, dismissToast }),
    [route, navigate, theme, toggleTheme, toasts, toast, dismissToast],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
