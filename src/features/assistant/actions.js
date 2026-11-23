// P5 : actions sur les activites existantes (terminer, annuler, supprimer, reporter, replanifier, rallonger).
// Fonctions pures : recherche de l'activite visee, calcul du report et textes de reponse.
// Les ecritures (updateActivity, deleteActivity...) sont faites par le chat via activitiesService.
import { normalize } from '../../lib/nlParser'
import { fmtDuration, pick } from './replies'
import { formatDay, formatTime, languageOf, localized } from './locale'

const pad = (n) => String(n).padStart(2, '0')
const MIN = 60 * 1000

const isCancelled = (a) => a.status === 'annulee'
const isDone = (a) => a.status === 'terminee'

const fmtTime = formatTime
const fmtDay = formatDay
const fmtDayShort = (t, lang) =>
  new Date(t).toLocaleDateString(
    lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar' : 'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'short' },
  )

// "« Cours » (lundi 23 novembre à 10 h)" ou "« Rapport » (avant vendredi 27 novembre)"
export function describe(a, lang = 'fr') {
  if (a.start) return localized(lang, `« ${a.title} » (${fmtDay(a.start, lang)} à ${fmtTime(a.start, lang)})`, `“${a.title}” (${fmtDay(a.start, lang)} at ${fmtTime(a.start, lang)})`, `« ${a.title} » (${fmtDay(a.start, lang)}، ${fmtTime(a.start, lang)})`)
  if (a.deadline) return localized(lang, `« ${a.title} » (avant ${fmtDay(a.deadline, lang)})`, `“${a.title}” (due ${fmtDay(a.deadline, lang)})`, `« ${a.title} » (قبل ${fmtDay(a.deadline, lang)})`)
  return `« ${a.title} »`
}

export function label(a, lang = 'fr') {
  if (a.start) return localized(lang, `${a.title} · ${fmtDayShort(a.start, lang)} à ${fmtTime(a.start, lang)}`, `${a.title} · ${fmtDayShort(a.start, lang)} at ${fmtTime(a.start, lang)}`, `${a.title} · ${fmtDayShort(a.start, lang)}، ${fmtTime(a.start, lang)}`)
  if (a.deadline) return localized(lang, `${a.title} · avant ${fmtDayShort(a.deadline, lang)}`, `${a.title} · due ${fmtDayShort(a.deadline, lang)}`, `${a.title} · قبل ${fmtDayShort(a.deadline, lang)}`)
  return a.title
}

export const sortByDate = (list) =>
  [...list].sort((x, y) => (x.start || x.deadline || '9999').localeCompare(y.start || y.deadline || '9999'))

// ---------- Trouver l'activite visee ----------
const tokensOf = (text) =>
  normalize(text || '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2)
    .map((w) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w))

// Meme mot (pluriel, "math" / "maths") ou meme racine d'au moins 5 lettres ("revision" / "reviser")
const commonPrefix = (a, b) => {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}
const sameWord = (t, p) =>
  t === p || (Math.min(t.length, p.length) >= 4 && (t.startsWith(p) || p.startsWith(t))) || commonPrefix(t, p) >= 5

function score(phraseTokens, title) {
  const tt = tokensOf(title)
  return phraseTokens.filter((p) => tt.some((t) => sameWord(t, p))).length
}

// Renvoie { matches, named, pool } : pool = activites concernees par l'action,
// matches = celles qui correspondent aux mots de la phrase, named = la phrase nomme l'activite.
export function findTargets(parsed, activities) {
  const list = Array.isArray(activities) ? activities : []
  const pool = sortByDate(
    list.filter((a) => (parsed.action === 'delete' ? true : !isCancelled(a) && !isDone(a))),
  )
  const named = parsed.tokens.length > 0
  let matches = pool
  if (named) {
    const scored = pool.map((a) => ({ a, s: score(parsed.tokens, a.title) })).filter((x) => x.s > 0)
    const best = Math.max(0, ...scored.map((x) => x.s))
    matches = scored.filter((x) => x.s === best).map((x) => x.a)
  }
  if (parsed.filterDate && matches.length > 1) {
    const sameDay = matches.filter((a) => (a.start || a.deadline || '').slice(0, 10) === parsed.filterDate)
    if (sameDay.length) matches = sameDay
  }
  return { matches, named, pool }
}

// ---------- Report ----------
// Renvoie { patch } ou { needWhen: true } ou { error: 'texte' }
export function postponePlan(item, when, now = new Date(), lang = 'fr') {
  const ref = item.start || item.deadline
  if (!ref || (!when.date && !when.clock)) return { needWhen: true }
  const day = when.date || ref.slice(0, 10)
  const [h, m] = when.clock || [Number(ref.slice(11, 13)), Number(ref.slice(14, 16))]
  const value = `${day}T${pad(h)}:${pad(m)}`
  if (value === ref) return { error: sameTime(lang) }
  if (new Date(value) < now) return { error: pastDate(lang) }
  const postponedCount = (item.postponedCount || 0) + 1
  return { patch: item.start ? { start: value, postponedCount } : { deadline: value, postponedCount } }
}

// ---------- Textes ----------
const listClashes = (clashes, lang = 'fr') =>
  clashes
    .map((c) => {
      const end = new Date(c.start).getTime() + (Number(c.durationMin) || 0) * MIN
      return `« ${c.title} » (${fmtTime(c.start, lang)} – ${fmtTime(end, lang)})`
    })
    .join(', ')

export const completed = (a, lang = 'fr') =>
  pick(
    languageOf(lang) === 'fr'
      ? [`Bravo ! J'ai marqué l'activité « ${a.title} » comme terminée.`, `C'est noté, « ${a.title} » est terminée. Bien joué !`]
      : languageOf(lang) === 'en'
        ? [`Great! I marked “${a.title}” as complete.`, `“${a.title}” is marked as complete. Well done!`]
        : [`أحسنت! تم تحديد « ${a.title} » كمكتمل.`, `تم تحديد « ${a.title} » كمكتمل. أحسنت!`],
  )
export const cancelled = (a, lang = 'fr') => localized(lang, `C'est fait, j'ai annulé « ${a.title} ».`, `Done, I cancelled “${a.title}”.`, `تم، ألغيت « ${a.title} ».`)
export const deleted = (a, lang = 'fr') => localized(lang, `J'ai supprimé « ${a.title} » de votre planning.`, `I removed “${a.title}” from your schedule.`, `حذفت « ${a.title} » من جدولك.`)
export const confirmDelete = (a, lang = 'fr') => localized(lang, `Voulez-vous vraiment supprimer ${describe(a, lang)} ? C'est définitif.`, `Are you sure you want to delete ${describe(a, lang)}? This can’t be undone.`, `هل تريد بالتأكيد حذف ${describe(a, lang)}؟ لا يمكن التراجع عن ذلك.`)
export const declined = (lang = 'fr') => pick(languageOf(lang) === 'fr' ? ["D'accord, je n'y touche pas.", 'Pas de souci, je laisse tout comme avant.'] : languageOf(lang) === 'en' ? ['All right, I’ll leave it as it is.', 'No problem, I won’t change anything.'] : ['حسنًا، سأتركه كما هو.', 'لا بأس، لن أغير شيئًا.'])
export const askWhen = (a, lang = 'fr') => pick(languageOf(lang) === 'fr' ? [`Pour quand voulez-vous reporter « ${a.title} » ?`, `D'accord ! Vous voulez le déplacer à quel moment ?`] : languageOf(lang) === 'en' ? [`When would you like to move “${a.title}” to?`, 'All right! When would you like to move it to?'] : [`إلى متى تريد تأجيل « ${a.title} »؟`, 'حسنًا! متى تريد نقله؟'])
export const askDelta = (a, lang = 'fr') => localized(lang, `De combien de temps « ${a.title} » dure-t-il de plus ou de moins ?`, `How much longer or shorter should “${a.title}” be?`, `كم تريد زيادة مدة « ${a.title} » أو تقليلها؟`)
export const noSlot = (lang = 'fr') => localized(lang, 'Je ne trouve pas de créneau libre dans les 30 prochains jours. Dites-moi un jour ou une heure qui vous arrange.', 'I can’t find a free slot in the next 30 days. Tell me a day or time that works for you.', 'لا أجد وقتًا متاحًا خلال الثلاثين يومًا القادمة. أخبرني بيوم أو وقت يناسبك.')
export const proposeMove = (a, start, lang = 'fr') => localized(lang, `Je peux placer « ${a.title} » le ${fmtDay(start, lang)} à ${fmtTime(start, lang)}, c'est libre. Je le fais ?`, `I can move “${a.title}” to ${fmtDay(start, lang)} at ${fmtTime(start, lang)}. It’s free. Shall I do that?`, `يمكنني نقل « ${a.title} » إلى ${fmtDay(start, lang)} عند ${fmtTime(start, lang)}، فالوقت متاح. هل أفعل ذلك؟`)
export const nothing = (lang = 'fr') => localized(lang, "Vous n'avez aucune activité à modifier pour le moment.", 'There are no activities to change right now.', 'ليس لديك أنشطة لتعديلها حاليًا.')
export const notFound = (lang = 'fr') => localized(lang, "Je ne trouve pas d'activité qui porte ce nom. Laquelle voulez-vous ?", 'I can’t find an activity with that name. Which one do you mean?', 'لم أجد نشاطًا بهذا الاسم. أي نشاط تقصد؟')
export const tooShort = (lang = 'fr') => localized(lang, 'Ça ferait une durée nulle : dites-moi une durée plus courte à retirer.', 'That would make the duration zero. Tell me a smaller amount of time to remove.', 'ستصبح المدة صفرًا. أخبرني بمدة أقل تريد حذفها.')
export const sameTime = (lang = 'fr') => localized(lang, "C'est déjà prévu à ce moment-là.", 'It’s already scheduled for that time.', 'إنه مجدول في ذلك الوقت بالفعل.')
export const pastDate = (lang = 'fr') => localized(lang, 'Ce moment est déjà passé. Donnez-moi une autre date ou une autre heure.', 'That time has already passed. Give me another date or time.', 'لقد مضى هذا الوقت. أعطني تاريخًا أو وقتًا آخر.')

export const which = (action, lang = 'fr') => {
  const messages = {
    fr: { complete: 'Laquelle avez-vous terminée ?', cancel: 'Laquelle voulez-vous annuler ?', delete: 'Laquelle voulez-vous supprimer ?', postpone: 'Laquelle voulez-vous reporter ?', reschedule: 'Laquelle faut-il replanifier ?', extend: 'Quelle activité est concernée ?' },
    en: { complete: 'Which one have you completed?', cancel: 'Which one would you like to cancel?', delete: 'Which one would you like to delete?', postpone: 'Which one would you like to postpone?', reschedule: 'Which one should I reschedule?', extend: 'Which activity do you mean?' },
    ar: { complete: 'أي نشاط أنهيت؟', cancel: 'أي نشاط تريد إلغاءه؟', delete: 'أي نشاط تريد حذفه؟', postpone: 'أي نشاط تريد تأجيله؟', reschedule: 'أي نشاط تريد إعادة جدولته؟', extend: 'أي نشاط تقصد؟' },
  }
  return messages[languageOf(lang)][action] || localized(lang, 'Quelle activité est concernée ?', 'Which activity do you mean?', 'أي نشاط تقصد؟')
}

export function moved(item, clashes = [], lang = 'fr') {
  const where = item.start
    ? localized(lang, `le ${fmtDay(item.start, lang)} à ${fmtTime(item.start, lang)}`, `to ${fmtDay(item.start, lang)} at ${fmtTime(item.start, lang)}`, `إلى ${fmtDay(item.start, lang)} عند ${fmtTime(item.start, lang)}`)
    : localized(lang, `à l'échéance du ${fmtDay(item.deadline, lang)} à ${fmtTime(item.deadline, lang)}`, `to the deadline on ${fmtDay(item.deadline, lang)} at ${fmtTime(item.deadline, lang)}`, `إلى الموعد النهائي في ${fmtDay(item.deadline, lang)} عند ${fmtTime(item.deadline, lang)}`)
  const opener = pick(
    languageOf(lang) === 'fr' ? ["C'est fait", 'Parfait'] : languageOf(lang) === 'en' ? ['Done', 'Perfect'] : ['تم', 'ممتاز'],
  )
  const done = localized(
    lang,
    `${opener} ! J'ai déplacé « ${item.title} » ${where}.`,
    `${opener}! I moved “${item.title}” ${where}.`,
    `${opener}، نقلت « ${item.title} » ${where}.`,
  )
  return clashes.length ? `${done} ${localized(lang, `Attention, ça chevauche ${listClashes(clashes, lang)}.`, `Note: it overlaps with ${listClashes(clashes, lang)}.`, `تنبيه: يتعارض مع ${listClashes(clashes, lang)}.`)}` : done
}

export function extended(item, clashes = [], lang = 'fr') {
  const until = item.start ? localized(lang, ` (jusqu'à ${fmtTime(new Date(item.start).getTime() + item.durationMin * MIN, lang)})`, ` (until ${fmtTime(new Date(item.start).getTime() + item.durationMin * MIN, lang)})`, ` (حتى ${fmtTime(new Date(item.start).getTime() + item.durationMin * MIN, lang)})`) : ''
  const done = localized(lang, `C'est noté : « ${item.title} » dure maintenant ${fmtDuration(item.durationMin, lang)}${until}.`, `Got it: “${item.title}” now lasts ${fmtDuration(item.durationMin, lang)}${until}.`, `تم: أصبحت مدة « ${item.title} » ${fmtDuration(item.durationMin, lang)}${until}.`)
  return clashes.length
    ? `${done} ${localized(lang, `Attention, ça chevauche ${listClashes(clashes, lang)}. Dites-moi si vous voulez déplacer l'une de ces activités.`, `It overlaps with ${listClashes(clashes, lang)}. Tell me if you’d like to move one of these activities.`, `يتعارض مع ${listClashes(clashes, lang)}. أخبرني إن كنت تريد نقل أحد هذه الأنشطة.`)}`
    : done
}