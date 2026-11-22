export function replyLang({ mode, hasKey, quotaPaused, lang }) {
  if (mode === 'gemini' && hasKey && !quotaPaused && lang !== 'fr') return 'fr'
  return lang || 'fr'
}
