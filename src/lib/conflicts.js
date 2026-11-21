// P2 : detection des conflits horaires.
// Fonctions pures : pas de React, pas de localStorage.
// Il faut passer les activites d'un seul utilisateur.

const MS_PER_MINUTE = 60 * 1000

function getInterval(activity) {
  if (!activity || !activity.start || activity.status === 'annulee') return null

  const startMs = new Date(activity.start).getTime()
  if (Number.isNaN(startMs)) return null

  const durationMin = Number(activity.durationMin)
  if (!(durationMin > 0)) return null

  return { startMs, endMs: startMs + durationMin * MS_PER_MINUTE }
}

function overlaps(a, b) {
  return a.startMs < b.endMs && b.startMs < a.endMs
}

/**
 * Renvoie les paires d'activites qui se chevauchent.
 * @param {Array} activities
 * @returns {Array<{ idA: string, idB: string }>} Liste vide s'il n'y a aucun conflit.
 */
export function detectConflicts(activities) {
  if (!Array.isArray(activities)) return []

  const intervals = activities.map(getInterval)
  const conflicts = []

  for (let i = 0; i < activities.length; i++) {
    if (!intervals[i]) continue
    for (let j = i + 1; j < activities.length; j++) {
      if (intervals[j] && overlaps(intervals[i], intervals[j])) {
        conflicts.push({ idA: activities[i].id, idB: activities[j].id })
      }
    }
  }

  return conflicts
}

/**
 * Renvoie les activites existantes qui chevauchent une activite donnee
 * (utile avant d'ajouter ou de deplacer une activite).
 * @param {object} candidate Activite a tester (elle-meme est ignoree si elle est dans la liste)
 * @param {Array} activities Activites existantes
 * @returns {Array} Activites en conflit avec le candidat
 */
export function findConflictsFor(candidate, activities) {
  const interval = getInterval(candidate)
  if (!interval || !Array.isArray(activities)) return []

  return activities.filter((other) => {
    if (other.id === candidate.id) return false
    const otherInterval = getInterval(other)
    return otherInterval !== null && overlaps(interval, otherInterval)
  })
}