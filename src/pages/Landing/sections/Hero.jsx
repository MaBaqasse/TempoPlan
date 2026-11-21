import { ArrowDown } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Hero() {
  return (
    <section className="bg-primary-50">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-10 md:grid-cols-[1.2fr_1fr] md:pb-24 md:pt-16">
        <div>
          <h1 className="text-[clamp(1.4rem,7vw,3rem)] font-bold leading-[1.1] tracking-tight text-ink md:text-[clamp(1.75rem,4vw,3rem)] md:whitespace-nowrap">
            <span className="block">Votre temps,</span>
            <span className="block">enfin bien organisé</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Ajoutez vos cours, tâches et objectifs. TempoPlan construit votre planning, trouve les
            créneaux libres et le réorganise quand un imprévu arrive.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/register">Mieux m’organiser</Button>
            <Button href="#comment-ca-marche" variant="secondary">
              En savoir plus
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <p className="mt-10 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm">
            Conçu pour les <span className="text-primary-500">étudiants</span> et les{' '}
            <span className="text-primary-500">professionnels</span>
            {'\u00A0'}!
          </p>
        </div>

        <img
          src="/images/hero-illustration.png"
          alt="Illustration d'un planning hebdomadaire avec des tâches cochées"
          className="mx-auto w-full max-w-lg"
          width="640"
          height="520"
        />
      </div>
    </section>
  )
}
