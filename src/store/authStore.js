// P1 : etat global
import { create } from 'zustand'

export const useAuthStore = create(() => ({ user: null }))
