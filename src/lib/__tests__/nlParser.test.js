// P5 : tests du parseur de langage naturel (src/lib/nlParser.js)
// Lancer : npx vitest run src/lib/__tests__/nlParser.test.js
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeRules,
  completeTask,
  isGenericTitle,
  missingFields,
  normalize,
  parseAction,
  parseQuery,
  parseTaskDetailed,
  parseTaskSmart,
  parseWhen,
  parseWithAI,
  refineTask,
  yesNo,
} from '../nlParser'

// Dimanche 22 novembre 2026, 19 h (heure locale) : date fixe pour que les tests ne dependent pas de l'horloge.
// Donc : demain = lundi 23 novembre, vendredi = 27 novembre.
const NOW = new Date(2026, 10, 22, 19, 0)

const fixedTask = (over = {}) => ({
  title: 'Cours de maths',
  category: 'cours',
  priority: 'moyenne',
  durationMin: 60,
  type: 'fixe',
  start: '2026-11-23T12:00',
  deadline: null,
  ...over,
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('normalize', () => {
  it('enleve les accents et garde la meme longueur', () => {
    const text = 'Réunion à 14h, l’été'
    const out = normalize(text)
    expect(out).toBe("reunion a 14h, l'ete")
    expect(out).toHaveLength(text.length)
  })
})

describe('parseTaskDetailed', () => {
  it('comprend une plage horaire : activite fixe, duree calculee', () => {
    const { task, missing } = parseTaskDetailed('Réunion demain de 14h à 15h30', NOW)
    expect(task).toMatchObject({
      title: 'Réunion',
      type: 'fixe',
      category: 'reunion',
      start: '2026-11-23T14:00',
      durationMin: 90,
    })
    expect(missing).toEqual([])
  })

  it('comprend une echeance : activite flexible, priorite haute si moins de 7 jours', () => {
    const { task, missing } = parseTaskDetailed('Réviser les réseaux 2 h avant vendredi', NOW)
    expect(task).toMatchObject({
      title: 'Réviser les réseaux',
      type: 'flexible',
      category: 'revision',
      priority: 'haute',
      durationMin: 120,
      deadline: '2026-11-27T18:00',
      start: null,
    })
    expect(missing).toEqual([])
  })

  it('priorite basse avec "facultatif"', () => {
    const { task } = parseTaskDetailed('Lire un article facultatif avant le 15/12', NOW)
    expect(task.priority).toBe('basse')
    expect(task.deadline).toBe('2026-12-15T18:00')
  })

  it("une heure sans duree : on prend 1 h par defaut et on le signale", () => {
    const { task, assumed } = parseTaskDetailed('Cours de maths lundi à 10h', NOW)
    expect(task).toMatchObject({ title: 'Cours de maths', type: 'fixe', start: '2026-11-23T10:00', durationMin: 60 })
    expect(task._noDuration).toBe(true)
    expect(assumed).toEqual(['durationMin'])
  })

  it("un cours avec une date mais sans heure : l'heure est a demander", () => {
    const { task, missing } = parseTaskDetailed('cours lundi', NOW)
    expect(task).toMatchObject({ title: 'Cours', category: 'cours', type: 'fixe', start: null, _date: '2026-11-23' })
    expect(missing).toEqual(['time'])
  })

  it('une phrase sans date ni heure ni duree n est pas comprise', () => {
    expect(parseTaskDetailed('bonjour tout le monde', NOW)).toBeNull()
    expect(parseTaskDetailed('', NOW)).toBeNull()
  })
})

describe('titre trop generique', () => {
  it('isGenericTitle', () => {
    expect(isGenericTitle('Cours')).toBe(true)
    expect(isGenericTitle('Réunion')).toBe(true)
    expect(isGenericTitle('Projet')).toBe(true)
    expect(isGenericTitle('Cours de maths')).toBe(false)
    expect(isGenericTitle('Réviser les réseaux')).toBe(false)
  })

  it("missingFields demande d'abord le titre, puis l'heure, puis la duree", () => {
    const { task } = parseTaskDetailed('cours lundi', NOW)
    expect(missingFields(task)).toEqual(['title', 'time', 'duration'])
  })

  it('un titre precis ne redemande pas le titre', () => {
    const { task } = parseTaskDetailed('Cours de maths lundi', NOW)
    expect(missingFields(task)).toEqual(['time', 'duration'])
    expect(missingFields(parseTaskDetailed('Réunion demain', NOW).task)).toEqual(['title', 'time', 'duration'])
  })

  it('completeTask (title) construit un titre naturel', () => {
    const cours = { title: 'Cours' }
    expect(completeTask(cours, 'title', 'maths', NOW).title).toBe('Cours de maths')
    expect(completeTask(cours, 'title', 'anglais', NOW).title).toBe("Cours d'anglais")
    expect(completeTask(cours, 'title', 'de physique', NOW).title).toBe('Cours de physique')
    expect(completeTask(cours, 'title', 'cours de maths', NOW).title).toBe('Cours de maths')
    expect(completeTask({ title: 'Réunion' }, 'title', 'budget', NOW).title).toBe('Réunion budget')
  })

  it('completeTask (title) refuse une reponse vide, un oui/non ou trop longue', () => {
    expect(completeTask({ title: 'Cours' }, 'title', '   ', NOW)).toBeNull()
    expect(completeTask({ title: 'Cours' }, 'title', 'oui', NOW)).toBeNull()
    expect(completeTask({ title: 'Cours' }, 'title', 'x'.repeat(61), NOW)).toBeNull()
  })

  it('scenario complet : « cours lundi » -> maths -> 12H -> 2H', () => {
    let { task } = parseTaskDetailed('cours lundi', NOW)
    task = completeTask(task, 'title', 'maths', NOW)
    expect(missingFields(task)).toEqual(['time', 'duration'])
    task = completeTask(task, 'time', '12H', NOW)
    expect(missingFields(task)).toEqual(['duration'])
    task = completeTask(task, 'duration', '2H', NOW)
    expect(missingFields(task)).toEqual([])
    expect(task).toMatchObject({ title: 'Cours de maths', type: 'fixe', start: '2026-11-23T12:00', durationMin: 120 })
  })
})

describe('completeTask : heure, echeance, duree', () => {
  const waiting = fixedTask({ start: null, _date: '2026-11-23', _noDuration: true })

  it("heure : « 12H » complete la date deja connue", () => {
    const out = completeTask(waiting, 'time', '12H', NOW)
    expect(out.start).toBe('2026-11-23T12:00')
    expect(out._date).toBeUndefined()
    expect(out._noDuration).toBe(true)
  })

  it('heure : une plage donne aussi la duree', () => {
    const out = completeTask(waiting, 'time', 'de 14h à 15h30', NOW)
    expect(out).toMatchObject({ start: '2026-11-23T14:00', durationMin: 90 })
    expect(out._noDuration).toBeUndefined()
  })

  it("heure : une periode de la journee (« l'apres-midi »)", () => {
    expect(completeTask(waiting, 'time', "l'après-midi", NOW).start).toBe('2026-11-23T14:00')
  })

  it('heure : reponse incomprise -> null', () => {
    expect(completeTask(waiting, 'time', 'je ne sais pas', NOW)).toBeNull()
  })

  it.each([
    ['2H', 120],
    ['45 min', 45],
    ['une heure', 60],
    ['demi-heure', 30],
    ['une heure et demie', 90],
    ['1 h et demie', 90],
    ['2', 120],
    ['90', 90],
  ])('duree : « %s » = %i min', (answer, minutes) => {
    const out = completeTask(fixedTask({ _noDuration: true }), 'duration', answer, NOW)
    expect(out.durationMin).toBe(minutes)
    expect(out._noDuration).toBeUndefined()
  })

  it('duree : reponse incomprise -> null', () => {
    expect(completeTask(fixedTask({ _noDuration: true }), 'duration', 'bientôt', NOW)).toBeNull()
  })

  it('echeance : « vendredi » donne 18 h par defaut, « vendredi 10h » garde l heure', () => {
    const flexible = { title: 'Rapport', type: 'flexible', start: null, deadline: null, durationMin: 60 }
    expect(completeTask(flexible, 'deadline', 'vendredi', NOW).deadline).toBe('2026-11-27T18:00')
    expect(completeTask(flexible, 'deadline', 'vendredi à 10h', NOW).deadline).toBe('2026-11-27T10:00')
    expect(completeTask(flexible, 'deadline', 'bientôt', NOW)).toBeNull()
  })
})

describe('yesNo', () => {
  it.each(['oui', 'Oui', 'ok merci', "d'accord", 'Ça marche', 'vas-y', 'parfait'])('« %s » = oui', (text) => {
    expect(yesNo(text)).toBe('yes')
  })
  it.each(['non', 'Non merci', 'laisse tomber', 'finalement non'])('« %s » = non', (text) => {
    expect(yesNo(text)).toBe('no')
  })
  it.each(['non, 2 h', 'peut-être', '   ', '', undefined])('« %s » n est ni oui ni non', (text) => {
    expect(yesNo(text)).toBeNull()
  })
})

describe('refineTask (corrections)', () => {
  it('« non 2 h » change la duree', () => {
    expect(refineTask(fixedTask(), 'non 2 h', NOW).durationMin).toBe(120)
  })

  it('« plutôt 15h » change l heure, pas la duree', () => {
    const out = refineTask(fixedTask(), 'plutôt 15h', NOW)
    expect(out.start).toBe('2026-11-23T15:00')
    expect(out.durationMin).toBe(60)
  })

  it('« mets-le vendredi » change le jour et garde l heure', () => {
    expect(refineTask(fixedTask(), 'mets-le vendredi', NOW).start).toBe('2026-11-27T12:00')
  })

  it("un message qui n'est pas une correction -> null", () => {
    expect(refineTask(fixedTask(), 'bonjour', NOW)).toBeNull()
    expect(refineTask(null, 'non 2 h', NOW)).toBeNull()
  })
})

describe('analyzeRules (intentions)', () => {
  it('salutation, remerciement, aide', () => {
    expect(analyzeRules('Bonjour', NOW).intent).toBe('chitchat')
    expect(analyzeRules('merci', NOW).intent).toBe('chitchat')
    expect(analyzeRules('aide', NOW).intent).toBe('chitchat')
  })

  it('questions sur le planning', () => {
    expect(analyzeRules("J'ai quoi demain ?", NOW).intent).toBe('query')
    expect(analyzeRules('Que dois-je faire cette semaine ?', NOW).intent).toBe('query')
    expect(analyzeRules('Suis-je libre jeudi après-midi ?', NOW).intent).toBe('query')
  })

  it('modifications', () => {
    expect(analyzeRules('reporte mon cours', NOW).intent).toBe('modify')
    expect(analyzeRules("j'ai fini le rapport", NOW).intent).toBe('modify')
    expect(analyzeRules('supprime la réunion', NOW).intent).toBe('modify')
  })

  it('objectif', () => {
    expect(analyzeRules("J'ai un objectif : réussir l'examen", NOW).intent).toBe('goal')
  })

  it('creation, y compris avec un verbe « ajoute »', () => {
    expect(analyzeRules('Réunion demain de 14 h à 15 h 30', NOW).intent).toBe('create')
    const out = analyzeRules('Ajoute un cours demain', NOW)
    expect(out.intent).toBe('create')
    expect(out.missing).toEqual(['time'])
  })

  it('phrase incomprise', () => {
    expect(analyzeRules('blabla', NOW).intent).toBe('other')
    expect(analyzeRules('', NOW).intent).toBe('other')
  })
})

describe('parseWhen', () => {
  it('jour et heure', () => {
    expect(parseWhen('demain à 16h', NOW)).toMatchObject({ date: '2026-11-23', clock: [16, 0] })
  })
  it('jour seul, heure seule', () => {
    expect(parseWhen('lundi', NOW)).toMatchObject({ date: '2026-11-23', clock: null })
    expect(parseWhen('à 10h30', NOW)).toMatchObject({ date: null, clock: [10, 30] })
  })
})

describe('parseAction', () => {
  it('terminer : repere les mots du titre', () => {
    const out = parseAction("j'ai fini mon cours de maths", NOW)
    expect(out.action).toBe('complete')
    expect(out.tokens).toEqual(['cours', 'maths'])
  })

  it('supprimer, avec un filtre sur la date', () => {
    const out = parseAction('supprime la réunion de demain', NOW)
    expect(out).toMatchObject({ action: 'delete', filterDate: '2026-11-23', tokens: ['reunion'] })
  })

  it('annuler', () => {
    expect(parseAction('annule la réunion', NOW)).toMatchObject({ action: 'cancel', tokens: ['reunion'] })
  })

  it('reporter vers demain', () => {
    const out = parseAction('reporte le rapport à demain', NOW)
    expect(out).toMatchObject({ action: 'postpone', tokens: ['rapport'] })
    expect(out.when.date).toBe('2026-11-23')
  })

  it('replanifier, et « j ai raté »', () => {
    expect(parseAction('replanifie mon rapport', NOW)).toMatchObject({ action: 'reschedule', tokens: ['rapport'] })
    expect(parseAction("j'ai raté mon cours", NOW)).toMatchObject({ action: 'reschedule', tokens: ['cours'] })
  })

  it('rallonger ou raccourcir une duree', () => {
    expect(parseAction('mon cours dure 1 h de plus', NOW)).toMatchObject({ action: 'extend', deltaMin: 60, sign: 1 })
    expect(parseAction('mon cours dure 30 min de moins', NOW)).toMatchObject({ action: 'extend', deltaMin: -30, sign: -1 })
  })

  it('pas une action -> null', () => {
    expect(parseAction('bonjour', NOW)).toBeNull()
  })
})

describe('parseQuery', () => {
  it('« j ai quoi demain ? » : planning de demain', () => {
    const q = parseQuery("J'ai quoi demain ?", NOW)
    expect(q.kind).toBe('agenda')
    expect(q.label).toBe('demain')
    expect(q.from).toEqual(new Date(2026, 10, 23))
    expect(q.to).toEqual(new Date(2026, 10, 24))
  })

  it('« suis-je libre jeudi apres-midi ? » : plages libres, periode connue', () => {
    const q = parseQuery('Suis-je libre jeudi après-midi ?', NOW)
    expect(q.kind).toBe('free')
    expect(q.period).toBe('apres-midi')
    expect(q.from).toEqual(new Date(2026, 10, 26))
  })

  it('« trouve-moi 2 h cette semaine » : duree demandee', () => {
    const q = parseQuery('Trouve-moi 2 h cette semaine', NOW)
    expect(q).toMatchObject({ kind: 'free', durationMin: 120, label: 'cette semaine' })
  })

  it('taches en retard', () => {
    const q = parseQuery('Quelles sont mes tâches en retard ?', NOW)
    expect(q.kind).toBe('late')
    expect(q.from).toBeNull()
  })

  it('echeances', () => {
    expect(parseQuery('Quelles sont mes échéances ?', NOW)).toMatchObject({ kind: 'deadlines', label: 'dans les 7 prochains jours' })
  })
})

describe('parseTaskSmart et Gemini', () => {
  const gemini = { ai: { apiKey: 'cle-test', mode: 'gemini' } }
  const rulesOnly = { ai: { apiKey: '', mode: 'rules' } }
  const silent = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
  const reply = (obj) => ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }),
  })

  it('un ordre reconnu par les regles ne passe pas par Gemini', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const out = await parseTaskSmart("J'ai quoi demain ?", gemini, NOW)
    expect(out).toMatchObject({ intent: 'query', mode: 'regles', aiSkipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mode regles : aucun appel reseau', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const out = await parseTaskSmart('Réviser les réseaux 2 h avant vendredi', rulesOnly, NOW)
    expect(out).toMatchObject({ intent: 'create', mode: 'regles' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reponse Gemini valide : tache creee en mode IA', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        reply({
          intent: 'create',
          task: {
            title: 'Réviser les réseaux',
            type: 'flexible',
            category: 'revision',
            priority: 'haute',
            durationMin: 120,
            start: null,
            deadline: '2026-11-27T18:00',
          },
        }),
      ),
    )
    const out = await parseTaskSmart('Réviser les réseaux 2 h avant vendredi', gemini, NOW)
    expect(out.mode).toBe('ia')
    expect(out.task).toMatchObject({ type: 'flexible', durationMin: 120, deadline: '2026-11-27T18:00' })
    expect(out.missing).toEqual([])
  })

  it("Gemini : date connue sans heure (T00:00) -> l'heure est a demander", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        reply({
          intent: 'create',
          task: { title: 'Cours', type: 'fixe', category: 'cours', priority: 'moyenne', durationMin: null, start: '2026-11-23T00:00', deadline: null },
        }),
      ),
    )
    const out = await parseWithAI('cours lundi', 'cle-test', NOW)
    expect(out.task).toMatchObject({ start: null, _date: '2026-11-23', _noDuration: true })
    expect(out.missing).toEqual(['time'])
  })

  it.each([
    [503, 'unavailable'],
    [500, 'unavailable'],
    [429, 'quota'],
    [403, 'key'],
    [401, 'key'],
  ])('erreur HTTP %i : repli sur les regles (%s)', async (status, kind) => {
    silent()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))
    const out = await parseTaskSmart('Réviser les réseaux 2 h avant vendredi', gemini, NOW)
    expect(out).toMatchObject({ mode: 'regles', aiError: kind, intent: 'create' })
    expect(out.task.durationMin).toBe(120)
  })

  it('503 : les 2 modeles sont essayes', async () => {
    silent()
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    vi.stubGlobal('fetch', fetchMock)
    await parseTaskSmart('Réviser les réseaux 2 h avant vendredi', gemini, NOW)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reseau coupe : repli sur les regles', async () => {
    silent()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const out = await parseTaskSmart('Réviser les réseaux 2 h avant vendredi', gemini, NOW)
    expect(out).toMatchObject({ mode: 'regles', aiError: 'unavailable', intent: 'create' })
  })
})