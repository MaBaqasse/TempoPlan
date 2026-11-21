// P2 : calculs du tableau de bord.
// Fonctions pures : pas de React, pas de localStorage.
import { detectConflicts } from './conflicts'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

const isActive = (activity) => activity.status !== 'terminee' && activity.status !== 'annulee'

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

// Lundi 00:00 (inclus) -> lundi suivant 00:00 (exclu), pour la semaine qui contient "now".
function getWeekRange(now) {
  const daysSinceMonday = (now.getDay() + 6) % 7
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday)
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7)
  return { weekStart, weekEnd }
}

// Retard : echeance depassee et activite ni terminee ni annulee (il ne se stocke pas).
export function isOverdue(activity, now = new Date()) {
  return Boolean(activity.deadline) && isActive(activity) && new Date(activity.deadline) < now
}

// Activites placees aujourd'hui (hors annulees), par ordre chronologique.
export function getTodayActivities(activities, now = new Date()) {
  const dayStart = startOfDay(now)
  const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1)

  return activities
    .filter((a) => {
      if (!a.start || a.status === 'annulee') return false
      const start = new Date(a.start)
      return start >= dayStart && start < dayEnd
    })
    .sort((a, b) => a.start.localeCompare(b.start))
}

// Prochaines echeances (activites a faire dont l'echeance n'est pas depassee).
export function getUpcomingDeadlines(activities, now = new Date(), limit = 5) {
  return activities
    .filter((a) => a.deadline && isActive(a) && new Date(a.deadline) >= now)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, limit)
}

/**
 * Resume de la semaine en cours (du lundi au dimanche).
 * Une activite compte dans la semaine selon son debut, ou son echeance si elle n'est pas placee.
 */
export function getWeekSummary(activities, now = new Date()) {
  const { weekStart, weekEnd } = getWeekRange(now)

  const inWeek = activities.filter((a) => {
    if (a.status === 'annulee') return false
    const reference = a.start ?? a.deadline
    if (!reference) return false
    const date = new Date(reference)
    return date >= weekStart && date < weekEnd
  })

  const done = inWeek.filter((a) => a.status === 'terminee').length
  const late = inWeek.filter((a) => isOverdue(a, now)).length
  const inProgress = inWeek.filter((a) => a.status === 'en_cours' && !isOverdue(a, now)).length

  return {
    total: inWeek.length,
    done,
    inProgress,
    late,
    percent: inWeek.length === 0 ? 0 : Math.round((done / inWeek.length) * 100),
  }
}

/**
 * Alertes : conflits a venir (aujourd'hui ou plus tard) et activites en retard.
 * @returns {{ conflicts: Array<{ a: object, b: object }>, late: Array }}
 */
export function getAlerts(activities, now = new Date()) {
  const dayStart = startOfDay(now)
  const upcoming = activities.filter(
    (a) => isActive(a) && a.start && new Date(a.start) >= dayStart,
  )
  const byId = new Map(upcoming.map((a) => [a.id, a]))

  const conflicts = detectConflicts(upcoming).map(({ idA, idB }) => ({
    a: byId.get(idA),
    b: byId.get(idB),
  }))

  const late = activities
    .filter((a) => isOverdue(a, now))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))

  return { conflicts, late }
}

// "dans 30 min", "dans 3 h", "dans 2 jours", ou "en retard".
export function formatTimeLeft(deadline, now = new Date()) {
  const diff = new Date(deadline).getTime() - now.getTime()
  if (diff < 0) return 'en retard'
  if (diff < MS_PER_HOUR) return `dans ${Math.max(1, Math.round(diff / MS_PER_MINUTE))} min`
  if (diff < MS_PER_DAY) return `dans ${Math.round(diff / MS_PER_HOUR)} h`
  const days = Math.floor(diff / MS_PER_DAY)
  return `dans ${days} jour${days > 1 ? 's' : ''}`
}