// P1 : disponibilités (jours, heures), durée des pauses et marge pour les imprévus
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import DaysPicker from './DaysPicker'
import { validateAvailability } from '@/services/settingsService'

function checkNumber(value, min, max) {
  const n = Number(value)
  if (value === '' || !Number.isInteger(n) || n < min || n > max) return 'Entrez un nombre entier entre ' + min + ' et ' + max + '.'
  return ''
}

export default function AvailabilitySection({ settings, onSave }) {
  const [days, setDays] = useState(settings.availability.days)
  const [startTime, setStartTime] = useState(settings.availability.startTime)
  const [endTime, setEndTime] = useState(settings.availability.endTime)
  const [breakMinutes, setBreakMinutes] = useState(String(settings.breakMinutes))
  const [bufferPercent, setBufferPercent] = useState(String(settings.bufferPercent))
  const [errors, setErrors] = useState({})

  function submit(e) {
    e.preventDefault()
    const next = validateAvailability({ days, startTime, endTime })
    const breakError = checkNumber(breakMinutes, 0, 120)
    const bufferError = checkNumber(bufferPercent, 0, 50)
    if (breakError) next.breakMinutes = breakError
    if (bufferError) next.bufferPercent = bufferError
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave({
      availability: { days, startTime, endTime },
      breakMinutes: Number(breakMinutes),
      bufferPercent: Number(bufferPercent),
    })
  }

  return (
    <Card
      title="Disponibilités"
      description="TempoPlan ne placera aucune tâche en dehors de ces jours et de ces heures."
    >
      <form onSubmit={submit} noValidate className="space-y-6">
        <div>
          <p className="mb-2 text-sm text-ink">{'Jours où vous travaillez ou étudiez\u00A0:'}</p>
          <DaysPicker value={days} onChange={setDays} error={errors.days} />
        </div>

        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={'Début de la journée\u00A0:'} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label={'Fin de la journée\u00A0:'} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          {errors.time && (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {errors.time}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label={'Pause entre deux séances (minutes)\u00A0:'}
              type="number"
              min="0"
              max="120"
              inputMode="numeric"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              error={errors.breakMinutes}
            />
          </div>
          <div>
            <Input
              label={'Marge pour les imprévus (%)\u00A0:'}
              type="number"
              min="0"
              max="50"
              inputMode="numeric"
              value={bufferPercent}
              onChange={(e) => setBufferPercent(e.target.value)}
              error={errors.bufferPercent}
            />
          </div>
        </div>
        <p className="-mt-2 text-sm text-muted">
          La marge garde du temps libre dans vos journées pour absorber un retard ou un imprévu.
        </p>

        <Button type="submit">Enregistrer les disponibilités</Button>
      </form>
    </Card>
  )
}
