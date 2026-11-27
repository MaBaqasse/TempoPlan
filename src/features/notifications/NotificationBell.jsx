// P1 : cloche de notifications de la barre du haut.
// Version provisoire : le badge (nombre non lu) et le panneau viendront avec la tâche « Notifications ».
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="rounded-full p-2 text-slate-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
