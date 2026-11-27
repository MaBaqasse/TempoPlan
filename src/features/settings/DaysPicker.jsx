// P1 : choix des jours actifs (1 = lundi ... 7 = dimanche). Utilisé par les Paramètres et l’Onboarding.
const DAYS = [
  { id: 1, short: 'Lun', long: 'Lundi' },
  { id: 2, short: 'Mar', long: 'Mardi' },
  { id: 3, short: 'Mer', long: 'Mercredi' },
  { id: 4, short: 'Jeu', long: 'Jeudi' },
  { id: 5, short: 'Ven', long: 'Vendredi' },
  { id: 6, short: 'Sam', long: 'Samedi' },
  { id: 7, short: 'Dim', long: 'Dimanche' },
]

export default function DaysPicker({ value, onChange, error }) {
  function toggle(id) {
    onChange(value.includes(id) ? value.filter((d) => d !== id) : [...value, id].sort((a, b) => a - b))
  }

  return (
    <div>
      <div role="group" aria-label="Jours actifs" className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const on = value.includes(day.id)
          return (
            <button
              key={day.id}
              type="button"
              aria-pressed={on}
              aria-label={day.long}
              onClick={() => toggle(day.id)}
              className={
                'min-w-14 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' +
                (on
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-primary-200 bg-white text-slate-700 hover:bg-primary-50')
              }
            >
              {day.short}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
