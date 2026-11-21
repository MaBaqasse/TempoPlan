// P2 : libelles et petites fonctions d'affichage pour les activites.

export const TYPE_LABELS = { fixe: 'Fixe', flexible: 'Flexible' }
export const PRIORITY_LABELS = { basse: 'Basse', moyenne: 'Moyenne', haute: 'Haute' }
export const CATEGORY_LABELS = {
  cours: 'Cours',
  revision: 'Révision',
  reunion: 'Réunion',
  projet: 'Projet',
  personnel: 'Personnel',
  loisir: 'Loisir',
}

const pad = (n) => String(n).padStart(2, '0')

// Date -> "YYYY-MM-DDTHH:mm" (heure locale) : le format stocke dans les activites.
export function toLocalISO(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// "2026-11-24T10:00" -> "mardi 24 novembre"
export function formatDay(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// "2026-11-24T10:00" -> "mar. 24 nov., 10:00"
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// "10:00 - 12:00" pour une activite placee.
export function formatTimeRange(activity) {
  const start = new Date(activity.start)
  const end = new Date(start.getTime() + activity.durationMin * 60 * 1000)
  return `${formatTime(start)} - ${formatTime(end)}`
}

// 90 -> "1 h 30", 120 -> "2 h", 45 -> "45 min"
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${pad(rest)}`
}

// Le retard ne se stocke pas : echeance depassee et activite ni terminee ni annulee.
export function isLate(activity, now = new Date()) {
  if (!activity.deadline) return false
  if (activity.status === 'terminee' || activity.status === 'annulee') return false
  return new Date(activity.deadline) < now
}

// Decale un debut d'un jour (pour "Reporter a demain").
export function addOneDay(iso) {
  const date = new Date(iso)
  date.setDate(date.getDate() + 1)
  return toLocalISO(date)
}