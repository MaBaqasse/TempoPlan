// P5 : reponses aux questions sur le planning (consultation uniquement, rien n'est modifie).
// Fonctions pures : answerQuery(query, activities, now) -> texte du chat.
// query vient de parseQuery (nlParser.js).
import { fmtDuration, pick } from './replies'
import { formatDay, formatTime, languageOf, localized } from './locale'

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY_MS = 24 * HOUR
const pad = (n) => String(n).padStart(2, '0')

// Plages de la journee prises en compte pour "libre" (heures)
const DAY_HOURS = [8, 20]
const PERIOD_HOURS = { matin: [8, 12], 'apres-midi': [12, 18], soir: [18, 22] }
const MAX_LINES = 8

const DONE_STATUS = ['terminee', 'terminée', 'faite', 'fait', 'done', 'completed']
const isCancelled = (a) => a.status === 'annulee'
const isDone = (a) => DONE_STATUS.includes(String(a.status || '').toLowerCase())

const ms = (iso) => new Date(iso).getTime()
const fmtTime = formatTime
const fmtDay = formatDay
const dayKey = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Activites avec une heure de debut qui chevauchent [from, to), triees
export function eventsBetween(activities, from, to) {
  const out = []
  for (const a of activities || []) {
    if (!a?.start || isCancelled(a)) continue
    const s = ms(a.start)
    if (Number.isNaN(s)) continue
    const d = Number(a.durationMin) > 0 ? Number(a.durationMin) : 0
    const e = s + d * MIN
    if (s < to && Math.max(e, s + 1) > from) out.push({ a, s, e })
  }
  return out.sort((x, y) => x.s - y.s)
}

const eventLine = ({ a, s, e }, lang) =>
  `• ${fmtTime(s, lang)}${e > s ? ` – ${fmtTime(e, lang)}` : ''} : ${a.title}${isDone(a) ? localized(lang, ' (terminé)', ' (completed)', ' (مكتمل)') : ''}`

const dueLine = (a, lang) =>
  `• ${a.title} : ${localized(lang, `avant ${fmtDay(ms(a.deadline), lang)} à ${fmtTime(ms(a.deadline), lang)}`, `due ${fmtDay(ms(a.deadline), lang)} at ${fmtTime(ms(a.deadline), lang)}`, `قبل ${fmtDay(ms(a.deadline), lang)} عند ${fmtTime(ms(a.deadline), lang)}`)}`

const withDeadline = (a) => a?.deadline && !Number.isNaN(ms(a.deadline)) && !isCancelled(a) && !isDone(a)

// ---------- Planning ----------
const LABEL_TRANSLATIONS = {
  "aujourd'hui": ['today', 'اليوم'],
  demain: ['tomorrow', 'غدًا'],
  'après-demain': ['the day after tomorrow', 'بعد غد'],
  'cette semaine': ['this week', 'هذا الأسبوع'],
  'la semaine prochaine': ['next week', 'الأسبوع القادم'],
  'ce week-end': ['this weekend', 'عطلة نهاية هذا الأسبوع'],
  'ce matin': ['this morning', 'هذا الصباح'],
  'cet après-midi': ['this afternoon', 'بعد ظهر اليوم'],
  'ce soir': ['this evening', 'هذا المساء'],
}

function queryLabel(q, lang) {
  if (languageOf(lang) === 'fr') return q.label
  const translation = LABEL_TRANSLATIONS[q.label]
  return translation ? translation[languageOf(lang) === 'en' ? 0 : 1] : fmtDay(q.from, lang)
}

function answerAgenda(q, activities, lang) {
  const label = queryLabel(q, lang)
  let from = q.from.getTime()
  let to = q.to.getTime()
  const single = to - from <= DAY_MS + HOUR
  if (q.period && single) {
    const [h0, h1] = PERIOD_HOURS[q.period]
    to = from + h1 * HOUR
    from += h0 * HOUR
  }
  const events = eventsBetween(activities, from, to)
  const due = activities
    .filter((a) => withDeadline(a) && !a.start && ms(a.deadline) >= from && ms(a.deadline) < to)
    .sort((x, y) => ms(x.deadline) - ms(y.deadline))

  if (!events.length && !due.length) {
    return pick(languageOf(lang) === 'fr'
      ? [`Rien de prévu ${label}, vous êtes libre !`, `Votre planning est vide ${label}. Profitez-en !`]
      : languageOf(lang) === 'en'
        ? [`Nothing planned ${label}, you’re free!`, `Your schedule is empty ${label}. Enjoy!`]
        : [`لا توجد خطط ${label}، أنت متاح!`, `جدولك فارغ ${label}. استمتع!`])
  }

  const lines = []
  if (events.length) {
    const intro =
      languageOf(lang) === 'fr'
        ? `${pick(['Voici votre planning', "Voilà ce que vous avez"])} pour ${label} :`
        : localized(lang, '', `Here’s your schedule for ${label}:`, `إليك جدولك ${label}:`)
    lines.push(intro)
    if (single) {
      lines.push(...events.map((event) => eventLine(event, lang)))
    } else {
      let current = ''
      for (const ev of events) {
        const key = dayKey(ev.s)
        if (key !== current) {
          current = key
          lines.push('', `${fmtDay(ev.s, lang)} :`)
        }
        lines.push(eventLine(ev, lang))
      }
    }
  }
  if (due.length) {
    lines.push(events.length ? '' : localized(lang, `Pas de créneau fixé pour ${label}, mais il y a des échéances :`, `Nothing is scheduled for ${label}, but there are deadlines:`, `لا توجد أوقات محددة ${label}، لكن هناك مواعيد نهائية:`))
    if (events.length) lines.push(localized(lang, 'À rendre :', 'Due:', 'مطلوب تسليمه:'))
    lines.push(...due.map((item) => dueLine(item, lang)))
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n')
}

// ---------- Plages libres ----------
export function gapsIn(events, wStart, wEnd) {
  const out = []
  let cursor = wStart
  for (const { s, e } of events) {
    if (cursor >= wEnd) break
    if (s > cursor) out.push([cursor, Math.min(s, wEnd)])
    cursor = Math.max(cursor, e)
  }
  if (cursor < wEnd) out.push([cursor, wEnd])
  return out.filter(([a, b]) => b > a)
}

function answerFree(q, activities, now, lang) {
  const label = queryLabel(q, lang)
  const [h0, h1] = q.period ? PERIOD_HOURS[q.period] : DAY_HOURS
  const minMin = q.durationMin || 30
  const nowMs = Math.ceil(now.getTime() / (15 * MIN)) * 15 * MIN
  const from = q.from.getTime()
  const to = q.to.getTime()
  const single = to - from <= DAY_MS + HOUR

  const days = []
  for (let d = from; d < to; d += DAY_MS) {
    const dayStart = new Date(d)
    dayStart.setHours(0, 0, 0, 0)
    const base = dayStart.getTime()
    const wStart = base + h0 * HOUR
    const wEnd = base + h1 * HOUR
    if (wEnd <= nowMs) continue
    const busy = eventsBetween(activities, wStart, wEnd)
    const gaps = gapsIn(busy, Math.max(wStart, nowMs), wEnd).filter(([a, b]) => b - a >= minMin * MIN)
    days.push({ base, busy, gaps })
  }

  const gapLine = (day, [a, b]) =>
    `• ${single ? '' : `${fmtDay(day.base, lang)} : `}${localized(lang, `de ${fmtTime(a, lang)} à ${fmtTime(b, lang)}`, `from ${fmtTime(a, lang)} to ${fmtTime(b, lang)}`, `من ${fmtTime(a, lang)} إلى ${fmtTime(b, lang)}`)}`
  const allGaps = days.flatMap((day) => day.gaps.map((g) => gapLine(day, g)))

  if (q.durationMin) {
    const dur = fmtDuration(q.durationMin, lang)
    if (!allGaps.length) {
      return localized(lang, `Je ne trouve pas de plage libre de ${dur} ${label}. Voulez-vous essayer une durée plus courte ou une autre période ?`, `I can’t find a free ${dur} slot ${label}. Would you like to try a shorter duration or another period?`, `لا أجد فترة متاحة مدتها ${dur} ${label}. هل تريد تجربة مدة أقصر أو فترة أخرى؟`)
    }
    return [localized(lang, `Voici où vous pouvez placer ${dur} ${label} :`, `Here’s where you can schedule ${dur} ${label}:`, `إليك الأوقات التي يمكنك فيها جدولة ${dur} ${label}:`), ...allGaps.slice(0, MAX_LINES)].join('\n')
  }

  if (single) {
    const day = days[0]
    if (!day) return localized(lang, `Cette période est déjà passée pour ${label}.`, `That period has already passed ${label}.`, `انتهت هذه الفترة ${label}.`)
    if (!day.busy.length) return pick(languageOf(lang) === 'fr' ? [`Oui, vous êtes libre ${label} !`, `Rien de prévu ${label} : vous êtes libre.`] : languageOf(lang) === 'en' ? [`Yes, you’re free ${label}!`, `Nothing planned ${label}; you’re free.`] : [`نعم، أنت متاح ${label}!`, `لا توجد خطط ${label}، أنت متاح.`])
    const busyText = day.busy.map((ev) => `« ${ev.a.title} » (${fmtTime(ev.s, lang)} – ${fmtTime(ev.e, lang)})`).join(', ')
    if (!allGaps.length) return localized(lang, `Non, vous êtes pris ${label} : ${busyText}.`, `No, you’re busy ${label}: ${busyText}.`, `لا، أنت مشغول ${label}: ${busyText}.`)
    return [localized(lang, `Pas complètement : vous avez ${busyText}.`, `Not completely: you have ${busyText}.`, `ليس بالكامل: لديك ${busyText}.`), localized(lang, 'Il vous reste de libre :', 'You’re still free:', 'ما زال لديك وقت متاح:'), ...allGaps.slice(0, MAX_LINES)].join('\n')
  }

  if (!allGaps.length) return localized(lang, `Je ne vois aucune plage libre ${label}.`, `I can’t find any free slots ${label}.`, `لا أجد أوقاتًا متاحة ${label}.`)
  return [localized(lang, `Voici vos plages libres ${label} :`, `Here are your free slots ${label}:`, `إليك أوقاتك المتاحة ${label}:`), ...allGaps.slice(0, MAX_LINES)].join('\n')
}

// ---------- Echeances et retards ----------
function answerDeadlines(q, activities, lang) {
  const from = q.from.getTime()
  const to = q.to.getTime()
  const items = activities
    .filter((a) => withDeadline(a) && ms(a.deadline) >= from && ms(a.deadline) < to)
    .sort((x, y) => ms(x.deadline) - ms(y.deadline))
  const label = queryLabel(q, lang)
  if (!items.length) return localized(lang, `Aucune échéance ${label}.`, `No deadlines ${label}.`, `لا توجد مواعيد نهائية ${label}.`)
  return [localized(lang, `Voici vos échéances ${label} :`, `Here are your deadlines ${label}:`, `إليك مواعيدك النهائية ${label}:`), ...items.slice(0, MAX_LINES).map((item) => dueLine(item, lang))].join('\n')
}

function answerLate(activities, now, lang) {
  const items = activities
    .filter((a) => withDeadline(a) && ms(a.deadline) < now.getTime())
    .sort((x, y) => ms(x.deadline) - ms(y.deadline))
  if (!items.length) return pick(languageOf(lang) === 'fr' ? ["Bonne nouvelle, rien n'est en retard !", 'Tout est à jour : aucune tâche en retard.'] : languageOf(lang) === 'en' ? ['Good news, nothing is overdue!', 'You’re all caught up; no overdue tasks.'] : ['أخبار جيدة، لا توجد مهام متأخرة!', 'كل شيء على ما يرام، لا توجد مهام متأخرة.'])
  const head = localized(lang, items.length === 1 ? 'Une tâche est en retard :' : `${items.length} tâches sont en retard :`, items.length === 1 ? 'One task is overdue:' : `${items.length} tasks are overdue:`, items.length === 1 ? 'هناك مهمة متأخرة:' : `هناك ${items.length} مهام متأخرة:`)
  return [head, ...items.slice(0, MAX_LINES).map((a) => `• ${a.title} (${localized(lang, `échéance : ${fmtDay(ms(a.deadline), lang)}`, `due: ${fmtDay(ms(a.deadline), lang)}`, `الموعد النهائي: ${fmtDay(ms(a.deadline), lang)}`)})`)].join('\n')
}

function answerNext(activities, now, lang) {
  const next = activities
    .filter((a) => a && !isCancelled(a) && !isDone(a))
    .map((a) => ({ activity: a, at: ms(a.start || a.deadline) }))
    .filter(({ at }) => Number.isFinite(at) && at >= now.getTime())
    .sort((a, b) => a.at - b.at)[0]
  if (!next) return localized(lang, 'Aucune activité à venir.', 'There are no upcoming activities.', 'لا توجد أنشطة قادمة.')
  const when = next.activity.start
    ? localized(lang, `le ${fmtDay(next.at, lang)} à ${fmtTime(next.at, lang)}`, `on ${fmtDay(next.at, lang)} at ${fmtTime(next.at, lang)}`, `في ${fmtDay(next.at, lang)} عند ${fmtTime(next.at, lang)}`)
    : localized(lang, `avant le ${fmtDay(next.at, lang)} à ${fmtTime(next.at, lang)}`, `due by ${fmtDay(next.at, lang)} at ${fmtTime(next.at, lang)}`, `قبل ${fmtDay(next.at, lang)} عند ${fmtTime(next.at, lang)}`)
  return localized(lang, `Votre prochaine activité est « ${next.activity.title} », ${when}.`, `Your next activity is “${next.activity.title}”, ${when}.`, `نشاطك التالي هو « ${next.activity.title} »، ${when}.`)
}

export function answerQuery(query, activities, now = new Date(), lang = 'fr') {
  const list = Array.isArray(activities) ? activities : []
  if (query.kind === 'late') return answerLate(list, now, lang)
  if (query.kind === 'deadlines') return answerDeadlines(query, list, lang)
  if (query.kind === 'free') return answerFree(query, list, now, lang)
  if (query.kind === 'next') return answerNext(list, now, lang)
  return answerAgenda(query, list, lang)
}

// ---------- Premier creneau libre pour deplacer / replacer une activite ----------
const toLocalISO = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Renvoie le debut ISO ("YYYY-MM-DDTHH:mm") du premier creneau libre de la duree de l'activite
// (dans les 30 prochains jours, entre 8 h et 20 h), ou null s'il n'y en a pas.
export function findFreeSlot(activities, item, now = new Date()) {
  const dur = Number(item.durationMin) * MIN
  if (!(dur > 0)) return null
  const others = (activities || []).filter((a) => a.id !== item.id)
  const deadline = item.deadline && !Number.isNaN(ms(item.deadline)) ? ms(item.deadline) : null
  const limit = deadline && deadline > now.getTime() ? deadline : Infinity
  const nowMs = Math.ceil(now.getTime() / (15 * MIN)) * 15 * MIN
  for (let i = 0; i < 30; i++) {
    const base = new Date(now)
    base.setHours(0, 0, 0, 0)
    base.setDate(base.getDate() + i)
    const wStart = new Date(base).setHours(DAY_HOURS[0], 0, 0, 0)
    const wEnd = new Date(base).setHours(DAY_HOURS[1], 0, 0, 0)
    if (wEnd <= nowMs) continue
    const gaps = gapsIn(eventsBetween(others, wStart, wEnd), Math.max(wStart, nowMs), wEnd)
    const gap = gaps.find(([a, b]) => b - a >= dur)
    if (gap) return gap[0] + dur > limit ? null : toLocalISO(gap[0])
  }
  return null
}