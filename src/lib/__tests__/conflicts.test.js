import { describe, it, expect } from 'vitest'
import { detectConflicts, findConflictsFor } from '../conflicts'

const a = { id: 'a', start: '2026-11-24T10:00', durationMin: 120 } // 10 h - 12 h
const b = { id: 'b', start: '2026-11-24T11:00', durationMin: 60 } // 11 h - 12 h
const c = { id: 'c', start: '2026-11-24T12:00', durationMin: 60 } // 12 h - 13 h

describe('detectConflicts', () => {
  it('renvoie une liste vide sans activites', () => {
    expect(detectConflicts([])).toEqual([])
  })

  it('detecte deux activites qui se chevauchent', () => {
    expect(detectConflicts([a, b])).toEqual([{ idA: 'a', idB: 'b' }])
  })

  it("ne signale pas deux activites qui s'enchainent", () => {
    expect(detectConflicts([a, c])).toEqual([])
  })

  it('ne renvoie que les vraies paires parmi plusieurs activites', () => {
    expect(detectConflicts([a, b, c])).toEqual([{ idA: 'a', idB: 'b' }])
  })

  it('ignore une activite flexible pas encore placee', () => {
    const unplaced = { id: 'u', start: null, durationMin: 60 }
    expect(detectConflicts([a, unplaced])).toEqual([])
  })

  it('ignore une activite annulee', () => {
    expect(detectConflicts([a, { ...b, status: 'annulee' }])).toEqual([])
  })

  it('ne plante pas si on ne passe pas un tableau', () => {
    expect(detectConflicts(null)).toEqual([])
  })
})

describe('findConflictsFor', () => {
  it('renvoie les activites qui chevauchent le candidat', () => {
    expect(findConflictsFor(b, [a, c])).toEqual([a])
  })

  it("ignore le candidat lui-meme s'il est dans la liste", () => {
    expect(findConflictsFor(a, [a])).toEqual([])
  })

  it('renvoie une liste vide si le candidat n a pas de creneau', () => {
    expect(findConflictsFor({ id: 'x', start: null, durationMin: 60 }, [a])).toEqual([])
  })
})