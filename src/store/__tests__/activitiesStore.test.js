import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createActivity } from '@/services/activitiesService'
import { useActivitiesStore } from '../activitiesStore.js'

// localStorage factice en memoire, pour tester sans navigateur.
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

const getState = () => useActivitiesStore.getState()

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  localStorage.setItem('tempoplan.session', JSON.stringify({ userId: 'u1' }))
  useActivitiesStore.setState({ activities: [] })
})

describe('activitiesStore', () => {
  it("addActivity ajoute l'activite dans le store", () => {
    const result = getState().addActivity(fixed)
    expect(result.ok).toBe(true)
    expect(getState().activities).toHaveLength(1)
  })

  it('addActivity avec des donnees invalides ne change pas le store', () => {
    const result = getState().addActivity({ ...fixed, title: '' })
    expect(result.ok).toBe(false)
    expect(getState().activities).toHaveLength(0)
  })

  it('addActivity renvoie les conflits', () => {
    getState().addActivity(fixed)
    const result = getState().addActivity({ ...fixed, title: 'Reunion', start: '2026-11-24T11:00', durationMin: 60 })
    expect(result.conflicts).toHaveLength(1)
  })

  it("deleteActivity retire l'activite du store", () => {
    const { activity } = getState().addActivity(fixed)
    expect(getState().deleteActivity(activity.id)).toBe(true)
    expect(getState().activities).toHaveLength(0)
  })

  it('completeActivity met a jour le statut dans le store', () => {
    const { activity } = getState().addActivity(fixed)
    getState().completeActivity(activity.id)
    expect(getState().activities[0].status).toBe('terminee')
  })

  it('load relit les activites depuis le stockage', () => {
    createActivity(fixed) // ecrit directement via le service, le store ne le sait pas encore
    expect(getState().activities).toHaveLength(0)
    getState().load()
    expect(getState().activities).toHaveLength(1)
  })
})