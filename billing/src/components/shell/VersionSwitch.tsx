import { useUi, type Version } from '../../state/ui'

const VERSIONS: { id: Version; label: string; hint: string }[] = [
  { id: 'a', label: 'Version A', hint: 'Current design' },
  { id: 'b', label: 'Version B', hint: 'Billing redesign' },
]

/** Demo-only: flips the whole portal between the current design (A) and the redesign (B). */
export function VersionSwitch() {
  const { version, setVersion, route } = useUi()
  // Checkout is a separate hosted page in production, so the prototype chrome stays off it.
  if (route === 'checkout') return null
  return (
    <div className="version-switch" role="group" aria-label="Design version">
      {VERSIONS.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={version === v.id}
          title={v.hint}
          onClick={() => setVersion(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
