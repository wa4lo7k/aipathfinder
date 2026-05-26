'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SetupTask {
  id: string
  label: string
  weight: number
  status: 'pending' | 'running' | 'done' | 'error'
}

const TASKS: SetupTask[] = [
  { id: 'profile', label: 'Loading your profile…', weight: 10, status: 'pending' },
  { id: 'stats', label: 'Calculating your profile score…', weight: 10, status: 'pending' },
  { id: 'roadmaps', label: 'Fetching your learning roadmaps…', weight: 20, status: 'pending' },
  { id: 'recommendations', label: 'Generating career recommendations…', weight: 20, status: 'pending' },
  { id: 'conversations', label: 'Setting up AI assistant…', weight: 15, status: 'pending' },
  { id: 'jobs', label: 'Scanning for matching jobs…', weight: 15, status: 'pending' },
  { id: 'finalize', label: 'Finalizing your dashboard…', weight: 10, status: 'pending' },
]

type SetupData = Record<string, any>

export default function SetupPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<SetupTask[]>(TASKS)
  const [progress, setProgress] = useState(0)
  const [currentLabel, setCurrentLabel] = useState('Setting up your personalized experience…')
  const [complete, setComplete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const dataRef = useRef<SetupData>({})

  const setTaskStatus = (id: string, status: SetupTask['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  useEffect(() => {
    const runSetup = async () => {
      const apiCalls: { id: string; fn: () => Promise<any> }[] = [
        {
          id: 'profile',
          fn: async () => {
            const res = await fetch('/api/profile')
            if (res.ok) {
              const json = await res.json()
              dataRef.current.profile = json.data
            }
          }
        },
        {
          id: 'stats',
          fn: async () => {
            const res = await fetch('/api/dashboard/stats')
            if (res.ok) {
              const json = await res.json()
              dataRef.current.stats = json.data
            }
          }
        },
        {
          id: 'roadmaps',
          fn: async () => {
            const res = await fetch('/api/roadmaps')
            if (res.ok) {
              const json = await res.json()
              dataRef.current.roadmaps = json.data || []
            }
          }
        },
        {
          id: 'recommendations',
          fn: async () => {
            const res = await fetch('/api/career-recommendations')
            if (res.ok) {
              const json = await res.json()
              dataRef.current.recommendations = json.data || []
              if (!json.data || json.data.length === 0) {
                const genRes = await fetch('/api/career-recommendations', { method: 'POST' })
                if (genRes.ok) {
                  const genJson = await genRes.json()
                  dataRef.current.recommendations = genJson.data || []
                }
              }
            }
          }
        },
        {
          id: 'conversations',
          fn: async () => {
            const res = await fetch('/api/conversations')
            if (res.ok) {
              const json = await res.json()
              dataRef.current.conversations = json.data || []
            }
          }
        },
        {
          id: 'jobs',
          fn: async () => {
            const res = await fetch('/api/jobs?query=software&location=')
            if (res.ok) {
              const json = await res.json()
              dataRef.current.jobs = json.data || []
            }
          }
        },
        {
          id: 'finalize',
          fn: async () => {
            if (dataRef.current.profile) {
              const { role, first_name, last_name } = dataRef.current.profile
              dataRef.current.userType = role
              dataRef.current.userName = first_name || last_name || 'User'
            }
          }
        },
      ]

      let completedWeight = 0
      for (const call of apiCalls) {
        const startTime = Date.now()
        const minDuration = 600 + Math.random() * 900
        setCurrentLabel(tasks.find(t => t.id === call.id)?.label || 'Working…')
        setTaskStatus(call.id, 'running')

        try {
          await call.fn()
        } catch {
          // ignore individual failures
        }

        const elapsed = Date.now() - startTime
        if (elapsed < minDuration) {
          await new Promise<void>(resolve => setTimeout(resolve, minDuration - elapsed))
        }
        setTaskStatus(call.id, 'done')

        completedWeight += tasks.find(t => t.id === call.id)?.weight || 0
        setProgress(Math.min(completedWeight, 95))
      }

      sessionStorage.setItem('setupData', JSON.stringify(dataRef.current))

      setProgress(100)
      setComplete(true)
      setCurrentLabel('You\'re all set!')

      timerRef.current = setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }

    runSetup()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!complete) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [complete])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 40,
      position: 'relative',
    }}>
      <div className="auth-bg-orbs" aria-hidden="true">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <Link href="/" className="nav-logo" style={{ fontSize: '1.6rem', display: 'inline-block', marginBottom: 48 }}>
          Pathfinder<span>AI</span>
        </Link>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            width: 200, height: 200, borderRadius: '50%', margin: '0 auto 32px',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--surface3)" strokeWidth="8" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="url(#progressGrad)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent2)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ fontSize: '2.8rem', fontWeight: 800 }}>
              {Math.round(progress)}<span style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>

          <p style={{ fontSize: '1.1rem', color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
            {complete ? 'You\'re all set!' : currentLabel}
          </p>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
            {complete ? 'Redirecting you to your personalized dashboard…' : 'Almost there — personalizing your experience.'}
          </p>
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 10,
              background: task.status === 'done' ? 'var(--accent3-dim)' : task.status === 'running' ? 'var(--accent-dim)' : task.status === 'error' ? 'var(--accent2-dim)' : 'var(--surface2)',
              border: '1px solid',
              borderColor: task.status === 'done' ? 'rgba(52,211,153,0.2)' : task.status === 'running' ? 'rgba(108,99,255,0.2)' : task.status === 'error' ? 'rgba(255,107,138,0.2)' : 'var(--border)',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: task.status === 'done' ? 'var(--accent3)' : task.status === 'running' ? 'var(--accent)' : task.status === 'error' ? 'var(--accent2)' : 'var(--surface3)',
                color: '#000', fontSize: 12, fontWeight: 700,
              }}>
                {task.status === 'done' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                ) : task.status === 'running' ? (
                  <span className="btn-spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                ) : task.status === 'error' ? (
                  <span>!</span>
                ) : (
                  <span style={{ opacity: 0.4 }}>{task.weight}</span>
                )}
              </div>
              <span style={{
                fontSize: '.85rem',
                color: task.status === 'done' ? 'var(--accent3)' : task.status === 'running' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: task.status === 'running' ? 600 : 400,
              }}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
