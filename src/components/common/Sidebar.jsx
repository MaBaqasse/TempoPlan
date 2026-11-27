// P1 : menu latéral de l’application.
// Ordinateur : large avec libellés. Tablette : réduit aux icônes. Mobile : tiroir ouvert par le bouton menu.
import { NavLink } from 'react-router-dom'
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import Logo from './Logo'

const links = [
  { to: '/app', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/app/planning', label: 'Planning', icon: CalendarDays },
  { to: '/app/activities', label: 'Activités', icon: ListChecks },
  { to: '/app/goals', label: 'Objectifs', icon: Target },
  { to: '/app/stats', label: 'Suivi', icon: TrendingUp },
  { to: '/app/assistant', label: 'Assistant', icon: Sparkles },
]
const settingsLink = { to: '/app/settings', label: 'Paramètres', icon: Settings }

function SidebarLink({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-center lg:justify-start ' +
        (isActive
          ? 'bg-primary-50 text-primary-600'
          : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600')
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="md:hidden lg:inline">{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Voile derrière le tiroir (mobile) */}
      {open && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-primary-950/40 md:hidden"
        />
      )}

      <aside
        id="menu-lateral"
        className={
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-primary-100 bg-white transition-all duration-300 ' +
          'md:visible md:w-20 md:translate-x-0 lg:w-64 ' +
          (open ? 'translate-x-0' : 'invisible -translate-x-full')
        }
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-primary-100 px-4 md:justify-center lg:justify-between lg:px-5">
          <div className="md:hidden lg:block">
            <Logo />
          </div>
          <CalendarClock
            className="hidden h-8 w-8 text-primary-500 md:block lg:hidden"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="rounded-lg p-2 text-ink hover:bg-primary-50 md:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav
          aria-label="Navigation de l’application"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          {links.map((l) => (
            <SidebarLink key={l.to} {...l} onClick={onClose} />
          ))}
        </nav>

        <div className="border-t border-primary-100 px-3 py-4">
          <SidebarLink {...settingsLink} onClick={onClose} />
        </div>
      </aside>
    </>
  )
}
