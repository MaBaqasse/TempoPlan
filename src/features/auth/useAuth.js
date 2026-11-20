// P1 : hook d'authentification
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  return useAuthStore()
}
