// P5 : bulle flottante (en bas a droite) qui ouvre la page de l'assistant
// A placer UNE fois dans AppLayout : <ChatBubble />
// Elle se cache d'elle-meme sur la page de l'assistant.
import { Link, useLocation } from 'react-router-dom'
import BotAvatar from './BotAvatar'

export default function ChatBubble({ to = '/app/assistant' }) {
  const { pathname } = useLocation()
  if (pathname.replace(/\/$/, '').endsWith('/assistant')) return null

  return (
    <Link
      to={to}
      aria-label="Ouvrir l'assistant de planification"
      className="group fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-full bg-white p-1.5 shadow-lg ring-1 ring-primary-200 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:bottom-6 sm:right-6"
    >
      <span className="hidden pl-3 text-base font-medium text-primary-700 group-hover:inline group-focus-visible:inline">
        Assistant
      </span>
      <BotAvatar className="h-14 w-14" />
    </Link>
  )
}