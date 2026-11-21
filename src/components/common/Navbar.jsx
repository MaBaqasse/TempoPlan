// P1 : barre de navigation de la landing page (fixe en haut, menu burger sur mobile)
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import Button from '@/components/ui/Button'

const links = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
  { href: '#pour-qui', label: 'Pour qui\u00A0?' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-primary-100 bg-white/95 backdrop-blur md:bg-primary-50/90">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
        aria-label="Navigation principale"
      >
        <Logo />

        {/* Ordinateur */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-medium text-ink transition-colors hover:text-primary-500"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Button to="/register" className="px-4 py-2 text-sm">
              Essayer gratuitement
            </Button>
          </li>
        </ul>

        {/* Mobile */}
        <button
          type="button"
          className="rounded-lg p-2 text-ink hover:bg-primary-100 md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Menu mobile : s’ouvre et se ferme avec une animation */}
      <div
        id="menu-mobile"
        className={
          'grid transition-[grid-template-rows,visibility] duration-300 ease-out md:hidden ' +
          (open ? 'grid-rows-[1fr]' : 'invisible grid-rows-[0fr]')
        }
      >
        <div
          className={
            'overflow-hidden transition-opacity duration-300 ease-out ' +
            (open ? 'opacity-100' : 'opacity-0')
          }
        >
          <ul className="space-y-1 border-t border-primary-100 px-6 pb-5 pt-3">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={close}
                  className="block rounded-lg px-3 py-2 font-medium text-ink hover:bg-primary-100"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button to="/register" className="w-full" onClick={close}>
                Essayer gratuitement
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}
