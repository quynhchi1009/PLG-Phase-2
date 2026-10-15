/**
 * The success mark: a white circle outlined in Registry Green with a green
 * tick. The shape pops in, then the tick draws itself.
 * Decorative only; the heading beside it carries the meaning.
 */
export function SuccessMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={['success-mark', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="-1.5 -1.5 51 51"
      aria-hidden
    >
      <circle className="success-mark__shape" cx="24" cy="24" r="24" />
      <path className="success-mark__tick" d="M15 24.5l6.2 6.2L33 18.8" pathLength={1} />
    </svg>
  )
}
