const LOCALES = { fr: 'fr-FR', en: 'en-GB', ar: 'ar' }

export const languageOf = (lang = 'fr') => (LOCALES[lang] ? lang : 'fr')
export const localeOf = (lang = 'fr') => LOCALES[languageOf(lang)]

export const localized = (lang, fr, en, ar) => {
  const values = { fr, en, ar }
  return values[languageOf(lang)]
}

export function formatDay(value, lang = 'fr') {
  return new Date(value).toLocaleDateString(localeOf(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatTime(value, lang = 'fr') {
  const date = new Date(value)
  if (languageOf(lang) === 'fr') {
    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getHours()} h${date.getMinutes() ? pad(date.getMinutes()) : ''}`
  }
  return date.toLocaleTimeString(localeOf(lang), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}
