// P2 : tableau de bord (vue du jour, echeances, resume de la semaine, alertes).
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import {
  TYPE_LABELS,
  formatDateTime,
  formatDay,
  formatDuration,
  formatTimeRange,
} from '@/features/activities/activityUtils'
import { useActivities } from '@/features/activities/useActivities'
import {
  formatTimeLeft,
  getAlerts,
  getTodayActivities,
  getUpcomingDeadlines,
  getWeekSummary,
} from '@/lib/dashboardStats'
import { KEYS, getSession, readList } from '@/services/storage'

const TYPE_STYLES = {
  fixe: 'bg-primary-500 text-white',
  flexible: 'border border-primary-200 bg-primary-50 text-primary-800',
}

function Card({ title, children }) {
  return (
    <section className="rounded-card border border-primary-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-primary-50 p-3 text-center">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const { activities, completeActivity } = useActivities()

  // Prenom de l'utilisateur connecte (absent tant que l'inscription n'est pas branchee).
  const firstName = useMemo(() => {
    const userId = getSession()?.userId
    return readList(KEYS.users).find((user) => user.id === userId)?.firstName ?? ''
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      now,
      today: getTodayActivities(activities, now),
      upcoming: getUpcomingDeadlines(activities, now, 5),
      week: getWeekSummary(activities, now),
      alerts: getAlerts(activities, now),
    }
  }, [activities])

  const { now, today, upcoming, week, alerts } = stats
  const hasAlerts = alerts.conflicts.length > 0 || alerts.late.length > 0

  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">
          Bonjour{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-muted">
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}. Voici votre journée.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button to="/app/activities">Ajouter une activité</Button>
        <Button to="/app/assistant" variant="secondary">
          Demander à l'assistant
        </Button>
        <Button to="/app/planning" variant="secondary">
          Générer mon planning
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Aujourd'hui">
          {today.length === 0 ? (
            <p className="text-muted">
              Rien de prévu aujourd'hui. Ajoutez une activité ou demandez un planning à l'assistant.
            </p>
          ) : (
            <ul className="space-y-3">
              {today.map((activity) => {
                const done = activity.status === 'terminee'
                return (
                  <li key={activity.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`done-${activity.id}`}
                        className="mt-1.5 size-4 accent-primary-500"
                        checked={done}
                        disabled={done}
                        onChange={() => completeActivity(activity.id)}
                      />
                      <label
                        htmlFor={`done-${activity.id}`}
                        className={done ? 'text-muted line-through' : 'text-ink'}
                      >
                        <span className="font-medium">{formatTimeRange(activity)}</span>
                        {' · '}
                        {activity.title}
                        <span className="block text-sm text-muted">
                          {formatDuration(activity.durationMin)}
                        </span>
                      </label>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium ${TYPE_STYLES[activity.type]}`}
                    >
                      {TYPE_LABELS[activity.type]}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title="Prochaines échéances">
          {upcoming.length === 0 ? (
            <p className="text-muted">Aucune échéance à venir.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink">{activity.title}</div>
                    <div className="text-sm text-muted">{formatDateTime(activity.deadline)}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-800">
                    {formatTimeLeft(activity.deadline, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Résumé de la semaine">
          {week.total === 0 ? (
            <p className="text-muted">Aucune activité cette semaine.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Terminées" value={week.done} />
                <Stat label="En cours" value={week.inProgress} />
                <Stat label="En retard" value={week.late} />
              </div>
              <div
                role="progressbar"
                aria-label="Progression de la semaine"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={week.percent}
                className="mt-4 h-2 rounded-full bg-primary-100"
              >
                <div
                  className="h-2 rounded-full bg-primary-500"
                  style={{ width: `${week.percent}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-muted">
                {week.done} sur {week.total} activités terminées ({week.percent} %)
              </p>
            </>
          )}
        </Card>

        <Card title="Alertes">
          {!hasAlerts ? (
            <p className="text-muted">Aucune alerte. Vous êtes à jour.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.conflicts.map(({ a, b }) => (
                <li key={`${a.id}-${b.id}`} className="rounded-lg bg-red-50 p-3 text-red-900">
                  Conflit : « {a.title} » et « {b.title} » ({formatDay(a.start)}).{' '}
                  <Link to="/app/activities" className="font-medium underline">
                    Corriger
                  </Link>
                </li>
              ))}
              {alerts.late.map((activity) => (
                <li key={activity.id} className="rounded-lg bg-red-50 p-3 text-red-900">
                  En retard : « {activity.title} » (échéance {formatDateTime(activity.deadline)}).{' '}
                  <Link to="/app/activities" className="font-medium underline">
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}