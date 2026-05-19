'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section id="hero-sec" className="hero" aria-label="Hero section">
      <div className="hero-orbs" aria-hidden="true">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      <div className="hero-grid-overlay" aria-hidden="true"></div>

      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot" aria-hidden="true"></span>
          Powered by Artificial Intelligence
        </div>

        <h1 className="hero-title">
          Your AI Career<br/><span className="gradient-text">Companion</span>
        </h1>

        <p className="hero-desc">
          Empowering students to find their purpose and job seekers to land their dream role —
          all with the intelligence of modern AI.
        </p>

        <div className="hero-cta">
          <Link href="/dashboard" className="btn-primary" aria-label="Go to dashboard">
            Go to Dashboard
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </Link>
          <button className="btn-outline" onClick={() => document.getElementById('how-it-works-sec')?.scrollIntoView({ behavior: 'smooth' })}>
            See How It Works
          </button>
        </div>
      </div>
    </section>
  )
}
