'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bot, Map, FileText, TrendingUp, Target, MessageSquare, Pencil, Search, Plus, Upload, GraduationCap, Compass, BookOpen, Zap } from 'lucide-react'
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

  const isStudent = profile?.role === 'student'
  const isJobSeeker = profile?.role === 'jobseeker'

  const navItems = useMemo(() => {
    const items = [
      { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    ]
    if (isJobSeeker) {
      items.push({ id: 'jobs', icon: Briefcase, label: 'Jobs' })
    }
    items.push(
      { id: 'ai-chat', icon: Bot, label: 'AI Assistant' },
      { id: 'roadmaps', icon: Map, label: 'Roadmaps' },
      { id: 'resume', icon: FileText, label: 'Resume' },
    )
    if (isStudent) {
      items.push({ id: 'recommendations', icon: Target, label: 'Career Paths' })
    }
    if (isJobSeeker) {
      items.push({ id: 'recommendations', icon: Target, label: 'Career Paths' })
    }
    return items
  }, [isStudent, isJobSeeker])

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

      // Fetch profile and check onboarding completion
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        const prof = profileData.data
        setProfile(prof)

        // Redirect to onboarding if profile is incomplete
        if (!prof?.role || !prof?.first_name) {
          router.push('/onboarding')
          return
        }
      } else {
        // Can't fetch profile — redirect to onboarding
        router.push('/onboarding')
        return
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
      <div className="dash-full-loader">
        <div className="dot-flashing"><span></span><span></span><span></span></div>
      </div>
    )
  }

  return (
    <div id="page-dashboard" className="page active">
      <button 
        className={`hamburger sidebar-hamburger ${sidebarOpen ? 'open' : ''}`}
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
                  onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
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
              <p className="dash-page-sub">
                Welcome back, {profile?.full_name || 'User'}! 
                {isStudent ? "Let's explore your career path." : "Here's your job search progress."}
              </p>
            </div>
            <div className="dash-topbar-right">
              <button onClick={handleLogout} className="btn-topbar-logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>

          <div id="dash-content-area">
            {activeSection === 'overview' && isStudent && (
              <div>
                <div className="dash-stats">
                  <div className="dash-stat-card card-accent-purple">
                    <div className="ds-icon"><GraduationCap size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{recommendations.length}</div>
                    <div className="ds-lbl">Career Paths Found</div>
                  </div>
                  <div className="dash-stat-card card-accent-blue">
                    <div className="ds-icon"><MessageSquare size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.conversations_count || 0}</div>
                    <div className="ds-lbl">AI Sessions</div>
                  </div>
                  <div className="dash-stat-card card-accent-green">
                    <div className="ds-icon"><Map size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.active_roadmaps || 0}</div>
                    <div className="ds-lbl">Learning Roadmaps</div>
                  </div>
                  <div className="dash-stat-card card-accent-pink">
                    <div className="ds-icon"><TrendingUp size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.profile_score || 0}%</div>
                    <div className="ds-lbl">Profile Score</div>
                  </div>
                </div>

                <div className="dash-overview-grid">
                  <div className="dash-card dash-card-featured">
                    <div className="dash-card-featured-header">
                      <Compass size={20} />
                      <h3>Explore Career Paths</h3>
                    </div>
                    <p className="dash-card-desc">Discover careers that align with your interests, skills, and academic background.</p>
                    <button onClick={() => { setActiveSection('recommendations'); generateRecommendations(); }} className="dash-action-btn" disabled={loadingRecommendations}>
                      {loadingRecommendations ? <span className="dot-flashing-sm"><span></span><span></span><span></span></span> : <><Zap size={16} /> Get AI Recommendations</>}
                    </button>
                  </div>
                  <div className="dash-card dash-card-featured">
                    <div className="dash-card-featured-header">
                      <BookOpen size={20} />
                      <h3>Learning Roadmaps</h3>
                    </div>
                    <p className="dash-card-desc">Build a structured learning path for your dream career with AI-generated milestones.</p>
                    <button onClick={() => setActiveSection('roadmaps')} className="dash-action-btn">
                      <Map size={16} /> View Roadmaps
                    </button>
                  </div>
                  <div className="dash-card dash-card-featured">
                    <div className="dash-card-featured-header">
                      <Bot size={20} />
                      <h3>AI Career Coach</h3>
                    </div>
                    <p className="dash-card-desc">Chat with your personal AI assistant about degrees, universities, and career options.</p>
                    <button onClick={() => { setActiveSection('ai-chat'); createNewConversation(); }} className="dash-action-btn">
                      <MessageSquare size={16} /> Start Chat
                    </button>
                  </div>
                </div>

                <div className="section-inner" style={{ marginTop: '28px' }}>
                  <div className="section-head">
                    <div className="section-label">Recent Activity</div>
                    <h2 className="section-title">Your Progress</h2>
                  </div>
                  {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                    <div className="dash-card">
                      {stats.recent_activity.map((activity: any, idx: number) => (
                        <div key={idx} className="dash-activity-item" style={{ borderBottom: idx < stats.recent_activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="dash-activity-title">{activity.title}</div>
                          <div className="dash-activity-meta">
                            {activity.type} • {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dash-empty-state">
                      <p>Start exploring to see your activity here!</p>
                      <button onClick={() => setActiveSection('recommendations')} className="dash-empty-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Explore Career Paths →</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'overview' && isJobSeeker && (
              <div>
                <div className="dash-stats">
                  <div className="dash-stat-card card-accent-pink">
                    <div className="ds-icon"><Target size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.jobs_applied || 0}</div>
                    <div className="ds-lbl">Jobs Applied</div>
                  </div>
                  <div className="dash-stat-card card-accent-blue">
                    <div className="ds-icon"><Briefcase size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{jobs.length}</div>
                    <div className="ds-lbl">Jobs Found</div>
                  </div>
                  <div className="dash-stat-card card-accent-purple">
                    <div className="ds-icon"><MessageSquare size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.conversations_count || 0}</div>
                    <div className="ds-lbl">AI Sessions</div>
                  </div>
                  <div className="dash-stat-card card-accent-green">
                    <div className="ds-icon"><TrendingUp size={22} strokeWidth={2} /></div>
                    <div className="ds-val purple">{stats?.profile_score || 0}%</div>
                    <div className="ds-lbl">Profile Score</div>
                  </div>
                </div>

                <div className="dash-overview-grid">
                  <div className="dash-card dash-card-featured">
                    <div className="dash-card-featured-header">
                      <Search size={20} />
                      <h3>Smart Job Search</h3>
                    </div>
                    <p className="dash-card-desc">Find matching opportunities using AI-powered search across top job platforms.</p>
                    <button onClick={() => { setActiveSection('jobs'); searchJobs(); }} className="dash-action-btn">
                      <Briefcase size={16} /> Search Jobs
                    </button>
                  </div>
                  <div className="dash-card dash-card-featured">
                    <div className="dash-card-featured-header">
                      <FileText size={20} />
                      <h3>Resume Builder</h3>
                    </div>
                    <p className="dash-card-desc">Upload and analyze your resume with AI to maximize your application success.</p>
                    <button onClick={() => setActiveSection('resume')} className="dash-action-btn">
                      <Upload size={16} /> Manage Resume
                    </button>
                  </div>
                  <div className="dash-card dash-card-featured">
                    <div className="dash-card-featured-header">
                      <Bot size={20} />
                      <h3>Interview Prep</h3>
                    </div>
                    <p className="dash-card-desc">Practice interviews and get coaching from your AI career assistant.</p>
                    <button onClick={() => { setActiveSection('ai-chat'); createNewConversation(); }} className="dash-action-btn">
                      <MessageSquare size={16} /> Start Chat
                    </button>
                  </div>
                </div>

                <div className="section-inner" style={{ marginTop: '28px' }}>
                  <div className="section-head">
                    <div className="section-label">Recent Activity</div>
                    <h2 className="section-title">Job Search Progress</h2>
                  </div>
                  {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                    <div className="dash-card">
                      {stats.recent_activity.map((activity: any, idx: number) => (
                        <div key={idx} className="dash-activity-item" style={{ borderBottom: idx < stats.recent_activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="dash-activity-title">{activity.title}</div>
                          <div className="dash-activity-meta">
                            {activity.type} • {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dash-empty-state">
                      <p>Start your job search to track your progress here!</p>
                      <button onClick={() => setActiveSection('jobs')} className="dash-empty-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Search Jobs →</button>
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
                <form onSubmit={searchJobs} className="dash-card" style={{ marginBottom: '24px' }}>
                  <div className="dash-search-row">
                    <input
                      type="text"
                      placeholder="Job title, keywords..."
                      value={jobSearch.query}
                      onChange={(e) => setJobSearch({ ...jobSearch, query: e.target.value })}
                      className="dash-input"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={jobSearch.location}
                      onChange={(e) => setJobSearch({ ...jobSearch, location: e.target.value })}
                      className="dash-input"
                    />
                    <button type="submit" disabled={loadingJobs} className="dash-search-btn">
                      {loadingJobs ? <span className="dot-flashing-sm"><span></span><span></span><span></span></span> : <Search size={18} />}
                      Search
                    </button>
                  </div>
                </form>
                <div className="dash-grid-list">
                  {loadingJobs ? (
                    <div className="dash-empty-state">
                      <div className="dot-flashing" style={{ margin: '0 auto 16px' }}><span></span><span></span><span></span></div>
                      <p>Searching for jobs...</p>
                    </div>
                  ) : jobs.length > 0 ? jobs.map((job) => (
                    <div key={job.id} className="dash-card">
                      <h3 className="dash-card-title">{job.title}</h3>
                      <div className="dash-card-meta">{job.company} • {job.location}</div>
                      <p className="dash-card-desc">{job.description?.substring(0, 200)}...</p>
                      {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="dash-card-link">View Job →</a>}
                    </div>
                  )) : (
                    <div className="dash-empty-state">
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
                      <button onClick={createNewConversation} className="dash-action-btn">
                        <Plus size={18} /> New Chat
                      </button>
                    </div>
                    <div className="dash-grid-list">
                      {conversations.length > 0 ? conversations.map((conv) => (
                        <div 
                          key={conv.id} 
                          onClick={() => setActiveConversationId(conv.id)}
                          className="dash-card dash-card-clickable"
                        >
                          <h3 className="dash-card-title">{conv.title}</h3>
                          <div className="dash-card-meta">
                            {new Date(conv.updated_at).toLocaleDateString()} • {conv.token_count || 0} tokens
                          </div>
                        </div>
                      )) : (
                        <div className="dash-empty-state">
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
                  <button onClick={() => setShowRoadmapForm(!showRoadmapForm)} className="dash-action-btn">
                    <Plus size={18} /> Create Roadmap
                  </button>
                </div>

                {showRoadmapForm && (
                  <form onSubmit={createRoadmap} className="dash-card" style={{ marginBottom: '24px' }}>
                    <h3 className="dash-card-title" style={{ marginBottom: '16px' }}>Create New Roadmap</h3>
                    <div className="dash-form-stack">
                      <div>
                        <label className="dash-form-label">Roadmap Title</label>
                        <input
                          type="text"
                          value={roadmapForm.title}
                          onChange={(e) => setRoadmapForm({...roadmapForm, title: e.target.value})}
                          placeholder="e.g., Path to Senior Developer"
                          required
                          className="dash-input dash-input-full"
                        />
                      </div>
                      <div>
                        <label className="dash-form-label">Target Role</label>
                        <input
                          type="text"
                          value={roadmapForm.targetRole}
                          onChange={(e) => setRoadmapForm({...roadmapForm, targetRole: e.target.value})}
                          placeholder="e.g., Senior Software Engineer"
                          required
                          className="dash-input dash-input-full"
                        />
                      </div>
                      <div>
                        <label className="dash-form-label">Description</label>
                        <textarea
                          value={roadmapForm.description}
                          onChange={(e) => setRoadmapForm({...roadmapForm, description: e.target.value})}
                          placeholder="Describe your goals and what you want to achieve..."
                          rows={3}
                          className="dash-textarea"
                        />
                      </div>
                      <div className="dash-form-actions">
                        <button type="submit" disabled={loadingRoadmap} className="dash-action-btn">
                          {loadingRoadmap ? <span className="dot-flashing-sm"><span></span><span></span><span></span></span> : <Plus size={18} />}
                          Generate Roadmap
                        </button>
                        <button type="button" onClick={() => setShowRoadmapForm(false)} className="dash-cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="dash-grid-list">
                  {roadmaps.length > 0 ? roadmaps.map((roadmap) => (
                    <div key={roadmap.id} className="dash-card">
                      <h3 className="dash-card-title">{roadmap.title}</h3>
                      <div className="dash-card-meta">Target: {roadmap.target_role}</div>
                      <div className="dash-progress-wrap">
                        <div className="dash-progress-track">
                          <div className="dash-progress-fill" style={{ width: `${roadmap.progress}%` }}></div>
                        </div>
                        <div className="dash-progress-label">{roadmap.progress}% Complete</div>
                      </div>
                      {roadmap.description && <p className="dash-card-desc">{roadmap.description}</p>}
                      {roadmap.milestones && roadmap.milestones.length > 0 && (
                        <div className="roadmap-timeline">
                          <h4 className="dash-milestones-title">Milestones</h4>
                          <div className="timeline-track">
                            {roadmap.milestones.map((milestone: any, idx: number) => {
                              const total = roadmap.milestones.length
                              const isCompleted = roadmap.progress > 0 && idx < Math.round((roadmap.progress / 100) * total)
                              const isCurrent = roadmap.progress > 0 && idx === Math.round((roadmap.progress / 100) * total)
                              return (
                                <div 
                                  key={idx} 
                                  className={`timeline-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                                  style={{ animationDelay: `${idx * 0.15}s` }}
                                >
                                  <div className="timeline-dot-col">
                                    <div className="timeline-dot">
                                      {isCompleted && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                      )}
                                    </div>
                                  </div>
                                  <div className="timeline-content">
                                    <div className="timeline-label">{milestone.title}</div>
                                    {milestone.description && <div className="timeline-desc">{milestone.description}</div>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="dash-empty-state">
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

                <div className="dash-empty-state" style={{ padding: '64px 32px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
                  <h3 className="dash-card-title" style={{ marginBottom: '8px' }}>Feature Under Development</h3>
                  <p>
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
                  <button onClick={generateRecommendations} disabled={loadingRecommendations} className="dash-action-btn">
                    {loadingRecommendations ? <span className="dot-flashing-sm"><span></span><span></span><span></span></span> : <Plus size={18} />}
                    Generate New
                  </button>
                </div>
                <div className="dash-grid-list">
                  {recommendations.length > 0 ? recommendations.map((rec) => (
                    <div key={rec.id} className="dash-card">
                      <div className="dash-card-header-row">
                        <h3 className="dash-card-title">{rec.title}</h3>
                        <div className="dash-match-badge">
                          {rec.match_score}% Match
                        </div>
                      </div>
                      <p className="dash-card-desc">{rec.description}</p>
                      {rec.avg_salary && <div className="dash-card-detail">💰 Avg Salary: ${rec.avg_salary.toLocaleString()}</div>}
                      {rec.time_to_ready && <div className="dash-card-detail">⏱️ Time to Ready: {rec.time_to_ready}</div>}
                      {rec.growth_outlook && <div className="dash-card-detail">📈 Growth: {rec.growth_outlook}</div>}
                    </div>
                  )) : (
                    <div className="dash-empty-state">
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
