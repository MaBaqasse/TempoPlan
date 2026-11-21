// P2 : alerte affichee quand une activite chevauche d'autres activites.
import Button from '@/components/ui/Button'
import { formatDay, formatTimeRange } from './activityUtils'

export default function ConflictAlert({
  conflicts,
  onEditTime,
  onConfirm,
  confirmLabel = 'Ajouter quand même',
}) {
  return (
    <div role="alert" className="rounded-card border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-900">
        {conflicts.length === 1
          ? 'Cette activité chevauche une autre activité :'
          : 'Cette activité chevauche plusieurs activités :'}
      </p>
      <ul className="mt-2 list-disc pl-5 text-red-900">
        {conflicts.map((other) => (
          <li key={other.id}>
            « {other.title} » ({formatDay(other.start)}, {formatTimeRange(other)})
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onEditTime}>
          Modifier l'horaire
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  )
}