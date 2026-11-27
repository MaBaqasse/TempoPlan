// P1 : inscription, connexion et session (simulées, sans backend).
// Les données passent uniquement par services/storage.js (règle R1 de P2).
// Formats (README) :
//   users   : { id, firstName, lastName, email, password, profile, onboardingDone, createdAt }
//   session : { userId, loggedInAt, remember }   <- « remember » est un champ ajouté par P1
// Attention : « password » contient une empreinte SHA-256 (jamais le mot de passe en clair),
// mais cela reste une démo : sans backend, aucune vraie sécurité n’est possible.
import { KEYS, read, write, getSession } from '@/services/storage'

// Mettre à false pour ne PAS ajouter les données de démonstration de P2 à l’inscription
const SEED_ON_REGISTER = true
const TAB_FLAG = 'tempoplan.tab' // marque l’onglet courant quand « Se souvenir de moi » n’est pas coché

// ---- petites fonctions d’accès au stockage (à adapter ici si storage.js change) ----
function listUsers() {
  const users = read(KEYS.users, [])
  return Array.isArray(users) ? users : []
}
function saveUsers(users) {
  write(KEYS.users, users)
}

// ---- utilitaires ----
function pad(n) {
  return String(n).padStart(2, '0')
}
// Date locale au format "YYYY-MM-DDTHH:mm" (règle R5)
function nowLocal() {
  const d = new Date()
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}
function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) return 'plain:' + password // contexte non sécurisé (http hors localhost)
  const data = new TextEncoder().encode(salt + ':' + password)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return 'sha256:' + hex
}
function publicUser(user) {
  const { password, ...safe } = user // eslint-disable-line no-unused-vars
  return safe
}
async function seedDemoData(userId) {
  try {
    const mod = await import('@/data/seed')
    if (typeof mod.loadSeed === 'function') mod.loadSeed(userId)
  } catch {
    /* les données de démonstration sont facultatives */
  }
}

// ---- session ----
function startSession(userId, remember) {
  write(KEYS.session, { userId, loggedInAt: nowLocal(), remember })
  try {
    sessionStorage.setItem(TAB_FLAG, '1')
  } catch {
    /* ignoré */
  }
}

export function getCurrentUser() {
  const session = getSession()
  if (!session?.userId) return null

  if (session.remember === false) {
    let tabAlive = false
    try {
      tabAlive = sessionStorage.getItem(TAB_FLAG) === '1'
    } catch {
      /* ignoré */
    }
    if (!tabAlive) {
      write(KEYS.session, null)
      return null
    }
  }

  const user = listUsers().find((u) => u.id === session.userId)
  return user ? publicUser(user) : null
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}

export function logout() {
  write(KEYS.session, null)
  try {
    sessionStorage.removeItem(TAB_FLAG)
  } catch {
    /* ignoré */
  }
}

// ---- inscription ----
// Renvoie { ok: true, user } ou { ok: false, errors: { email?, form? } }
export async function registerUser({ firstName, lastName, email, profile, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const users = listUsers()

  if (users.some((u) => u.email === cleanEmail)) {
    return {
      ok: false,
      errors: { email: 'Un compte existe déjà avec cette adresse. Essayez de vous connecter.' },
    }
  }

  const id = newId()
  const user = {
    id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: cleanEmail,
    password: await hashPassword(password, id),
    profile,
    onboardingDone: false,
    createdAt: nowLocal(),
  }

  saveUsers([...users, user])
  if (!listUsers().some((u) => u.id === id)) {
    return {
      ok: false,
      errors: {
        form: 'Impossible d’enregistrer le compte : le stockage du navigateur est indisponible.',
      },
    }
  }

  startSession(id, true)
  if (SEED_ON_REGISTER) await seedDemoData(id)
  return { ok: true, user: publicUser(user) }
}

// ---- connexion ----
// Renvoie { ok: true, user } ou { ok: false, error }
export async function loginUser({ email, password, remember = false }) {
  const user = listUsers().find((u) => u.email === email.trim().toLowerCase())
  const valid = user && (await hashPassword(password, user.id)) === user.password

  // Un seul message pour « e-mail inconnu » et « mot de passe faux »
  if (!valid) return { ok: false, error: 'Adresse e-mail ou mot de passe incorrect.' }

  startSession(user.id, remember)
  return { ok: true, user: publicUser(user) }
}
