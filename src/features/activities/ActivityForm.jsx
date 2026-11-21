// P2 : formulaire d'ajout et de modification d'une activite.
// onSubmit(data) doit renvoyer un objet d'erreurs { champ: message } (vide si tout va bien).
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { ACTIVITY_TYPES, CATEGORIES, PRIORITIES } from '@/utils/constants'
import { CATEGORY_LABELS, PRIORITY_LABELS, TYPE_LABELS } from './activityUtils'

const fieldClass =
  'w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-base text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-primary-500'

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function toFormValues(activity) {
  return {
    title: activity?.title ?? '',
    type: activity?.type ?? 'fixe',
    start: activity?.start ?? '',
    deadline: activity?.deadline ?? '',
    durationMin: activity?.durationMin ?? 60,
    priority: activity?.priority ?? 'moyenne',
    category: activity?.category ?? 'cours',
    recurrence: activity?.recurrence ?? '',
    notes: activity?.notes ?? '',
  }
}

// Transforme les valeurs du formulaire en donnees d'activite.
// Une flexible garde son debut actuel : c'est le moteur de planification qui la place.
function toActivityData(values, activity) {
  const isFixed = values.type === 'fixe'
  return {
    title: values.title,
    type: values.type,
    category: values.category,
    priority: values.priority,
    durationMin: Number(values.durationMin),
    notes: values.notes,
    recurrence: values.recurrence || null,
    start: isFixed ? values.start || null : (activity?.start ?? null),
    deadline: isFixed ? null : values.deadline || null,
  }
}

export default function ActivityForm({ activity = null, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(activity))
  const [errors, setErrors] = useState({})

  const change = (name) => (event) => setValues((v) => ({ ...v, [name]: event.target.value }))

  function handleSubmit(event) {
    event.preventDefault()
    setErrors(onSubmit(toActivityData(values, activity)) ?? {})
  }

  const isFixed = values.type === 'fixe'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-card border border-primary-200 bg-primary-50 p-4"
    >
      <h2 className="mb-4 text-xl font-semibold text-ink">
        {activity ? "Modifier l'activité" : 'Nouvelle activité'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="activity-title" label="Nom" error={errors.title}>
            <input
              id="activity-title"
              className={fieldClass}
              value={values.title}
              onChange={change('title')}
              placeholder="Ex. Cours de Réseaux"
            />
          </Field>
        </div>

        <Field id="activity-type" label="Type" error={errors.type}>
          <select id="activity-type" className={fieldClass} value={values.type} onChange={change('type')}>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>

        {isFixed ? (
          <Field id="activity-start" label="Date et heure de début" error={errors.start}>
            <input
              id="activity-start"
              type="datetime-local"
              className={fieldClass}
              value={values.start}
              onChange={change('start')}
            />
          </Field>
        ) : (
          <Field id="activity-deadline" label="Échéance" error={errors.deadline}>
            <input
              id="activity-deadline"
              type="datetime-local"
              className={fieldClass}
              value={values.deadline}
              onChange={change('deadline')}
            />
          </Field>
        )}

        <Field id="activity-duration" label="Durée (en minutes)" error={errors.durationMin}>
          <input
            id="activity-duration"
            type="number"
            min="5"
            step="5"
            className={fieldClass}
            value={values.durationMin}
            onChange={change('durationMin')}
          />
        </Field>

        <Field id="activity-priority" label="Priorité" error={errors.priority}>
          <select
            id="activity-priority"
            className={fieldClass}
            value={values.priority}
            onChange={change('priority')}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="activity-category" label="Catégorie" error={errors.category}>
          <select
            id="activity-category"
            className={fieldClass}
            value={values.category}
            onChange={change('category')}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="activity-recurrence" label="Répétition (optionnel)">
          <select
            id="activity-recurrence"
            className={fieldClass}
            value={values.recurrence}
            onChange={change('recurrence')}
          >
            <option value="">Aucune</option>
            <option value="weekly">Chaque semaine</option>
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field id="activity-notes" label="Notes (optionnel)">
            <textarea
              id="activity-notes"
              rows="2"
              className={fieldClass}
              value={values.notes}
              onChange={change('notes')}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit">Enregistrer</Button>
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}