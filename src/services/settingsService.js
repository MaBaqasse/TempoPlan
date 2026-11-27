// P1 : paramètres de l’utilisateur (disponibilités, pauses, notifications, assistant IA).
// Stockage : une liste d’objets dans KEYS.settings, un par utilisateur (champ userId), comme les autres listes.
//   { userId,
//     availability: { days, startTime, endTime },          days : 1 = lundi ... 7 = dimanche
//     breakMinutes, bufferPercent,                          durées en minutes / marge en %
//     notifications: { browserAlerts, reminderMinutesBefore, deadlines, overdue, conflicts },
//     ai: { mode: 'rules' | 'ai', apiKey } }
// Les autres modules (planning, notifications, assistant) lisent avec getSettings().
//   Exemple : const { ai, availability } = getSettings()
import { KEYS, read, write, getSession } from '@/services/storage'

export const DEFAULT_SETTINGS = {
  availability: { days: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '20:00' },
  breakMinutes: 15,
  bufferPercent: 15,
  notifications: {
    browserAlerts: false, // activé seulement après l’autorisation du navigateur
    reminderMinutesBefore: 30,
    deadlines: true,
    overdue: true,
    conflicts: true,
  },
  ai: { mode: 'rules', apiKey: '' },
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

// Fusion en profondeur : les objets sont fusionnés, les tableaux (ex. days) sont remplacés
function merge(base, patch) {
  const out = { ...base }
  for (const key of Object.keys(patch ?? {})) {
    out[key] = isPlainObject(base?.[key]) && isPlainObject(patch[key]) ? merge(base[key], patch[key]) : patch[key]
  }
  return out
}

// Accepte la liste (format normal) et un objet unique (ancien format éventuel)
function allSettings() {
  const raw = read(KEYS.settings, [])
  if (Array.isArray(raw)) return raw
  return isPlainObject(raw) && raw.userId ? [raw] : []
}

function currentUserId() {
  return getSession()?.userId ?? null
}

// Paramètres de l’utilisateur (par défaut : l’utilisateur connecté), complétés par les valeurs par défaut
export function getSettings(userId = currentUserId()) {
  const stored = allSettings().find((s) => s.userId === userId)
  return merge({ ...structuredClone(DEFAULT_SETTINGS), userId }, stored ?? {})
}

// Enregistre une modification partielle : saveSettings({ breakMinutes: 30, ai: { mode: 'ai' } })
// Renvoie les paramètres complets, ou null si personne n’est connecté.
export function saveSettings(patch, userId = currentUserId()) {
  if (!userId) return null
  const next = merge(getSettings(userId), patch)
  const others = allSettings().filter((s) => s.userId !== userId)
  write(KEYS.settings, [...others, { ...next, userId }])
  return getSettings(userId)
}

// Vrai si l’assistant doit utiliser l’IA (mode « ai » ET une clé enregistrée)
export function isAiEnabled(settings = getSettings()) {
  return settings.ai?.mode === 'ai' && String(settings.ai?.apiKey ?? '').trim() !== ''
}

export function validateAvailability({ days, startTime, endTime }) {
  const errors = {}
  if (!days || days.length === 0) errors.days = 'Choisissez au moins un jour.'
  if (!startTime || !endTime) errors.time = 'Indiquez une heure de début et une heure de fin.'
  else if (startTime >= endTime) errors.time = 'L’heure de fin doit être après l’heure de début.'
  return errors
}
