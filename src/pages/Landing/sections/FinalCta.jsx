import Button from '@/components/ui/Button'

export default function FinalCta() {
  return (
    <section aria-labelledby="titre-cta" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary-500 to-primary-400">
          {/* MODIFIÉ : image en haut sur petit écran, à droite sur grand écran */}
          <div
            aria-hidden="true"
            className="h-48 w-full [mask-image:linear-gradient(to_bottom,black_45%,transparent)] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-2/5 md:[mask-image:linear-gradient(to_right,transparent,black_35%)]"
          >
            <img
              src="/images/cta-planner.png"
              alt=""
              className="h-full w-full object-cover opacity-50"
            />
          </div>

          {/* MODIFIÉ : espacement du texte (moins de marge en haut sur petit écran) */}
          <div className="relative max-w-xl px-8 pb-10 pt-4 md:px-12 md:py-14">
            <h2
              id="titre-cta"
              className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl"
            >
              Prêt à reprendre le contrôle de votre temps{'\u00A0'}?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-primary-100">
              Créez votre premier planning en quelques minutes et laissez TempoPlan s’occuper du
              reste.
            </p>
            <div className="mt-8">
              <Button to="/register" variant="light">
                Inscrivez-vous
              </Button>
            </div>
            <p className="mt-5 text-sm text-primary-100">Gratuit · Sans installation</p>
          </div>
        </div>
      </div>
    </section>
  )
}
