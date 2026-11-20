// P1 : bloque l'acces a l'application si l'utilisateur n'est pas connecte
import { Navigate, Outlet } from 'react-router-dom'
import { getSession } from '@/services/storage'

export default function ProtectedRoute() {
  // TODO (P1) : brancher sur authStore. Pour le developpement, mettre DEV_BYPASS a true.
  const DEV_BYPASS = true
  if (!DEV_BYPASS && !getSession()) return <Navigate to="/login" replace />
  return <Outlet />
}
