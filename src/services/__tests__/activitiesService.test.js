import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  completeActivity,
  createActivity,
  deleteActivity,
  listActivities,
  postponeActivity,
  updateActivity,
} from '../activitiesService.js'

function memoryStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
}

const fixed = {
  title: 'Cours de Reseaux',
  type: 'fixe',
  category: 'cours',
  priority: 'haute',
  start: '2026-11-24T10:00',
  durationMin: 120,
}

const flexible = {
  title: 'Reviser',
  type: 'flexible',
  category: 'revision',
  priority: 'moyenne',
  start: '2026-11-24T10:00',
  durationMin: 60,
  deadline: '2026-11-30T18:00',
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  localStorage.setItem('tempoplan.session', JSON.stringify({ userId: 'u1' }))
})

describe('createActivity', () => {
  it('cree une activite valide et la liste', () => {
    const result = createActivity(fixed)
    expect(result.ok).toBe(true)
    expect(result.activity.status).toBe('a_faire')
    expect(listActivities()).toHaveLength(1)
  })

  it('refuse une activite sans titre', () => {
    const result = createActivity({ ...fixed, title: '  ' })
    expect(result.ok).toBe(false)
    expect(result.errors.title).toBeDefined()
    expect(listActivities()).toHaveLength(0)
  })

  it('refuse une activite flexible sans echeance', () => {
    const result = createActivity({ ...flexible, deadline: null })
    expect(result.ok).toBe(false)
    expect(result.errors.deadline).toBeDefined()
  })

  it('refuse une duree non entiere', () => {
    expect(createActivity({ ...fixed, durationMin: 1.5 }).ok).toBe(false)
  })
})

describe('listActivities', () => {
  it('ne renvoie que les activites de l utilisateur connecte', () => {
    createActivity(fixed)
    createActivity(fixed, 'u2')
    expect(listActivities()).toHaveLength(1)
    expect(listActivities('u2')).toHaveLength(1)
  })
})

describe('updateActivity', () => {
  it('modifie seulement les champs fournis', () => {
    const { activity } = createActivity(fixed)
    const result = updateActivity(activity.id, { title: 'Nouveau titre' })
    expect(result.activity.title).toBe('Nouveau titre')
    expect(result.activity.durationMin).toBe(120)
  })

  it('ne change jamais id, userId ni createdAt', () => {
    const { activity } = createActivity(fixed)
    const result = updateActivity(activity.id, { id: 'x', userId: 'u9', createdAt: '2000-01-01T00:00' })
    expect(result.activity.id).toBe(activity.id)
    expect(result.activity.userId).toBe('u1')
    expect(result.activity.createdAt).toBe(activity.createdAt)
  })

  it('echoue si l activite n existe pas', () => {
    expect(updateActivity('inconnu', { title: 'x' }).ok).toBe(false)
  })
})

describe('deleteActivity', () => {
  it('supprime une activite existante', () => {
    const { activity } = createActivity(fixed)
    expect(deleteActivity(activity.id)).toBe(true)
    expect(listActivities()).toHaveLength(0)
  })

  it('renvoie false si l activite n existe pas', () => {
    expect(deleteActivity('inconnu')).toBe(false)
  })
})

describe('postponeActivity et completeActivity', () => {
  it('deplace et compte le report', () => {
    const { activity } = createActivity(flexible)
    const result = postponeActivity(activity.id, '2026-11-25T10:00')
    expect(result.activity.start).toBe('2026-11-25T10:00')
    expect(result.activity.postponedCount).toBe(1)
  })

  it('marque comme terminee', () => {
    const { activity } = createActivity(fixed)
    const result = completeActivity(activity.id)
    expect(result.activity.status).toBe('terminee')
    expect(result.activity.completedAt).not.toBeNull()
  })
})