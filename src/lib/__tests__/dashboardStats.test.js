import { describe, expect, it } from 'vitest'
import {
  formatTimeLeft,
  getAlerts,
  getTodayActivities,
  getUpcomingDeadlines,
  getWeekSummary,
  isOverdue,
} from '../dashboardStats'

const now = new Date('2026-11-21T12:00:00') // samedi 21 novembre 2026

const act = (id, fields = {}) => ({
  id,
  start: null,
  durationMin: 60,
  deadline: null,
  status: 'a_faire',
  ...fields,
})

describe('isOverdue', () => {
  it('detecte une echeance depassee', () => {
    expect(isOverdue(act('a', { deadline: '2026-11-20T18:00' }), now)).toBe(true)
  })

  it('ignore une activite terminee ou sans echeance, ou a echeance future', () => {
    expect(isOverdue(act('a', { deadline: '2026-11-20T18:00', status: 'terminee' }), now)).toBe(false)
    expect(isOverdue(act('b'), now)).toBe(false)
    expect(isOverdue(act('c', { deadline: '2026-11-25T18:00' }), now)).toBe(false)
  })
})

describe('getTodayActivities', () => {
  it("renvoie les activites d'aujourd'hui dans l'ordre, sans annulees ni non placees", () => {
    const list = [
      act('t2', { start: '2026-11-21T18:00' }),
      act('t1', { start: '2026-11-21T09:00' }),
      act('tomorrow', { start: '2026-11-22T10:00' }),
      act('cancelled', { start: '2026-11-21T10:00', status: 'annulee' }),
      act('unplaced'),
    ]
    expect(getTodayActivities(list, now).map((a) => a.id)).toEqual(['t1', 't2'])
  })
})

describe('getUpcomingDeadlines', () => {
  const list = [
    act('far', { deadline: '2026-11-25T18:00' }),
    act('soon', { deadline: '2026-11-23T09:00' }),
    act('past', { deadline: '2026-11-20T18:00' }),
    act('done', { deadline: '2026-11-22T18:00', status: 'terminee' }),
  ]

  it('trie par echeance et ignore le passe et le termine', () => {
    expect(getUpcomingDeadlines(list, now).map((a) => a.id)).toEqual(['soon', 'far'])
  })

  it('respecte la limite', () => {
    expect(getUpcomingDeadlines(list, now, 1).map((a) => a.id)).toEqual(['soon'])
  })
})

describe('getWeekSummary', () => {
  it('compte les activites de la semaine du lundi au dimanche', () => {
    const list = [
      act('done', { start: '2026-11-20T14:00', status: 'terminee' }),
      act('late', { start: '2026-11-19T10:00', deadline: '2026-11-20T18:00' }),
      act('progress', { start: '2026-11-21T18:00', status: 'en_cours' }),
      act('todo', { start: '2026-11-22T10:00' }),
      act('nextWeek', { start: '2026-11-23T10:00' }),
      act('lastWeek', { start: '2026-11-15T10:00' }),
      act('cancelled', { start: '2026-11-21T10:00', status: 'annulee' }),
    ]
    expect(getWeekSummary(list, now)).toEqual({
      total: 4,
      done: 1,
      inProgress: 1,
      late: 1,
      percent: 25,
    })
  })

  it('renvoie des zeros sans activite', () => {
    expect(getWeekSummary([], now)).toEqual({ total: 0, done: 0, inProgress: 0, late: 0, percent: 0 })
  })
})

describe('getAlerts', () => {
  it('renvoie les conflits a venir et les activites en retard', () => {
    const list = [
      act('a', { start: '2026-11-22T10:00', durationMin: 120 }),
      act('b', { start: '2026-11-22T11:00' }),
      act('lateOne', { deadline: '2026-11-20T18:00' }),
      act('pastX', { start: '2026-11-18T10:00', durationMin: 120 }),
      act('pastY', { start: '2026-11-18T11:00' }),
    ]
    const alerts = getAlerts(list, now)
    expect(alerts.conflicts).toHaveLength(1)
    expect(alerts.conflicts[0].a.id).toBe('a')
    expect(alerts.conflicts[0].b.id).toBe('b')
    expect(alerts.late.map((x) => x.id)).toEqual(['lateOne'])
  })

  it("ignore un conflit avec une activite terminee", () => {
    const list = [
      act('a', { start: '2026-11-22T10:00', durationMin: 120 }),
      act('b', { start: '2026-11-22T11:00', status: 'terminee' }),
    ]
    expect(getAlerts(list, now).conflicts).toEqual([])
  })
})

describe('formatTimeLeft', () => {
  it('formate le temps restant', () => {
    expect(formatTimeLeft('2026-11-21T12:30', now)).toBe('dans 30 min')
    expect(formatTimeLeft('2026-11-21T15:00', now)).toBe('dans 3 h')
    expect(formatTimeLeft('2026-11-22T14:00', now)).toBe('dans 1 jour')
    expect(formatTimeLeft('2026-11-24T12:00', now)).toBe('dans 3 jours')
  })

  it('indique un retard si l echeance est passee', () => {
    expect(formatTimeLeft('2026-11-20T12:00', now)).toBe('en retard')
  })
})