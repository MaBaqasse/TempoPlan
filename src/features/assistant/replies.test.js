import { describe, expect, it } from 'vitest'
import * as say from './replies'
import * as actions from './actions'
import { answerQuery } from './agenda'

const task = {
  title: 'Budget review',
  type: 'fixe',
  start: '2026-11-24T10:00',
  deadline: null,
  durationMin: 60,
}
const clash = { title: 'Maths class', start: '2026-11-24T10:00', durationMin: 60 }
const date = new Date(2026, 10, 23, 9)

describe('réponses localisées', () => {
  it.each(['fr', 'en', 'ar'])('fournit les réponses de replies.js en %s', (lang) => {
    const outputs = [
      say.pick(['picked']),
      say.fmtDuration(90, lang),
      say.listClashes([clash], lang),
      say.greeting(lang),
      say.thanks(lang),
      say.outOfScope(lang),
      say.question('title', { category: 'cours' }, lang),
      say.question('time', {}, lang),
      say.question('deadline', {}, lang),
      say.question('duration', {}, lang),
      say.retry('title', lang),
      say.retry('time', lang),
      say.retry('deadline', lang),
      say.retry('duration', lang),
      say.understood(task, [], lang),
      say.understood({ ...task, type: 'flexible', start: null, deadline: '2026-11-27T18:00' }, [], lang),
      say.understood(task, [clash], lang),
      say.noSlots(task, lang),
      say.noSlots({ ...task, type: 'flexible' }, lang),
      say.added(task, [], lang),
      say.added(task, [clash], lang),
      say.conflict([clash], lang),
      say.failed({ title: 'Required' }, lang),
      say.refusedAll(lang),
      say.conflictEdit(lang),
      say.conflictPropose(1, lang),
      say.conflictPropose(0, lang),
      say.unclear(lang),
      say.help(lang),
      say.soon(lang),
      say.whichSlot(lang),
      say.declined(lang),
      say.useButtons(lang),
      say.multi(['Review maths', 'Physics'], lang),
      say.nextTask('Review maths', 0, lang),
      say.nextTask('Review maths', 1, lang),
      say.skipped(lang),
      say.queueStopped(lang),
      say.pieceUnclear('Review maths', lang),
    ]

    expect(outputs.every((text) => typeof text === 'string' && text.length > 0)).toBe(true)
    expect(say.understood(task, [], lang)).toContain('Budget review')
    expect(say.added(task, [], lang)).toContain('Budget review')
    expect(say.help(lang)).toMatch(/Review networks|Réviser les réseaux|مراجعة الشبكات/)
    if (lang === 'en') expect(say.greeting(lang)).toContain('Hello!')
    if (lang === 'ar') expect(say.greeting(lang)).toContain('مرحبًا')
    if (lang === 'fr') expect(say.greeting(lang)).toContain('Bonjour')
  })

  it.each(['fr', 'en', 'ar'])('localise les réponses de consultation et de modification en %s', (lang) => {
    const next = answerQuery(
      { kind: 'next' },
      [{ ...task, start: '2026-11-24T10:00' }],
      date,
      lang,
    )
    const description = actions.describe(task, lang)
    const move = actions.proposeMove(task, '2026-11-25T11:00', lang)
    const extension = actions.extended(task, [], lang)
    const label = actions.label(task, lang)

    expect(next).toContain('Budget review')
    expect(description).toContain('Budget review')
    expect(move).toContain('Budget review')
    expect(extension).toContain('Budget review')
    expect(label).toContain('Budget review')

    const actionReplies = [
      actions.completed(task, lang),
      actions.cancelled(task, lang),
      actions.deleted(task, lang),
      actions.confirmDelete(task, lang),
      actions.declined(lang),
      actions.askWhen(task, lang),
      actions.askDelta(task, lang),
      actions.noSlot(lang),
      actions.nothing(lang),
      actions.notFound(lang),
      actions.tooShort(lang),
      actions.sameTime(lang),
      actions.pastDate(lang),
      actions.which('postpone', lang),
      actions.moved(task, [], lang),
      actions.extended(task, [clash], lang),
    ]
    expect(actionReplies.every((text) => typeof text === 'string' && text.length > 0)).toBe(true)
  })

  it('formate les heures et les jours avec la langue demandée', () => {
    expect(say.understood(task, [], 'fr')).toContain('mardi')
    expect(say.understood(task, [], 'en')).toContain('Tuesday')
    expect(say.understood(task, [], 'ar')).toContain('الثلاثاء')
  })
})
