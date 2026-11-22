// P5 : Interface de chat
// phrase -> analyse -> questions si infos manquantes -> creneaux libres -> verification des conflits -> enregistrement
import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { findConflictsFor } from '@/lib/conflicts'
import {
  completeTask,
  correctTypos,
  detectLanguage,
  localizeReply,
  missingFields,
  parseAction,
  parseQuery,
  parseTaskSmart,
  parseWhen,
  queueCommand,
  refineTask,
  splitTasks,
  yesNo,
} from '@/lib/nlParser'
import {
  completeActivity,
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
} from '@/services/activitiesService'
import { KEYS, getSession, read } from '@/services/storage'
import BotAvatar from './BotAvatar'
import SlotProposal from './SlotProposal'
import { answerQuery, findFreeSlot } from './agenda'
import * as todo from './actions'
import { getSlots } from './mockSlots'
import * as say from './replies'
import { replyLang as resolveReplyLang } from './replyLang'

const SUGGESTIONS = [
  'Réviser les réseaux 2 h avant vendredi',
  'Réunion demain de 14 h à 15 h 30',
  'Cours de maths lundi',
]

// Lit la cle et le mode dans les parametres (ecrits par P1) via storage.js
function loadAiSettings() {
  const userId = getSession()?.userId
  const raw = read(KEYS.settings)
  const mine = Array.isArray(raw) ? raw.find((s) => s.userId === userId) : raw
  const ai = mine?.ai ?? {}
  const useAI = Boolean(ai.apiKey) && ai.mode !== 'rules'
  return { ai: { apiKey: ai.apiKey || '', mode: useAI ? 'gemini' : 'rules' } }
}

// Messages d'etat de l'IA (Gemini). Le chat continue de fonctionner en mode regles.
const NOTICES = {
  quota: {
    title: 'Quota Gemini atteint',
    text: "La limite gratuite de l'assistant IA est atteinte pour le moment. Réessayez dans quelques minutes (ou demain). En attendant, je continue en mode règles : les phrases simples fonctionnent toujours.",
  },
  key: {
    title: 'Clé Gemini refusée',
    text: 'Vérifiez votre clé dans les Paramètres. En attendant, je continue en mode règles.',
    danger: true,
  },
  unavailable: {
    title: 'Assistant IA indisponible',
    text: "Mode règles activé : l'assistant IA n'est pas disponible pour le moment.",
  },
}

function NoticeBox({ kind }) {
  const { title, text, danger } = NOTICES[kind] ?? NOTICES.unavailable
  return (
    <div
      role="alert"
      className={`rounded-2xl rounded-bl-md border px-4 py-3 text-base text-ink ${
        danger ? 'border-danger/40 bg-danger/10' : 'border-accent/40 bg-accent/10'
      }`}
    >
      <p className="font-semibold">
        <span aria-hidden="true">⚠ </span>
        {title}
      </p>
      <p>{text}</p>
    </div>
  )
}

const QUOTA_PAUSE_MS = 60 * 1000 // apres un quota atteint, on n'appelle plus Gemini pendant 1 minute

export default function AssistantChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(() => (loadAiSettings().ai.mode === 'gemini' ? 'IA' : 'Règles'))
  const [pending, setPending] = useState(null) // { task, field } : question posee a l'utilisateur
  const [active, setActive] = useState(null) // derniere tache proposee (pour les corrections)
  const [flow, setFlow] = useState(null) // question en cours sur une activite existante (quand ? combien ? supprimer ?)
  const endRef = useRef(null)
  const quotaUntil = useRef(0) // pas d'appel a Gemini avant cette heure
  const lastNotice = useRef(null) // evite de repeter le meme encadre a chaque message
  const queue = useRef([]) // phrases des taches qui restent a traiter quand l'utilisateur en a donne plusieurs
  const lang = useRef('fr') // langue de l'utilisateur ('fr', 'en' ou 'ar'), detectee a chaque message
  const msgId = useRef(0) // identifiant des messages du bot (pour remplacer le texte apres reformulation)

  function replyLang() {
    const { ai } = loadAiSettings()
    return resolveReplyLang({
      mode: ai.mode,
      hasKey: Boolean(ai.apiKey),
      quotaPaused: Date.now() < quotaUntil.current,
      lang: lang.current,
    })
  }

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const addMessage = (msg) => setMessages((prev) => [...prev, msg])

  // Les réponses suivent replyLang : Gemini reformule le français quand c'est nécessaire.
  // skipLocalize : le texte est déjà dans la langue cible.
  const bot = (text, { skipLocalize = false, ...extra } = {}) => {
    const id = ++msgId.current
    addMessage({ id, role: 'bot', text, ...extra })
    if (!skipLocalize) localize(id, text)
  }

  async function localize(id, text) {
    const { ai } = loadAiSettings()
    if (lang.current === 'fr' || ai.mode !== 'gemini' || Date.now() < quotaUntil.current) return
    const out = await localizeReply(text, lang.current, ai.apiKey)
    if (out && out !== text) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: out } : m)))
    }
  }

  const updateMessage = (index, change) =>
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, ...change(m) } : m)))

  // Pose une question quand il manque une information (retry : la reponse precedente n'a pas ete comprise)
  function ask(task, field, retry = false) {
    setPending({ task, field })
    setActive(null)
    bot(retry ? say.retry(field, replyLang()) : say.question(field, task, replyLang()))
  }

  // Pose la prochaine question, ou propose des creneaux si tout est connu
  function next(task) {
    const [field] = missingFields(task)
    return field ? ask(task, field) : propose(task)
  }

  // Propose des creneaux libres pour la tache
  function propose(task) {
    const activities = listActivities()
    const slots = getSlots(task, activities)
    const clashes = task.type === 'fixe' && task.start ? findConflictsFor(task, activities) : []
    setPending(null)
    setActive(task)
    bot(say.understood(task, clashes, replyLang()), { task, slots })
    if (slots.length === 0) bot(say.noSlots(task, replyLang()))
  }

  // Reponse "oui" / "non" a la derniere proposition
  function answerYesNo(answer) {
    if (answer === 'no') return bot(say.declined(replyLang()))
    if (messages.some((m) => m.conflict)) return bot(say.useButtons(replyLang()))
    let last = -1
    messages.forEach((m, i) => {
      if (m.slots?.length > 0) last = i
    })
    if (last === -1) return bot(say.useButtons(replyLang()))
    const { slots } = messages[last]
    if (slots.length === 1) return accept(last, slots[0].start)
    return bot(say.whichSlot(replyLang()))
  }

  // Retire les boutons de la tache abandonnee (creneaux, conflit) et ses questions en attente
  function clearProposals() {
    setPending(null)
    setActive(null)
    setMessages((prev) =>
      prev.map((m) => (m.slots?.length > 0 || m.conflict ? { ...m, slots: [], conflict: null } : m)),
    )
  }

  async function send(text) {
    const phrase = text.trim()
    if (!phrase || loading) return
    setInput('')
    addMessage({ role: 'user', text: phrase })
    const now = new Date()

    // Langue de l'utilisateur : une reponse courte ("12h", "oui") ne la change pas
    const detected = detectLanguage(phrase)
    if (detected) lang.current = detected

    // 0. Reponse a une question sur une activite existante
    if (flow) {
      const current = flow
      setFlow(null)
      const item = getActivity(current.id)
      if (!item) return bot(todo.nothing(replyLang()))
      if (current.type === 'when') {
        const when = parseWhen(phrase, now)
        if (when.date || when.clock) return applyPostpone(item, when, now)
      } else if (current.type === 'delta') {
        const minutes = completeTask({ _noDuration: true }, 'duration', phrase, now)?.durationMin
        if (minutes) return applyExtend(item, minutes * (current.sign ?? 1))
      } else {
        const answer = yesNo(phrase)
        if (answer === 'no') return bot(todo.declined(replyLang()))
        if (answer === 'yes') {
          if (current.type === 'delete') {
            if (!deleteActivity(current.id)) return bot(say.failed({ storage: 'Suppression impossible.' }, replyLang()))
            return bot(todo.deleted(item, replyLang()), { success: true })
          }
          return doMove(item, current.start)
        }
      }
      // sinon : la question est abandonnee et la phrase est traitee normalement
    }

    // Liste de taches en cours : "passe" saute la tache actuelle, "stop" arrete la liste
    const command = queue.current.length > 0 ? queueCommand(phrase) : null
    if (command === 'stop') {
      queue.current = []
      clearProposals()
      return bot(say.queueStopped(replyLang()))
    }
    if (command === 'skip') {
      clearProposals()
      bot(say.skipped(replyLang()))
      return advanceQueue()
    }

    // 1. Reponse a une question de l'assistant
    if (pending) {
      const done = completeTask(pending.task, pending.field, phrase, now)
      if (done) return next(done)
    }
    // 2. Oui / non a la derniere proposition, puis correction ("non, 2 h")
    if (active) {
      const answer = yesNo(phrase)
      if (answer) return answerYesNo(answer)
      const fixed = refineTask(active, phrase, now)
      if (fixed) return propose(fixed)
    }

    // 3. Plusieurs taches dans la meme phrase : on les traite une par une
    const pieces = splitTasks(phrase, now)
    if (pieces) {
      queue.current = pieces.slice(1)
      setPending(null)
      setActive(null)
      bot(say.multi(pieces.map(correctTypos), replyLang()))
      return interpret(pieces[0], now, { queued: true })
    }

    // 4. Nouvelle phrase : analyse par Gemini (ou par les regles)
    const waiting = pending
    setPending(null)
    return interpret(phrase, now, { waiting })
  }

  // Passe a la tache suivante de la liste, s'il y en a une
  function advanceQueue() {
    const [piece, ...rest] = queue.current
    if (piece === undefined) return false
    queue.current = rest
    setPending(null)
    setActive(null)
    bot(say.nextTask(correctTypos(piece), rest.length, replyLang()))
    interpret(piece, new Date(), { queued: true })
    return true
  }

  // Analyse une phrase (Gemini ou regles) et lance la suite. queued : phrase issue d'une liste de taches.
  async function interpret(phrase, now, { waiting = null, queued = false } = {}) {
    setLoading(true)
    const settings = loadAiSettings()
    const coolingDown = Date.now() < quotaUntil.current
    const result = await parseTaskSmart(
      phrase,
      coolingDown ? { ai: { ...settings.ai, mode: 'rules' } } : settings,
      now,
    )
    setLoading(false)
    if (!result.aiSkipped) setMode(result.mode === 'ia' ? 'IA' : 'Règles')

    if (result.aiSkipped) {
      // ordre traite par les regles : on ne touche ni au mode affiche ni aux encadres
    } else if (settings.ai.mode === 'gemini' && result.mode !== 'ia') {
      const kind = coolingDown ? 'quota' : result.aiError || 'unavailable'
      if (kind === 'quota' && !coolingDown) quotaUntil.current = Date.now() + QUOTA_PAUSE_MS
      if (lastNotice.current !== kind) addMessage({ role: 'bot', notice: kind })
      lastNotice.current = kind
    } else if (result.mode === 'ia') {
      lastNotice.current = null
    }

    if (result.intent === 'create' && result.task) return next(result.task)
    if (queued) {
      // un morceau de la liste n'est pas compris : on le signale et on passe au suivant
      bot(say.pieceUnclear(phrase, replyLang()))
      return advanceQueue()
    }
    if (result.intent === 'query') return bot(answerQuery(parseQuery(phrase, now), listActivities(), now, replyLang()))
    if (result.intent === 'modify') return handleModify(phrase, now)
    if (result.intent === 'goal') return bot(say.soon(replyLang()))

    // Reponse incomprise a une question : on repose la meme question
    if (waiting) return ask(waiting.task, waiting.field, true)

    // Si la reponse de Gemini est deja dans la langue de l'utilisateur, pas de reformulation en plus
    // (Gemini repond parfois en francais a une phrase anglaise : dans ce cas on la reformule)
    const fromAI =
      result.mode === 'ia' && Boolean(result.reply) && detectLanguage(result.reply) === lang.current
    const responseLang = replyLang()
    const ruleReply =
      result.mode === 'regles' && responseLang === 'fr' && result.replyFr ? result.replyFr : result.reply
    const alreadyLocalized =
      result.mode === 'regles' && responseLang !== 'fr' && Boolean(result.reply)
    if (result.intent === 'chitchat') {
      return bot(ruleReply || say.help(responseLang), { skipLocalize: fromAI || alreadyLocalized })
    }
    return bot(ruleReply || say.unclear(responseLang), { skipLocalize: fromAI || alreadyLocalized })
  }

  // ---------- Modifier une activite existante ----------
  function tryUpdate(id, patch, onOk) {
    const result = updateActivity(id, patch)
    if (!result.ok) return bot(say.failed(result.errors, replyLang()))
    return onOk(result)
  }

  function showChoices(parsed, list, intro) {
    const options = todo.sortByDate(list).slice(0, 6).map((a) => ({ id: a.id, label: todo.label(a, replyLang()) }))
    bot(intro, { choice: { parsed, options } })
  }

  function handleModify(phrase, now) {
    const parsed = parseAction(phrase, now)
    if (!parsed) return bot(say.unclear(replyLang()))
    const { matches, named, pool } = todo.findTargets(parsed, listActivities())
    if (pool.length === 0) return bot(todo.nothing(replyLang()))
    if (matches.length === 1) return applyAction(parsed, matches[0], now)
    if (named && matches.length === 0) return showChoices(parsed, pool, todo.notFound(replyLang()))
    return showChoices(parsed, matches, todo.which(parsed.action, replyLang()))
  }

  function applyExtend(item, delta) {
    const minutes = item.durationMin + delta
    if (minutes <= 0) return bot(todo.tooShort(replyLang()))
    return tryUpdate(item.id, { durationMin: minutes }, (r) =>
      bot(todo.extended(r.activity, r.conflicts, replyLang()), { success: true }),
    )
  }

  function applyPostpone(item, when, now) {
    const plan = todo.postponePlan(item, when, now, replyLang())
    if (plan.error) return bot(plan.error)
    if (plan.needWhen) {
      setFlow({ type: 'when', id: item.id })
      return bot(todo.askWhen(item, replyLang()))
    }
    return tryUpdate(item.id, plan.patch, (r) => bot(todo.moved(r.activity, r.conflicts, replyLang()), { success: true }))
  }

  function doMove(item, start) {
    const postponedCount = item.start ? (item.postponedCount || 0) + 1 : item.postponedCount || 0
    return tryUpdate(item.id, { start, postponedCount }, (r) =>
      bot(todo.moved(r.activity, r.conflicts, replyLang()), { success: true }),
    )
  }

  function applyAction(parsed, item, now = new Date()) {
    switch (parsed.action) {
      case 'complete': {
        const result = completeActivity(item.id)
        return result.ok ? bot(todo.completed(item, replyLang()), { success: true }) : bot(say.failed(result.errors, replyLang()))
      }
      case 'cancel':
        return tryUpdate(item.id, { status: 'annulee' }, () => bot(todo.cancelled(item, replyLang()), { success: true }))
      case 'delete':
        setFlow({ type: 'delete', id: item.id })
        return bot(todo.confirmDelete(item, replyLang()))
      case 'extend':
        if (!parsed.deltaMin) {
          setFlow({ type: 'delta', id: item.id, sign: parsed.sign })
          return bot(todo.askDelta(item, replyLang()))
        }
        return applyExtend(item, parsed.deltaMin)
      default: {
        // postpone / reschedule
        if (parsed.when.date || parsed.when.clock) return applyPostpone(item, parsed.when, now)
        if (parsed.action === 'postpone') {
          setFlow({ type: 'when', id: item.id })
          return bot(todo.askWhen(item, replyLang()))
        }
        const slot = findFreeSlot(listActivities(), item, now)
        if (!slot) return bot(todo.noSlot(replyLang()))
        setFlow({ type: 'move', id: item.id, start: slot })
        return bot(todo.proposeMove(item, slot, replyLang()))
      }
    }
  }

  function pickTarget(index, id) {
    const { parsed } = messages[index].choice
    updateMessage(index, () => ({ choice: null }))
    const item = getActivity(id)
    if (item) applyAction(parsed, item)
  }

  // Enregistre apres verification des conflits
  function accept(index, start, force = false) {
    const base = messages[index].task
    const { _date, _noDuration, ...task } = { ...base, start }
    if (!force) {
      const clashes = findConflictsFor(task, listActivities())
      if (clashes.length) {
        updateMessage(index, () => ({ conflict: null }))
        bot(say.conflict(clashes, replyLang()), { conflict: { index, start } })
        return
      }
    }
    const result = createActivity(task)
    if (!result.ok) {
      bot(say.failed(result.errors, replyLang()))
      return
    }
    bot(say.added(task, result.conflicts, replyLang()), { success: true })
    updateMessage(index, () => ({ slots: [], conflict: null }))
    setActive(null)
    advanceQueue()
  }

  function refuse(index, start) {
    const left = messages[index].slots.filter((s) => s.start !== start)
    updateMessage(index, () => ({ slots: left }))
    if (left.length === 0) bot(say.refusedAll(replyLang()))
  }

  // Choix apres un conflit
  function resolveConflict(messageIndex, choice) {
    const { index, start } = messages[messageIndex].conflict
    updateMessage(messageIndex, () => ({ conflict: null }))
    if (choice === 'force') return accept(index, start, true)
    if (choice === 'propose') {
      const base = messages[index].task
      const slots = getSlots({ ...base, start: base.type === 'fixe' ? start : base.start }, listActivities())
      updateMessage(index, () => ({ slots }))
      return bot(say.conflictPropose(slots.length, replyLang()))
    }
    return bot(say.conflictEdit(replyLang()))
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-2rem)] max-w-4xl flex-col p-2 sm:p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-primary-200 bg-white shadow-sm">
        {/* En-tête */}
        <header className="flex items-center gap-3 border-b border-primary-100 bg-primary-50 px-4 py-3">
          <BotAvatar />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-ink">Assistant de planification</h1>
            <p className="truncate text-sm text-muted">
              Dites-moi ce que vous devez faire, je trouve le bon moment.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-primary-200">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${mode === 'IA' ? 'bg-success' : 'bg-accent'}`}
            />
            Mode : {mode}
          </span>
        </header>

        {/* Conversation */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation avec l'assistant"
          className="flex-1 space-y-4 overflow-y-auto bg-primary-50/40 px-4 py-5"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <BotAvatar />
              <div>
                <p className="text-lg font-semibold text-ink">Que devez-vous planifier ?</p>
                <p className="text-base text-muted">Écrivez une tâche ou essayez un exemple :</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-primary-200 bg-white px-4 py-2 text-base text-primary-700 shadow-sm transition-colors hover:bg-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={i}
                className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && <BotAvatar small />}
                <div
                  className={`flex min-w-0 max-w-[85%] flex-col gap-2 ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {m.notice ? (
                    <NoticeBox kind={m.notice} />
                  ) : (
                    <p
                      dir="auto"
                      className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-base shadow-sm ${
                        isUser
                          ? 'rounded-br-md bg-primary-500 text-white'
                          : m.success
                            ? 'rounded-bl-md border border-success/30 bg-success/10 text-green-900'
                            : 'rounded-bl-md border border-primary-200 bg-white text-ink'
                      }`}
                    >
                      {m.success && <span aria-hidden="true">✓ </span>}
                      {m.text}
                    </p>
                  )}

                  {m.conflict && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => resolveConflict(i, 'edit')}>
                        Modifier l'horaire
                      </Button>
                      <Button variant="secondary" onClick={() => resolveConflict(i, 'propose')}>
                        Proposer un créneau
                      </Button>
                      <Button variant="light" onClick={() => resolveConflict(i, 'force')}>
                        Ajouter quand même
                      </Button>
                    </div>
                  )}

                  {m.choice && (
                    <div className="flex flex-wrap gap-2">
                      {m.choice.options.map((option) => (
                        <Button
                          key={option.id}
                          variant="secondary"
                          onClick={() => pickTarget(i, option.id)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {m.slots?.length > 0 && (
                    <div className="grid w-80 max-w-full gap-2 sm:w-96">
                      {m.slots.map((slot) => (
                        <SlotProposal
                          key={slot.start}
                          slot={slot}
                          durationMin={m.task.durationMin}
                          onAccept={(start) => accept(i, start)}
                          onRefuse={() => refuse(i, slot.start)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex items-end gap-2" role="status">
              <BotAvatar small />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-primary-200 bg-white px-4 py-3 shadow-sm">
                <span className="sr-only">L'assistant réfléchit...</span>
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-primary-300 motion-safe:animate-bounce"
                    style={{ animationDelay: `${n * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Zone de saisie */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            send(input)
          }}
          className="flex items-center gap-2 border-t border-primary-100 bg-white p-3"
        >
          <label htmlFor="assistant-input" className="sr-only">
            Votre demande
          </label>
          <input
            id="assistant-input"
            dir="auto"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Écrivez ce que vous devez faire..."
            className="min-w-0 flex-1 rounded-full border border-primary-200 bg-primary-50/50 px-5 py-2.5 text-base text-ink placeholder:text-muted/70 focus-visible:border-primary-500 focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-primary-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Envoyer"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}