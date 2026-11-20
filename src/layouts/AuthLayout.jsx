// P1 : carte centree pour connexion et inscription
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen">
      {/* TODO : carte centree pour connexion et inscription */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
