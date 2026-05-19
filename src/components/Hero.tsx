'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Target, Bot, TrendingUp } from 'lucide-react'

export default function Hero() {
  const [stats, setStats] = useState({ users: 0, success: 0, paths: 0, jobs: 0 })

  useEffect(() => {
    // Animate stat counters
    const animateCounter = (key: keyof typeof stats, target: number, duration: number, suffix = '') => {
      const increment = target / (duration / 16)
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setStats(prev => ({ ...prev, [key]: target }))
          clearInterval(timer)
        } else {
          setStats(prev => ({ ...prev, [key]: Math.floor(current) }))
        }
      }, 16)
    }

    setTimeout(() => animateCounter('users', 10000, 2000), 200)
    setTimeout(() => animateCounter('success', 92, 1500), 400)
    setTimeout(() => animateCounter('paths', 500, 1800), 600)
    setTimeout(() => animateCounter('jobs', 50000, 2200), 800)
  }, [])

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

        <div className="hero-stats" role="list" aria-label="Key statistics">
          <div className="stat-item" role="listitem">
            <span className="stat-num">{stats.users.toLocaleString()}</span>
            <span className="stat-lbl">Active Users</span>
          </div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item" role="listitem">
            <span className="stat-num">{stats.success}%</span>
            <span className="stat-lbl">Success Rate</span>
          </div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item" role="listitem">
            <span className="stat-num">{stats.paths}+</span>
            <span className="stat-lbl">Career Paths</span>
          </div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item" role="listitem">
            <span className="stat-num">{stats.jobs.toLocaleString()}</span>
            <span className="stat-lbl">Jobs Matched</span>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="hero-floating-cards" aria-hidden="true">
        <div className="float-card float-card-1">
          <span className="fc-icon-wrapper">
            <Target size={20} strokeWidth={2.5} />
          </span>
          <div>
            <div className="fc-label">Match Rate</div>
            <div className="fc-value">92%</div>
          </div>
        </div>
        <div className="float-card float-card-2">
          <span className="fc-icon-wrapper">
            <Bot size={20} strokeWidth={2.5} />
          </span>
          <div>
            <div className="fc-label">AI Powered</div>
            <div className="fc-value">Live</div>
          </div>
        </div>
        <div className="float-card float-card-3">
          <span className="fc-icon-wrapper">
            <TrendingUp size={20} strokeWidth={2.5} />
          </span>
          <div>
            <div className="fc-label">Growth</div>
            <div className="fc-value">+200%</div>
          </div>
        </div>
      </div>
    </section>
  )
}
