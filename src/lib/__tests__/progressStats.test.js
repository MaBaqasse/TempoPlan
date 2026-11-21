import { describe, expect, it } from 'vitest'
import {
  getAdvice,
  getFrequentlyPostponed,
  getPeriodRange,
  getProgressStats,
} from '../progressStats'

const now = new Date('2026-11-21T12:00:00') // samedi 21 novembre 2026

const act = (id, fields = {}) => ({
  id,
  title: 'Titre',
  category: 'cours',
  start: null,
  durationMin: 60,
  deadline: null,
  status: 'a_faire',
  postponedCount: 0,
  ...fields,
})

describe('getPeriodRange', () => {
  it('renvoie la semaine du lundi au lundi suivant', () => {
    const { start, end } = getPeriodRange('week', now)
    expect(start).toEqual(new Date(2026, 10, 16))
    expect(end).toEqual(new Date(2026, 10, 23))
  })

  it('renvoie le mois en cours', () => {
    const { start, end } = getPeriodRange('month', now)
    expect(start).toEqual(new Date(2026, 10, 1))
    expect(end).toEqual(new Date(2026, 11, 1))
  })
})

describe('getProgressStats', () => {
  const list = [
    act('done', { start: '2026-11-20T14:00', status: 'terminee', durationMin: 90, category: 'revision' }),
    act('late', { start: '2026-11-19T10:00', deadline: '2026-11-20T18:00' }),
    act('progress', { start: '2026-11-21T18:00', status: 'en_cours' }),
    act('todo', { start: '2026-11-22T10:00', category: 'projet' }),
    act('nextWeek', { start: '2026-11-23T10:00' }),
    act('cancelled', { start: '2026-11-21T10:00', status: 'annulee' }),
  ]

  it('compte les activites de la semaine', () => {
    expect(getProgressStats(list, 'week', now)).toMatchObject({
      total: 4,
      done: 1,
      inProgress: 1,
      late: 1,
      percent: 25,
    })
  })

  it('calcule les minutes prevues et realisees par jour', () => {
    const { byDay } = getProgressStats(list, 'week', now)
    expect(byDay).toHaveLength(7)
    expect(byDay.find((d) => d.date === '2026-11-20')).toEqual({
      date: '2026-11-20',
      plannedMin: 90,
      doneMin: 90,
    })
    expect(byDay.find((d) => d.date === '2026-11-22')).toEqual({
      date: '2026-11-22',
      plannedMin: 60,
      doneMin: 0,
    })
  })

  it('repartit les minutes par categorie, de la plus grande a la plus petite', () => {
    expect(getProgressStats(list, 'week', now).byCategory).toEqual([
      { category: 'cours', minutes: 120 },
      { category: 'revision', minutes: 90 },
      { category: 'projet', minutes: 60 },
    ])
  })

  it('renvoie un jour par jour du mois pour la periode "month"', () => {
    const stats = getProgressStats(list, 'month', now)
    expect(stats.byDay).toHaveLength(30)
    expect(stats.total).toBe(5)
  })

  it('renvoie des zeros sans activite', () => {
    expect(getProgressStats([], 'week', now)).toMatchObject({ total: 0, done: 0, percent: 0 })
  })
})

describe('getFrequentlyPostponed', () => {
  it('garde les activites reportees 2 fois ou plus, les plus reportees d abord', () => {
    const list = [
      act('b', { postponedCount: 2 }),
      act('a', { postponedCount: 3 }),
      act('c', { postponedCount: 1 }),
      act('d', { postponedCount: 5, status: 'annulee' }),
    ]
    expect(getFrequentlyPostponed(list).map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('getAdvice', () => {
  it('conseille de traiter les retards et les reports repetes', () => {
    const list = [
      act('late', {
        title: 'Maths',
        start: '2026-11-19T10:00',
        deadline: '2026-11-20T18:00',
        postponedCount: 2,
      }),
    ]
    const tips = getAdvice(list, 'week', now)
    expect(tips.some((t) => t.includes('en retard'))).toBe(true)
    expect(tips.some((t) => t.includes('« Maths »') && t.includes('2 fois'))).toBe(true)
  })

  it('detecte une journee tres chargee', () => {
    const list = [
      act('a', { start: '2026-11-19T08:00', durationMin: 180 }),
      act('b', { start: '2026-11-19T12:00', durationMin: 180 }),
      act('c', { start: '2026-11-19T16:00', durationMin: 180 }),
    ]
    expect(getAdvice(list, 'week', now).some((t) => t.includes('très chargé'))).toBe(true)
  })

  it('detecte des soirees chargees sur plusieurs jours', () => {
    const list = ['17', '18'].flatMap((day) =>
      [18, 19, 20].map((hour) =>
        act(`${day}-${hour}`, { start: `2026-11-${day}T${hour}:00`, durationMin: 30 }),
      ),
    )
    expect(getAdvice(list, 'week', now).some((t) => t.includes('soirées'))).toBe(true)
  })

  it('ne renvoie aucun conseil quand tout va bien', () => {
    expect(getAdvice([act('ok', { start: '2026-11-22T10:00' })], 'week', now)).toEqual([])
  })
})