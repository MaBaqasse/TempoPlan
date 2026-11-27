// P1 : export, réinitialisation et données de démonstration (section « Données » des paramètres).
import { KEYS, read, write } from '@/services/storage'
import { getCurrentUser } from '@/services/authService'
import { getSettings } from '@/services/settingsService'

function mine(key, userId) {
  const list = read(key, [])
  return Array.isArray(list) ? list.filter((item) => item.userId === userId) : []
}

function removeMine(key, userId) {
  const list = read(key, [])
  if (!Array.isArray(list)) return 0
  const kept = list.filter((item) => item.userId !== userId)
  write(key, kept)
  return list.length - kept.length
}

// Données de l’utilisateur connecté. La clé API n’est JAMAIS exportée.
export function exportUserData() {
  const user = getCurrentUser()
  if (!user) return null
  const { ai, ...settings } = getSettings(user.id)
  return {
    exportedAt: new Date().toISOString(),
    user,
    activities: mine(KEYS.activities, user.id),
    goals: mine(KEYS.goals, user.id),
    settings: { ...settings, ai: { mode: ai.mode } },
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// Supprime les activités et objectifs de l’utilisateur connecté (le compte et les paramètres restent)
export function resetUserData() {
  const user = getCurrentUser()
  if (!user) return { activities: 0, goals: 0 }
  return { activities: removeMine(KEYS.activities, user.id), goals: removeMine(KEYS.goals, user.id) }
}

// Ajoute les données de démonstration de P2. Renvoie 'added', 'already' ou 'unavailable'.
export async function loadDemoData() {
  const user = getCurrentUser()
  if (!user) return 'unavailable'
  try {
    const mod = await import('@/data/seed')
    if (typeof mod.loadSeed !== 'function') return 'unavailable'
    return mod.loadSeed(user.id) ? 'added' : 'already'
  } catch {
    return 'unavailable'
  }
}
