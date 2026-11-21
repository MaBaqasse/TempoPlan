// P1 : bouton partage. Variantes : primary, secondary, light, accent.
// Utilisation : <Button to="/register">Mieux m’organiser</Button>   (lien interne)
//               <Button href="#faq" variant="secondary">...</Button> (ancre / lien externe)
//               <Button onClick={...}>...</Button>                  (vrai bouton)
import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-medium ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary-500 disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'border border-primary-200 bg-white text-ink hover:bg-primary-100',
  light: 'bg-primary-100 text-primary-700 hover:bg-primary-200',
  accent: 'bg-accent text-white hover:opacity-90',
}

export default function Button({
  variant = 'primary',
  to,
  href,
  className = '',
  children,
  ...props
}) {
  const classes = [base, variants[variant], className].join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
