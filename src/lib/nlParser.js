// P5 : analyse d'une phrase en langage naturel.
// V1 : regles (regex), toujours disponibles. V2 : API Gemini, avec repli sur la V1.
import { CATEGORIES, PRIORITIES } from '../utils/constants'

const DAYS = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 }
const DAY_NAMES = Object.keys(DAYS).join('|')
const PERIOD_HOUR = { matin: 9, 'apres-midi': 14, soir: 18 }
const NUMBER_WORDS = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
}
const MONTHS = {
  janvier: 0,
  janv: 0,
  fevrier: 1,
  fevr: 1,
  mars: 2,
  avril: 3,
  avr: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  juil: 6,
  aout: 7,
  septembre: 8,
  sept: 8,
  octobre: 9,
  oct: 9,
  novembre: 10,
  nov: 10,
  decembre: 11,
  dec: 11,
}

const DATE_EXPR =
  `(apres-demain|demain|aujourd'hui|aujourdhui|dans\\s+(?:\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+(?:jours?|semaines?)|` +
  `(?:la\\s+)?semaine\\s+prochaine|(?:ce\\s+)?week-?end|(?:ce\\s+)?(?:${DAY_NAMES})(?:\\s+prochain)?|` +
  `\\d{1,2}\\s+(?:${Object.keys(MONTHS).join('|')})\\.?|\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?)(?![a-z])`

const RE_RANGE = /\b(?:de\s+)?(\d{1,2})\s*(?:h(?:eures?)?|:)(?![a-z])\s*(\d{2})?\s*(?:a|-)\s*(\d{1,2})\s*(?:h(?:eures?)?|:)(?![a-z])\s*(\d{2})?(?!\d)/
const RE_TIME = /\ba\s*(\d{1,2})\s*(?:h(?:eures?)?|:)(?![a-z])\s*(\d{2})?(?!\d)/
const RE_NAMED_TIME = /\ba\s+(midi|minuit)\b/
const RE_BARE_TIME = /\b(\d{1,2})\s*(?:h(?:eures?)?|:)(?![a-z])\s*(\d{2})?(?!\d)/
const RE_DURATION_H = /\b(\d+)\s*h(?:eures?)?(?![a-z])(\d{2})?(?!\d)/
const RE_DURATION_MIN = /\b(\d+)\s*(?:min|minutes?)(?![a-z])/
const RE_DEADLINE = new RegExp(`\\b(?:avant|d'ici|dici|pour|jusqu'a)\\s+(?:le\\s+)?${DATE_EXPR}`)
const RE_DATE = new RegExp(`\\b(?:le\\s+)?${DATE_EXPR}`)
const RE_PERIOD = /\b(?:(ce|cet|le)\s+)?(?:(?:de\s+)?l[' ]|du\s+|en\s+)?(matin|apres[- ]midi|soir|soiree)(?![a-z])/

const KEYWORDS = {
  cours: ['cours', 'amphi', 'td', 'class', 'lecture', 'درس', 'حصة'],
  revision: ['revis', 'exam', 'controle', 'qcm', 'study', 'revise', 'امتحان'],
  reunion: ['reunion', 'rdv', 'rendez-vous', 'rendez vous', 'meeting', 'اجتماع'],
  projet: ['projet', 'rapport', 'devoir', 'dossier', 'tp', 'project', 'homework', 'assignment', 'مشروع'],
  loisir: ['sport', 'film', 'jeu', 'loisir', 'detente', 'sortie', 'workout', 'gym', 'movie'],
}

const INTENTS = ['create', 'query', 'modify', 'goal', 'chitchat', 'other']
const LOCAL_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const ACTIVITY_VERB =
  /^(?:ajouter|planifier|programmer|prevoir|creer|reviser|preparer|lire|apprendre|aller|faire|appeler|travailler|etudier|ecrire|finir|rendre|reserver|organiser|assister|participer|acheter|envoyer|nettoyer|cuisiner|courir|study|prepare|read|review|revise|learn|practice|practise|work|call|book|attend|write|finish|do)\b/

const pad = (n) => String(n).padStart(2, '0')
const toISO = (d, h = 0, m = 0) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const rangeMinutes = (r) => r.eh * 60 + r.em - (r.sh * 60 + r.sm)

// Sans accents, en minuscules, et de MEME LONGUEUR que le texte d'origine.
const normalize = (text) =>
  text
    .split('')
    .map((c) => (c === '\u2019' ? "'" : c.normalize('NFD')[0].toLowerCase()[0]))
    .join('')

// ---------- Pretraitement : fautes de frappe, anglais, arabe ----------
// Tout est ramene au francais AVANT l'analyse, uniquement pour les mots de date, d'heure et de duree
// (les titres restent tels que l'utilisateur les ecrit). preprocess(preprocess(x)) === preprocess(x).
const AR = '\\u0600-\\u06FF'
const arWord = (pattern, prefix = false) =>
  new RegExp(`(?<![${AR}])${prefix ? '(?:ال)?' : ''}(?:${pattern})(?![${AR}])`, 'g')

// Arabe sans voyelles breves ni tatweel, alef et ya unifies, chiffres arabes -> 0-9
function arNorm(text) {
  return String(text ?? '')
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

const AR_DAYS = [
  ['اثنين', 'lundi'],
  ['ثلاثاء', 'mardi'],
  ['اربعاء', 'mercredi'],
  ['خميس', 'jeudi'],
  ['جمعة', 'vendredi'],
  ['سبت', 'samedi'],
]
const AR_COUNT = { ثلاث: 3, اربع: 4, خمس: 5 }

const AR_RULES = [
  [arWord('اسبوع\\s+(?:ال)?(?:قادم|مقبل)', true), 'semaine prochaine'],
  [arWord('هذا\\s+(?:ال)?اسبوع'), 'cette semaine'],
  [arWord('بعد\\s+غدا?'), 'apres-demain'],
  [arWord('غدا?'), 'demain'],
  [arWord('اليوم'), "aujourd'hui"],
  [arWord('يوم'), ''],
  ...AR_DAYS.map(([ar, fr]) => [arWord(ar, true), fr]),
  [/(?<![\u0600-\u06FF])الاحد(?![\u0600-\u06FF])/g, 'dimanche'],
  [/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(?:ال)?(?:قادم|مقبل)(?![\u0600-\u06FF])/g, '$1 prochain'],
  [arWord('صباحا?', true), 'matin'],
  [arWord('بعد\\s+(?:ال)?(?:ظهر|ظهيرة)'), 'apres-midi'],
  [arWord('مساءا?', true), 'soir'],
  [arWord('نصف\\s+ساعة'), '30 min'],
  [arWord('ربع\\s+ساعة'), '15 min'],
  [arWord('ساعة\\s+و\\s*نصف'), '1h30'],
  [arWord('ساعتين'), '2 h'],
  [/(?<![\u0600-\u06FF])الساعة\s+(\d{1,2})(?::(\d{2}))?/g, (_, h, m) => `à ${h}h${m || ''}`],
  [/(\d+)\s*(?:ساعات|ساعة)(?![\u0600-\u06FF])/g, '$1 h'],
  [/(\d+)\s*(?:دقيقة|دقائق)(?![\u0600-\u06FF])/g, '$1 min'],
  [/(?<![\u0600-\u06FF])(ثلاث|اربع|خمس)\s+ساعات(?![\u0600-\u06FF])/g, (_, w) => `${AR_COUNT[w]} h`],
  [arWord('ساعة'), '1 h'],
  [arWord('في'), ''],
]

function preprocessArabic(text) {
  if (!/[\u0600-\u06FF]/.test(text)) return text
  let t = arNorm(text)
  for (const [re, to] of AR_RULES) t = t.replace(re, to)
  return t.replace(/ {2,}/g, ' ').trim()
}

function preprocessDarija(text) {
  const rules = [
    [/\b(?:ghda|ghdda|ghadi)\b/gi, 'demain'],
    [/\blyoum\b/gi, "aujourd'hui"],
    [/\bsbah\b/gi, 'matin'],
    [/\b(?:l3chiya|lmasa)\b/gi, 'soir'],
    [/\bmn\s+(\d{1,2})\s+l\s+(\d{1,2})\b/gi, (_, start, end) => `de ${start}h à ${end}h`],
    [/هل\s+عندي/g, "est-ce que j'ai"],
    [/شنو\s+عندي|اشنو\s+عندي/g, "j'ai quoi"],
    [/هدفي/g, 'mon objectif'],
    [/النجاح/g, 'reussir'],
    [/عندي/g, "j'ai"],
    [/بدل|غير/g, 'change'],
    [/وقت/g, 'time'],
    [/\bwach\b/gi, 'est-ce que'],
    [/\b(?:chno|chnou|achno|shno)\b/gi, "j'ai quoi"],
    [/\b(?:3andi|3ndi)\b/gi, "j'ai"],
    [/\bchi\s+(?=\w)/gi, ''],
    [/\bbghit\b/gi, 'je veux'],
    [/\b(?:zid)\b/gi, 'mets'],
    [/\b(?:bdel|bddl|bdl)\b/gi, 'change'],
    [/\bsawb(?:\s+liya)?\b/gi, 'planifie'],
    [/\bl\s+(?=\d)/gi, 'à '],
  ]
  return rules.reduce((out, [re, to]) => out.replace(re, to), text)
}

const EN_DAYS = {
  monday: 'lundi',
  tuesday: 'mardi',
  wednesday: 'mercredi',
  thursday: 'jeudi',
  friday: 'vendredi',
  saturday: 'samedi',
  sunday: 'dimanche',
}
const EN_NUMBERS = { one: 1, an: 1, a: 1, two: 2, three: 3, four: 4, five: 5 }

function preprocessEnglish(text) {
  const rules = [
    // intentions
    [/\bwhat do i (?:need|have) to do\b/gi, 'que dois-je faire'],
    [/\bwhat do i have\b/gi, "j'ai quoi"],
    [/\bam i (?:free|available)\b/gi, 'suis-je libre'],
    [/\bhow (?:busy|booked) am i\b/gi, 'suis-je occupé'],
    [/\bmy (?:schedule|agenda|planning)\b/gi, 'mon planning'],
    [/\bmy deadlines\b/gi, 'mes echeances'],
    [/\boverdue\b/gi, 'en retard'],
    [/\bfind me\b/gi, 'trouve-moi'],
    [/\bi(?:'ve| have)? (?:finished|completed)\b/gi, "j'ai fini"],
    [/\bcancel\b/gi, 'annule'],
    [/\bdelete\b/gi, 'supprime'],
    [/\bpostpone\b/gi, 'reporte'],
    [/\breschedule\b/gi, 'replanifie'],
    [/^\s*(?:add|schedule|plan|book)\s+/gi, 'ajoute '],
    [/^\s*i (?:have to|need to|must|should)\s+/gi, 'je dois '],
    // jours et periodes
    [/\bday after tomorrow\b/gi, 'apres-demain'],
    [/\btomorrow\b/gi, 'demain'],
    [/\btoday\b/gi, "aujourd'hui"],
    [/\btonight\b/gi, 'ce soir'],
    [/\bnext week\b/gi, 'semaine prochaine'],
    [/\b(?:this|current) week\b/gi, 'cette semaine'],
    [/\bweek-?end\b/gi, 'week-end'],
    [new RegExp(`\\b(${Object.keys(EN_DAYS).join('|')})\\b`, 'gi'), (d) => EN_DAYS[d.toLowerCase()]],
    [new RegExp(`\\bnext\\s+(${Object.keys(DAYS).join('|')})\\b`, 'g'), '$1 prochain'],
    [new RegExp(`\\b(?:on|this)\\s+(?=(?:${Object.keys(DAYS).join('|')})\\b)`, 'g'), ''],
    [/\bmorning\b/gi, 'matin'],
    [/\bafternoon\b/gi, 'apres-midi'],
    [/\bevening\b/gi, 'soir'],
    [/\b(?:in|during)\s+the\s+(?=(?:matin|apres-midi|soir)\b)/gi, ''],
    // heures
    [
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi,
      (_, h, m, ap) => `${(Number(h) % 12) + (/pm/i.test(ap) ? 12 : 0)}h${m || ''}`,
    ],
    [/\b(\d{1,2}h(?:\d{2})?)\s+(?:to|until|till)\s+(?=\d)/gi, '$1 à '],
    [/\bat\s+(?=\d)/gi, 'à '],
    [/\bfrom\s+(?=\d)/gi, 'de '],
    [/\bfor\s+(?=\d|half\b|an? hour\b)/gi, 'pendant '],
    // durees
    [/\bhalf an hour\b/gi, '30 min'],
    [/\b(\d+)\.5\s*(?:hours?|hrs?)\b/gi, '$1h30'],
    [/\b(\d+)\s*(?:hours?|hrs?)\b/gi, '$1 h'],
    [/\b(one|an|a|two|three|four|five)\s+hours?\b/gi, (_, w) => `${EN_NUMBERS[w.toLowerCase()]} h`],
    [/\b(\d+)\s*mins?\b/gi, '$1 min'],
    // echeances
    [new RegExp(`\\bby\\s+(?=(?:${Object.keys(DAYS).join('|')}|demain|apres-demain)\\b)`, 'gi'), 'avant '],
    [/\bbefore\b/gi, 'avant'],
    [/\bin\s+(\d+)\s+days?\b/gi, 'dans $1 jours'],
    [/\b(?:until|till)\b/gi, "jusqu'à"],
  ]
  return rules.reduce((t, [re, to]) => t.replace(re, to), text)
}

// Mots proches (1 faute : lettre en trop, manquante, fausse ou inversee) d'un mot de date connu
const FUZZY_WORDS = [
  ...Object.keys(DAYS),
  'demain',
  'semaine',
  'prochain',
  'prochaine',
  'avant',
  'apres',
  "aujourd'hui",
  'matin',
  'soir',
  'heures',
  'minutes',
  'reporte',
  'annule',
  'supprime',
  'termine',
  'libre',
  'planning',
  'echeance',
]
const FUZZY_SKIP = new Set(['domain', 'malin', 'martin', 'soit', 'livre', 'report', 'heure', 'termite', 'annuel', 'annual'])

function distance1(a, b) {
  if (a === b) return false
  if (Math.abs(a.length - b.length) > 1) return false
  if (a.length === b.length) {
    const diff = []
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff.push(i)
    if (diff.length === 1) return true
    return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a]
  let i = 0
  while (i < short.length && long[i] === short[i]) i++
  return long.slice(i + 1) === short.slice(i)
}

function fixTypos(text) {
  return text.replace(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g, (word) => {
    const n = normalize(word)
    if (n.length < 4 || FUZZY_WORDS.includes(n) || FUZZY_SKIP.has(n)) return word
    const targets = FUZZY_WORDS.filter((w) => w[0] === n[0] && distance1(n, w))
    return targets.length === 1 ? targets[0] : word
  })
}

export function preprocess(text) {
  if (!text) return ''
  return fixTypos(preprocessEnglish(preprocessArabic(preprocessDarija(String(text)))))
}
// Corrige seulement les fautes de frappe (pour l'affichage des morceaux d'une liste de taches).
export const correctTypos = (text) => fixTypos(String(text ?? ''))

// ---------- Langue de l'utilisateur ----------
const EN_HINT =
  /\b(tomorrow|today|tonight|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|meeting|class|homework|exam|study|revise|at|the|for|hours?|mins?|am|pm|free|cancel|postpone|delete|finished|what|my|please|thanks|thank|you|hello|hi|hey|good|morning|evening|yes|sure|help|weather|forecast|joke|capital|recipe|news)\b/i
const FR_HINT =
  /[àâçéèêëîïôûùüœ]|\b(le|la|les|un|une|des|de|du|et|pour|avant|apres|demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|cours|reunion|je|j'ai|mon|ma|mes|que|qui|est|suis|bonjour|bonsoir|salut|merci|puis|ensuite|dans|semaine|prochain|prochaine|matin|soir|heure|heures|ajoute|annule|reporte|supprime)\b/i
const LANG_NAMES = { en: 'anglais', ar: 'arabe' }

// 'ar', 'en', 'fr', ou null si on ne peut pas savoir ("12h", "oui") : le chat garde alors la langue precedente.
export function detectLanguage(text) {
  const t = String(text ?? '')
  if (/[\u0600-\u06FF]/.test(t)) return 'ar'
  if (/\b(salam|slm|marhaba|ahlan|shukran|choukran)\b/i.test(t)) return 'ar'
  if (EN_HINT.test(t)) return 'en'
  // Le francais demande une preuve (accent ou mot courant) : un simple nom comme "budget review" ne change pas la langue.
  return FR_HINT.test(t) ? 'fr' : null
}

function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + n)
  return d
}

function resolveDate(expr, now) {
  const e = expr.replace(/\s+/g, ' ').replace(/^(?:le|ce)\s+/, '').replace(/ prochain$/, '')
  if (e === 'demain') return addDays(now, 1)
  if (e === 'apres-demain') return addDays(now, 2)
  if (e.startsWith('aujourd')) return addDays(now, 0)
  const dans = /^dans (\d+|[a-z]+) (jours?|semaines?)$/.exec(e)
  if (dans) {
    const count = Number(dans[1]) || NUMBER_WORDS[dans[1]]
    return addDays(now, count * (dans[2].startsWith('semaine') ? 7 : 1))
  }
  if (/semaine prochaine$/.test(e)) return addDays(now, (1 - now.getDay() + 7) % 7 || 7)
  if (/week-?end$/.test(e)) return addDays(now, (6 - now.getDay() + 7) % 7)
  if (e in DAYS) return addDays(now, (DAYS[e] - now.getDay() + 7) % 7 || 7)
  const named = /^(\d{1,2})\s+([a-z]+)\.?$/.exec(e)
  if (named && named[2] in MONTHS) return new Date(now.getFullYear(), MONTHS[named[2]], Number(named[1]))
  const [d, m, y] = e.split('/').map(Number)
  const year = y ? (y < 100 ? 2000 + y : y) : now.getFullYear()
  return new Date(year, m - 1, d)
}

function detectCategory(norm) {
  for (const cat of CATEGORIES) {
    if (
      KEYWORDS[cat]?.some((k) =>
        /[\u0600-\u06FF]/.test(k) ? norm.includes(k) : new RegExp(`\\b${k}`).test(norm),
      )
    ) {
      return cat
    }
  }
  return 'personnel'
}

function describesActivity(text, category) {
  const n = normalize(text).trim()
  return /^(?:je dois|il faut)\b/.test(n) || ACTIVITY_VERB.test(n) || category !== 'personnel'
}

function cleanTitle(orig) {
  let t = orig
    .replace(
      /^\s*(?:ajouter|ajoute|planifier|planifie|pr[ée]voir|pr[ée]vois|programmer|programme|cr[ée]er|cr[ée]e|je dois|j'ai|il faut|je veux)\s+(?:un|une)?\s*/i,
      '',
    )
    .replace(/^\s*(?:عندي|لدي)\s+/u, '')
    .replace(/\s+/g, ' ')
  for (let i = 0; i < 3; i++) {
    t = t
      .replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, '')
      .replace(/\s+(le|la|a|à|de|du|pour|d'|pendant|durant|environ|vers|sur|en)$/i, '')
  }
  t = t.trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Activité'
}

// Extrait heure, plage, duree, date et periode ; renvoie aussi le texte restant.
// loose : accepte une plage sans "de" (reponse a une question). clockOnly : ignore les durees.
function scan(text, now, { loose = false, clockOnly = false } = {}) {
  let orig = text
  let norm = normalize(text)
  const cut = (re) => {
    const m = re.exec(norm)
    if (!m) return null
    const end = m.index + m[0].length
    norm = `${norm.slice(0, m.index)} ${norm.slice(end)}`
    orig = `${orig.slice(0, m.index)} ${orig.slice(end)}`
    return m
  }
  const out = { range: null, time: null, durationMin: null, date: null, isDeadline: false, period: null }
  const hasDateOrPeriod = RE_DATE.test(norm) || RE_PERIOD.test(norm)
  const periodClock =
    /\b\d{1,2}\s*(?:h(?:eures?)?|:)\s*(?:de\s+l[' ]|du\s+|en\s+)(?:apres[- ]midi|soir|soiree)\b/.test(norm)

  const r = RE_RANGE.exec(norm)
  if (r) {
    const sh = Number(r[1])
    const sm = Number(r[2] || 0)
    const eh = Number(r[3])
    const em = Number(r[4] || 0)
    const explicit = loose || /^de\s/.test(r[0]) || r[0].includes('-')
    if (explicit && sh < 24 && sm < 60 && eh <= 24 && em < 60 && eh * 60 + em > sh * 60 + sm) {
      cut(RE_RANGE)
      out.range = { sh, sm, eh, em }
    }
  }
  if (!out.range) {
    const t = cut(RE_TIME)
    if (t && Number(t[1]) < 24 && Number(t[2] || 0) < 60) {
      out.time = { hh: Number(t[1]), mm: Number(t[2] || 0) }
    } else {
      const named = cut(RE_NAMED_TIME)
      if (named) {
        out.time = { hh: named[1] === 'midi' ? 12 : 0, mm: 0 }
      } else {
        const bare = RE_BARE_TIME.exec(norm)
        const hour = Number(bare?.[1])
        if (bare && (clockOnly || periodClock || (hasDateOrPeriod && hour >= 7 && hour <= 23))) {
          cut(RE_BARE_TIME)
          out.time = { hh: hour, mm: Number(bare[2] || 0) }
        }
      }
    }
  }

  if (!out.range && !clockOnly) {
    const h = cut(RE_DURATION_H)
    if (h) out.durationMin = Number(h[1]) * 60 + Number(h[2] || 0)
    else {
      const min = cut(RE_DURATION_MIN)
      if (min) out.durationMin = Number(min[1])
    }
  }

  const dl = cut(RE_DEADLINE)
  if (dl) {
    out.date = resolveDate(dl[1], now)
    out.isDeadline = true
  } else {
    const d = cut(RE_DATE)
    if (d) out.date = resolveDate(d[1], now)
  }

  const p = cut(RE_PERIOD)
  if (p) {
    out.period = p[2].replace(' ', '-').replace('soiree', 'soir')
    if (out.time && ['apres-midi', 'soir'].includes(out.period) && out.time.hh > 0 && out.time.hh < 12) {
      out.time.hh += 12
    }
    if (out.time && out.period === 'matin' && out.time.hh === 12) out.time.hh = 0
  }

  return { ...out, orig, norm }
}

// ---------- V1 : regles ----------
// Renvoie { task, missing, assumed } ou null si rien n'est compris.
// missing : champs a demander ('deadline' ou 'time'). assumed : valeurs par defaut utilisees.
export function parseTaskDetailed(input, now = new Date()) {
  if (!input || !input.trim()) return null
  const text = preprocess(input)
  const s = scan(text, now)
  const hasClock = Boolean(s.range || s.time || s.period)
  const category = detectCategory(normalize(text))
  if (!hasClock && !s.durationMin && !s.date && !describesActivity(text, category)) return null

  const durationMin = s.range ? rangeMinutes(s.range) : s.durationMin || 60
  const assumed = s.range || s.durationMin ? [] : ['durationMin']
  const isFixed = hasClock && !s.isDeadline

  let priority = 'moyenne'
  if (/\b(urgent|important|prioritaire|haute)/.test(s.norm)) priority = 'haute'
  else if (/\b(facultatif|peu important|basse)/.test(s.norm)) priority = 'basse'
  else if (!isFixed && s.date && (s.date - now) / 86400000 <= 7) priority = 'haute'

  const base = {
    title: cleanTitle(s.orig),
    category,
    priority,
    durationMin,
    ...(assumed.length ? { _noDuration: true } : {}),
  }

  if (isFixed) {
    const [hh, mm] = s.range
      ? [s.range.sh, s.range.sm]
      : s.time
        ? [s.time.hh, s.time.mm]
        : [PERIOD_HOUR[s.period], 0]
    let day = s.date || addDays(now, 0)
    if (!s.date && new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm) < now) {
      day = addDays(now, 1)
    }
    return { task: { ...base, type: 'fixe', start: toISO(day, hh, mm), deadline: null }, missing: [], assumed }
  }

  // Un cours ou une reunion avec une date mais sans heure : on demande l'heure.
  if (['cours', 'reunion'].includes(category) && s.date && !s.isDeadline) {
    return {
      task: { ...base, type: 'fixe', start: null, deadline: null, _date: dateStr(s.date) },
      missing: ['time'],
      assumed,
    }
  }

  const [dh, dm] = s.time
    ? [s.time.hh, s.time.mm]
    : s.period
      ? [PERIOD_HOUR[s.period], 0]
      : s.range
        ? [s.range.sh, s.range.sm]
        : [18, 0]
  const deadline = s.date ? toISO(s.date, dh, dm) : null
  return {
    task: { ...base, type: 'flexible', start: null, deadline },
    missing: deadline ? [] : ['deadline'],
    assumed,
  }
}

export function parseTask(text, now = new Date()) {
  return parseTaskDetailed(text, now)?.task ?? null
}

// Duree donnee en mots ou avec un simple nombre : "une heure", "demi-heure", "2" (= 2 h), "90" (= 90 min)
function bareDuration(norm) {
  const n = norm.trim()
  if (/demi.?heure/.test(n)) return 30
  const words = { une: 1, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 }
  const m = /\b(une|un|deux|trois|quatre|cinq)\s+heures?(?:\s+et\s+(demie?|quart))?/.exec(n)
  if (m) return words[m[1]] * 60 + (m[2] ? (m[2] === 'quart' ? 15 : 30) : 0)
  const b = /^\D*(\d+)\D*$/.exec(n)
  if (b) {
    const v = Number(b[1])
    return v <= 8 ? v * 60 : v
  }
  return null
}

// Titres trop generiques : on demande le nom precis ("Cours" -> "Cours de maths")
const GENERIC_TITLE =
  /^(cours|td|tp|reunion|rdv|rendez-vous|meeting|projet|devoir|rapport|dossier|examen|exam|controle|revision|activite|tache)$/
const TITLE_WITH_DE = /^(cours|td|tp|examen|exam|controle|revision)$/

export const isGenericTitle = (title) => GENERIC_TITLE.test(normalize(title || '').trim())

// "Cours" + "maths" -> "Cours de maths" ; "Cours" + "anglais" -> "Cours d'anglais"
function buildTitle(generic, answer) {
  const a = answer.trim().replace(/[?!.]+$/, '')
  const base = normalize(generic).trim()
  const na = normalize(a)
  let title = a
  if (!na.startsWith(base)) {
    const linked = /^(de |d'|du |des )/.test(na)
      ? ''
      : TITLE_WITH_DE.test(base)
        ? /^[aeiouy]/.test(na)
          ? "d'"
          : 'de '
        : ''
    title = `${generic} ${linked}${a}`
  }
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// Informations a demander a l'utilisateur, dans l'ordre : 'title', 'time', 'deadline', 'duration'
export function missingFields(task) {
  const out = []
  if (isGenericTitle(task.title)) out.push('title')
  if (task.type === 'fixe' && !task.start) out.push('time')
  if (task.type === 'flexible' && !task.deadline) out.push('deadline')
  if (task._noDuration) out.push('duration')
  return out
}

// Complete une tache avec la reponse de l'utilisateur a une question (field : 'title', 'deadline', 'time' ou 'duration').
// Renvoie la tache completee, ou null si la reponse n'est pas comprise.
export function completeTask(task, field, text, now = new Date()) {
  if (field === 'title') {
    const name = (text || '').trim()
    if (!name || name.length > 60 || yesNo(name)) return null
    // Une phrase avec une date, une heure ou une duree est une nouvelle demande, pas un nom.
    const s = scan(preprocess(name), now)
    if (s.date || s.time || s.range || s.period || s.durationMin) return null
    return { ...task, title: buildTitle(task.title, name) }
  }
  text = preprocess(text)
  const s = scan(text, now, { loose: true, clockOnly: field !== 'duration' })
  if (field === 'duration') {
    const half = /(\d+)\s*(?:h|heures?)\s+et\s+(demie?|quart)/.exec(normalize(text))
    const minutes = half
      ? Number(half[1]) * 60 + (half[2] === 'quart' ? 15 : 30)
      : s.range
        ? rangeMinutes(s.range)
        : s.durationMin || bareDuration(s.norm)
    if (!minutes) return null
    const { _noDuration, ...rest } = task
    return { ...rest, durationMin: minutes }
  }
  let clock = null
  if (s.range) clock = [s.range.sh, s.range.sm]
  else if (s.time) clock = [s.time.hh, s.time.mm]
  else if (s.period) clock = [PERIOD_HOUR[s.period], 0]
  else {
    const m = RE_BARE_TIME.exec(s.norm)
    if (m && Number(m[1]) < 24 && Number(m[2] || 0) < 60) clock = [Number(m[1]), Number(m[2] || 0)]
  }

  if (field === 'deadline') {
    if (!s.date) return null
    const [h, m] = clock || [18, 0]
    return { ...task, deadline: toISO(s.date, h, m) }
  }
  if (field === 'time') {
    if (!clock) return null
    const { _date, _noDuration, ...rest } = task
    const day = s.date ? dateStr(s.date) : _date || rest.start?.slice(0, 10) || dateStr(now)
    return {
      ...rest,
      ...(_noDuration && !s.range ? { _noDuration: true } : {}),
      type: 'fixe',
      deadline: null,
      start: `${day}T${pad(clock[0])}:${pad(clock[1])}`,
      durationMin: s.range ? rangeMinutes(s.range) : rest.durationMin,
    }
  }
  return null
}

// Reponse courte a une question fermee ("je l'ajoute ?") : 'yes', 'no' ou null.
// "non 2 h" n'est PAS un simple non : c'est une correction (voir refineTask).
const YES =
  /^(oui|ouais|yes|yep|ok|okay|sure|dac|d accord|vas y|allez y|allez|parfait|c est bon|ca marche|ca me va|bien sur|volontiers|ajoute( le| la)?|accepte|confirme|valide|go|top|super|nickel)( (merci|svp|stp|s il (te|vous) plait|parfait|bien sur|c est bon|ca marche|ajoute( le| la)?))*$/
const NO =
  /^(non|nan|nope|pas maintenant|annule|annuler|refuse|laisse tomber|finalement non|pas du tout)( (merci|svp|stp|finalement|laisse tomber))*$/
const AR_YES = /^(نعم|اي|ايوه|ايوا|حسنا|موافق|تمام|طيب)$/
const AR_NO = /^(لا|كلا)$/
export function yesNo(text) {
  const ar = arNorm(text).replace(/[^\u0600-\u06FF]+/g, ' ').trim()
  if (AR_YES.test(ar)) return 'yes'
  if (AR_NO.test(ar)) return 'no'
  const n = normalize(text || '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (!n) return null
  if (YES.test(n)) return 'yes'
  if (NO.test(n)) return 'no'
  return null
}

const GREETING = "Bonjour ! Dites-moi ce que vous avez à faire et je m'occupe de trouver le bon moment."
const HELP =
  'Je peux vous aider à planifier : une tâche (« Réviser les réseaux »), une plage horaire (« Réunion de 14 h à 15 h »), une question (« Suis-je libre jeudi ? »), une modification (« Décale le cours ») ou un objectif (« Préparer mon examen »).'

const RULE_REPLIES = {
  greeting: {
    fr: GREETING,
    en: 'Hello! Tell me what you need to do and I’ll find a good time.',
    ar: 'مرحبًا! أخبرني بما تريد إنجازه وسأجد لك وقتًا مناسبًا.',
  },
  thanks: {
    fr: 'Avec plaisir ! Dites-moi si vous avez autre chose à planifier.',
    en: 'You’re welcome! Tell me if there’s anything else you’d like to plan.',
    ar: 'على الرحب والسعة! أخبرني إن كان لديك شيء آخر تريد التخطيط له.',
  },
  help: {
    fr: HELP,
    en: 'I can help you plan: a task (“Review networks”), a time slot (“Meeting from 14:00 to 15:00”), a question (“Am I free Thursday?”), a change (“Move my class”) or a goal (“Prepare for my exam”).',
    ar: 'يمكنني مساعدتك في التخطيط: مهمة («مراجعة الشبكات»)، فترة زمنية («اجتماع من 14:00 إلى 15:00»)، سؤال («هل أنا متاح يوم الخميس؟»)، تعديل («غيّر موعد الدرس») أو هدف («الاستعداد لامتحاني»).',
  },
  offTopic: {
    fr: "Je peux seulement t'aider à planifier ton emploi du temps…",
    en: 'I can only help you plan your schedule…',
    ar: 'يمكنني مساعدتك فقط في تخطيط جدولك…',
  },
  unclear: {
    fr: "Je n'ai pas bien compris. Dites-moi ce que vous avez à faire, avec la durée ou la date si vous les connaissez.",
    en: 'I didn’t quite understand. Tell me what you need to do, and include a duration or date if you know it.',
    ar: 'لم أفهم تمامًا. أخبرني بما تريد إنجازه، مع المدة أو التاريخ إن كنت تعرفهما.',
  },
}

function ruleReply(kind, lang) {
  return RULE_REPLIES[kind][lang] || RULE_REPLIES[kind].fr
}

function ruleResponse(intent, kind, lang) {
  const reply = ruleReply(kind, lang)
  return lang === 'fr' ? { intent, reply } : { intent, reply, replyFr: ruleReply(kind, 'fr') }
}

// Intention + details par regles. Renvoie { intent, reply?, task?, missing?, assumed? }.
const AR_GREETING = /^(مرحبا|اهلا|سلام|السلام عليكم|صباح الخير|مساء الخير)( .*)?$/
const AR_MIXED_GREETING = /^(?:مرحبا|اهلا|سلام|السلام عليكم)[،,]\s*(?:bonjour|bonsoir|salut|hello|hi)[!?؟]*$/i
const AR_THANKS = /^(شكرا|شكرا جزيلا|بارك الله فيك)$/
const NEXT_ACTIVITY =
  /\b(?:mon|ma|mes)\s+prochain(?:e|s|es)?\s+(?:cours|activite|activites|seance|reunion|examen|evenement)\b|\bmy\s+next\s+(?:class|course|activity|meeting|exam|event)\b/
const EDIT_VERB = /\b(mets|mettre|avance|avancer|change|changer|raccourcis|raccourcir|shorten|reduce|move|advance|adjust|set)\b/
const EDIT_TARGET = /\b(cours|class|course|reunion|rdv|rendez|meeting|activite|activity|heure|time)\b/

export function analyzeRules(input, now = new Date()) {
  const n0 = normalize(input || '').trim()
  const language = detectLanguage(input) || 'fr'
  if (!n0) return ruleResponse('other', 'unclear', language)
  const ar = arNorm(input).trim()
  if (AR_GREETING.test(ar) && ar.split(/\s+/).length <= 3) return ruleResponse('chitchat', 'greeting', language)
  if (AR_MIXED_GREETING.test(ar)) return ruleResponse('chitchat', 'greeting', language)
  if (AR_THANKS.test(ar)) return ruleResponse('chitchat', 'thanks', language)
  // Salutations : testees sur le texte brut ("good morning" ne doit pas devenir "good matin")
  const text = preprocess(input)
  const n = normalize(text).trim()
  const greetingText = n0.replace(/[!?.,]/g, ' ').replace(/\s+/g, ' ').trim()
  const extendedGreeting = /^(?:salut|bonjour|hello|hi|hey) (?:ca va|how are you)$/.test(greetingText)
  if (
    /^(bonjour|bonsoir|salut|hello|hi|hey|coucou|salam|slm|marhaba|ahlan|good morning|good evening)\b/.test(n0) &&
    (n0.split(/\s+/).length <= 3 || extendedGreeting)
  ) {
    return ruleResponse('chitchat', 'greeting', language)
  }
  if (/^(merci|thanks|thank you|shukran|choukran)\b/.test(n0)) {
    return ruleResponse('chitchat', 'thanks', language)
  }
  if (
    /^(aide|help|aidez.moi|comment ca marche|que sais.tu faire|what can you do)\b/.test(n0) ||
    /(مساعدة|ساعدني|ماذا تستطيع أن تفعل)/.test(String(input || ''))
  ) {
    return ruleResponse('chitchat', 'help', language)
  }
  if (/\b(meteo|weather|forecast|temperature)\b/.test(n)) return ruleResponse('other', 'offTopic', language)
  if (/\bmatch\b/.test(n) && /\b(who|won|gagne|gagner|score|result|resultat)\b/.test(n)) {
    return ruleResponse('other', 'offTopic', language)
  }
  if (
    /\bj'ai (fini|termine|finis|rate|manque|loupe)\b|\b(reporte|reporter|annule|annuler|supprime|supprimer|efface|effacer|replanifie|replanifier|replace|replacer|decale|decaler|deplace|deplacer|repousse|repousser)\b|\b(est|sont|c'est) (fini|finie|finis|termine|terminee|termines)\b|\b(dure|durera|a dure|prolonge|rallonge)\b.*(de plus|en plus|de moins|en moins)/.test(
      n,
    )
  ) {
    return { intent: 'modify' }
  }
  const creating = /^(ajoute|ajouter|planifi|programm|cree|creer|prevoi|mets|mettre)/.test(n)
  if (
    !creating &&
    (NEXT_ACTIVITY.test(n) ||
      /\b(que dois.je faire|qu.est.ce que (je dois|j'ai)|qu'ai-je|j'ai quoi|ai.je (quelque chose|quoi)|quoi de prevu|suis.je (libre|disponible|occupe|prise?)|je suis (libre|disponible|occupe|prise?)|quelles? sont mes|mon planning|mon programme|mes echeances|mes taches|mes activites|en retard|trouve.moi|cherche.moi|un creneau libre)\b/.test(
        n,
      ) ||
      /\best-ce que j'ai(?:\s|$)/.test(n))
  ) {
    return { intent: 'query' }
  }
  if (
    /\b(objectif|je veux reussir|je veux apprendre)\b/.test(n) ||
    /\bje veux preparer\b.*\b(examen|exam|concours|semestre|certificat|certification|diplome|diploma)\b/.test(n) ||
    /\bmy goal\b/.test(n) ||
    /\bi want to prepare\b.*\b(exam|examination|certification|diploma|semester)\b/.test(n) ||
    /\bje voudrais reussir\b.*\b(examen|exam|concours|semestre|certificat|diplome)\b/.test(n) ||
    (/\bje veux\b.*\bnwjed\b.*\b(exam|examen)\b/.test(n) &&
      !scan(text, now).date &&
      !scan(text, now).time &&
      !scan(text, now).durationMin)
  ) {
    return { intent: 'goal' }
  }
  if (EDIT_VERB.test(n) && EDIT_TARGET.test(n)) return { intent: 'modify' }

  const detailed = parseTaskDetailed(text, now)
  if (detailed) return { intent: 'create', ...detailed }
  const offTopic =
    /\b(capital|capitale|joke|blague|recipe|recette|news|actualites|politics|politique|match|who won)\b/.test(n) ||
    /(طقس|مباراة|نتيجة|عاصمة|نكتة)/.test(String(input || ''))
  return ruleResponse('other', offTopic ? 'offTopic' : 'unclear', language)
}

// ---------- V2 : API Gemini ----------
// Modeles essayes dans l'ordre : si l'un est surcharge (503) ou introuvable (404), on passe au suivant
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest']
const RETRY_STATUS = [404, 429, 500, 503]
const GEMINI_TIMEOUT_MS = 6000
const geminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

function buildPrompt(text, now) {
  const weekday = now.toLocaleDateString('fr-FR', { weekday: 'long' })
  return `Tu es l'assistant d'un planning pour etudiants et professionnels. Nous sommes ${weekday} ${toISO(now, now.getHours(), now.getMinutes())}.
La phrase peut contenir des fautes de frappe ou etre en francais, en anglais ou en arabe : comprends-la quand meme et garde le titre dans la langue de l'utilisateur.
Le champ reply doit etre ecrit dans la langue de la phrase : en anglais si la phrase est en anglais, en arabe si elle est en arabe, en francais seulement si elle est en francais.
Si la phrase decrit une activite a ajouter, meme sans tous les details, reponds avec intent "create" et non "other".
Reponds uniquement avec un JSON de cette forme :
{"intent": "create|query|modify|goal|chitchat|other", "reply": "reponse courte, dans la langue de la phrase (seulement pour chitchat ou other)", "task": {...} ou null}
Intentions : create = ajouter une activite ; query = question sur le planning ; modify = reporter, annuler ou terminer ; goal = objectif a long terme ; chitchat = salutation, remerciement, aide ; other = hors sujet.
Pour create, task contient : title (court), type ("fixe" si une heure precise, une plage ou une periode de la journee est donnee, sinon "flexible"), category (${CATEGORIES.join(' | ')}), priority (${PRIORITIES.join(' | ')}), durationMin (entier, null si inconnue), start (ISO "YYYY-MM-DDTHH:mm" si fixe, sinon null), deadline (ISO si flexible et echeance connue, sinon null).
Regles : "de 14h a 15h30" = start 14:00 et durationMin 90 ; matin = 09:00, apres-midi = 14:00, soir = 18:00 ; "dans 3 jours", "lundi prochain", "ce week-end" se calculent a partir d'aujourd'hui ; une echeance sans heure = 18:00 ; si la date est connue mais pas l'heure d'une activite fixe, mets start = la date a T00:00 ; ne devine jamais une date ou une heure absente.
Phrase : ${JSON.stringify(text)}`
}

function normalizeAiTask(t) {
  const type = t.type === 'fixe' ? 'fixe' : 'flexible'
  const duration = Number(t.durationMin) > 0 ? Math.round(Number(t.durationMin)) : null
  let start = type === 'fixe' && LOCAL_ISO.test(t.start) ? t.start : null
  const deadline = type === 'flexible' && LOCAL_ISO.test(t.deadline) ? t.deadline : null

  const task = {
    title: String(t.title).trim().slice(0, 120),
    type,
    category: CATEGORIES.includes(t.category) ? t.category : 'personnel',
    priority: PRIORITIES.includes(t.priority) ? t.priority : 'moyenne',
    durationMin: duration || 60,
    start,
    deadline,
  }
  if (!duration) task._noDuration = true
  const missing = []
  if (type === 'fixe' && start?.endsWith('T00:00')) {
    task._date = start.slice(0, 10)
    task.start = null
    start = null
  }
  if (type === 'fixe' && !start) missing.push('time')
  if (type === 'flexible' && !deadline) missing.push('deadline')
  return { task, missing, assumed: duration ? [] : ['durationMin'] }
}

// kind : 'quota' (limite gratuite atteinte), 'key' (cle refusee) ou 'unavailable' (panne, reseau...)
export class GeminiError extends Error {
  constructor(kind, status) {
    super(`Gemini ${status}`)
    this.kind = kind
    this.status = status
  }
}

export async function parseWithAI(text, apiKey, now = new Date()) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(text, now) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  })
  let res = null
  let sawQuota = false
  for (const model of GEMINI_MODELS) {
    try {
      res = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      })
    } catch {
      res = null
      continue
    }
    if (res.status === 429) sawQuota = true
    if (res.ok || !RETRY_STATUS.includes(res.status)) break
  }
  if (!res || !res.ok) {
    const status = res ? res.status : 'reseau'
    const kind = sawQuota ? 'quota' : [400, 401, 403].includes(status) ? 'key' : 'unavailable'
    throw new GeminiError(kind, status)
  }

  const data = await res.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const obj = JSON.parse(raw.replace(/^\s*```(?:json)?|```\s*$/g, ''))

  const intent = INTENTS.includes(obj.intent) ? obj.intent : 'other'
  if (intent !== 'create') {
    return { intent, reply: typeof obj.reply === 'string' ? obj.reply.slice(0, 300) : null }
  }
  if (!obj.task?.title) return { intent: 'other', reply: null }
  return { intent: 'create', ...normalizeAiTask(obj.task) }
}

// Reformule un message de l'assistant (ecrit en francais) dans la langue de l'utilisateur.
// En cas d'echec (cle, quota, reseau...), renvoie le texte d'origine : le chat reste utilisable.
export async function localizeReply(text, lang, apiKey) {
  if (!text || !apiKey || !LANG_NAMES[lang]) return text
  const prompt =
    `Reformule ce message d'un assistant de planning en ${LANG_NAMES[lang]}, sur un ton naturel et poli. ` +
    `Garde tels quels ce qui est entre « » (titres, noms de boutons), ainsi que les dates, heures et durees. ` +
    `Garde les retours a la ligne. Reponds uniquement avec le message reformule, sans guillemets autour.\n\nMessage :\n${text}`
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 },
  })
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      })
      if (res.ok) {
        const data = await res.json()
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        // Gemini entoure parfois sa reponse de guillemets droits : on les enleve
        const out = raw?.replace(/^"([\s\S]*)"$/, '$1').trim()
        return out || text
      }
      if (!RETRY_STATUS.includes(res.status)) return text
    } catch {
      // modele suivant
    }
  }
  return text
}

// Point d'entree pour l'interface : IA si possible, sinon regles.
// Renvoie { mode: 'ia' | 'regles', aiSkipped?: true (ordre traite par les regles sans appeler Gemini), aiError?: 'quota' | 'key' | 'unavailable', intent, reply?, task?, ... }
export async function parseTaskSmart(text, settings, now = new Date()) {
  const key = settings?.ai?.apiKey
  // Les ordres que les regles reconnaissent clairement (consulter, modifier, salutation...) ne passent pas par Gemini :
  // reponse plus rapide, pas de quota consomme, et Gemini ne peut pas les prendre pour une creation.
  const rules = analyzeRules(text, now)
  if (['query', 'modify', 'goal', 'chitchat'].includes(rules.intent)) {
    return { ...rules, mode: 'regles', aiSkipped: true }
  }
  if (settings?.ai?.mode === 'gemini' && key) {
    try {
      const ai = await parseWithAI(text, key, now)
      // Gemini n'a pas vu d'activite alors que les regles en comprennent une : on garde celle des regles
      if (ai.intent === 'other' && rules.intent === 'create') return { ...rules, mode: 'ia' }
      return { ...ai, mode: 'ia' }
    } catch (error) {
      console.warn('Gemini :', error.message) // repli sur les regles
      return { ...analyzeRules(text, now), mode: 'regles', aiError: error.kind || 'unavailable' }
    }
  }
  return { ...analyzeRules(text, now), mode: 'regles' }
}

// Corrige la derniere tache proposee : "non 2 h", "plutot a 15 h", "mets-le vendredi".
// Renvoie la tache modifiee, ou null si le message n'est pas une correction.
export function refineTask(task, input, now = new Date()) {
  if (!task || !input || !input.trim()) return null
  const s = scan(preprocess(input), now)
  const residual = s.norm
    .replace(
      /\b(non|oui|plutot|en fait|finalement|change|changez|modifie|mets|mettre|mettez|met|le|la|les|a|de|du|pour|avant|en|ce|cet|c'est|ca|sera|duree|heure|h|ou|pas|il|elle|svp|stp)\b/g,
      ' ',
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (residual !== '') return null

  let clock = s.range ? [s.range.sh, s.range.sm] : s.time ? [s.time.hh, s.time.mm] : null
  if (!clock && s.period) clock = [PERIOD_HOUR[s.period], 0]
  let duration = s.range ? rangeMinutes(s.range) : s.durationMin
  // "plutot 15h" : un nombre d'heures entre 7 et 23 sans "a" est une heure, pas une duree
  if (!clock && !s.range && duration && duration % 60 === 0 && duration / 60 >= 7 && duration / 60 <= 23) {
    clock = [duration / 60, 0]
    duration = null
  }

  const next = { ...task }
  let changed = false
  if (duration) {
    next.durationMin = duration
    delete next._noDuration
    changed = true
  }
  if (task.type === 'fixe' && task.start) {
    if (clock || s.date) {
      const day = s.date ? dateStr(s.date) : task.start.slice(0, 10)
      const [h, m] = clock || [Number(task.start.slice(11, 13)), Number(task.start.slice(14, 16))]
      next.start = `${day}T${pad(h)}:${pad(m)}`
      changed = true
    }
  } else if (task.type === 'flexible' && (s.date || clock)) {
    const day = s.date ? dateStr(s.date) : task.deadline?.slice(0, 10)
    if (day) {
      const [h, m] =
        clock || (task.deadline ? [Number(task.deadline.slice(11, 13)), Number(task.deadline.slice(14, 16))] : [18, 0])
      next.deadline = `${day}T${pad(h)}:${pad(m)}`
      changed = true
    }
  }
  return changed ? next : null
}

// ---------- Questions sur le planning ----------
// Analyse une question ("j'ai quoi demain ?", "suis-je libre jeudi apres-midi ?", "trouve-moi 2 h cette semaine").
// Renvoie { kind: 'agenda' | 'free' | 'deadlines' | 'late', from, to, label, period, durationMin }
// from / to : Date (to exclu) ; null pour 'late'.
const PERIOD_WORD = { matin: 'matin', 'apres-midi': 'après-midi', soir: 'soir' }
const PERIOD_THIS = { matin: 'ce matin', 'apres-midi': 'cet après-midi', soir: 'ce soir' }

export function parseQuery(input, now = new Date()) {
  const text = preprocess(input)
  const n = normalize(text)
  const s = scan(text, now)

  let kind = 'agenda'
  if (/\bretard/.test(n)) kind = 'late'
  else if (/\b(echeance|a rendre|deadline)/.test(n)) kind = 'deadlines'
  else if (NEXT_ACTIVITY.test(n)) kind = 'next'
  else if (/\b(libre|libres|disponible|dispo|occupe|prise?|busy|booked|trouve|cherche|creneau)/.test(n)) kind = 'free'

  const today = addDays(now, 0)
  // Fin de la semaine (lundi a dimanche) ; le dimanche, on prend les 7 jours qui viennent
  const endOfWeek = addDays(now, now.getDay() === 0 ? 8 : 8 - now.getDay())
  const namedDay = new RegExp(`\\b(${DAY_NAMES})\\b`).test(n)
  let from = null
  let to = null
  let label = ''
  let hasDate = true

  if (/\bsemaine prochaine\b/.test(n)) {
    from = addDays(now, (1 - now.getDay() + 7) % 7 || 7)
    to = addDays(from, 7)
    label = 'la semaine prochaine'
  } else if (/\b(cette semaine|semaine en cours)\b/.test(n)) {
    from = today
    to = endOfWeek
    label = 'cette semaine'
  } else if (/week-?end/.test(n)) {
    const dow = now.getDay()
    from = dow === 0 ? today : addDays(now, (6 - dow + 7) % 7)
    to = addDays(from, dow === 0 ? 1 : 2)
    label = 'ce week-end'
  } else if (s.date) {
    from = s.date
    to = addDays(from, 1)
    const diff = Math.round((from - today) / 86400000)
    label =
      diff === 0
        ? "aujourd'hui"
        : diff === 1 && !namedDay
          ? 'demain'
          : diff === 2 && !namedDay
            ? 'après-demain'
            : from.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  } else if (kind === 'late') {
    hasDate = false
  } else if (kind === 'deadlines') {
    from = today
    to = addDays(today, 7)
    label = 'dans les 7 prochains jours'
  } else if (kind === 'next') {
    hasDate = false
  } else if (kind === 'free') {
    from = today
    to = endOfWeek
    label = 'cette semaine'
  } else {
    from = today
    to = addDays(today, 1)
    label = "aujourd'hui"
    hasDate = false
  }

  if (s.period && from && kind !== 'late') {
    label = hasDate ? `${label} ${PERIOD_WORD[s.period]}` : PERIOD_THIS[s.period]
  }
  return { kind, from, to, label, period: s.period || null, durationMin: s.durationMin || null }
}

export { normalize }

// ---------- Modifications du planning ----------
// Quand ? : "demain", "a 16 h", "lundi a 10 h"... Renvoie { date: 'YYYY-MM-DD' | null, clock: [h, m] | null, norm }
export function parseWhen(input, now = new Date()) {
  const s = scan(preprocess(input), now, { loose: true, clockOnly: true })
  let clock = null
  if (s.range) clock = [s.range.sh, s.range.sm]
  else if (s.time) clock = [s.time.hh, s.time.mm]
  else if (s.period) clock = [PERIOD_HOUR[s.period], 0]
  else {
    const m = RE_BARE_TIME.exec(s.norm)
    if (m && Number(m[1]) < 24 && Number(m[2] || 0) < 60) clock = [Number(m[1]), Number(m[2] || 0)]
  }
  return { date: s.date ? dateStr(s.date) : null, clock, norm: s.norm }
}

const ACTION_STOP = new Set(
  (
    'le la les l un une des de du d mon ma mes ton ta tes son sa ses ce cet cette ces j ai fini finie finis finies ' +
    'termine terminee termines terminees marque marquer comme fait annule annuler annulee supprime supprimer efface ' +
    'effacer reporte reporter decale decaler deplace deplacer repousse repousser replanifie replanifier replace ' +
    'replacer rate rates manque manques loupe loupee dure durera prolonge rallonge deborde plus moins encore en au ' +
    'aux a pour vers sur et ou puis svp stp s il elle plait c ca cela y heure heures min minutes minute h demi quart ' +
    'mets met avance avancer raccourcis raccourcir shorten reduce move earlier advance change changer modify adjust set time times hour hours ' +
    'tache activite qui que qu est ete etait pas ne n m me te se my the to'
  ).split(' '),
)

// Action demandee sur une activite existante.
// Renvoie { action, tokens, filterDate, when, deltaMin, sign } ou null.
// action : 'complete' | 'cancel' | 'delete' | 'postpone' | 'reschedule' | 'extend'
export function parseAction(input, now = new Date()) {
  const text = preprocess(input)
  const n = normalize(text)
  let action = null
  const shortening = /\b(raccourcis|raccourcir|shorten|reduce)\b/.test(n)
  if (shortening || (/\b(dure|durera|a dure|prolonge|rallonge)\b/.test(n) && /(de plus|en plus|de moins|en moins)/.test(n))) {
    action = 'extend'
  }
  else if (/\b(supprime|supprimer|efface|effacer)\b/.test(n)) action = 'delete'
  else if (/\b(annule|annuler|annulee)\b/.test(n)) action = 'cancel'
  else if (/\b(replanifie|replanifier|replace|replacer)\b/.test(n)) action = 'reschedule'
  else if (/\b(reporte|reporter|decale|decaler|deplace|deplacer|repousse|repousser)\b/.test(n)) action = 'postpone'
  else if (EDIT_VERB.test(n) && EDIT_TARGET.test(n)) action = 'postpone'
  else if (/\bj'ai (fini|termine|finis)\b|\b(fini|finie|finis|termine|terminee|termines)\b|\bmarque\b.*\b(fait|fini|termine)/.test(n)) {
    action = 'complete'
  } else if (/\b(rate|rates|manque|manques|loupe|loupee)\b/.test(n)) action = 'reschedule'
  if (!action) return null

  let norm
  let when = { date: null, clock: null }
  let filterDate = null
  let deltaMin = null
  const sign = /(de moins|en moins)/.test(n) || shortening ? -1 : 1

  if (action === 'postpone' || action === 'reschedule') {
    const w = parseWhen(text, now)
    when = { date: w.date, clock: w.clock }
    norm = w.norm
  } else {
    const s = scan(text, now)
    norm = s.norm
    if (s.date) filterDate = dateStr(s.date)
    if (action === 'extend') {
      let d = s.durationMin
      if (!d) {
        if (/demi.?heure/.test(s.norm)) d = 30
        else if (/quart d'heure/.test(s.norm)) d = 15
        else if (/\bune heure\b/.test(s.norm)) d = 60
        else if (/\bdeux heures\b/.test(s.norm)) d = 120
      }
      deltaMin = d ? d * sign : null
    }
  }
  const tokens = norm
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2 && !ACTION_STOP.has(w))
    .map((w) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w))
  return { action, tokens, filterDate, when, deltaMin, sign }
}

// ---------- Plusieurs taches dans une phrase ----------
// Separateurs "forts" : toujours un changement de tache. Separateurs "faibles" ("et") : seulement
// si les DEUX morceaux sont de vraies taches ("lundi et mardi" ou "2 h et demie" ne sont pas coupes).
const STRONG_SEP = /\s*;\s*|\s+(?:et ensuite|et puis|puis|ensuite|apres ca|apres cela|and then|then|after that|ثم)\s+/g
const WEAK_SEP = /\s+(?:et|and)\s+/g

// Coupe le texte aux endroits ou `re` (applique au texte normalise, de meme longueur) trouve un separateur.
function splitBy(text, re) {
  const parts = []
  const seps = []
  let last = 0
  for (const m of normalize(text).matchAll(re)) {
    parts.push(text.slice(last, m.index))
    seps.push(text.slice(m.index, m.index + m[0].length))
    last = m.index + m[0].length
  }
  parts.push(text.slice(last))
  return { parts, seps }
}

const cleanPiece = (piece) =>
  piece
    .replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, '')
    .replace(/^(?:d['\u2019]abord|first(?:ly)?|ensuite|puis|et|and|then)\s+/i, '')
    .trim()

// Un morceau est une vraie tache s'il contient un titre et une indication (date, heure ou duree).
function isTaskLike(piece, now) {
  const d = parseTaskDetailed(piece, now)
  return Boolean(d) && d.task.title !== 'Activité' && /[A-Za-zÀ-ÿ\u0600-\u06FF]{3}/.test(d.task.title)
}

function splitWeak(piece, now) {
  const { parts, seps } = splitBy(piece, WEAK_SEP)
  if (parts.length < 2) return [piece]
  const out = []
  let current = parts[0]
  for (let i = 1; i < parts.length; i++) {
    const right = parts[i]
    const startsLikeNumber = /^(\d|demi|quart)/.test(normalize(right.trim()))
    if (!startsLikeNumber && isTaskLike(current, now) && isTaskLike(right, now)) {
      out.push(current)
      current = right
    } else {
      current += seps[i - 1] + right
    }
  }
  out.push(current)
  return out
}
// « chacune / chacun / each » : la duree et l'echeance de la phrase valent pour CHAQUE tache.
const EACH_WORD = /[\s,]*\b(?:chacune?s?|chacun|each)\b/gi
const EACH_TEST = /\b(?:chacune?s?|chacun|each)\b/i
// Debut des details (virgule, chiffre, echeance, date) : ce qui precede est le titre.
const DETAIL_START = new RegExp(
  `,|\\d|\\b(?:avant|d'ici|jusqu'a|pour|dans|demain|apres-demain|aujourd'hui|${DAY_NAMES}|before|by|until|tomorrow|today)\\b`,
)

// Titre seul (avant virgule, chiffre ou date), pour ne pas confondre « jeudi » avec « jeu ».
const titlePart = (n) => {
  const i = n.search(DETAIL_START)
  return i > 0 ? n.slice(0, i) : n
}

// « Reviser maths et physique » -> « Reviser maths » + « Reviser physique ».
// Le verbe n'est repete que si le 2e morceau n'a pas de verbe et reste de la meme categorie.
function repeatVerb(pieces) {
  const first = normalize(pieces[0]).trim()
  const m = ACTIVITY_VERB.exec(first)
  if (!m) return pieces
  const verb = pieces[0].trim().slice(0, m[0].length)
  const category = detectCategory(titlePart(first))
  return pieces.map((piece, i) => {
    if (i === 0) return piece
    const n = normalize(piece).trim()
    if (ACTIVITY_VERB.test(n) || !/[A-Za-zÀ-ÿ]{3}/.test(piece)) return piece
    const c = detectCategory(titlePart(n))
    return c === 'personnel' || c === category ? `${verb} ${piece}` : piece
  })
}

// « 2 h chacune, avant jeudi » (dite a la fin) s'applique a tous les morceaux qui n'ont pas leurs propres details.
function applyEach(pieces) {
  if (!EACH_TEST.test(pieces.join(' '))) return pieces
  const clean = pieces.map((p) => p.replace(EACH_WORD, '').trim())
  const last = clean[clean.length - 1]
  const cut = normalize(last).search(DETAIL_START)
  if (cut <= 0) return clean
  const shared = last.slice(cut).replace(/^[\s,]+/, '')
  const title = cleanPiece(last.slice(0, cut))
  return [...clean.slice(0, -1), title].map((p) =>
    normalize(p).search(DETAIL_START) === -1 ? `${p} ${shared}` : p,
  )
}
// Renvoie la liste des phrases (une par tache) si la phrase en contient plusieurs, sinon null.
export function splitTasks(text, now = new Date()) {
  const raw = (text || '').trim()
  if (!raw) return null
  const strong = splitBy(raw, STRONG_SEP).parts.map(cleanPiece).filter(Boolean)
  const found = strong.flatMap((p) => splitWeak(p, now).map(cleanPiece)).filter(Boolean)
  if (found.length < 2) return null
  const pieces = applyEach(repeatVerb(found))
  // Chaque morceau doit etre une creation (ou au moins pas une question, un ordre ou une salutation)
  for (const piece of pieces) {
    const r = analyzeRules(piece, now)
    if (r.intent === 'create') {
      if (r.task.title === 'Activité') return null
    } else if (r.intent !== 'other' || !/[A-Za-zÀ-ÿ\u0600-\u06FF]{3}/.test(piece)) return null
  }
  return pieces
}

// Commande pendant une liste de taches : "passe" saute la tache en cours, "stop" arrete la liste.
const SKIP = /^(passe|passer|on passe|saute|sauter|suivant|suivante|la suivante|tache suivante|ignore|ignorer|skip|next)$/
const STOP = /^(stop|arrete|arreter|arrete tout|annule tout|tout annuler|laisse tomber le reste|cancel all)$/
export function queueCommand(text) {
  const n = normalize(text || '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (SKIP.test(n)) return 'skip'
  if (STOP.test(n)) return 'stop'
  return null
}