// P1 : fond (photo + voile indigo) et logo des pages de connexion / inscription
import { Outlet } from 'react-router-dom'
import Logo from '@/components/common/Logo'

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-primary-600">
      {/* Photo : public/images/auth-bg.jpg (sans voile). Si elle manque, le fond reste indigo. */}
      <img
        src="/images/auth-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Voile indigo : ajustez l’opacité (/50) pour éclaircir ou foncer le fond */}
      <div aria-hidden="true" className="absolute inset-0 bg-primary-500/50" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <Logo variant="light" />
        <main className="flex flex-1 items-center py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
