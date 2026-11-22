// P2 : calculs de la page Suivi des progres.
// Fonctions pures : pas de React, pas de localStorage.
import { isOverdue } from './dashboardStats'

const MAX_DAILY_MINUTES = 8 * 60 // au-dela, une journee est consideree comme tres chargee
const EVENING_HOUR = 18
const MAX_EVENING_ACTIVITIES = 2
const MANY_POSTPONEMENTS = 2

const pad = (n) => String(n).padStart(2, '0')
const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const toHours = (minutes) => Math.round((minutes / 60) * 10) / 10

/**
 * Periode : 'week' (lundi -> dimanche) ou 'month' (mois en cours).
 * @returns {{ start: Date, end: Date }} debut inclus, fin exclue
 */
export function getPeriodRange(period, now = new Date()) {
  if (period === 'month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    }
  }
  const daysSinceMonday = (now.getDay() + 6) % 7
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  return { start, end }
}

// Activites de la periode (hors annulees) : selon leur debut, ou leur echeance si elles ne sont pas placees.
function activitiesInPeriod(activities, range) {
  return activities.filter((a) => {
    if (a.status === 'annulee') return false
    const reference = a.start ?? a.deadline
    if (!reference) return false
    const date = new Date(reference)
    return date >= range.start && date < range.end
  })
}

// Minutes prevues et realisees pour chaque jour de la periode.
function getDailyMinutes(inPeriod, range) {
  const days = new Map()
  for (
    let d = new Date(range.start);
    d < range.end;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    days.set(dayKey(d), { date: dayKey(d), plannedMin: 0, doneMin: 0 })
  }

  for (const a of inPeriod) {
    if (!a.start) continue
    const entry = days.get(a.start.slice(0, 10))
    if (!entry) continue
    entry.plannedMin += a.durationMin
    if (a.status === 'terminee') entry.doneMin += a.durationMin
  }

  return [...days.values()]
}

// Minutes par categorie, de la plus grande a la plus petite.
function getCategoryMinutes(inPeriod) {
  const totals = new Map()
  for (const a of inPeriod) {
    totals.set(a.category, (totals.get(a.category) ?? 0) + a.durationMin)
  }
  return [...totals]
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

/**
 * Chiffres de la page Suivi pour une periode.
 * @returns {{ total, done, inProgress, late, percent, byDay, byCategory }}
 */
export function getProgressStats(activities, period = 'week', now = new Date()) {
  const range = getPeriodRange(period, now)
  const inPeriod = activitiesInPeriod(activities, range)

  const done = inPeriod.filter((a) => a.status === 'terminee').length
  const late = inPeriod.filter((a) => isOverdue(a, now)).length
  const inProgress = inPeriod.filter((a) => a.status === 'en_cours' && !isOverdue(a, now)).length

  return {
    total: inPeriod.length,
    done,
    inProgress,
    late,
    percent: inPeriod.length === 0 ? 0 : Math.round((done / inPeriod.length) * 100),
    byDay: getDailyMinutes(inPeriod, range),
    byCategory: getCategoryMinutes(inPeriod),
  }
}

// Activites reportees plusieurs fois (toutes periodes), les plus reportees d'abord.
export function getFrequentlyPostponed(activities, limit = 5) {
  return activities
    .filter((a) => a.status !== 'annulee' && a.postponedCount >= MANY_POSTPONEMENTS)
    .sort((a, b) => b.postponedCount - a.postponedCount || a.title.localeCompare(b.title))
    .slice(0, limit)
}

// Conseils d'ajustement calcules par regles. Renvoie une liste de phrases (vide si tout va bien).
export function getAdvice(activities, period = 'week', now = new Date()) {
  const range = getPeriodRange(period, now)
  const inPeriod = activitiesInPeriod(activities, range)
  const tips = []

  // 1. Retards
  const lateCount = activities.filter((a) => isOverdue(a, now)).length
  if (lateCount === 1) {
    tips.push('1 activité est en retard. Traitez-la en priorité ou replanifiez-la.')
  } else if (lateCount > 1) {
    tips.push(`${lateCount} activités sont en retard. Traitez-les en priorité ou replanifiez-les.`)
  }

  // 2. Reports repetes
  const [mostPostponed] = getFrequentlyPostponed(activities, 1)
  if (mostPostponed) {
    tips.push(
      `« ${mostPostponed.title} » a été reportée ${mostPostponed.postponedCount} fois. ` +
        'Essayez de la placer plus tôt ou de la découper en étapes.',
    )
  }

  // 3. Journee tres chargee
  const busiest = getDailyMinutes(inPeriod, range)
    .filter((d) => d.plannedMin > MAX_DAILY_MINUTES)
    .sort((a, b) => b.plannedMin - a.plannedMin)[0]
  if (busiest) {
    const label = new Date(`${busiest.date}T00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    tips.push(
      `Le ${label} est très chargé (${toHours(busiest.plannedMin)} h prévues). ` +
        "Répartissez une partie du travail sur d'autres jours.",
    )
  }

  // 4. Soirees chargees : plus de 2 activites apres 18 h, sur au moins 2 jours
  const eveningsByDay = new Map()
  for (const a of inPeriod) {
    if (a.start && new Date(a.start).getHours() >= EVENING_HOUR) {
      const key = a.start.slice(0, 10)
      eveningsByDay.set(key, (eveningsByDay.get(key) ?? 0) + 1)
    }
  }
  const crowdedEvenings = [...eveningsByDay.values()].filter(
    (count) => count > MAX_EVENING_ACTIVITIES,
  ).length
  if (crowdedEvenings >= 2) {
    tips.push(
      `Vos soirées sont souvent trop chargées. Essayez de limiter à ${MAX_EVENING_ACTIVITIES} tâches après ${EVENING_HOUR} h.`,
    )
  }

  return tips
}