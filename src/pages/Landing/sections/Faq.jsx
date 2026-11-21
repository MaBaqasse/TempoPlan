import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'

// ATTENTION : verifiez que ces reponses restent vraies pour votre projet.
// Tant qu’il n’y a pas de backend, les donnees restent dans le navigateur (localStorage) :
// adaptez alors la reponse sur la confidentialite.
const faqs = [
  {
    q: 'TempoPlan est-il gratuit\u00A0?',
    a: 'Oui. Vous pouvez organiser vos activités, générer votre planning et suivre vos progrès sans payer.',
  },
  {
    q: 'Mes données sont-elles privées\u00A0?',
    a: 'Vos activités, vos objectifs et votre planning ne sont accessibles que depuis votre compte. Ils ne sont partagés avec aucun autre utilisateur.',
  },
  {
    q: 'Puis-je modifier le planning proposé\u00A0?',
    a: 'Bien sûr. Le planning est une proposition : vous pouvez déplacer, modifier, reporter ou supprimer n’importe quelle activité. Pour les changements importants, TempoPlan vous demande toujours de valider avant de les appliquer.',
  },
  {
    q: 'TempoPlan fonctionne-t-il sur mobile\u00A0?',
    a: 'Oui. Le site s’adapte aux écrans de téléphone, de tablette et d’ordinateur. Il suffit d’un navigateur, sans rien installer.',
  },
  {
    q: 'Que se passe-t-il en cas de conflit\u00A0?',
    a: 'TempoPlan détecte le conflit et vous prévient. Vos engagements fixes (cours, réunions) ne sont jamais déplacés automatiquement, seules les tâches flexibles peuvent être replacées.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0) // la 1re question est ouverte par defaut

  return (
    <section id="faq" aria-labelledby="titre-faq" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <SectionHeader
          id="titre-faq"
          label="FAQ"
          title="Vos questions, nos réponses"
          subtitle="Tout ce qu’il faut savoir avant de commencer."
        />

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {faqs.map((item, i) => {
            const open = openIndex === i
            return (
              <div
                key={item.q}
                className={
                  'rounded-xl border transition-colors ' +
                  (open
                    ? 'border-primary-200 bg-white shadow-sm'
                    : 'border-transparent bg-primary-100 hover:bg-primary-200') /* MODIFIÉ : survol */
                }
              >
                <h3>
                  <button
                    type="button"
                    id={'faq-bouton-' + i}
                    aria-expanded={open}
                    aria-controls={'faq-panneau-' + i}
                    onClick={() => setOpenIndex(open ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-lg font-medium text-ink focus-visible:outline-2 focus-visible:outline-primary-500"
                  >
                    {item.q}
                    <ChevronDown
                      className={
                        'h-5 w-5 shrink-0 transition-transform ' + (open ? 'rotate-180' : '')
                      }
                      aria-hidden="true"
                    />
                  </button>
                </h3>

                {/* MODIFIÉ : panneau de réponse animé (hauteur + fondu + glissement) */}
                <div
                  id={'faq-panneau-' + i}
                  role="region"
                  aria-labelledby={'faq-bouton-' + i}
                  aria-hidden={!open}
                  className={
                    'grid transition-[grid-template-rows,visibility] duration-300 ease-out ' +
                    (open ? 'grid-rows-[1fr]' : 'invisible grid-rows-[0fr]')
                  }
                >
                  <div className="overflow-hidden">
                    <p
                      className={
                        'px-5 pb-5 leading-relaxed text-muted transition-all duration-300 ease-out ' +
                        (open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')
                      }
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-muted">
          Une autre question&nbsp;? Écrivez-nous à{' '}
          <a
            href="mailto:contact@tempoplan.com"
            className="text-primary-500 underline underline-offset-2 hover:text-primary-700"
          >
            contact@tempoplan.com
          </a>
        </p>
      </div>
    </section>
  )
}
