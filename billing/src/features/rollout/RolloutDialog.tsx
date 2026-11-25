import { useId, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useUi } from '../../state/ui'
import { useRolloutMessage } from './useRolloutMessage'

/**
 * Pop-up A (before rollout) and pop-up B (rollout day on, and for a customer coming back), PRD 5.2.
 *
 * Laid out like the other products' pre- and post-rollout pop-ups: a centred title and one line under it,
 * three boxes side by side, then a note on the left and the one button on the right. Before rollout the boxes
 * are plain sentences; after it the key figures are set in 600, as in those pop-ups.
 *
 * It opens on its own when a stage starts, as on a first login. Before rollout "Got it" closes it and the
 * banner stays; after rollout its one button goes to My Plan, and Escape or a click outside closes it.
 * Checkout is Stripe's page, so nothing opens there.
 */
export function RolloutDialog() {
  const msg = useRolloutMessage()
  const { route, navigate } = useUi()
  const headingId = useId()
  const descId = useId()
  const open = !!msg && msg.popupOpen && route !== 'checkout'
  const pre = msg?.phase === 'pre'
  // After rollout the figures carry the weight; before it the sentences stay plain.
  const fact = (text: string): ReactNode => (pre ? text : <strong>{text}</strong>)

  return (
    <Dialog
      open={open}
      onClose={() => msg?.closePopup()}
      labelledBy={headingId}
      describedBy={descId}
      size="wide"
      stepKey={msg?.phase}
      hideClose
    >
      {open && msg && (
        <div className="dialog__body rollout-pop">
          <header className="rollout-pop__head">
            <h2 id={headingId} tabIndex={-1} className="dialog__title">
              {pre ? 'Auto top up is coming' : 'Auto top up is now on'}
            </h2>
            <p id={descId} className="dialog__lede">
              {pre
                ? `From ${msg.rolloutDate}, auto top up replaces manual top-ups on your ${msg.planName} plan.`
                : `Auto top up has replaced manual top-ups on your ${msg.planName} plan.`}
            </p>
          </header>

          <ul className="rollout-pop__tiles">
            <li className="rollout-pop__tile">
              <p className="rollout-pop__tile-title">Auto top up</p>
              <p>Your plan renews early and adds {fact(`${msg.credits} credits`)} when your credits run out</p>
            </li>
            <li className="rollout-pop__tile">
              <p className="rollout-pop__tile-title">Same price</p>
              <p>Each auto top up costs {fact(msg.price)}, the price of your plan. Your billing date resets</p>
            </li>
            <li className="rollout-pop__tile">
              <p className="rollout-pop__tile-title">Your control</p>
              <p>Turn it off at any time on the My Plan page</p>
            </li>
          </ul>

          <div className="rollout-pop__foot">
            <p>No action required from your end.</p>
            {pre ? (
              <Button data-autofocus onClick={msg.closePopup}>
                Got it
              </Button>
            ) : (
              <Button
                data-autofocus
                onClick={() => {
                  msg.closePopup()
                  navigate('billing')
                }}
              >
                Manage auto top up
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
