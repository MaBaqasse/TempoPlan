// P1 : disposition des pages d’authentification : texte à gauche, carte du formulaire à droite
// (empilés sur mobile). Utilisation : <AuthSplit title="..." subtitle="...">{formulaire}</AuthSplit>
export default function AuthSplit({ title, subtitle, children }) {
  return (
    <div className="grid w-full items-center gap-10 md:grid-cols-2">
      <div className="text-white">
        <h1 className="max-w-md text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-xl font-medium leading-snug text-white/80 md:text-2xl">{subtitle}</p>
      </div>

      <div className="w-full max-w-md justify-self-center rounded-2xl bg-primary-50 p-6 shadow-xl shadow-primary-950/20 sm:p-8 md:justify-self-end">
        {children}
      </div>
    </div>
  )
}
