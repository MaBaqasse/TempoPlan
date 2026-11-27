// P1 : trois questions après l’inscription pour personnaliser le planning
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Logo from '@/components/common/Logo'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import DaysPicker from '@/features/settings/DaysPicker'
import { getSettings, saveSettings, validateAvailability } from '@/services/settingsService'
import { useAuthStore } from '@/store/authStore'

const BREAKS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 h' },
]
const TOTAL = 3

export default function Onboarding() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const [initial] = useState(() => getSettings())
  const [step, setStep] = useState(0)
  const [startTime, setStartTime] = useState(initial.availability.startTime)
  const [endTime, setEndTime] = useState(initial.availability.endTime)
  const [days, setDays] = useState(initial.availability.days)
  const [breakMinutes, setBreakMinutes] = useState(initial.breakMinutes)
  const [error, setError] = useState('')

  // Place le focus sur la question à chaque étape (lecteurs d’écran et clavier)
  const headingRef = useRef(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function finish(values) {
    saveSettings({
      availability: { days: values.days, startTime: values.startTime, endTime: values.endTime },
      breakMinutes: values.breakMinutes,
    })
    updateProfile({ onboardingDone: true })
    toast.success('Votre planning est personnalisé.')
    navigate('/app', { replace: true })
  }

  function goNext(values) {
    setError('')
    if (step === TOTAL - 1) finish(values)
    else setStep(step + 1)
  }

  const current = { startTime, endTime, days, breakMinutes }

  function handleContinue() {
    if (step === 0) {
      const errors = validateAvailability({ days: [1], startTime, endTime })
      if (errors.time) return setError(errors.time)
    }
    if (step === 1) {
      const errors = validateAvailability({ days, startTime: '00:00', endTime: '23:59' })
      if (errors.days) return setError(errors.days)
    }
    goNext(current)
  }

  // « Passer cette étape » : on garde la valeur par défaut de cette question
  function handleSkip() {
    const values = { ...current }
    if (step === 0) {
      values.startTime = initial.availability.startTime
      values.endTime = initial.availability.endTime
      setStartTime(values.startTime)
      setEndTime(values.endTime)
    }
    if (step === 1) {
      values.days = initial.availability.days
      setDays(values.days)
    }
    if (step === 2) {
      values.breakMinutes = initial.breakMinutes
      setBreakMinutes(values.breakMinutes)
    }
    goNext(values)
  }

  const questions = [
    'Quelles sont vos heures de disponibilité\u00A0?',
    'Quels jours travaillez-vous ou étudiez-vous\u00A0?',
    'Quelle durée de pause préférez-vous entre deux séances\u00A0?',
  ]

  return (
    <div className="flex min-h-screen flex-col items-center bg-primary-50 px-6 py-8">
      <Logo />

      <div className="flex w-full max-w-xl flex-1 flex-col justify-center py-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Bienvenue, {user?.firstName}
          {'\u00A0'}!
        </h1>
        <p className="mt-2 text-lg text-muted">
          Trois questions pour personnaliser votre planning.
        </p>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted">
            <span>
              Étape {step + 1} sur {TOTAL}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progression"
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-valuenow={step + 1}
            className="h-2 overflow-hidden rounded-full bg-primary-100"
          >
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: ((step + 1) / TOTAL) * 100 + '%' }}
            />
          </div>
        </div>

        <Card className="mt-6">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold text-ink outline-none"
          >
            {questions[step]}
          </h2>

          <div className="mt-5">
            {step === 0 && (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={'De\u00A0:'}
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <Input
                    label={'À\u00A0:'}
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted">
                  TempoPlan ne placera aucune tâche en dehors de ces heures.
                </p>
              </div>
            )}

            {step === 1 && <DaysPicker value={days} onChange={setDays} />}

            {step === 2 && (
              <div role="radiogroup" aria-label="Durée de pause" className="grid grid-cols-3 gap-3">
                {BREAKS.map((b) => {
                  const on = breakMinutes === b.value
                  return (
                    <button
                      key={b.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setBreakMinutes(b.value)}
                      className={
                        'rounded-xl border px-4 py-3 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' +
                        (on
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-primary-200 bg-white text-ink hover:bg-primary-50')
                      }
                    >
                      {b.label}
                    </button>
                  )
                })}
              </div>
            )}

            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={handleContinue}>
              {step === TOTAL - 1 ? 'Terminer' : 'Continuer'}
            </Button>
            <Button variant="secondary" onClick={handleSkip}>
              Passer cette étape
            </Button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep(step - 1)
                }}
                className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                Retour
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
