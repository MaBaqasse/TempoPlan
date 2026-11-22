import { describe, expect, it } from 'vitest'
import { analyzeRules, normalize, parseAction, parseQuery, parseTaskDetailed, preprocess } from '../nlParser'
import { cases, now } from '../../features/assistant/dev/nlRulesParity.cases'
import { answerQuery } from '../../features/assistant/agenda'

describe('parité des intentions et tâches en mode règles', () => {
  for (const { phrase, intent, task, missing, action, baselineKo } of cases) {
    const test = baselineKo ? it.fails : it
    test(`${phrase} → ${intent}`, () => {
      const result = analyzeRules(phrase, now)
      expect(result.intent).toBe(intent)
      if (task) expect(result.task).toMatchObject(task)
      if (action) expect(parseAction(phrase, now)).toMatchObject(action)
      if (missing) {
        const detailed = parseTaskDetailed(phrase, now)
        expect(detailed?.missing).toEqual(missing)
      }
    })
  }

  it('répond à la question sur la prochaine activité', () => {
    const query = parseQuery('Quel est mon prochain cours ?', now)
    expect(query.kind).toBe('next')
    expect(answerQuery(query, [{ title: 'Cours de maths', start: '2026-11-24T10:00', durationMin: 60 }], now)).toContain(
      'Cours de maths',
    )
  })

  it('les questions sur une journée occupée passent par les plages libres', () => {
    expect(parseQuery('Est-ce que je suis occupé jeudi ?', now)).toMatchObject({
      kind: 'free',
      from: new Date(2026, 10, 26),
    })
    expect(parseQuery('How busy am I on Thursday?', now).kind).toBe('free')
  })

  it.each([
    ['Réunion demain 14h', 'Réunion', '2026-11-24T14:00'],
    ['TD lundi 8h', 'TD', '2026-11-30T08:00'],
    ['Réunion demain 7 h', 'Réunion', '2026-11-24T07:00'],
    ['Réunion demain à 14 heures', 'Réunion', '2026-11-24T14:00'],
    ['Réunion demain à midi', 'Réunion', '2026-11-24T12:00'],
    ['Réunion demain à minuit', 'Réunion', '2026-11-24T00:00'],
    ['Réunion demain 8 h du soir', 'Réunion', '2026-11-24T20:00'],
    ["Réunion demain 3 h de l'après-midi", 'Réunion', '2026-11-24T15:00'],
  ])('analyse l’heure dans « %s »', (phrase, title, start) => {
    const { task } = parseTaskDetailed(phrase, now)
    expect(task).toMatchObject({ title, type: 'fixe', start })
  })

  it('distingue les durées courtes des heures sans « à »', () => {
    expect(parseTaskDetailed('Réviser les réseaux demain 2 h', now).task).toMatchObject({
      type: 'flexible',
      durationMin: 120,
    })
    expect(parseTaskDetailed('Réviser les réseaux demain 6 h', now).task.durationMin).toBe(360)
  })

  it.each([
    ['Réviser les réseaux le 25 novembre', '2026-11-25'],
    ['Réviser les réseaux 25 nov', '2026-11-25'],
    ['Réviser les réseaux dans 2 semaines', '2026-12-07'],
    ['Réviser les réseaux dans trois jours', '2026-11-26'],
    ['Réviser les réseaux ce lundi', '2026-11-30'],
  ])('analyse la date dans « %s »', (phrase, date) => {
    expect(parseTaskDetailed(phrase, now).task.deadline).toBe(`${date}T18:00`)
  })

  it.each([
    ['Réunion demain après midi', '2026-11-24T14:00'],
    ["Réunion demain l'après-midi", '2026-11-24T14:00'],
    ['Réunion demain en soirée', '2026-11-24T18:00'],
  ])('analyse la période dans « %s »', (phrase, start) => {
    expect(parseTaskDetailed(phrase, now).task.start).toBe(start)
  })

  it('corrige les fautes temporelles et darija sans casser les titres', () => {
    const typoCases = [
      ['avnt', 'avant'],
      ['aprs', 'apres'],
      ["aujoud'hui", "aujourd'hui"],
      ['matn', 'matin'],
      ['sori', 'soir'],
      ['heurrs', 'heures'],
      ['minuts', 'minutes'],
      ['reporle', 'reporte'],
      ['annull', 'annule'],
      ['supprmie', 'supprime'],
      ['termnie', 'termine'],
      ['liber', 'libre'],
      ['planing', 'planning'],
      ['echeanc', 'echeance'],
    ]
    for (const [input, expected] of typoCases) expect(preprocess(input)).toBe(expected)

    const titles = [
      'Cours de maths',
      'Soirée jeux',
      'Matin calme',
      'Avant-première cinéma',
      'Le livre bleu',
      'Un moment libre',
      'Planning annuel',
      'Réunion du soir',
      'Étude des heures',
      'Termite dans le jardin',
      'Minutes perdues',
    ]
    for (const title of titles) expect(preprocess(title)).toBe(title)
  })

  it('prétraite la darija et garde les titres dans leur langue', () => {
    for (const phrase of [
      'ghda réviser réseaux',
      'lyoum réviser réseaux',
      'réviser sbah',
      'réviser l3chiya',
      'réviser lmasa',
      'wach 3andi chi cours ghda?',
      'chno l planning dyali lyoum?',
      'bghit nwjed l examen dyal réseaux',
      'zid l cours l 14h',
      'bdel l cours l 14h',
      'mn 10 l 12',
      'هل عندي درس غدا؟',
      'بدل وقت الاجتماع',
      'هدفي النجاح في الامتحان',
    ]) {
      expect(preprocess(preprocess(phrase))).toBe(preprocess(phrase))
    }

    expect(normalize('Réunion à 14h, l’été')).toHaveLength('Réunion à 14h, l’été'.length)
    expect(parseTaskDetailed('اجتماع غدا الساعة 14 ساعتين', now).task.title).toBe('اجتماع')
    expect(parseTaskDetailed('عندي امتحان الشبكات', now).task.title).toBe('امتحان الشبكات')
    expect(parseTaskDetailed('تحضير عرض المشروع', now).task.title).toBe('تحضير عرض المشروع')
    expect(parseTaskDetailed('Réviser الرياضيات demain', now).task.title).toBe('Réviser الرياضيات')
  })

  it.each([
    ['Bonjour', 'chitchat', 'Bonjour'],
    ['hello', 'chitchat', 'Hello!'],
    ['مرحبا', 'chitchat', 'مرحبًا'],
    ['merci beaucoup', 'chitchat', 'Avec plaisir'],
    ['thanks', 'chitchat', 'You’re welcome'],
    ['شكرا', 'chitchat', 'على الرحب'],
    ['aide', 'chitchat', 'une tâche'],
    ['help', 'chitchat', 'a task'],
    ['ماذا تستطيع أن تفعل؟', 'chitchat', 'يمكنني مساعدتك'],
    ['la météo demain', 'other', 'Je peux seulement'],
    ['Tell me a joke, please', 'other', 'I can only help'],
    ['What is the capital of Japan?', 'other', 'I can only help'],
    ['Who won the match?', 'other', 'I can only help'],
    ['ما عاصمة اليابان؟', 'other', 'يمكنني مساعدتك فقط'],
    ['azerty', 'other', "Je n'ai pas bien compris"],
    ['???', 'other', "Je n'ai pas bien compris"],
  ])('répond en %s au message « %s »', (phrase, intent, reply) => {
    const result = analyzeRules(phrase, now)
    expect(result.intent).toBe(intent)
    expect(result.reply).toContain(reply)
  })
})
