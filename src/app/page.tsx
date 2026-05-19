import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Reasons from '@/components/Reasons'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Reasons />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  )
}
