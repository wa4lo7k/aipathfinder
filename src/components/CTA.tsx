'use client'

import Link from 'next/link'

export default function CTA() {
  return (
    <section className="cta-banner" aria-labelledby="cta-heading">
      <div className="cta-orb" aria-hidden="true"></div>
      <div className="section-inner">
        <div className="section-head center fade-in">
          <h2 className="section-title" id="cta-heading">Ready to Find Your <span className="gradient-text">Path?</span></h2>
          <p className="section-sub">Join thousands of students and job seekers who've already taken the first step.</p>
          <Link href="/dashboard" className="btn-primary btn-large" style={{marginTop: '8px'}}>
            Open Dashboard
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
