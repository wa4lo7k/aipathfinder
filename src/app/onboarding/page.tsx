'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<'student' | 'jobseeker' | null>(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    currentRole: '',
    skills: '',
    careerGoals: '',
    experienceLevel: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        const prof = data.data
        setProfile(prof)
        setSelectedRole(prof.role)
        setFormData({
          firstName: prof.first_name || '',
          lastName: prof.last_name || '',
          currentRole: prof.current_role || '',
          skills: prof.skills?.join(', ') || '',
          careerGoals: prof.career_goals || '',
          experienceLevel: prof.experience_level || ''
        })
        // If profile is already filled, skip to step 2
        if (prof.first_name) {
          setStep(2)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleRoleSelect = (role: 'student' | 'jobseeker') => {
    setSelectedRole(role)
    setStep(2)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: selectedRole,
          current_role: formData.currentRole,
          skills: skillsArray,
          career_goals: formData.careerGoals,
          experience_level: formData.experienceLevel
        })
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        alert('Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="page-onboarding" className="page active">
      <div className="auth-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      <div className="onboard-shell">
        <div className="onboard-box">
          <div className="pf-progress-wrap">
            <div className="pf-progress-bar" style={{ width: step === 1 ? '50%' : '100%' }}></div>
          </div>
          <div className="pf-back-row">
            {step === 2 && (
              <button className="back-link inline" onClick={() => setStep(1)}>← Back</button>
            )}
            <span className="step-indicator">Step {step} of 2</span>
          </div>

          <Link href="/" className="nav-logo onboard-logo">Pathfinder<span>AI</span></Link>

          {step === 1 && (
            <div className="onboarding-step">
              <div className="role-header">
                <div className="section-label center">Welcome aboard!</div>
                <h2 className="role-title">Who are you?</h2>
                <p className="role-sub">Choose your path so we can personalize every part of your experience.</p>
              </div>
              <div className="role-cards">
                <div 
                  className="role-card role-student" 
                  onClick={() => handleRoleSelect('student')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoleSelect('student')}
                >
                  <div className="role-card-icon">🎓</div>
                  <h3>Student</h3>
                  <p>I'm exploring career options, want to discover degrees, and need guidance on my future path.</p>
                  <div className="role-card-features">
                    <span>✓ Career Recommendations</span>
                    <span>✓ Degree Suggestions</span>
                    <span>✓ University Finder</span>
                    <span>✓ AI Guidance</span>
                  </div>
                  <div className="role-card-cta">Choose Student →</div>
                </div>
                <div 
                  className="role-card role-jobseeker"
                  onClick={() => handleRoleSelect('jobseeker')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoleSelect('jobseeker')}
                >
                  <div className="role-card-icon">💼</div>
                  <h3>Job Seeker</h3>
                  <p>I'm actively looking for opportunities and need smart matching to find the right role fast.</p>
                  <div className="role-card-features">
                    <span>✓ Smart Job Matching</span>
                    <span>✓ LinkedIn Jobs</span>
                    <span>✓ Remote Opportunities</span>
                    <span>✓ AI Assistance</span>
                  </div>
                  <div className="role-card-cta">Choose Job Seeker →</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2>Complete Your Profile</h2>
              <p className="pf-sub">Help us personalize your dashboard experience</p>
              <form onSubmit={handleProfileSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input 
                      type="text" 
                      name="firstName" 
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input 
                      type="text" 
                      name="lastName" 
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="form-group full">
                    <label>Current Role/Title</label>
                    <input 
                      type="text" 
                      name="currentRole" 
                      placeholder="e.g., Software Engineer" 
                      value={formData.currentRole}
                      onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="form-group full">
                    <label>Experience Level</label>
                    <select 
                      name="experienceLevel" 
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                      required
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', width: '100%' }}
                    >
                      <option value="">Select experience level</option>
                      <option value="beginner">Beginner (0-2 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="advanced">Advanced (5-10 years)</option>
                      <option value="expert">Expert (10+ years)</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Skills (comma separated)</label>
                    <input 
                      type="text" 
                      name="skills" 
                      placeholder="e.g., JavaScript, React, Python" 
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="form-group full">
                    <label>Career Goals</label>
                    <textarea 
                      name="careerGoals" 
                      placeholder="Describe your career aspirations..." 
                      value={formData.careerGoals}
                      onChange={(e) => setFormData({...formData, careerGoals: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn-auth" disabled={loading}>
                  <span className="btn-text">{loading ? 'Saving...' : 'Launch My Dashboard →'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
