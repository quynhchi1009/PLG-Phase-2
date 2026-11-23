import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Check, Info, X } from 'lucide-react'
import type { PlanFeature } from '../../data/plans'
import { useUi } from '../../state/ui'

/* Badge ------------------------------------------------------------------ */

export function Badge({
  tone = 'positive',
  children,
}: {
  tone?: 'positive' | 'warning' | 'neutral' | 'accent'
  children: ReactNode
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

/* Switch ----------------------------------------------------------------- */

export function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
}: {
  checked: boolean
  onChange: () => void
  labelledBy: string
  describedBy?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="switch"
      onClick={onChange}
    >
      <span className="switch__thumb" aria-hidden />
    </button>
  )
}

/* InfoTip: a small explanatory popover anchored to an (i) button --------- */

export function InfoTip({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <span className="infotip">
      <button type="button" className="infotip__trigger" aria-label={label} aria-describedby={id}>
        {icon ?? <Info size={14} aria-hidden />}
      </button>
      <span role="tooltip" id={id} className="infotip__bubble">
        {children}
      </span>
    </span>
  )
}

/* Checklist -------------------------------------------------------------- */

export function Checklist({
  items,
  size = 'md',
}: {
  items: (string | PlanFeature)[]
  size?: 'sm' | 'md'
}) {
  return (
    <ul className={`checklist checklist--${size}`}>
      {items.map((item) => {
        const key = typeof item === 'string' ? item : item.title
        return (
          <li key={key}>
            <Check className="checklist__mark" size={16} strokeWidth={2.25} aria-hidden />
            {typeof item === 'string' ? (
              <span>{item}</span>
            ) : (
              <span>
                <strong>{item.title}</strong>
                {item.detail && <span className="checklist__detail">{item.detail}</span>}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* Notice: inline banner for state the user should know about ------------- */

export function Notice({
  tone,
  icon,
  title,
  children,
  onDismiss,
}: {
  tone: 'positive' | 'negative' | 'warning'
  icon: ReactNode
  title: string
  children: ReactNode
  onDismiss?: () => void
}) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'negative' ? 'alert' : 'status'}>
      <span className="notice__icon" aria-hidden>
        {icon}
      </span>
      <div className="notice__body">
        <p className="notice__title">{title}</p>
        <p className="notice__text">{children}</p>
      </div>
      {onDismiss && (
        <button type="button" className="icon-btn notice__dismiss" aria-label={`Dismiss: ${title}`} onClick={onDismiss}>
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}

/* Tabs: roving-focus tablist following the WAI-ARIA pattern ------------- */

export interface TabDef<T extends string> {
  id: T
  label: string
  icon?: ReactNode
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
  variant = 'line',
}: {
  tabs: TabDef<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
  variant?: 'line' | 'segmented'
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1
    let next = -1
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={`tabs tabs--${variant}`}>
      {tabs.map((tab, i) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className="tabs__tab"
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* Toaster ---------------------------------------------------------------- */

export function Toaster() {
  const { toasts, dismissToast } = useUi()
  return (
    <div className="toaster" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <p>{t.message}</p>
          <button type="button" className="icon-btn icon-btn--chrome" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)}>
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}
