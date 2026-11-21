// P1 : assemble les sections de la landing page dans l’ordre
import Hero from './sections/Hero'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import AudienceCards from './sections/AudienceCards'
import Faq from './sections/Faq'
import FinalCta from './sections/FinalCta'

export default function Landing() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <AudienceCards />
      <Faq />
      <FinalCta />
    </>
  )
}
