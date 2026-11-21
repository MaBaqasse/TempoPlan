// P2 : CRUD des activites.
// Seul fichier qui lit et ecrit les activites. Passe toujours par storage.js.
// Les fonctions qui modifient renvoient { ok: true, activity, conflicts } ou { ok: false, errors }.
// "conflicts" liste les activites qui chevauchent celle qui vient d'etre enregistree.
import { KEYS, getSession, readList, write } from '@/services/storage'
import { findConflictsFor } from '@/lib/conflicts'
import { ACTIVITY_TYPES, CATEGORIES, PRIORITIES, STATUSES } from '@/utils/constants'

const LOCAL_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const pad = (n) => String(n).padStart(2, '0')

function isLocalISO(value) {
  return typeof value === 'string' && LOCAL_ISO.test(value) && !Number.isNaN(new Date(value).getTime())
}

function nowISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Utilisateur connecte (la session est ecrite par l'authentification de P1).
function currentUserId() {
  return getSession()?.userId ?? null
}

const fail = (errors) => ({ ok: false, errors })

// Renvoie un objet { champ: message } ; vide si tout est valide.
function validate(data) {
  const errors = {}
  if (!data.title || !String(data.title).trim()) errors.title = 'Le titre est obligatoire.'
  if (!ACTIVITY_TYPES.includes(data.type)) errors.type = 'Type invalide.'
  if (!CATEGORIES.includes(data.category)) errors.category = 'Categorie invalide.'
  if (!PRIORITIES.includes(data.priority)) errors.priority = 'Priorite invalide.'
  if (!Number.isInteger(data.durationMin) || data.durationMin <= 0) {
    errors.durationMin = 'La duree doit etre un nombre entier de minutes superieur a 0.'
  }
  if (data.status !== undefined && !STATUSES.includes(data.status)) errors.status = 'Statut invalide.'

  if (data.type === 'fixe' && !isLocalISO(data.start)) {
    errors.start = 'Une activite fixe a besoin d une date et heure de debut.'
  }
  if (data.type === 'flexible') {
    if (!isLocalISO(data.deadline)) errors.deadline = 'Une activite flexible a besoin d une echeance.'
    if (data.start != null && !isLocalISO(data.start)) errors.start = 'Date de debut invalide.'
  }
  return errors
}

export function listActivities(userId = currentUserId()) {
  if (!userId) return []
  return readList(KEYS.activities).filter((a) => a.userId === userId)
}

export function getActivity(id) {
  return readList(KEYS.activities).find((a) => a.id === id) ?? null
}

export function createActivity(data, userId = currentUserId()) {
  if (!userId) return fail({ userId: 'Aucun utilisateur connecte.' })

  const errors = validate(data)
  if (Object.keys(errors).length > 0) return fail(errors)

  const activity = {
    id: crypto.randomUUID(),
    userId,
    title: data.title.trim(),
    notes: data.notes ?? '',
    type: data.type,
    category: data.category,
    priority: data.priority,
    start: data.start ?? null,
    durationMin: data.durationMin,
    deadline: data.deadline ?? null,
    status: data.status ?? 'a_faire',
    goalId: data.goalId ?? null,
    postponedCount: 0,
    recurrence: data.recurrence ?? null,
    completedAt: null,
    createdAt: nowISO(),
  }

  const conflicts = findConflictsFor(activity, listActivities(userId))

  if (!write(KEYS.activities, [...readList(KEYS.activities), activity])) {
    return fail({ storage: 'Enregistrement impossible.' })
  }
  return { ok: true, activity, conflicts }
}

export function updateActivity(id, changes) {
  const all = readList(KEYS.activities)
  const index = all.findIndex((a) => a.id === id)
  if (index === -1) return fail({ id: 'Activite introuvable.' })

  const allowed = { ...changes }
  delete allowed.id
  delete allowed.userId
  delete allowed.createdAt

  const updated = { ...all[index], ...allowed }
  const errors = validate(updated)
  if (Object.keys(errors).length > 0) return fail(errors)

  const conflicts = findConflictsFor(updated, listActivities(updated.userId))

  const next = [...all]
  next[index] = updated
  if (!write(KEYS.activities, next)) return fail({ storage: 'Enregistrement impossible.' })
  return { ok: true, activity: updated, conflicts }
}

export function deleteActivity(id) {
  const all = readList(KEYS.activities)
  const next = all.filter((a) => a.id !== id)
  if (next.length === all.length) return false
  return write(KEYS.activities, next)
}

// Deplace l'activite a un nouveau debut et compte le report (pour le suivi).
export function postponeActivity(id, newStart) {
  if (!isLocalISO(newStart)) return fail({ start: 'Date de debut invalide.' })
  const activity = getActivity(id)
  if (!activity) return fail({ id: 'Activite introuvable.' })
  return updateActivity(id, { start: newStart, postponedCount: activity.postponedCount + 1 })
}

export function completeActivity(id) {
  return updateActivity(id, { status: 'terminee', completedAt: nowISO() })
}