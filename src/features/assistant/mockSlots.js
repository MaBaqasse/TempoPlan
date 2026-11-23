// P5 : creneaux PROVISOIRES en attendant findFreeSlots de P4.
// Ils evitent deja les conflits grace a findConflictsFor (P2).
// A remplacer par : findFreeSlots(activities, settings, duration, deadline)
import { findConflictsFor } from '@/lib/conflicts'

const pad = (n) => String(n).padStart(2, '0')
const toISO = (d, h) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:00`
const dayStart = (d, offset = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset)

export function formatSlot(startISO, durationMin) {
  const start = new Date(startISO)
  const end = new Date(start.getTime() + durationMin * 60000)
  const day = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
  const hm = (d) => `${d.getHours()} h${d.getMinutes() ? pad(d.getMinutes()) : ''}`
  return `${day.charAt(0).toUpperCase() + day.slice(1)}, ${hm(start)} - ${hm(end)}`
}

const isFree = (start, durationMin, activities) =>
  findConflictsFor({ start, durationMin }, activities).length === 0

// Le creneau doit se terminer avant 22 h
const endsInDay = (start, durationMin) => {
  const s = new Date(start)
  return s.getTime() + durationMin * 60000 <= dayStart(s).getTime() + 22 * 3600000
}

function fixedSlots(task, activities, now) {
  const { start, durationMin } = task
  if (new Date(start) > now && isFree(start, durationMin, activities)) {
    return [{ start, reason: 'Heure demandée, aucun conflit.' }]
  }

  const wanted = new Date(start)
  const wantedHour = wanted.getHours()
  const slots = []
  const sameDayHours = Array.from({ length: 12 }, (_, i) => 8 + i)
    .filter((h) => h !== wantedHour)
    .sort((a, b) => Math.abs(a - wantedHour) - Math.abs(b - wantedHour))

  for (const h of sameDayHours) {
    if (slots.length >= 2) break
    const candidate = toISO(wanted, h)
    if (new Date(candidate) > now && endsInDay(candidate, durationMin) && isFree(candidate, durationMin, activities)) {
      slots.push({ start: candidate, reason: 'Libre le même jour.' })
    }
  }
  for (let offset = 1; offset <= 5 && slots.length < 3; offset++) {
    const candidate = toISO(dayStart(wanted, offset), wantedHour)
    if (endsInDay(candidate, durationMin) && isFree(candidate, durationMin, activities)) {
      slots.push({ start: candidate, reason: 'Même heure, un autre jour.' })
    }
  }
  return slots
}

function flexibleSlots(task, activities, now) {
  const { deadline, durationMin } = task
  const deadlineDate = new Date(deadline)
  const hours = [14, 10, 16, 9, 11, 15, 17]
  const slots = []

  // On evite la derniere minute : les jours precedents d'abord, le jour meme en dernier.
  for (const back of [1, 2, 3, 4, 5, 6, 7, 0]) {
    if (slots.length >= 3) break
    const day = dayStart(deadlineDate, -back)
    for (const h of hours) {
      const start = toISO(day, h)
      const startMs = new Date(start).getTime()
      if (startMs <= now.getTime()) continue
      if (startMs + durationMin * 60000 > deadlineDate.getTime()) continue
      if (!endsInDay(start, durationMin) || !isFree(start, durationMin, activities)) continue
      slots.push({
        start,
        reason:
          back === 0
            ? "Disponible le jour de l'échéance."
            : `Disponible et ${back} jour${back > 1 ? 's' : ''} avant l'échéance.`,
      })
      break
    }
  }
  return slots
}

// Creneaux libres (au plus 3) pour une tache. Liste vide si rien n'est libre.
export function getSlots(task, activities = [], now = new Date()) {
  if (task.type === 'fixe' && task.start) return fixedSlots(task, activities, now)
  if (!task.deadline) return []
  return flexibleSlots(task, activities, now)
}