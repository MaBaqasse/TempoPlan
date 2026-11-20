// P1 : sidebar + barre du haut de l'application
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      {/* TODO : sidebar + barre du haut de l'application */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
