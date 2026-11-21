// P2 : CRUD des objectifs.
// Les sous-taches d'un objectif sont des activites avec goalId.
// La progression ne se stocke pas : elle se calcule avec getGoalProgress.
// Les fonctions qui modifient renvoient { ok: true, goal } ou { ok: false, errors }.
import { KEYS, getSession, readList, write } from '@/services/storage'
import { listActivities, updateActivity } from '@/services/activitiesService'
import { GOAL_TYPES } from '@/utils/constants'

const DATE_OR_DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/
const pad = (n) => String(n).padStart(2, '0')

function isValidDate(value) {
  return typeof value === 'string' && DATE_OR_DATETIME.test(value) && !Number.isNaN(new Date(value).getTime())
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
  if (!GOAL_TYPES.includes(data.type)) errors.type = 'Type invalide.'
  if (!Number.isInteger(data.importance) || data.importance < 1 || data.importance > 5) {
    errors.importance = "L'importance doit etre un entier de 1 a 5."
  }
  if (!isValidDate(data.deadline)) errors.deadline = "L'echeance est obligatoire."
  return errors
}

// Tous les objectifs de l'utilisateur (par defaut : l'utilisateur connecte).
export function listGoals(userId = currentUserId()) {
  if (!userId) return []
  return readList(KEYS.goals).filter((g) => g.userId === userId)
}

export function getGoal(id) {
  return readList(KEYS.goals).find((g) => g.id === id) ?? null
}

export function createGoal(data, userId = currentUserId()) {
  if (!userId) return fail({ userId: 'Aucun utilisateur connecte.' })

  const errors = validate(data)
  if (Object.keys(errors).length > 0) return fail(errors)

  const goal = {
    id: crypto.randomUUID(),
    userId,
    title: data.title.trim(),
    description: data.description ?? '',
    type: data.type,
    deadline: data.deadline,
    importance: data.importance,
    createdAt: nowISO(),
  }

  if (!write(KEYS.goals, [...readList(KEYS.goals), goal])) {
    return fail({ storage: 'Enregistrement impossible.' })
  }
  return { ok: true, goal }
}

// Modification partielle. id, userId et createdAt ne peuvent jamais etre modifies.
export function updateGoal(id, changes) {
  const all = readList(KEYS.goals)
  const index = all.findIndex((g) => g.id === id)
  if (index === -1) return fail({ id: 'Objectif introuvable.' })

  const allowed = { ...changes }
  delete allowed.id
  delete allowed.userId
  delete allowed.createdAt

  const updated = { ...all[index], ...allowed }
  const errors = validate(updated)
  if (Object.keys(errors).length > 0) return fail(errors)

  const next = [...all]
  next[index] = updated
  if (!write(KEYS.goals, next)) return fail({ storage: 'Enregistrement impossible.' })
  return { ok: true, goal: updated }
}

// Supprime l'objectif. Ses activites ne sont pas supprimees : elles sont detachees (goalId = null).
// Renvoie true si l'objectif a ete supprime.
export function deleteGoal(id) {
  const all = readList(KEYS.goals)
  const goal = all.find((g) => g.id === id)
  if (!goal) return false

  listActivities(goal.userId)
    .filter((a) => a.goalId === id)
    .forEach((a) => updateActivity(a.id, { goalId: null }))

  return write(
    KEYS.goals,
    all.filter((g) => g.id !== id),
  )
}

/**
 * Progression d'un objectif, calculee a partir de ses activites (les annulees sont ignorees).
 * @returns {{ total: number, done: number, percent: number, remainingMinutes: number }}
 */
export function getGoalProgress(goalId, activities = listActivities()) {
  const linked = activities.filter((a) => a.goalId === goalId && a.status !== 'annulee')
  const done = linked.filter((a) => a.status === 'terminee')
  const remainingMinutes = linked
    .filter((a) => a.status !== 'terminee')
    .reduce((sum, a) => sum + a.durationMin, 0)

  return {
    total: linked.length,
    done: done.length,
    percent: linked.length === 0 ? 0 : Math.round((done.length / linked.length) * 100),
    remainingMinutes,
  }
}