import { analyzeRules, GeminiError, parseWithAI } from '../../../lib/nlParser.js'
import { cases, now } from './nlRulesParity.cases.js'

const key = process.env.GEMINI_KEY
const taskView = (result) => {
  if (!result.task) return null
  const { title, type, category, priority, durationMin, start, deadline, _date, _noDuration } = result.task
  return { title, type, category, priority, durationMin, start, deadline, _date, _noDuration }
}

if (!key) {
  console.log('GEMINI_KEY absente ; analyse des règles uniquement.')
  for (const { phrase } of cases) {
    const result = analyzeRules(phrase, now)
    console.log(JSON.stringify({ phrase, intent: result.intent, task: taskView(result) }))
  }
} else {
  const originalFetch = globalThis.fetch
  let quotaSeen = false
  globalThis.fetch = async (...args) => {
    if (quotaSeen) throw new Error('Gemini quota reached')
    const response = await originalFetch(...args)
    if (response.status === 429) quotaSeen = true
    return response
  }

  try {
    for (const { phrase } of cases) {
      const rules = analyzeRules(phrase, now)
      try {
        const ai = await parseWithAI(phrase, key, now)
        const rulesTask = taskView(rules)
        const aiTask = taskView(ai)
        if (rules.intent !== ai.intent || JSON.stringify(rulesTask) !== JSON.stringify(aiTask)) {
          console.log(JSON.stringify({ phrase, rules: { intent: rules.intent, task: rulesTask }, ai: { intent: ai.intent, task: aiTask } }))
        }
      } catch (error) {
        if (quotaSeen || (error instanceof GeminiError && error.status === 429)) {
          console.error('Arrêt : quota Gemini (HTTP 429).')
          break
        }
        throw error
      }
      if (quotaSeen) {
        console.error('Arrêt : quota Gemini (HTTP 429).')
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 6000))
    }
  } finally {
    globalThis.fetch = originalFetch
  }
}
