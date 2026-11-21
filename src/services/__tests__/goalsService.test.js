import { beforeEach, describe, expect, it, vi } from 'vitest'
import { completeActivity, createActivity, listActivities } from '../activitiesService.js'
import {
  createGoal,
  deleteGoal,
  getGoalProgress,
  listGoals,
  updateGoal,
} from '../goalsService.js'

// localStorage factice en memoire, pour tester sans navigateur.
function memoryStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
}

const goalData = {
  title: "Reussir l'examen de reseaux",
  type: 'court_terme',
  deadline: '2026-12-01',
  importance: 5,
}

// Cree une activite flexible liee a un objectif.
const linkedActivity = (goalId, durationMin) => ({
  title: `Etape ${durationMin}`,
  type: 'flexible',
  category: 'revision',
  priority: 'haute',
  start: null,
  durationMin,
  deadline: '2026-11-30T18:00',
  goalId,
})

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  localStorage.setItem('tempoplan.session', JSON.stringify({ userId: 'u1' }))
})

describe('createGoal', () => {
  it('cree un objectif valide et le liste', () => {
    const result = createGoal(goalData)
    expect(result.ok).toBe(true)
    expect(listGoals()).toHaveLength(1)
  })

  it('refuse un objectif sans titre', () => {
    const result = createGoal({ ...goalData, title: ' ' })
    expect(result.ok).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('refuse une importance hors de 1 a 5', () => {
    expect(createGoal({ ...goalData, importance: 6 }).ok).toBe(false)
    expect(createGoal({ ...goalData, importance: 0 }).ok).toBe(false)
  })

  it('refuse un type invalide', () => {
    expect(createGoal({ ...goalData, type: 'moyen_terme' }).ok).toBe(false)
  })
})

describe('listGoals', () => {
  it("ne renvoie que les objectifs de l'utilisateur connecte", () => {
    createGoal(goalData)
    createGoal(goalData, 'u2')
    expect(listGoals()).toHaveLength(1)
    expect(listGoals('u2')).toHaveLength(1)
  })
})

describe('updateGoal', () => {
  it('modifie seulement les champs fournis', () => {
    const { goal } = createGoal(goalData)
    const result = updateGoal(goal.id, { importance: 3 })
    expect(result.goal.importance).toBe(3)
    expect(result.goal.title).toBe(goalData.title)
  })

  it('ne change jamais id, userId ni createdAt', () => {
    const { goal } = createGoal(goalData)
    const result = updateGoal(goal.id, { id: 'x', userId: 'u9', createdAt: '2000-01-01T00:00' })
    expect(result.goal.id).toBe(goal.id)
    expect(result.goal.userId).toBe('u1')
    expect(result.goal.createdAt).toBe(goal.createdAt)
  })
})

describe('deleteGoal', () => {
  it("supprime l'objectif et detache ses activites sans les supprimer", () => {
    const { goal } = createGoal(goalData)
    createActivity(linkedActivity(goal.id, 60))

    expect(deleteGoal(goal.id)).toBe(true)
    expect(listGoals()).toHaveLength(0)
    expect(listActivities()).toHaveLength(1)
    expect(listActivities()[0].goalId).toBeNull()
  })

  it("renvoie false si l'objectif n'existe pas", () => {
    expect(deleteGoal('inconnu')).toBe(false)
  })
})

describe('getGoalProgress', () => {
  it('renvoie zero pour un objectif sans activite', () => {
    const { goal } = createGoal(goalData)
    expect(getGoalProgress(goal.id)).toEqual({ total: 0, done: 0, percent: 0, remainingMinutes: 0 })
  })

  it('calcule la progression et le travail restant', () => {
    const { goal } = createGoal(goalData)
    const first = createActivity(linkedActivity(goal.id, 60)).activity
    createActivity(linkedActivity(goal.id, 90))
    createActivity(linkedActivity(goal.id, 30))
    completeActivity(first.id)

    expect(getGoalProgress(goal.id)).toEqual({
      total: 3,
      done: 1,
      percent: 33,
      remainingMinutes: 120,
    })
  })

  it('ignore les activites annulees', () => {
    const { goal } = createGoal(goalData)
    createActivity({ ...linkedActivity(goal.id, 60), status: 'annulee' })
    expect(getGoalProgress(goal.id).total).toBe(0)
  })
})