// P2 : graphique "Taches souvent reportees" (nombre de reports par activite).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const BAR_COLOR = '#f97316' // orange d'accent du theme (le rouge est reserve aux retards et conflits)

const shorten = (text, max = 20) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

export default function LateTasksChart({ tasks }) {
  const data = tasks.map((task) => ({ name: shorten(task.title), count: task.postponedCount }))

  return (
    <div
      role="img"
      aria-label="Graphique du nombre de reports par activité"
      style={{ height: Math.max(160, data.length * 44) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tickLine={false} />
          <Tooltip formatter={(value) => `${value} fois`} />
          <Bar dataKey="count" name="Reports" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}