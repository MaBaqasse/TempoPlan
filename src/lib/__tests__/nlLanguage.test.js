// Tests : detection de la langue de l'utilisateur et reformulation des reponses par Gemini.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, detectLanguage, localizeReply, parseTaskSmart } from '../nlParser'

afterEach(() => vi.unstubAllGlobals())

describe('detectLanguage', () => {
  it('detecte l\'arabe, l\'anglais et le francais', () => {
    expect(detectLanguage('اجتماع غدا')).toBe('ar')
    expect(detectLanguage('Meeting tomorrow at 3pm')).toBe('en')
    expect(detectLanguage('Cours de maths lundi')).toBe('fr')
  })
  it('renvoie null pour une reponse courte : la langue precedente est gardee', () => {
    expect(detectLanguage('12h')).toBeNull()
    expect(detectLanguage('oui')).toBeNull()
    expect(detectLanguage('budget review')).toBeNull()
    expect(detectLanguage('maths')).toBeNull()
    expect(detectLanguage('')).toBeNull()
    expect(detectLanguage(undefined)).toBeNull()
  })
})

describe('completeTask (title) : nouvelle demande pendant une question', () => {
  const now = new Date(2026, 10, 22, 19, 0)
  const task = { title: 'Meeting', type: 'fixe', start: '2026-11-23T15:00', durationMin: 120 }
  it('une phrase complete (arabe, anglais, francais) n\'est pas un titre', () => {
    expect(completeTask(task, 'title', 'اجتماع غدا الساعة 14 ساعتين', now)).toBeNull()
    expect(completeTask(task, 'title', 'Meeting tomorrow at 3pm', now)).toBeNull()
    expect(completeTask(task, 'title', 'cours lundi', now)).toBeNull()
  })
  it('un simple nom reste accepte', () => {
    expect(completeTask(task, 'title', 'budget review', now).title).toBe('Meeting budget review')
  })
})

describe('parseTaskSmart : Gemini repond « other » alors que les regles comprennent', () => {
  it('garde la creation trouvee par les regles', async () => {
    const reply = { intent: 'other', reply: 'Quel est le sujet ?', task: null }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }),
      }),
    )
    const now = new Date(2026, 10, 22, 19, 0)
    const result = await parseTaskSmart(
      'Meeting tomorrow at 3pm for 2 hours',
      { ai: { mode: 'gemini', apiKey: 'KEY' } },
      now,
    )
    expect(result.intent).toBe('create')
    expect(result.task).toMatchObject({ type: 'fixe', start: '2026-11-23T15:00', durationMin: 120 })
  })
})

describe('localizeReply', () => {
  it('ne fait aucun appel sans cle ou pour le francais', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await localizeReply('Bonjour', 'en', '')).toBe('Bonjour')
    expect(await localizeReply('Bonjour', 'fr', 'KEY')).toBe('Bonjour')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('renvoie la version reformulee par Gemini', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: ' Hello! ' }] } }] }),
      }),
    )
    expect(await localizeReply('Bonjour !', 'en', 'KEY')).toBe('Hello!')
  })
  it('enleve les guillemets que Gemini ajoute autour de la reponse', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: '"Great! What is it about?"' }] } }] }),
      }),
    )
    expect(await localizeReply('Parfait ! C\'est sur quoi ?', 'en', 'KEY')).toBe('Great! What is it about?')
  })
  it('renvoie le texte d\'origine si Gemini echoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    expect(await localizeReply('Bonjour !', 'ar', 'KEY')).toBe('Bonjour !')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('reseau')))
    expect(await localizeReply('Bonjour !', 'ar', 'KEY')).toBe('Bonjour !')
  })
})