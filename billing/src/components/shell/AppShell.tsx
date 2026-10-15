import { useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  ChevronDown,
  CircleArrowLeft,
  Gem,
  KeyRound,
  List,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Radar,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Tag,
  UsersRound,
} from 'lucide-react'
import { useBilling } from '../../state/billing'
import { useUi, type Route } from '../../state/ui'

interface NavChild {
  label: string
  route?: Route
}

interface NavItem {
  label: string
  icon: ReactNode
  route?: Route
  isNew?: boolean
  children?: NavChild[]
  /** Still available to an account without an active plan. */
  lapsed?: boolean
}

const NAV: NavItem[] = [
  { label: 'Search', icon: <Search size={18} />, route: 'report' },
  { label: 'View Reports', icon: <List size={18} />, lapsed: true },
  { label: 'Onboarding Management', icon: <UsersRound size={18} /> },
  { label: 'pKYB', icon: <Radar size={18} />, isNew: true },
  {
    label: 'My Plan',
    icon: <Gem size={18} />,
    lapsed: true,
    children: [{ label: 'Billing', route: 'billing' }, { label: 'Top up' }],
  },
  { label: 'Products & Pricing', icon: <Tag size={18} />, route: 'plans', lapsed: true },
  { label: 'API Key', icon: <KeyRound size={18} />, isNew: true },
  { label: 'MCP', icon: <Plug size={18} />, isNew: true },
  { label: 'Account Settings', icon: <Settings size={18} />, lapsed: true },
]

const TITLES: Record<Route, string> = {
  billing: 'My plan',
  plans: 'Upgrade',
  report: 'Choose report',
  checkout: 'Checkout',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate, theme, toggleTheme, toast } = useUi()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'My Plan': true })
  const { state } = useBilling()
  const nav = state.status === 'none' ? NAV.filter((i) => i.lapsed) : NAV

  useEffect(() => setDrawerOpen(false), [route])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const notInPrototype = (label: string) => toast(`${label} isn't part of this billing prototype.`)

  return (
    <div className={`shell ${collapsed ? 'shell--collapsed' : ''} ${drawerOpen ? 'shell--drawer' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <button
          type="button"
          className="icon-btn icon-btn--chrome topbar__menu"
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="sidebar"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} aria-hidden />
        </button>
        <a className="logo" href="#/billing">
          <img src="/asiaverify-logo.png" alt="AsiaVerify" width={106} height={28} />
        </a>
        <span className="topbar__title">{TITLES[route]}</span>
        <div className="topbar__actions">
          <button
            type="button"
            className="icon-btn icon-btn--chrome"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
          </button>
          {route === 'plans' ? (
            <>
              <a className="topbar__help" href="mailto:support@asiaverify.com">
                Get help
              </a>
              <button
                type="button"
                className="btn btn--primary btn--sm topbar__upgrade"
                onClick={() => document.getElementById('choose-title')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Upgrade now
              </button>
            </>
          ) : (
            <>
              <button type="button" className="icon-btn icon-btn--chrome topbar__bell" aria-label="Notifications, 2 unread" onClick={() => notInPrototype('Notifications')}>
                <Bell size={19} aria-hidden />
                <span className="topbar__count" aria-hidden>
                  2
                </span>
              </button>
              <button type="button" className="icon-btn icon-btn--chrome" aria-label="Cart" onClick={() => notInPrototype('Cart')}>
                <ShoppingCart size={19} aria-hidden />
              </button>
            </>
          )}
        </div>
      </header>

      <FlexBanner />

      <div className="shell__scrim" aria-hidden onClick={() => setDrawerOpen(false)} />

      <nav id="sidebar" className="sidebar" aria-label="Portal">
        <ul className="sidebar__list">
          <li>
            <button type="button" className="sidebar__item" onClick={() => window.history.back()}>
              <CircleArrowLeft size={18} aria-hidden />
              <span className="sidebar__label">Previous Page</span>
            </button>
          </li>
          <li className="sidebar__collapse">
            <button
              type="button"
              className="sidebar__item"
              aria-pressed={collapsed}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
              <span className="sidebar__label">{collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
            </button>
          </li>
        </ul>
        <ul className="sidebar__list sidebar__list--main">
          {nav.map((item) => {
            if (item.children) {
              const open = !!openGroups[item.label] && !collapsed
              const groupId = `nav-${item.label.replace(/\W+/g, '-').toLowerCase()}`
              const hasCurrent = item.children.some((c) => c.route === route)
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className={`sidebar__item ${hasCurrent && !open ? 'is-parent-current' : ''}`}
                    aria-expanded={open}
                    aria-controls={groupId}
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false)
                        setOpenGroups((g) => ({ ...g, [item.label]: true }))
                      } else setOpenGroups((g) => ({ ...g, [item.label]: !g[item.label] }))
                    }}
                  >
                    <span aria-hidden className="sidebar__icon">
                      {item.icon}
                    </span>
                    <span className="sidebar__label">{item.label}</span>
                    <ChevronDown size={16} aria-hidden className={`sidebar__chevron ${open ? 'is-open' : ''}`} />
                  </button>
                  {open && (
                    <ul id={groupId} className="sidebar__sub">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <button
                            type="button"
                            className="sidebar__item sidebar__item--sub"
                            aria-current={child.route === route ? 'page' : undefined}
                            onClick={() => {
                              if (child.route) return navigate(child.route)
                              if (child.label === 'Top up') {
                                navigate('billing')
                                window.setTimeout(() => {
                                  const el = document.getElementById('top-up')
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                  el?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
                                }, 50)
                                return
                              }
                              notInPrototype(child.label)
                            }}
                          >
                            <span className="sidebar__label">{child.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }
            const current = item.route === route
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className="sidebar__item"
                  aria-current={current ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  onClick={() => (item.route ? navigate(item.route) : notInPrototype(item.label))}
                >
                  <span aria-hidden className="sidebar__icon">
                    {item.icon}
                  </span>
                  <span className="sidebar__label">{item.label}</span>
                  {item.isNew && <span className="sidebar__new">New</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <ul className="sidebar__list sidebar__list--foot">
          <li>
            <button type="button" className="sidebar__item" onClick={() => notInPrototype('Log out')}>
              <LogOut size={18} aria-hidden />
              <span className="sidebar__label">Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}

/** Flex customers out of credits, or past their one top-up, see this across the portal. */
function FlexBanner() {
  const { state } = useBilling()
  const { navigate } = useUi()
  if (state.status !== 'active' || state.planId !== 'flex') return null
  const empty = state.creditsRemaining === 0
  if (!empty && !state.topUpUsed) return null
  return (
    <div className="flex-banner" role="status">
      <p>
        To continue generating reports and access all features,{' '}
        {state.topUpUsed ? (
          <button type="button" className="text-btn" onClick={() => navigate('plans')}>
            upgrade your plan
          </button>
        ) : (
          <>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                navigate('billing')
                window.setTimeout(() => document.getElementById('top-up')?.scrollIntoView({ block: 'center' }), 50)
              }}
            >
              top up
            </button>{' '}
            or{' '}
            <button type="button" className="text-btn" onClick={() => navigate('plans')}>
              upgrade your plan
            </button>
          </>
        )}
        .
      </p>
    </div>
  )
}
