// P1 : page « introuvable »
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export default function NotFound() {
  const user = useAuthStore((s) => s.user)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary-50 px-6 text-center">
      <p className="text-7xl font-bold text-primary-500 sm:text-8xl">404</p>
      <h1 className="mt-4 text-3xl font-bold text-ink">Page introuvable</h1>
      <p className="mt-3 max-w-md text-lg text-muted">Cette page n’existe pas ou a été déplacée.</p>
      <Button to={user ? '/app' : '/'} className="mt-8">
        {user ? 'Retour au tableau de bord' : 'Retour à l’accueil'}
      </Button>
    </main>
  )
}
