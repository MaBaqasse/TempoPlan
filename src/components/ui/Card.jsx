// P1 : carte partagée (tableau de bord, objectifs, statistiques...).
// Exemples :
//   <Card title="Aujourd’hui" action={<Button variant="secondary">Voir tout</Button>}>...</Card>
//   <Card hoverable as="li">...</Card>           (se soulève au survol)
//   <Card padding="none">...</Card>              (pour une image ou une liste qui va jusqu’aux bords)
const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
}

export default function Card({
  title,
  description,
  action,
  headingAs: Heading = 'h2',
  as: Tag = 'div',
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...props
}) {
  const hasHeader = title || description || action

  return (
    <Tag
      className={
        'rounded-2xl border border-primary-100 bg-white shadow-sm ' +
        paddings[padding] +
        ' ' +
        (hoverable
          ? 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-950/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 '
          : '') +
        className
      }
      {...props}
    >
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <Heading className="text-lg font-semibold text-ink">{title}</Heading>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}
