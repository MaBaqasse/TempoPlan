// P1 : interrupteur (activé / désactivé) avec libellé et description.
//   <Switch label="Échéances proches" description="Prévenir avant chaque date limite." checked={v} onChange={setV} />
import { useId } from 'react'

export default function Switch({ checked, onChange, label, description, disabled = false, id, className = '' }) {
  const autoId = useId()
  const switchId = id ?? autoId
  const descId = switchId + '-description'

  return (
    <div className={'flex items-start justify-between gap-4 ' + className}>
      <div className="min-w-0">
        <label htmlFor={switchId} className="cursor-pointer font-medium text-ink">
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-0.5 text-sm text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 ' +
          (checked ? 'bg-primary-500' : 'bg-slate-300')
        }
      >
        <span
          aria-hidden="true"
          className={
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ' +
            (checked ? 'translate-x-5' : 'translate-x-0')
          }
        />
      </button>
    </div>
  )
}
