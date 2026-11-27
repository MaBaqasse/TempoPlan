// P1 : bloque l’accès à l’application si l’utilisateur n’est pas connecté
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
