import { CalendarCheck, WandSparkles, Clock, RefreshCw, Target, Bell } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'

const features = [
  {
    icon: CalendarCheck,
    title: 'Gestion des activités',
    text: 'Ajoutez vos cours, réunions et tâches, fixes ou flexibles. Les conflits d’horaires sont détectés avant qu’ils ne posent problème.',
  },
  {
    icon: WandSparkles,
    title: 'Planning automatique',
    text: 'TempoPlan construit votre emploi du temps à partir de vos activités, de vos échéances et de vos disponibilités.',
  },
  {
    icon: Clock,
    title: 'Créneaux libres suggérés',
    text: 'Vous ne savez pas où placer une nouvelle tâche\u00A0? Recevez des propositions de créneaux adaptés à sa durée.',
  },
  {
    icon: RefreshCw,
    title: 'Réorganisation',
    text: 'Un cours annulé ou une tâche plus longue que prévu\u00A0? Votre planning s’ajuste, sans toucher à vos engagements fixes.',
  },
  {
    icon: Target,
    title: 'Priorités et objectifs',
    text: 'Classez vos tâches par urgence et importance, et découpez vos grands objectifs en petites étapes réalisables.',
  },
  {
    icon: Bell,
    title: 'Rappels et suivi',
    text: 'Soyez prévenu avant chaque échéance, puis visualisez ce que vous avez terminé et ce qui prend du retard.',
  },
]

export default function Features() {
  return (
    <section
      id="fonctionnalites"
      aria-labelledby="titre-fonctionnalites"
      className="scroll-mt-20 bg-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <SectionHeader
          id="titre-fonctionnalites"
          label="Fonctionnalités"
          title="Tout ce qu'il faut pour mieux gérer votre temps"
          subtitle="Un seul espace pour planifier, ajuster et suivre vos journées, sans jongler entre plusieurs outils."
        />

        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
