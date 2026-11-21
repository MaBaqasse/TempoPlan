// P1 : en-tete de section (petit label + titre + sous-titre)
// align="left" (par defaut) ou "center"
export default function SectionHeader({ label, title, subtitle, align = 'left', id }) {
  const centered = align === 'center'
  return (
    <header className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}>
      {label && (
        <p className="text-sm font-medium uppercase tracking-wider text-primary-500">{label}</p>
      )}
      <h2 id={id} className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-lg leading-relaxed text-muted">{subtitle}</p>}
    </header>
  )
}
