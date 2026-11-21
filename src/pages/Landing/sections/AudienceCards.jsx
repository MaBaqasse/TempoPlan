import SectionHeader from '@/components/common/SectionHeader'

// Les images sont dans public/images/ (voir LISEZMOI.txt). Idealement 3 photos de meme ambiance.
const audiences = [
  {
    image: '/images/audience-students.png',
    alt: 'Étudiants qui révisent ensemble',
    title: 'Étudiants',
    text: 'Cours, révisions, projets de groupe, examens\u00A0: organisez vos semaines et répartissez votre travail pour ne plus tout laisser à la dernière minute.',
  },
  {
    image: '/images/audience-professionals.png',
    alt: 'Collègues en réunion dans un bureau',
    title: 'Professionnels',
    text: 'Réunions, échéances, dossiers à rendre\u00A0: gardez une vue claire de vos journées et trouvez rapidement un créneau pour chaque tâche.',
  },
  {
    image: '/images/audience-balance.png',
    alt: 'Personne qui note son organisation dans un carnet',
    title: 'Toute personne qui veut mieux s’équilibrer',
    text: 'Travail, objectifs personnels, loisirs et repos\u00A0: donnez à chaque chose sa place sans vous épuiser.',
  },
]

export default function AudienceCards() {
  return (
    <section id="pour-qui" aria-labelledby="titre-pour-qui" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <SectionHeader
          id="titre-pour-qui"
          align="center"
          label={'Pour qui\u00A0?'}
          title="Un planning qui s’adapte à votre rythme"
          subtitle="Que vous jongliez entre cours et révisions ou entre réunions et projets, TempoPlan s’ajuste à vos obligations."
        />

        <ul className="mt-14 grid gap-8 md:grid-cols-3">
          {audiences.map((a) => (
            <li
              key={a.title}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-primary-950/10 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-950/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <img
                src={a.image}
                alt={a.alt}
                className="h-44 w-full bg-primary-100 object-cover"
                loading="lazy"
              />
              <div className="flex-1 p-6">
                <h3 className="text-lg font-semibold text-ink">{a.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{a.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center font-medium text-primary-500">
          Quel que soit votre emploi du temps, TempoPlan le rend plus clair et plus réaliste&nbsp;!
        </p>
      </div>
    </section>
  )
}
