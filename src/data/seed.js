
import { KEYS, readList, write } from '@/services/storage'

const pad = (n) => String(n).padStart(2, '0')

function toLocalISO(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function at(now, dayOffset, hour, minute = 0) {
  return toLocalISO(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute),
  )
}

export function buildSeed(userId, now = new Date()) {
  const createdAt = at(now, -3, 9)

  const activity = (fields) => ({
    userId,
    notes: '',
    deadline: null,
    status: 'a_faire',
    goalId: null,
    postponedCount: 0,
    recurrence: null,
    completedAt: null,
    createdAt,
    ...fields,
  })

  const goals = [
    {
      id: 'seed-g1',
      userId,
      title: "Reussir l'examen de reseaux",
      description: 'Reviser tous les chapitres avant le controle.',
      type: 'court_terme',
      deadline: at(now, 7, 18),
      importance: 5,
      createdAt,
    },
    {
      id: 'seed-g2',
      userId,
      title: 'Terminer le projet de developpement web',
      description: "Livrer l'application TempoPlan et preparer la demo.",
      type: 'long_terme',
      deadline: at(now, 30, 18),
      importance: 4,
      createdAt,
    },
  ]

  const activities = [
    
    activity({
      id: 'seed-a1',
      title: 'Cours de Reseaux',
      type: 'fixe',
      category: 'cours',
      priority: 'haute',
      start: at(now, 1, 10),
      durationMin: 120,
    }),
    
    activity({
      id: 'seed-a2',
      title: 'Reunion de projet',
      type: 'fixe',
      category: 'reunion',
      priority: 'moyenne',
      start: at(now, 1, 11),
      durationMin: 60,
    }),
    activity({
      id: 'seed-a3',
      title: 'Cours de Programmation Web',
      type: 'fixe',
      category: 'cours',
      priority: 'moyenne',
      start: at(now, 2, 8),
      durationMin: 120,
    }),
    activity({
      id: 'seed-a4',
      title: 'TP de Systemes',
      type: 'fixe',
      category: 'cours',
      priority: 'haute',
      start: at(now, 2, 14),
      durationMin: 120,
    }),
    activity({
      id: 'seed-a5',
      title: 'Sport',
      type: 'fixe',
      category: 'loisir',
      priority: 'basse',
      start: at(now, 0, 18),
      durationMin: 60,
      recurrence: 'weekly',
    }),

   
    activity({
      id: 'seed-b1',
      title: 'Reviser les reseaux',
      type: 'flexible',
      category: 'revision',
      priority: 'haute',
      start: at(now, 2, 10),
      durationMin: 120,
      deadline: at(now, 3, 18),
      goalId: 'seed-g1',
    }),
    activity({
      id: 'seed-b2',
      title: 'Reviser le chapitre 1 : modele OSI',
      type: 'flexible',
      category: 'revision',
      priority: 'haute',
      start: at(now, 1, 14),
      durationMin: 90,
      deadline: at(now, 4, 18),
      goalId: 'seed-g1',
    }),
    activity({
      id: 'seed-b3',
      title: 'Exercices de sous-reseaux',
      type: 'flexible',
      category: 'revision',
      priority: 'moyenne',
      start: null, 
      durationMin: 60,
      deadline: at(now, 5, 18),
      goalId: 'seed-g1',
    }),

    
    activity({
      id: 'seed-c1',
      title: 'Rapport de TP',
      type: 'flexible',
      category: 'projet',
      priority: 'haute',
      start: null,
      durationMin: 180,
      deadline: at(now, 4, 18),
      goalId: 'seed-g2',
    }),
    activity({
      id: 'seed-c2',
      title: "Preparer l'expose",
      type: 'flexible',
      category: 'projet',
      priority: 'moyenne',
      start: null,
      durationMin: 90,
      deadline: at(now, 6, 18),
      goalId: 'seed-g2',
    }),
    activity({
      id: 'seed-c3',
      title: 'Maquettes du projet',
      type: 'flexible',
      category: 'projet',
      priority: 'moyenne',
      start: at(now, 3, 15),
      durationMin: 120,
      deadline: at(now, 10, 18),
      goalId: 'seed-g2',
    }),

    
    activity({
      id: 'seed-d1',
      title: 'Exercices de maths',
      type: 'flexible',
      category: 'revision',
      priority: 'moyenne',
      start: at(now, -2, 10),
      durationMin: 90,
      deadline: at(now, -1, 18),
      postponedCount: 2,
    }),
    activity({
      id: 'seed-d2',
      title: 'Lire le chapitre 3',
      type: 'flexible',
      category: 'personnel',
      priority: 'basse',
      start: at(now, 3, 16),
      durationMin: 60,
      deadline: at(now, 5, 18),
    }),

    // --- Terminee ---
    activity({
      id: 'seed-e1',
      title: 'Resume du cours de bases de donnees',
      type: 'flexible',
      category: 'revision',
      priority: 'moyenne',
      start: at(now, -1, 14),
      durationMin: 60,
      deadline: at(now, 0, 18),
      status: 'terminee',
      completedAt: at(now, -1, 15),
    }),
  ]

  return { goals, activities }
}


export function loadSeed(userId) {
  const existingActivities = readList(KEYS.activities)
  if (existingActivities.some((a) => a.userId === userId)) return false

  const { goals, activities } = buildSeed(userId)
  write(KEYS.activities, [...existingActivities, ...activities])
  write(KEYS.goals, [...readList(KEYS.goals), ...goals])
  return true
}


export const seedActivities = buildSeed('u1').activities