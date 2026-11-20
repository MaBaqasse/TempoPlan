// P2 : hook des activites
import { useActivitiesStore } from '@/store/activitiesStore'

export function useActivities() {
  return useActivitiesStore()
}
