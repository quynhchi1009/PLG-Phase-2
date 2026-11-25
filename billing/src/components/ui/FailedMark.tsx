/**
 * The failure mark, the counterpart of the success mark: a white circle outlined in the negative
 * colour with an exclamation point. The shape pops in the same way.
 * Decorative only; the heading beside it carries the meaning.
 */
export function FailedMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={['failed-mark', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="-1.5 -1.5 51 51"
      aria-hidden
    >
      <circle className="failed-mark__shape" cx="24" cy="24" r="24" />
      <path className="failed-mark__bang" d="M24 13.5v13" />
      <circle className="failed-mark__dot" cx="24" cy="33.5" r="2.4" />
    </svg>
  )
}
