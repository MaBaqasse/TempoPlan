import { describe, it, expect } from 'vitest'
import { splitTasks, analyzeRules, correctTypos } from '../nlParser'

const now = new Date(2026, 10, 23, 9, 0) // lundi 23 novembre 2026

describe('plusieurs taches : verbe repete et « chacune »', () => {
  it('repete le verbe et applique duree et echeance a chaque tache', () => {
    expect(splitTasks('Réviser maths et physique, 2 h chacune, avant jeudi', now)).toEqual([
      'Réviser maths 2 h, avant jeudi',
      'Réviser physique 2 h, avant jeudi',
    ])
  })

  it('chaque morceau devient une tache complete', () => {
    for (const piece of splitTasks('Réviser maths et physique, 2 h chacune, avant jeudi', now)) {
      const r = analyzeRules(piece, now)
      expect(r.intent).toBe('create')
      expect(r.task).toMatchObject({ type: 'flexible', durationMin: 120, deadline: '2026-11-26T18:00' })
      expect(r.missing).toEqual([])
    }
  })

  it('fonctionne en anglais', () => {
    const pieces = splitTasks('Revise maths and physics, 2 hours each, before friday', now)
    expect(pieces).toHaveLength(2)
    expect(pieces[1]).toMatch(/^Revise physics/)
    for (const p of pieces) expect(analyzeRules(p, now).task.durationMin).toBe(120)
  })

  it('« chacun » sans echeance', () => {
    const pieces = splitTasks('Réviser maths et physique, 1 h chacun', now)
    expect(pieces).toHaveLength(2)
    for (const p of pieces) expect(analyzeRules(p, now).task.durationMin).toBe(60)
  })

  it('ne repete pas le verbe si le 2e morceau a le sien', () => {
    const pieces = splitTasks('Réviser maths demain et appeler Paul vendredi', now)
    expect(pieces).toHaveLength(2)
    expect(pieces[1]).toMatch(/^appeler/i)
  })

  it('ne repete pas le verbe si la categorie change', () => {
    const pieces = splitTasks('Réviser maths demain et le sport samedi', now)
    expect(pieces[1]).not.toMatch(/^Réviser/)
  })

  it('une phrase simple n est pas coupee', () => {
    expect(splitTasks('Réviser les réseaux 2 h avant vendredi', now)).toBeNull()
    expect(splitTasks('Quelle est la capitale du Japon ?', now)).toBeNull()
  })
})
describe('affichage des morceaux : fautes corrigées', () => {
  it('corrige les fautes de date sans toucher au titre', () => {
    expect(correctTypos('Réviser maths 2 h, avant jeud')).toBe('Réviser maths 2 h, avant jeudi')
    expect(correctTypos('Cours de maths')).toBe('Cours de maths')
    expect(correctTypos('Soirée jeux')).toBe('Soirée jeux')
  })

  it('un texte sans faute ne change pas', () => {
    expect(correctTypos('Réviser physique 2 h, avant jeudi')).toBe('Réviser physique 2 h, avant jeudi')
    expect(correctTypos('')).toBe('')
  })
})