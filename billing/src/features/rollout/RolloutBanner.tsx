import { useUi } from '../../state/ui'
import { useRolloutMessage } from './useRolloutMessage'

/**
 * The persistent banner across the portal (PRD 5.2), written like the other products' pre- and post-rollout
 * banners: one centred sentence with the key facts in 600 and a closing "… here" link. Before rollout it says
 * what changes on the day and "here" opens pop-up A; from rollout day to T+14 it says Auto top up is on and
 * "here" goes to My Plan. A returning customer gets pop-up B only, so no banner.
 */
export function RolloutBanner() {
  const msg = useRolloutMessage()
  const { navigate } = useUi()
  if (!msg || msg.phase === 'returning') return null

  return (
    <div className="rollout-banner" role="status">
      {msg.phase === 'pre' ? (
        <p>
          Auto top up starts on <strong>{msg.rolloutDate}</strong> - if your credits run out, your{' '}
          <strong>{msg.planName}</strong> plan renews early for {msg.price}. Learn more{' '}
          <button type="button" className="text-btn" aria-label="Learn more about auto top up" onClick={msg.openPopup}>
            here
          </button>
        </p>
      ) : (
        <p>
          Auto top up is now on for your <strong>{msg.planName}</strong> plan - if your credits run out, it renews
          early for {msg.price}. Manage it{' '}
          <button type="button" className="text-btn" aria-label="Manage auto top up" onClick={() => navigate('billing')}>
            here
          </button>
        </p>
      )}
    </div>
  )
}
