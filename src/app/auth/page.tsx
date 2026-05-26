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
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const firstName = String(formData.get('firstName') || '').trim()
    const lastName = String(formData.get('lastName') || '').trim()

    const supabase = createBrowserSupabaseClient()

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError

        // Refresh the session to ensure cookies are set
        await supabase.auth.getSession()
        
        // Always redirect to onboarding after login
        // Onboarding handles routing to dashboard based on chosen path
        router.push('/onboarding')
        router.refresh()
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: 'student',
            },
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        })
        if (signUpError) throw signUpError

        // Check if email confirmation is required
        if (signUpData?.user && !signUpData.session) {
          // Email confirmation required
          form.reset()
          setIsLogin(true)
          setSuccessMsg('Account created! Please check your email to confirm your account, then log in.')
        } else {
          // Auto-login after signup (if email confirmation is disabled)
          form.reset()
          setIsLogin(true)
          setSuccessMsg('Account created successfully! Please log in with your credentials.')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="page-auth" className="auth-fullpage">
      <div className="auth-fullpage-left">
        <div className="auth-brand-content">
          <Link href="/" className="nav-logo auth-logo">Pathfinder<span>AI</span></Link>
          <h1 className="auth-brand-title">
            Your AI-Powered<br/><span className="gradient-text">Career Journey</span>
          </h1>
          <p className="auth-brand-desc">
            Empowering students to find their purpose and job seekers to land their dream role — all with the intelligence of modern AI.
          </p>
          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>AI-powered career recommendations</span>
            </div>
            <div className="auth-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Personalized learning roadmaps</span>
            </div>
            <div className="auth-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Smart job matching & search</span>
            </div>
          </div>
        </div>
        <div className="auth-bg-orbs" aria-hidden="true">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>
      </div>

      <div className="auth-fullpage-right">
        <div className="auth-box">
          <div className="auth-header">
            <h2 className="auth-box-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="auth-tagline">{isLogin ? 'Sign in to continue your journey' : 'Start your AI-powered career path'}</p>
          </div>

          <div className="auth-tabs" data-active={isLogin ? 'login' : 'signup'}>
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg('') }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg('') }}
            >
              Sign Up
            </button>
          </div>

          {successMsg && (
            <div className="auth-alert success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {successMsg}
            </div>
          )}

          {error && (
            <div className="auth-alert error">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" placeholder="Your first name" required={!isLogin} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" placeholder="Your last name" required={!isLogin} />
                </div>
              </>
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
