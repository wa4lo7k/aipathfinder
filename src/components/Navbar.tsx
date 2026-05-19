'use client'

import { useState } from 'react'
import Link from 'next/link'
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMenu = () => setMobileMenuOpen(false)

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
          className={`hamburger${mobileMenuOpen ? ' open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu" 
          aria-expanded={mobileMenuOpen}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <Link href="#hero-sec" onClick={closeMenu}>Home</Link>
        <Link href="#reasons-sec" onClick={closeMenu}>Why Us</Link>
        <Link href="#how-it-works-sec" onClick={closeMenu}>How It Works</Link>
        <Link href="#features-sec" onClick={closeMenu}>Features</Link>
        <Link href="/dashboard" className="mobile-cta" onClick={closeMenu}>Go to Dashboard →</Link>
      </div>
    </nav>
  )
}
