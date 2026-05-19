'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bot, Map, FileText, TrendingUp, Target, MessageSquare, Pencil, Search, Plus, Loader2, Upload } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import ChatInterface from '@/components/ChatInterface'

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  
  // Data states
  const [stats, setStats] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  
  // UI states
  const [jobSearch, setJobSearch] = useState({ query: '', location: '' })
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [roadmapForm, setRoadmapForm] = useState({ title: '', targetRole: '', description: '' })
  const [showRoadmapForm, setShowRoadmapForm] = useState(false)
  const [loadingRoadmap, setLoadingRoadmap] = useState(false)

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'jobs', icon: Briefcase, label: 'Jobs' },
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant' },
    { id: 'roadmaps', icon: Map, label: 'Roadmaps' },
    { id: 'resume', icon: FileText, label: 'Resume' },
    { id: 'recommendations', icon: Target, label: 'Career Paths' },
  ]

  // Fetch all data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth')
        return
      }

      // Fetch stats
      const statsRes = await fetch('/api/dashboard/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      // Fetch profile
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.data)
      }

      // Fetch conversations
      const convRes = await fetch('/api/conversations')
      if (convRes.ok) {
        const convData = await convRes.json()
        setConversations(convData.data || [])
      }

      // Fetch roadmaps
      const roadmapRes = await fetch('/api/roadmaps')
      if (roadmapRes.ok) {
        const roadmapData = await roadmapRes.json()
        setRoadmaps(roadmapData.data || [])
      }

      // Fetch resumes
      const resumeRes = await fetch('/api/resumes')
      if (resumeRes.ok) {
        const resumeData = await resumeRes.json()
        setResumes(resumeData.data || [])
      }

      // Fetch career recommendations
      const recRes = await fetch('/api/career-recommendations')
      if (recRes.ok) {
        const recData = await recRes.json()
        setRecommendations(recData.data || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchJobs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      setLoadingJobs(true)
      const params = new URLSearchParams()
      if (jobSearch.query) params.append('query', jobSearch.query)
      if (jobSearch.location) params.append('location', jobSearch.location)
      
      const res = await fetch(`/api/jobs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.data || [])
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to search jobs' }))
        alert(errorData.error || 'Failed to search jobs')
      }
    } catch (error) {
      console.error('Error searching jobs:', error)
      alert('Error searching jobs. Please try again.')
    } finally {
      setLoadingJobs(false)
    }
  }

  // Auto-search when section changes to jobs
  useEffect(() => {
    if (activeSection === 'jobs' && jobs.length === 0) {
      searchJobs()
    }
  }, [activeSection])

  const generateRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      const res = await fetch('/api/career-recommendations', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        alert('Career recommendations generated successfully!')
        await fetchDashboardData() // Refresh all data
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to generate recommendations' }))
        alert(errorData.error || 'Failed to generate recommendations. Please try again.')
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      alert('Error generating recommendations. Please ensure your profile is complete.')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      })
      if (res.ok) {
        const data = await res.json()
        setActiveConversationId(data.data.id)
        await fetchDashboardData()
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const createRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoadingRoadmap(true)
      const res = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roadmapForm.title,
          target_role: roadmapForm.targetRole,
          description: roadmapForm.description
        })
      })
      if (res.ok) {
        alert('Roadmap created successfully!')
        setShowRoadmapForm(false)
        setRoadmapForm({ title: '', targetRole: '', description: '' })
        await fetchDashboardData()
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create roadmap' }))
        alert(errorData.error || 'Failed to create roadmap. Please try again.')
      }
    } catch (error) {
      console.error('Error creating roadmap:', error)
      alert('Error creating roadmap. Please try again.')
    } finally {
      setLoadingRoadmap(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = profile?.first_name?.[0]?.toUpperCase() + (profile?.last_name?.[0]?.toUpperCase() || '') || 'U'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div id="page-dashboard" className="page active">
      <button 
        className="hamburger sidebar-hamburger" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <span></span><span></span><span></span>
      </button>

      <div className="dash-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-top">
            <Link href="/" className="nav-logo sidebar-logo">Pathfinder<span>AI</span></Link>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const NavIcon = item.icon
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="nav-icon"><NavIcon size={18} strokeWidth={2} /></span>
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-user-wrap">
              <button 
                className="sidebar-user"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
              >
                <div className="user-av">{initials}</div>
                <div className="user-meta">
                  <div className="user-name">{profile?.full_name || profile?.email?.split('@')[0] || 'User'}</div>
                  <div className="user-role-tag">{profile?.role || 'User'}</div>
                </div>
                <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {profileDropdownOpen && (
                <div className="profile-dropdown">
                  <Link href="/onboarding" className="pd-item">
                    <Pencil size={16} strokeWidth={2} /> Edit Profile
                  </Link>
                  <div className="pd-divider"></div>
                  <button onClick={handleLogout} className="pd-item pd-logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <main className="dash-main">
          <div className="dash-topbar">
            <div className="dash-topbar-left">
              <h1 className="dash-page-title">{navItems.find(i => i.id === activeSection)?.label || 'Dashboard'}</h1>
              <p className="dash-page-sub">Welcome back, {profile?.full_name || 'User'}! Here's your career progress.</p>
            </div>
            <div className="dash-topbar-right">
              <button onClick={handleLogout} className="btn-topbar-logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>

          <div id="dash-content-area">
            {activeSection === 'overview' && (
              <div>
                <div className="dash-stats">
                  <div className="dash-stat-card">
                    <div className="ds-icon"><Target size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.jobs_applied || 0}</div>
                    <div className="ds-lbl">Jobs Applied</div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="ds-icon"><MessageSquare size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.conversations_count || 0}</div>
                    <div className="ds-lbl">AI Conversations</div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="ds-icon"><Map size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.active_roadmaps || 0}</div>
                    <div className="ds-lbl">Active Roadmaps</div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="ds-icon"><TrendingUp size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.profile_score || 0}%</div>
                    <div className="ds-lbl">Profile Complete</div>
                  </div>
                </div>

                <div className="section-inner">
                  <div className="section-head">
                    <div className="section-label">Recent Activity</div>
                    <h2 className="section-title">Your Progress</h2>
                  </div>
                  {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                      {stats.recent_activity.map((activity: any, idx: number) => (
                        <div key={idx} style={{ padding: '12px 0', borderBottom: idx < stats.recent_activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{activity.title}</div>
                          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            {activity.type} • {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p>Complete your profile to get personalized career recommendations!</p>
                      <Link href="/onboarding" style={{ color: 'var(--accent)', marginTop: '16px', display: 'inline-block' }}>Complete Profile →</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'jobs' && (
              <div className="section-inner">
                <div className="section-head">
                  <div className="section-label">Job Search</div>
                  <h2 className="section-title">Find Your Next Opportunity</h2>
                </div>
                <form onSubmit={searchJobs} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Job title, keywords..."
                      value={jobSearch.query}
                      onChange={(e) => setJobSearch({ ...jobSearch, query: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && searchJobs(e)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={jobSearch.location}
                      onChange={(e) => setJobSearch({ ...jobSearch, location: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && searchJobs(e)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    />
                    <button type="submit" disabled={loadingJobs} style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loadingJobs ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loadingJobs ? 0.6 : 1 }}>
                      {loadingJobs ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      Search
                    </button>
                  </div>
                </form>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {loadingJobs ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                      <p>Searching for jobs...</p>
                    </div>
                  ) : jobs.length > 0 ? jobs.map((job) => (
                    <div key={job.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                      <h3 style={{ marginBottom: '8px' }}>{job.title}</h3>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{job.company} • {job.location}</div>
                      <p style={{ marginBottom: '16px', fontSize: '14px' }}>{job.description?.substring(0, 200)}...</p>
                      {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>View Job →</a>}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      {jobSearch.query || jobSearch.location ? (
                        <p>No jobs found. Try different search terms.</p>
                      ) : (
                        <p>Enter search terms and click Search to find jobs</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'ai-chat' && (
              <div className="section-inner">
                {activeConversationId ? (
                  <ChatInterface 
                    conversationId={activeConversationId} 
                    onBack={() => setActiveConversationId(null)} 
                  />
                ) : (
                  <>
                    <div className="section-head">
                      <div className="section-label">AI Assistant</div>
                      <h2 className="section-title">Career Guidance Chat</h2>
                      <button onClick={createNewConversation} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> New Chat
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {conversations.length > 0 ? conversations.map((conv) => (
                        <div 
                          key={conv.id} 
                          onClick={() => setActiveConversationId(conv.id)}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <h3 style={{ marginBottom: '8px' }}>{conv.title}</h3>
                          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            {new Date(conv.updated_at).toLocaleDateString()} • {conv.token_count || 0} tokens
                          </div>
                        </div>
                      )) : (
                        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                          <p>No conversations yet. Start a new chat to get AI-powered career guidance!</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === 'roadmaps' && (
              <div className="section-inner">
                <div className="section-head">
                  <div className="section-label">Career Roadmaps</div>
                  <h2 className="section-title">Your Learning Path</h2>
                  <button onClick={() => setShowRoadmapForm(!showRoadmapForm)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Create Roadmap
                  </button>
                </div>

                {showRoadmapForm && (
                  <form onSubmit={createRoadmap} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Create New Roadmap</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Roadmap Title</label>
                        <input
                          type="text"
                          value={roadmapForm.title}
                          onChange={(e) => setRoadmapForm({...roadmapForm, title: e.target.value})}
                          placeholder="e.g., Path to Senior Developer"
                          required
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Target Role</label>
                        <input
                          type="text"
                          value={roadmapForm.targetRole}
                          onChange={(e) => setRoadmapForm({...roadmapForm, targetRole: e.target.value})}
                          placeholder="e.g., Senior Software Engineer"
                          required
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Description</label>
                        <textarea
                          value={roadmapForm.description}
                          onChange={(e) => setRoadmapForm({...roadmapForm, description: e.target.value})}
                          placeholder="Describe your goals and what you want to achieve..."
                          rows={3}
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', resize: 'vertical' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" disabled={loadingRoadmap} style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loadingRoadmap ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {loadingRoadmap ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                          Generate Roadmap
                        </button>
                        <button type="button" onClick={() => setShowRoadmapForm(false)} style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--border)', color: 'var(--text)', border: 'none', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div style={{ display: 'grid', gap: '16px' }}>
                  {roadmaps.length > 0 ? roadmaps.map((roadmap) => (
                    <div key={roadmap.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                      <h3 style={{ marginBottom: '8px' }}>{roadmap.title}</h3>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Target: {roadmap.target_role}</div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ background: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ background: 'var(--accent)', height: '100%', width: `${roadmap.progress}%` }}></div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{roadmap.progress}% Complete</div>
                      </div>
                      {roadmap.description && <div style={{ fontSize: '14px', marginBottom: '12px' }}>{roadmap.description}</div>}
                      {roadmap.milestones && roadmap.milestones.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Milestones:</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {roadmap.milestones.map((milestone: any, idx: number) => (
                              <div key={idx} style={{ fontSize: '13px', padding: '8px', background: 'var(--bg)', borderRadius: '6px' }}>
                                • {milestone.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      <p>No roadmaps yet. Create one to plan your career journey!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'resume' && (
              <div className="section-inner">
                <div className="section-head">
                  <div className="section-label">Resume Management</div>
                  <h2 className="section-title">Your Resumes</h2>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '64px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Feature Under Development</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                    We're working hard to bring you AI-powered resume analysis. This feature will be available soon!
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'recommendations' && (
              <div className="section-inner">
                <div className="section-head">
                  <div className="section-label">Career Recommendations</div>
                  <h2 className="section-title">Personalized Career Paths</h2>
                  <button onClick={generateRecommendations} disabled={loadingRecommendations} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {loadingRecommendations ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Generate New
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {recommendations.length > 0 ? recommendations.map((rec) => (
                    <div key={rec.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <h3>{rec.title}</h3>
                        <div style={{ background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}>
                          {rec.match_score}% Match
                        </div>
                      </div>
                      <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>{rec.description}</p>
                      {rec.avg_salary && <div style={{ fontSize: '14px', marginBottom: '8px' }}>💰 Avg Salary: ${rec.avg_salary.toLocaleString()}</div>}
                      {rec.time_to_ready && <div style={{ fontSize: '14px', marginBottom: '8px' }}>⏱️ Time to Ready: {rec.time_to_ready}</div>}
                      {rec.growth_outlook && <div style={{ fontSize: '14px' }}>📈 Growth: {rec.growth_outlook}</div>}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      <p>No recommendations yet. Click "Generate New" to get AI-powered career suggestions!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
