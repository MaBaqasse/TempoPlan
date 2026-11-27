// P1 : état global de l’utilisateur connecté (Zustand)
import { create } from 'zustand'
import * as authService from '@/services/authService'

export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),

  async signUp(data) {
    const result = await authService.registerUser(data)
    if (result.ok) set({ user: result.user })
    return result
  },

  async signIn(email, password, remember) {
    const result = await authService.loginUser({ email, password, remember })
    if (result.ok) set({ user: result.user })
    return result
  },

  signOut() {
    authService.logout()
    set({ user: null })
  },

  updateProfile(changes) {
    const result = authService.updateProfile(changes)
    if (result.ok) set({ user: result.user })
    return result
  },

  changePassword(data) {
    return authService.changePassword(data)
  },

  deleteAccount() {
    const result = authService.deleteAccount()
    if (result.ok) set({ user: null })
    return result
  },
}))
