import { describe, expect, it } from 'vitest'
import { replyLang } from './replyLang'

describe('replyLang', () => {
  it.each([
    [{ mode: 'rules', hasKey: false, quotaPaused: false, lang: 'en' }, 'en'],
    [{ mode: 'rules', hasKey: true, quotaPaused: false, lang: 'ar' }, 'ar'],
    [{ mode: 'gemini', hasKey: false, quotaPaused: false, lang: 'en' }, 'en'],
    [{ mode: 'gemini', hasKey: true, quotaPaused: true, lang: 'ar' }, 'ar'],
    [{ mode: 'gemini', hasKey: true, quotaPaused: false, lang: 'en' }, 'fr'],
    [{ mode: 'gemini', hasKey: true, quotaPaused: false, lang: 'ar' }, 'fr'],
    [{ mode: 'gemini', hasKey: true, quotaPaused: false, lang: 'fr' }, 'fr'],
    [{ mode: 'rules', hasKey: false, quotaPaused: true, lang: 'fr' }, 'fr'],
    [{ mode: 'rules', hasKey: false, quotaPaused: false, lang: null }, 'fr'],
  ])('choisit la langue avec %o', (input, expected) => {
    expect(replyLang(input)).toBe(expected)
  })
})
