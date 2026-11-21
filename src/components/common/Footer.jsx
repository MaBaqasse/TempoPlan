// P1 : pied de page. A completer avec les noms de l’equipe avant la presentation.
export default function Footer() {
  return (
    <footer className="border-t border-slate-300">
      <div className="mx-auto max-w-6xl space-y-2 px-6 py-8 text-sm text-muted">
        <p>© {new Date().getFullYear()} TempoPlan. Tous droits réservés.</p>
        <p>
          Projet réalisé dans le cadre du module Développement Frontend, FST Marrakech, Université
          Cadi Ayyad.
        </p>
        {/* TODO : <p>Réalisé par : nom 1, nom 2, nom 3, nom 4, nom 5</p> */}
      </div>
    </footer>
  )
}
