// P2 : graphique "Repartition par categorie" (heures par categorie).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORY_LABELS } from '@/features/activities/activityUtils'

const BAR_COLOR = '#4f46e5' // primary-500

const toHours = (minutes) => Math.round((minutes / 60) * 10) / 10

export default function CategoryChart({ categories }) {
  const data = categories.map(({ category, minutes }) => ({
    name: CATEGORY_LABELS[category] ?? category,
    hours: toHours(minutes),
  }))

  return (
    <div
      role="img"
      aria-label="Graphique des heures par catégorie"
      style={{ height: Math.max(160, data.length * 44) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} />
          <YAxis type="category" dataKey="name" width={90} tickLine={false} />
          <Tooltip formatter={(value) => `${value} h`} />
          <Bar dataKey="hours" name="Heures" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}