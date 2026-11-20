// P2 : acces unique a localStorage. Les pages n'appellent JAMAIS localStorage directement.
// Schema a valider par tout le groupe avant de coder (voir README).
export const KEYS = {
  users: 'tempoplan.users',
  activities: 'tempoplan.activities',
  goals: 'tempoplan.goals',
  settings: 'tempoplan.settings',
  session: 'tempoplan.session',
}

export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const getSession = () => read(KEYS.session)
