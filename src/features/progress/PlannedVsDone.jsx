// P2 : graphique "Prevu vs realise" (heures par jour).
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Couleurs du theme : primary-300 (prevu) et primary-500 (realise).
const PLANNED_COLOR = '#a7a3f2'
const DONE_COLOR = '#4f46e5'

const toHours = (minutes) => Math.round((minutes / 60) * 10) / 10

function dayLabel(date, period) {
  const d = new Date(`${date}T00:00`)
  return period === 'month' ? String(d.getDate()) : d.toLocaleDateString('fr-FR', { weekday: 'short' })
}

export default function PlannedVsDone({ days, period }) {
  const data = days.map((day) => ({
    label: dayLabel(day.date, period),
    planned: toHours(day.plannedMin),
    done: toHours(day.doneMin),
  }))

  return (
    <div role="img" aria-label="Graphique des heures prévues et réalisées par jour" className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} interval={period === 'month' ? 1 : 0} />
          <YAxis tickLine={false} />
          <Tooltip formatter={(value) => `${value} h`} />
          <Legend />
          <Bar dataKey="planned" name="Prévu" fill={PLANNED_COLOR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="done" name="Réalisé" fill={DONE_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}