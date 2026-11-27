// P1 : structure de l’application connectée : menu latéral + barre du haut + contenu de la page
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Plus } from 'lucide-react'
import Sidebar from '@/components/common/Sidebar'
import UserMenu from '@/components/common/UserMenu'
import NotificationBell from '@/features/notifications/NotificationBell'
import Button from '@/components/ui/Button'
// Bulle de l’assistant (P5) : décommentez ces 2 lignes après avoir vérifié le chemin du fichier
// (cherchez « ChatBubble » avec Ctrl + P dans VS Code, probablement dans src/features/assistant/)
// import ChatBubble from '@/features/assistant/ChatBubble'

const pageTitles = {
  '/app': 'Tableau de bord',
  '/app/planning': 'Planning',
  '/app/activities': 'Mes activités',
  '/app/goals': 'Mes objectifs',
  '/app/stats': 'Mon suivi',
  '/app/assistant': 'Assistant de planification',
  '/app/settings': 'Paramètres et profil',
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const title = pageTitles[pathname.replace(/\/+$/, '')] ?? ''

  // Ferme le tiroir (mobile) avec Échap
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-primary-50/40">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Aller au contenu
      </a>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="md:pl-20 lg:pl-64">
        {/* Barre du haut : hauteur 4 rem (h-16) */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-primary-100 bg-white/90 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="menu-lateral"
            className="rounded-lg p-2 text-ink hover:bg-primary-50 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <p className="flex-1 truncate text-lg font-semibold text-ink">{title}</p>

          {/* P2 peut lire location.state?.openForm dans Activities.jsx pour ouvrir le formulaire directement */}
          <Button
            to="/app/activities"
            state={{ openForm: true }}
            aria-label="Nouvelle activité"
            className="px-3 py-2 text-sm sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nouvelle activité</span>
          </Button>
          <NotificationBell />
          <UserMenu />
        </header>

        <main id="contenu" tabIndex={-1} className="p-4 outline-none md:p-8">
          <Outlet />
        </main>
      </div>

      {/* <ChatBubble /> */}
    </div>
  )
}
