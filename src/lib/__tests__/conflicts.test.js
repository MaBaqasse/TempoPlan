import { describe, it, expect } from 'vitest'
import { detectConflicts } from '../conflicts'

describe('detectConflicts', () => {
  it('renvoie une liste vide sans activites', () => {
    expect(detectConflicts([])).toEqual([])
  })
})
