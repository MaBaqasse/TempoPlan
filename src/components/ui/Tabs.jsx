// P1 : onglets accessibles (flèches gauche/droite, Début, Fin).
// Le composant affiche seulement la barre d’onglets ; c’est vous qui choisissez le contenu à afficher.
//
//   const [tab, setTab] = useState('all')
//   <Tabs
//     idPrefix="activites" ariaLabel="Filtrer les activités"
//     tabs={[{ id: 'all', label: 'Toutes', count: 14 }, { id: 'fixe', label: 'Fixes' }, { id: 'flexible', label: 'Flexibles' }]}
//     value={tab} onChange={setTab}
//   />
//   <TabPanel idPrefix="activites" value={tab}>...contenu...</TabPanel>
import { useRef } from 'react'

export function Tabs({
  tabs,
  value,
  onChange,
  ariaLabel = 'Onglets',
  idPrefix = 'tabs',
  className = '',
}) {
  const refs = useRef({})

  function handleKeyDown(e, index) {
    const targets = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }
    if (!(e.key in targets)) return
    e.preventDefault()
    const next = tabs[(targets[e.key] + tabs.length) % tabs.length]
    onChange(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <div className={'max-w-full overflow-x-auto ' + className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex gap-1 rounded-xl bg-primary-50 p-1"
      >
        {tabs.map((tab, i) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el
              }}
              type="button"
              role="tab"
              id={idPrefix + '-' + tab.id}
              aria-selected={active}
              aria-controls={idPrefix + '-panel'}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={
                'flex items-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 ' +
                (active
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-600 hover:text-primary-600')
              }
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={
                    'ml-2 rounded-full px-2 text-xs ' +
                    (active ? 'bg-primary-100 text-primary-700' : 'bg-white/70 text-slate-600')
                  }
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TabPanel({ idPrefix = 'tabs', value, className = '', children }) {
  return (
    <div
      role="tabpanel"
      id={idPrefix + '-panel'}
      aria-labelledby={idPrefix + '-' + value}
      tabIndex={0}
      className={
        'rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 ' +
        className
      }
    >
      {children}
    </div>
  )
}

export default Tabs
