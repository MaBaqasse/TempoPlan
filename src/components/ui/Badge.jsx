// P1 : pastille d’état (priorité, type d’activité, statut...).
// Exemples : <Badge variant="danger">En retard</Badge>   <Badge variant="primary" dot>Flexible</Badge>
// Rappel de la charte : le rouge (danger) est réservé aux retards et aux conflits.
const variants = {
  neutral: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success/15 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-danger/10 text-red-700',
  accent: 'bg-accent/15 text-orange-800',
}

const dots = {
  neutral: 'bg-slate-500',
  primary: 'bg-primary-500',
  success: 'bg-success',
  warning: 'bg-amber-500',
  danger: 'bg-danger',
  accent: 'bg-accent',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  children,
  ...props
}) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ' +
        variants[variant] +
        ' ' +
        sizes[size] +
        ' ' +
        className
      }
      {...props}
    >
      {dot && <span aria-hidden="true" className={'h-1.5 w-1.5 rounded-full ' + dots[variant]} />}
      {children}
    </span>
  )
}
