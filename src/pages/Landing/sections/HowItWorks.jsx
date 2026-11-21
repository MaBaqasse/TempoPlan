import SectionHeader from '@/components/common/SectionHeader'

const steps = [
  {
    title: 'Ajoutez vos activités et échéances',
    body: 'Saisissez vos cours, réunions et tâches avec leur durée, leur date limite et leur priorité. Vous pouvez aussi simplement l’écrire à l’assistant, par exemple\u00A0: «\u00A0Réviser les réseaux 2\u00A0h avant vendredi\u00A0».',
  },
  {
    title: 'Recevez un planning personnalisé',
    body: 'TempoPlan place chaque activité au bon moment, respecte vos horaires fixes et garde des pauses ainsi qu’une marge pour les imprévus.',
  },
  {
    title: 'Ajustez en un clic quand ça change',
    body: (
      <>
        Une activité annulée ou reportée&nbsp;?{' '}
        <span className="whitespace-nowrap">Signalez-le</span>, et votre planning est réorganisé.
        Vous validez les changements avant qu’ils ne soient appliqués.
      </>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="titre-comment"
      className="scroll-mt-20 bg-primary-50"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <SectionHeader
          id="titre-comment"
          label="Comment ça marche"
          title="Votre planning prêt en trois étapes"
          subtitle="Pas de configuration compliquée : vous décrivez ce que vous avez à faire, TempoPlan s’occupe du reste."
        />

        {/* Frise : ligne a gauche sur mobile, au centre en zigzag sur ordinateur */}
        <ol className="relative mx-auto mt-14 max-w-3xl">
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-6 top-6 w-0.5 -translate-x-1/2 bg-primary-500 md:left-1/2"
          />
          {steps.map((step, i) => {
            const textOnRight = i % 2 === 0
            return (
              <li
                key={step.title}
                className="relative grid grid-cols-[auto_1fr] gap-x-6 py-6 md:grid-cols-[1fr_auto_1fr] md:gap-x-8"
              >
                <span className="z-10 col-start-1 row-start-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 font-semibold text-white md:col-start-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div
                  className={
                    'col-start-2 row-start-1 ' +
                    (textOnRight ? 'md:col-start-3' : 'md:col-start-1 md:text-right')
                  }
                >
                  <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
