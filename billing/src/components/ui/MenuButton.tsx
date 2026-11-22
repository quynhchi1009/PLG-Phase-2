import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './Button'

export interface MenuItem {
  label: string
  onSelect: () => void
  /** A danger item sits apart at the end of the list, in the negative colour. */
  tone?: 'default' | 'danger'
}

/* MenuButton: a button that opens a short list of actions (WAI-ARIA menu button).
   Click, Enter, Space or ArrowDown opens it and moves focus into the list; arrows,
   Home and End move through it; Escape closes it and returns focus to the button;
   a click outside or Tab away closes it. Choosing an item closes the menu and hands
   focus back to the button first, so a dialog the action opens restores focus there. */
export function MenuButton({
  label,
  items,
  variant = 'primary',
}: {
  label: string
  items: MenuItem[]
  variant?: ComponentProps<typeof Button>['variant']
}) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Button does not forward a ref, so the trigger is found by its place in the root.
  const trigger = () => rootRef.current?.querySelector<HTMLButtonElement>(':scope > button') ?? null

  useEffect(() => {
    if (!open) return
    itemRefs.current[0]?.focus()
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const choose = (item: MenuItem) => {
    setOpen(false)
    trigger()?.focus()
    item.onSelect()
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = items.length - 1
    const at = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    let next = -1
    if (e.key === 'ArrowDown') next = at >= last ? 0 : at + 1
    else if (e.key === 'ArrowUp') next = at <= 0 ? last : at - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      trigger()?.focus()
      return
    } else if (e.key === 'Tab') {
      // Focus the button first; the browser then tabs on from there and the menu closes.
      trigger()?.focus()
      setOpen(false)
      return
    }
    if (next < 0) return
    e.preventDefault()
    itemRefs.current[next]?.focus()
  }

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
  }

  return (
    <div className="menu" ref={rootRef} onBlur={onBlur}>
      <Button
        size="sm"
        variant={variant}
        className="menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        {label}
        <ChevronDown className="menu__chevron" size={16} strokeWidth={2} aria-hidden />
      </Button>
      {/* Pressing the list's padding must not move focus off the items, or the blur would close it. */}
      <div
        id={menuId}
        role="menu"
        aria-label={label}
        className="menu__list"
        data-open={open}
        onKeyDown={onListKeyDown}
        onMouseDown={(e) => e.preventDefault()}
      >
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {item.tone === 'danger' && i > 0 && <div role="separator" className="menu__sep" />}
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className={`menu__item${item.tone === 'danger' ? ' menu__item--danger' : ''}`}
              onClick={() => choose(item)}
            >
              {item.label}
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
