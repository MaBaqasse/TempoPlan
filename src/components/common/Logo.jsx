// P1 : logo TempoPlan (icone calendrier + horloge + nom).
// Pour utiliser votre logo Canva : exportez-le en SVG dans public/images/logo.svg
// et remplacez l’icone ci-dessous par <img src="/images/logo.svg" alt="" className="h-8 w-8" />
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'

export default function Logo({ className = '' }) {
  return (
    <Link
      to="/"
      className={'inline-flex items-center gap-2 text-ink ' + className}
      aria-label="TempoPlan, accueil"
    >
      <CalendarClock className="h-8 w-8 text-primary-500" strokeWidth={1.75} aria-hidden="true" />
      <span className="text-xl font-semibold tracking-tight">TempoPlan</span>
    </Link>
  )
}
