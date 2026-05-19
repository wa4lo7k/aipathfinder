'use client'

import { useState } from 'react'
import Link from 'next/link'
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" aria-label="Pathfinder AI Home">
          Pathfinder<span>AI</span>
        </Link>
        <div className="nav-links" role="menubar">
          <Link href="#hero-sec" role="menuitem">Home</Link>
          <Link href="#reasons-sec" role="menuitem">Why Us</Link>
          <Link href="#how-it-works-sec" role="menuitem">How It Works</Link>
          <Link href="#features-sec" role="menuitem">Features</Link>
          <Link href="/dashboard" className="nav-cta" role="menuitem">Dashboard</Link>
        </div>
        <button 
          className="hamburger" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu" 
          aria-expanded={mobileMenuOpen}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-menu" aria-hidden="false">
          <Link href="#hero-sec">Home</Link>
          <Link href="#reasons-sec">Why Us</Link>
          <Link href="#how-it-works-sec">How It Works</Link>
          <Link href="#features-sec">Features</Link>
          <Link href="/dashboard" className="mobile-cta">Go to Dashboard →</Link>
        </div>
      )}
    </nav>
  )
}
