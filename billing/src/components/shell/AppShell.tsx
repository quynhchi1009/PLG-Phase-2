import { useEffect, useState, type ReactNode } from 'react'
import { CircleArrowLeft, KeyRound, Menu, Radar } from 'lucide-react'
import { useBilling } from '../../state/billing'
import { useUi, type Route } from '../../state/ui'
import { PaymentBanner } from '../../features/upgrade/PaymentBanner'
import {
  AccountSettingsIcon,
  BellIcon,
  CartIcon,
  ChevronDownIcon,
  LogoutIcon,
  McpIcon,
  MenuToggleIcon,
  MyPlanIcon,
  OnboardingIcon,
  ProductsPricingIcon,
  SearchIcon,
  ViewReportsIcon,
} from './ShellIcons'

interface NavChild {
  label: string
  route?: Route
  /** Manual top-ups exist for Flex only: Growth has no Top up page (it has Auto top up on Billing). */
  flexOnly?: boolean
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

/* Icons without a production glyph (pKYB, API Key, Previous Page) use Lucide at the same 25px. */
const NAV: NavItem[] = [
  { label: 'Search', icon: <SearchIcon />, route: 'report' },
  { label: 'View Reports', icon: <ViewReportsIcon />, lapsed: true },
  /* Billing is a top-level row, as in production (between the report items and Onboarding Management). */
  { label: 'Billing', icon: <MyPlanIcon />, route: 'billing', lapsed: true },
  { label: 'Onboarding Management', icon: <OnboardingIcon /> },
  { label: 'pKYB', icon: <Radar size={25} strokeWidth={2.2} />, isNew: true },
  { label: 'My Plan', icon: <MyPlanIcon />, lapsed: true, children: [{ label: 'Top up', flexOnly: true }] },
  { label: 'Products & Pricing', icon: <ProductsPricingIcon />, route: 'plans', lapsed: true },
  { label: 'API Key', icon: <KeyRound size={25} strokeWidth={2.2} />, isNew: true },
  { label: 'MCP', icon: <McpIcon />, isNew: true },
  { label: 'Account Settings', icon: <AccountSettingsIcon />, lapsed: true },
]

const TITLES: Record<Route, string> = {
  billing: 'My plan',
  plans: 'Upgrade',
  report: 'Choose report',
  checkout: 'Checkout',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate, toast } = useUi()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const { state } = useBilling()
  // Growth (any status) gets no Top up page; a group left with no children (My Plan) is dropped too.
  const growth = state.planId !== 'flex'
  const nav = (state.status === 'none' ? NAV.filter((i) => i.lapsed) : NAV)
    .map((item) =>
      item.children ? { ...item, children: item.children.filter((c) => !(growth && c.flexOnly)) } : item,
    )
    .filter((item) => !item.children || item.children.length > 0)

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

      <div className="shell__scrim" aria-hidden onClick={() => setDrawerOpen(false)} />

      <nav id="sidebar" className="sidebar" aria-label="Portal">
        <a className="sidebar__logo" href="#/billing" aria-label="AsiaVerify">
          <img className="sidebar__logo-full" src="/asiaverify-logo-full.png" alt="" width={151} height={40} />
          <img className="sidebar__logo-mark" src="/asiaverify-mark.png" alt="" width={44} height={40} />
        </a>

        <ul className="sidebar__list sidebar__list--head">
          <li className="sidebar__collapse">
            <button
              type="button"
              className="sidebar__item"
              aria-expanded={!collapsed}
              aria-controls="sidebar-main"
              onClick={() => setCollapsed((c) => !c)}
            >
              <span aria-hidden className="sidebar__icon sidebar__icon--toggle">
                <MenuToggleIcon />
              </span>
              <span className="sidebar__label">Menu</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sidebar__item"
              title={collapsed ? 'Previous Page' : undefined}
              onClick={() => window.history.back()}
            >
              <span aria-hidden className="sidebar__icon">
                <CircleArrowLeft size={25} strokeWidth={2.2} />
              </span>
              <span className="sidebar__label">Previous Page</span>
            </button>
          </li>
        </ul>

        <ul id="sidebar-main" className="sidebar__list sidebar__list--main">
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
                    <span aria-hidden className={`sidebar__chevron ${open ? 'is-open' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {open && (
                    <ul id={groupId} className="sidebar__sub">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <button
                            type="button"
                            className="sidebar__sub-item"
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
                            {child.label}
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
            <button
              type="button"
              className="sidebar__item"
              title={collapsed ? 'Logout' : undefined}
              onClick={() => notInPrototype('Log out')}
            >
              <span aria-hidden className="sidebar__icon">
                <LogoutIcon />
              </span>
              <span className="sidebar__label">Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="shell__col">
        <header className="topbar">
          <button
            type="button"
            className="topbar__icon-btn topbar__menu"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls="sidebar"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={26} aria-hidden />
          </button>
          <a className="topbar__mark" href="#/billing" aria-label="AsiaVerify">
            <img src="/asiaverify-mark.png" alt="" width={44} height={40} />
          </a>
          <span className="topbar__title">{TITLES[route]}</span>
          <div className="topbar__actions">
            {route !== 'plans' && (
              <>
                <button
                  type="button"
                  className="topbar__icon-btn topbar__bell"
                  aria-label="Notifications, 2 unread"
                  onClick={() => notInPrototype('Notifications')}
                >
                  <BellIcon />
                  <span className="topbar__count" aria-hidden>
                    2
                  </span>
                </button>
                <button
                  type="button"
                  className="topbar__icon-btn topbar__cart"
                  aria-label="Cart"
                  onClick={() => notInPrototype('Cart')}
                >
                  <CartIcon />
                  <span className="topbar__dot" aria-hidden />
                </button>
              </>
            )}
            <a className="topbar__help" href="mailto:support@asiaverify.com">
              Get Help
            </a>
            {route === 'plans' && (
              <button
                type="button"
                className="btn btn--primary btn--sm topbar__upgrade"
                onClick={() => document.getElementById('choose-title')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Upgrade now
              </button>
            )}
          </div>
        </header>

        <PaymentBanner />
        <FlexBanner />

        <main id="main" className="main" tabIndex={-1}>
          {children}
        </main>
      </div>
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
