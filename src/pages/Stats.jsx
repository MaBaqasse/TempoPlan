// P2 : suivi des progres (cartes chiffrees, graphiques, reports, conseils).
import { useMemo, useState } from 'react'
import { useActivities } from '@/features/activities/useActivities'
import CategoryChart from '@/features/progress/CategoryChart'
import LateTasksChart from '@/features/progress/LateTasksChart'
import PlannedVsDone from '@/features/progress/PlannedVsDone'
import { getAdvice, getFrequentlyPostponed, getProgressStats } from '@/lib/progressStats'

const PERIODS = [
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois' },
]

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
    <div className="rounded-card border border-primary-200 bg-primary-50 p-4 text-center">
      <div className="text-3xl font-bold text-ink">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}

export default function Stats() {
  const { activities } = useActivities()
  const [period, setPeriod] = useState('week')

  const { stats, postponed, advice } = useMemo(() => {
    const now = new Date()
    return {
      stats: getProgressStats(activities, period, now),
      postponed: getFrequentlyPostponed(activities, 5),
      advice: getAdvice(activities, period, now),
    }
  }, [activities, period])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Mon suivi</h1>
        <div role="tablist" aria-label="Période" className="flex gap-2">
          {PERIODS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={period === id}
              onClick={() => setPeriod(id)}
              className={`rounded-lg px-4 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 ${
                period === id
                  ? 'bg-primary-500 text-white'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="rounded-card border border-primary-200 bg-primary-50 p-6 text-center text-ink">
          Pas encore de données. Terminez une première activité pour voir vos statistiques.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Terminées" value={stats.done} />
            <Stat label="En cours" value={stats.inProgress} />
            <Stat label="En retard" value={stats.late} />
            <Stat label="Taux de réalisation" value={`${stats.percent} %`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Prévu vs réalisé">
              <PlannedVsDone days={stats.byDay} period={period} />
            </Card>

            <Card title="Répartition par catégorie">
              <CategoryChart categories={stats.byCategory} />
            </Card>

            <Card title="Tâches souvent reportées">
              {postponed.length === 0 ? (
                <p className="text-muted">Aucune tâche reportée plusieurs fois.</p>
              ) : (
                <LateTasksChart tasks={postponed} />
              )}
            </Card>

            <Card title="Conseils d'ajustement">
              {advice.length === 0 ? (
                <p className="text-muted">Aucun conseil pour le moment : votre planning est équilibré.</p>
              ) : (
                <ul className="list-disc space-y-2 pl-5 text-ink">
                  {advice.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}