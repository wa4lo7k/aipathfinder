'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const fullName = String(formData.get('fullName') || '').trim()

    const supabase = createBrowserSupabaseClient()

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: fullName, last_name: '', role: 'student' },
          },
        })
        if (signUpError) throw signUpError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="page-auth" className="page active">
      <div className="auth-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      <div className="auth-wrapper">
        <div className="auth-box">
          <div className="auth-header">
            <Link href="/" className="nav-logo auth-logo">Pathfinder<span>AI</span></Link>
            <p className="auth-tagline">Your AI-powered career journey starts here</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError('') }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError('') }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="auth-error" style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="fullName" placeholder="Your full name" required={!isLogin} />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-eye-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={isLogin ? 'Your password' : 'Min. 6 characters'}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="eye-icon eye-open"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              <span className="btn-text">
                {loading ? 'Please wait...' : isLogin ? 'Login →' : 'Create Account →'}
              </span>
              {loading && <span className="btn-spinner"></span>}
            </button>
          </form>

          <Link href="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
