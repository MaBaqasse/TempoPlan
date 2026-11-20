// P1 : navbar + footer de la landing page
import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      {/* TODO : navbar + footer de la landing page */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
