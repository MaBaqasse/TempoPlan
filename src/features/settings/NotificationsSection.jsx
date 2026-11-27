// P1 : préférences de notification (alertes du navigateur, délai de rappel, types d’alertes)
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Switch from '@/components/ui/Switch'
import Button from '@/components/ui/Button'

const REMINDERS = [
  { value: 10, label: '10 minutes avant' },
  { value: 30, label: '30 minutes avant' },
  { value: 60, label: '1 heure avant' },
  { value: 1440, label: '1 jour avant' },
]

export default function NotificationsSection({ settings, onSave }) {
  const [values, setValues] = useState(settings.notifications)
  const [message, setMessage] = useState('')

  const update = (field) => (value) => setValues((v) => ({ ...v, [field]: value }))

  // L’autorisation du navigateur se demande au moment où l’utilisateur active l’interrupteur
  async function toggleBrowserAlerts(next) {
    setMessage('')
    if (!next) return update('browserAlerts')(false)

    if (typeof Notification === 'undefined') {
      setMessage('Votre navigateur ne gère pas les notifications.')
      return
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission === 'granted') update('browserAlerts')(true)
    else {
      setMessage('Le navigateur a bloqué les notifications. Autorisez-les pour ce site (cadenas dans la barre d’adresse), puis réessayez.')
    }
  }

  function submit(e) {
    e.preventDefault()
    onSave({ notifications: values })
  }

  return (
    <Card title="Notifications" description="Choisissez ce dont TempoPlan doit vous prévenir.">
      <form onSubmit={submit} className="space-y-5">
        <Switch
          label="Alertes du navigateur"
          description="Recevoir un rappel même quand l’onglet TempoPlan est en arrière-plan."
          checked={values.browserAlerts}
          onChange={toggleBrowserAlerts}
        />
        {message && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        )}

        <Select
          label={'Délai de rappel\u00A0:'}
          value={values.reminderMinutesBefore}
          onChange={(e) => update('reminderMinutesBefore')(Number(e.target.value))}
        >
          {REMINDERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>

        <div className="space-y-4 border-t border-primary-100 pt-5">
          <Switch label="Échéances proches" description="Prévenir quand une date limite approche." checked={values.deadlines} onChange={update('deadlines')} />
          <Switch label="Tâches en retard" description="Signaler les tâches dont l’échéance est dépassée." checked={values.overdue} onChange={update('overdue')} />
          <Switch label="Conflits d’horaires" description="Avertir quand deux activités se chevauchent." checked={values.conflicts} onChange={update('conflicts')} />
        </div>

        <Button type="submit">Enregistrer les notifications</Button>
      </form>
    </Card>
  )
}
