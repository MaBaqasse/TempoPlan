// P1 : avatar (initiales) + menu du compte : paramètres et déconnexion
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

function initials(user) {
  return ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || '?'
}

export default function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Ferme le menu en cliquant à l’extérieur ou avec Échap
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleLogout() {
    setOpen(false)
    signOut()
    toast.success('Vous êtes déconnecté.')
    navigate('/login', { replace: true })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full p-1 hover:bg-primary-50 sm:pr-2"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700"
        >
          {initials(user)}
        </span>
        <span className="sr-only">Menu du compte de {user?.firstName}</span>
        <ChevronDown
          className={'hidden h-4 w-4 text-slate-500 transition-transform sm:block ' + (open ? 'rotate-180' : '')}
          aria-hidden="true"
        />
      </button>

      <div
        role="menu"
        className={
          'absolute right-0 top-12 z-50 w-64 rounded-xl border border-primary-100 bg-white p-2 shadow-xl shadow-primary-950/10 transition-all duration-150 ' +
          (open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0')
        }
      >
        <div className="border-b border-primary-100 px-3 pb-2 pt-1">
          <p className="truncate font-medium text-ink">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
        <Link
          role="menuitem"
          to="/app/settings"
          onClick={() => setOpen(false)}
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-primary-50"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Paramètres et profil
        </Link>
        <button
          role="menuitem"
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
