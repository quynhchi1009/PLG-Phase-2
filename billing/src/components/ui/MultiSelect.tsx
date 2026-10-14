import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface Option {
  value: string
  label: string
  hint?: string
  /** Heading of the group this option starts or belongs to. */
  group?: string
  /** Nested under the option before it (e.g. document types of a scope). */
  nested?: boolean
}

/**
 * A select-style trigger that opens a checklist for picking several values.
 * `allValue` selects every option; `unsureValue` is exclusive with the rest.
 */
export function MultiSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  allValue,
  unsureValue,
  nestedNote,
}: {
  label: string
  placeholder: string
  options: Option[]
  value: string[]
  onChange: (next: string[]) => void
  allValue?: string
  unsureValue?: string
  /** Caption shown above a nested block. */
  nestedNote?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const labelId = useId()
  const listId = useId()

  const regular = options.filter((o) => o.value !== allValue && o.value !== unsureValue)

  const close = (focus = false) => {
    setOpen(false)
    if (focus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const allSelected = regular.length > 0 && regular.every((o) => value.includes(o.value))

  const toggle = (v: string) => {
    if (v === unsureValue) return onChange(value.includes(v) ? [] : [v])
    if (v === allValue) return onChange(allSelected ? [] : regular.map((o) => o.value))
    const base = value.filter((x) => x !== unsureValue)
    onChange(base.includes(v) ? base.filter((x) => x !== v) : [...base, v])
  }

  const isChecked = (v: string) => (v === allValue ? allSelected : value.includes(v))
  const selected = options.filter((o) => value.includes(o.value))

  const summary =
    selected.length === 0
      ? null
      : allSelected && allValue
        ? options.find((o) => o.value === allValue)?.label
        : selected.length <= 2
          ? selected.map((o) => o.label).join(', ')
          : `${selected[0].label}, ${selected[1].label} +${selected.length - 2} more`

  return (
    <div className="field" ref={rootRef}>
      <span className="field__label" id={labelId}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className={`select ${open ? 'is-open' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-value`}
        onClick={() => setOpen((o) => !o)}
      >
        <span id={`${labelId}-value`} className={summary ? 'select__value' : 'select__placeholder'}>
          {summary ?? placeholder}
        </span>
        <ChevronDown size={16} aria-hidden className="select__chevron" />
      </button>
      {open && (
        <div className="select__menu" id={listId} role="group" aria-labelledby={labelId}>
          <div className="select__scroll">
            {options.map((o, i) => {
              const prev = options[i - 1]
              const startsNested = o.nested && !prev?.nested
              const option = (
                <label className={`select__option ${o.nested ? 'select__option--nested' : ''}`}>
                  <input type="checkbox" checked={isChecked(o.value)} onChange={() => toggle(o.value)} />
                  <span className="check__box" aria-hidden>
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                  <span className="select__option-label">{o.label}</span>
                  {o.hint && <span className="select__option-hint">{o.hint}</span>}
                </label>
              )
              return (
                <Fragment key={o.value}>
                  {o.group && o.group !== prev?.group && <p className="select__group">{o.group}</p>}
                  {startsNested && nestedNote && <p className="select__nest-note">{nestedNote}</p>}
                  {option}
                  {(o.value === unsureValue || o.value === allValue) && !options[i + 1]?.group && (
                    <hr className="select__rule" />
                  )}
                </Fragment>
              )
            })}
          </div>
          <div className="select__foot">
            {value.length > 0 && (
              <button type="button" className="select__clear" onClick={() => onChange([])}>
                Clear
              </button>
            )}
            <button type="button" className="select__done" onClick={() => close(true)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
