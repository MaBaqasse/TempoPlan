// P2 : carte d'une activite (titre, badges, details, actions).
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  formatDateTime,
  formatDay,
  formatDuration,
  formatTimeRange,
  isLate,
} from './activityUtils'

// Le rouge est reserve aux retards et aux conflits (voir le dossier de conception).
const PRIORITY_STYLES = {
  haute: 'bg-orange-100 text-orange-800',
  moyenne: 'bg-primary-100 text-primary-800',
  basse: 'bg-slate-100 text-slate-700',
}

const TYPE_STYLES = {
  fixe: 'bg-primary-500 text-white',
  flexible: 'border border-primary-200 bg-primary-50 text-primary-800',
}

function Pill({ className, children }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${className}`}>{children}</span>
  )
}

function ActionButton({ className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${className}`}
      {...props}
    />
  )
}

export default function ActivityCard({
  activity,
  hasConflict = false,
  onEdit,
  onPostpone,
  onComplete,
  onDelete,
}) {
  const done = activity.status === 'terminee'
  const late = isLate(activity)

  return (
    <article
      className={`rounded-card border bg-white p-4 ${hasConflict ? 'border-red-300' : 'border-primary-200'} ${done ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={`text-lg font-semibold text-ink ${done ? 'line-through' : ''}`}>
          {activity.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <Pill className={TYPE_STYLES[activity.type]}>{TYPE_LABELS[activity.type]}</Pill>
          <Pill className={PRIORITY_STYLES[activity.priority]}>
            {PRIORITY_LABELS[activity.priority]}
          </Pill>
          {hasConflict && <Pill className="bg-red-100 text-red-800">Conflit</Pill>}
          {late && <Pill className="bg-red-100 text-red-800">En retard</Pill>}
          {done && <Pill className="bg-green-100 text-green-800">Terminée</Pill>}
        </div>
      </div>

      <dl className="mt-2 space-y-0.5 text-muted">
        <div>
          {activity.start
            ? `${formatDay(activity.start)}, ${formatTimeRange(activity)}`
            : 'Pas encore placée dans le planning'}
        </div>
        {activity.deadline && <div>Échéance : {formatDateTime(activity.deadline)}</div>}
        <div>
          {formatDuration(activity.durationMin)} · {CATEGORY_LABELS[activity.category]}
          {activity.recurrence === 'weekly' ? ' · Chaque semaine' : ''}
        </div>
        {activity.postponedCount > 0 && <div>Reportée {activity.postponedCount} fois</div>}
        {activity.notes && <div className="pt-1 text-ink">{activity.notes}</div>}
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        {!done && (
          <ActionButton
            className="bg-primary-100 text-primary-700 hover:bg-primary-200"
            onClick={() => onComplete(activity)}
            aria-label={`Marquer ${activity.title} comme terminée`}
          >
            Terminer
          </ActionButton>
        )}
        <ActionButton
          className="border border-primary-200 text-ink hover:bg-primary-50"
          onClick={() => onEdit(activity)}
          aria-label={`Modifier ${activity.title}`}
        >
          Modifier
        </ActionButton>
        {!done && activity.start && (
          <ActionButton
            className="border border-primary-200 text-ink hover:bg-primary-50"
            onClick={() => onPostpone(activity)}
            aria-label={`Reporter ${activity.title} à demain`}
          >
            Reporter
          </ActionButton>
        )}
        <ActionButton
          className="border border-red-200 text-red-800 hover:bg-red-50"
          onClick={() => onDelete(activity)}
          aria-label={`Supprimer ${activity.title}`}
        >
          Supprimer
        </ActionButton>
      </div>
    </article>
  )
}