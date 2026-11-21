
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

export function remove(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function readList(key) {
  const value = read(key, [])
  return Array.isArray(value) ? value : []
}

export const getSession = () => read(KEYS.session)