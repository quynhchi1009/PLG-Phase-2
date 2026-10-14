import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  /** Accessible name; should match the visible heading. */
  labelledBy: string
  describedBy?: string
  size?: 'sm' | 'md' | 'lg'
  /** Changes when the flow moves to another step, so the content re-enters. */
  stepKey?: string
  children: ReactNode
}

export function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  size = 'md',
  stepKey,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  // Move focus to the new step's first focusable control so keyboard and
  // screen reader users land in the right place after each transition.
  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>('h2')
    target?.focus({ preventScroll: true })
  }, [open, stepKey])

  return (
    <dialog
      ref={ref}
      className={`dialog dialog--${size}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="dialog__surface" key={stepKey}>
          <button type="button" className="dialog__close icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
          {children}
        </div>
      )}
    </dialog>
  )
}
