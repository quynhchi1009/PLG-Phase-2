import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './PaymentProgress'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'quiet' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: ReactNode
  /** A payment is going through: the label gives way to a spinner and the click does nothing.
   *  The button stays focusable and keeps its colour, so it reads as working, not as unavailable. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  loading,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', loading && 'is-loading', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      {...rest}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest['aria-disabled']}
      onClick={loading ? undefined : onClick}
    >
      {loading ? <Spinner className="spinner--btn" /> : icon}
      {children}
    </button>
  )
}
