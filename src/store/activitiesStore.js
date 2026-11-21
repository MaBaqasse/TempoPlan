// P2 : etat global des activites.
// Le service (activitiesService) reste la source de verite : apres chaque action
// reussie, le store relit la liste depuis le stockage.
import { create } from 'zustand'
import {
  completeActivity,
  createActivity,
  deleteActivity,
  listActivities,
  postponeActivity,
  updateActivity,
} from '@/services/activitiesService'

export const useActivitiesStore = create((set) => {
  // Relit les activites de l'utilisateur connecte.
  const refresh = () => set({ activities: listActivities() })

  // Appelle une action du service, puis rafraichit le store si elle a reussi.
  // Le resultat { ok, activity, conflicts } ou { ok, errors } est renvoye tel quel.
  const run =
    (action) =>
    (...args) => {
      const result = action(...args)
      if (result.ok) refresh()
      return result
    }

  return {
    activities: [],
    load: refresh,
    addActivity: run(createActivity),
    updateActivity: run(updateActivity),
    postponeActivity: run(postponeActivity),
    completeActivity: run(completeActivity),
    deleteActivity: (id) => {
      const deleted = deleteActivity(id)
      if (deleted) refresh()
      return deleted
    },
  }
})