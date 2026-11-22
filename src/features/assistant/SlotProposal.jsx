// P5 : une proposition de creneau avec Accepter / Modifier / Refuser
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { formatSlot } from './mockSlots'

export default function SlotProposal({ slot, durationMin, onAccept, onRefuse }) {
  const [editing, setEditing] = useState(false)
  const [start, setStart] = useState(slot.start)
  const inputId = `slot-${slot.start}`

  return (
    <div className="overflow-hidden rounded-card border border-primary-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <>
              <label htmlFor={inputId} className="block text-base font-medium text-ink">
                Nouvelle date et heure
              </label>
              <input
                id={inputId}
                type="datetime-local"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-primary-500"
              />
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-ink">
                {start ? formatSlot(start, durationMin) : 'Date à choisir'}
              </p>
              {start === slot.start && <p className="text-sm text-muted">{slot.reason}</p>}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-primary-100 bg-primary-50/60 px-4 py-3">
        <Button onClick={() => onAccept(start)} disabled={!start}>
          Accepter
        </Button>
        <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
          {editing ? 'Terminer' : 'Modifier'}
        </Button>
        <Button variant="light" onClick={onRefuse}>
          Refuser
        </Button>
      </div>
    </div>
  )
}