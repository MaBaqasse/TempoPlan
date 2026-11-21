// P2 : liste, ajout, modification, report et suppression des activites.
import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import ActivityCard from '@/features/activities/ActivityCard'
import ActivityForm from '@/features/activities/ActivityForm'
import ConflictAlert from '@/features/activities/ConflictAlert'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  addOneDay,
} from '@/features/activities/activityUtils'
import { useActivities } from '@/features/activities/useActivities'
import { loadSeed } from '@/data/seed'
import { findConflictsFor } from '@/lib/conflicts'
import { validateActivity } from '@/services/activitiesService'
import { getSession } from '@/services/storage'
import { CATEGORIES, PRIORITIES } from '@/utils/constants'

const TABS = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'fixes', label: 'Fixes' },
  { id: 'flexibles', label: 'Flexibles' },
  { id: 'terminees', label: 'Terminées' },
]

const filterClass =
  'rounded-lg border border-primary-200 bg-white px-3 py-2 text-base text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-primary-500'

// Les activites sont triees par debut, ou par echeance si elles ne sont pas placees.
const sortKey = (activity) => activity.start ?? activity.deadline ?? '9999-12-31T23:59'

export default function Activities() {
  const {
    activities,
    conflicts,
    load,
    addActivity,
    updateActivity,
    postponeActivity,
    completeActivity,
    deleteActivity,
  } = useActivities()

  const [tab, setTab] = useState('toutes')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | une activite
  const [pending, setPending] = useState(null) // { data, conflicts } en attente de confirmation
  const [notice, setNotice] = useState('')

  // Le message de confirmation disparait tout seul.
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const conflictIds = useMemo(
    () => new Set(conflicts.flatMap((pair) => [pair.idA, pair.idB])),
    [conflicts],
  )

  const visible = activities
    .filter((a) => {
      if (tab === 'fixes' && a.type !== 'fixe') return false
      if (tab === 'flexibles' && a.type !== 'flexible') return false
      if (tab === 'terminees' && a.status !== 'terminee') return false
      if (priorityFilter && a.priority !== priorityFilter) return false
      if (categoryFilter && a.category !== categoryFilter) return false
      if (search && !a.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))

  const isEdit = editing !== null && editing !== 'new'

  function closeForm() {
    setEditing(null)
    setPending(null)
  }

  // Enregistre vraiment. Renvoie les erreurs du service, ou {} si tout va bien.
  function save(data) {
    const result = isEdit ? updateActivity(editing.id, data) : addActivity(data)
    if (!result.ok) return result.errors
    closeForm()
    setNotice(isEdit ? 'Activité modifiée.' : 'Activité ajoutée.')
    return {}
  }

  // Valide, puis previent en cas de conflit avant d'enregistrer.
  function submit(data) {
    const candidate = isEdit ? { ...editing, ...data } : data
    const errors = validateActivity(candidate)
    if (Object.keys(errors).length > 0) return errors

    const found = findConflictsFor(candidate, activities)
    if (found.length > 0) {
      setPending({ data, conflicts: found })
      return {}
    }
    return save(data)
  }

  function handlePostpone(activity) {
    const result = postponeActivity(activity.id, addOneDay(activity.start))
    if (!result.ok) return setNotice('Report impossible.')
    const clash = result.conflicts[0]
    return setNotice(
      clash
        ? `Activité reportée à demain. Attention : elle chevauche « ${clash.title} ».`
        : 'Activité reportée à demain.',
    )
  }

  function handleComplete(activity) {
    completeActivity(activity.id)
    setNotice('Activité terminée.')
  }

  function handleDelete(activity) {
    if (!window.confirm(`Supprimer « ${activity.title} » ?`)) return
    deleteActivity(activity.id)
    setNotice('Activité supprimée.')
  }

  // Charge les donnees de demonstration pour l'utilisateur connecte.
  function handleLoadSeed() {
    const userId = getSession()?.userId
    if (userId && loadSeed(userId)) {
      load()
      setNotice('Données de démonstration chargées.')
    } else {
      setNotice('Impossible de charger les données de démonstration.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Mes activités</h1>
        <Button
          onClick={() => {
            setPending(null)
            setEditing('new')
          }}
        >
          + Nouvelle activité
        </Button>
      </div>

      {notice && (
        <p role="status" className="rounded-lg bg-green-100 px-4 py-2 text-green-900">
          {notice}
        </p>
      )}

      {editing !== null && (
        <div className="space-y-3">
          <ActivityForm
            key={isEdit ? editing.id : 'new'}
            activity={isEdit ? editing : null}
            onSubmit={submit}
            onCancel={closeForm}
          />
          {pending && (
            <ConflictAlert
              conflicts={pending.conflicts}
              onEditTime={() => setPending(null)}
              onConfirm={() => save(pending.data)}
              confirmLabel={isEdit ? 'Enregistrer quand même' : 'Ajouter quand même'}
            />
          )}
        </div>
      )}

      <div role="tablist" aria-label="Type d'activités" className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 ${
              tab === id
                ? 'bg-primary-500 text-white'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          aria-label="Rechercher une activité"
          placeholder="Rechercher..."
          className={`${filterClass} min-w-48 flex-1`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filtrer par priorité"
          className={filterClass}
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="">Toutes les priorités</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par catégorie"
          className={filterClass}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-card border border-primary-200 bg-primary-50 p-6 text-center">
          <p className="text-ink">
            Aucune activité pour l'instant. Ajoutez votre premier cours ou votre première tâche.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => setEditing('new')}>Ajouter une activité</Button>
            <Button variant="secondary" onClick={handleLoadSeed}>
              Charger des données de démonstration
            </Button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted">Aucune activité ne correspond à vos filtres.</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((activity) => (
            <li key={activity.id}>
              <ActivityCard
                activity={activity}
                hasConflict={conflictIds.has(activity.id)}
                onEdit={(a) => {
                  setPending(null)
                  setEditing(a)
                }}
                onPostpone={handlePostpone}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}