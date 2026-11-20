// P1 : bouton partage (variantes primary / secondary / accent)
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-white text-ink border border-slate-300 hover:bg-lavender',
  accent: 'bg-accent text-white hover:opacity-90',
}

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={"rounded-lg px-4 py-2 font-semibold transition " + variants[variant] + " " + className}
      {...props}
    />
  )
}
