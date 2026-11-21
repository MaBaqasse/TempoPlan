// P2 : hook des activites. Point d'entree pour tous les composants.
// Renvoie : activities, conflicts, load, addActivity, updateActivity,
// postponeActivity, completeActivity, deleteActivity.
import { useEffect, useMemo } from 'react'
import { useActivitiesStore } from '@/store/activitiesStore'
import { detectConflicts } from '@/lib/conflicts'

export function useActivities() {
  const store = useActivitiesStore()
  const { load, activities } = store

  // Recharge au premier affichage (utile apres une connexion ou un changement d'utilisateur).
  useEffect(() => {
    load()
  }, [load])

  // Paires d'activites qui se chevauchent : [{ idA, idB }]
  const conflicts = useMemo(() => detectConflicts(activities), [activities])

  return { ...store, conflicts }
}