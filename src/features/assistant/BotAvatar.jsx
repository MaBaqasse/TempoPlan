// Avatar rond de l'assistant (petit robot avec casque, en SVG : aucune image a ajouter)
export default function BotAvatar({ small = false, className = '' }) {
  // className : taille du cercle (ex. 'h-14 w-14'), sinon h-10 w-10 (h-8 w-8 si small)
  const size = className || (small ? 'h-8 w-8' : 'h-10 w-10')
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-primary-500 text-white ${size}`}
    >
      <svg viewBox="0 0 32 32" className="h-4/5 w-4/5">
        {/* antenne */}
        <path d="M16 7V4" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="16" cy="3.2" r="1.7" className="fill-accent" />
        {/* casque */}
        <rect x="3.5" y="11.5" width="3.2" height="7.5" rx="1.6" className="fill-accent" />
        <rect x="25.3" y="11.5" width="3.2" height="7.5" rx="1.6" className="fill-accent" />
        {/* tete */}
        <rect x="6" y="7" width="20" height="15.5" rx="6.5" className="fill-white" />
        {/* ecran du visage */}
        <rect x="9" y="10" width="14" height="9.5" rx="4.5" className="fill-primary-950" />
        {/* yeux */}
        <circle cx="13" cy="14" r="1.5" className="fill-cyan-300" />
        <circle cx="19" cy="14" r="1.5" className="fill-cyan-300" />
        {/* sourire */}
        <path
          d="M13.2 16.8Q16 18.8 18.8 16.8"
          className="stroke-cyan-300"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* corps */}
        <rect x="10.5" y="24" width="11" height="6" rx="3" className="fill-white" />
      </svg>
    </span>
  )
}