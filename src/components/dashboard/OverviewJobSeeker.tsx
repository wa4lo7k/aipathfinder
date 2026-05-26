'use client'

import { Briefcase, Map, MessageSquare, TrendingUp, Search, FileText, Bot, Clock, Award, PieChart, Target, Zap, Upload } from 'lucide-react'

interface JobSeekerOverviewProps {
  stats: any
  profile: any
  roadmaps: any[]
  jobs: any[]
  conversations: any[]
  recommendations: any[]
  loadingRecommendations: boolean
  onSectionChange: (section: string) => void
  onGenerateRecommendations: () => void
  onStartChat: () => void
  onSearchJobs: () => void
}

function RadialProgress({ value, size = 140, strokeWidth = 10, label, color = 'var(--accent2)' }: { value: number; size?: number; strokeWidth?: number; label: string; color?: string }) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="chart-radial-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radialGradJob" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent2)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#radialGradJob)" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text)"
          fontSize={size * 0.22} fontWeight={800} fontFamily="var(--font-heading, sans-serif)">
          {value}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="var(--text-muted)"
          fontSize={size * 0.09} fontWeight={500}>
          {label}
        </text>
      </svg>
    </div>
  )
}

function Timeline({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) return null
  const recent = activities.slice(0, 5)
  return (
    <div className="chart-timeline">
      {recent.map((a, i) => (
        <div key={i} className="chart-timeline-node">
          <div className="chart-timeline-dot" style={{
            background: a.type === 'conversation' ? 'var(--accent4)' : a.type === 'roadmap_created' ? 'var(--accent3)' : a.type === 'job_applied' ? 'var(--accent2)' : 'var(--accent)',
          }} />
          <div className="chart-timeline-content">
            <div className="chart-timeline-title">{a.title}</div>
            <div className="chart-timeline-meta">
              {a.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              {a.created_at && ` • ${new Date(a.created_at).toLocaleDateString()}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function JobMatchChart({ recommendations }: { recommendations: any[] }) {
  if (!recommendations || recommendations.length === 0) return null
  const top = recommendations.slice(0, 5)
  return (
    <div className="chart-bar-vertical">
      {top.map((r, i) => (
        <div key={i} className="chart-bar-item">
          <div className="chart-bar-label">{r.title.length > 18 ? r.title.slice(0, 18) + '…' : r.title}</div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{
              width: `${r.match_score || 0}%`,
              background: `linear-gradient(90deg, var(--accent2), var(--accent))`,
              transitionDelay: `${i * 0.08}s`,
            }} />
          </div>
          <div className="chart-bar-value">{r.match_score || 0}%</div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <div className="dash-stat-card-modern" style={{ borderLeftColor: color }}>
      <div className="dash-stat-card-modern-icon" style={{ background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <div className="dash-stat-card-modern-val">{value}</div>
      <div className="dash-stat-card-modern-lbl">{label}</div>
    </div>
  )
}

export default function OverviewJobSeeker({
  stats, profile, roadmaps, jobs, conversations, recommendations,
  loadingRecommendations, onSectionChange, onGenerateRecommendations, onStartChat, onSearchJobs,
}: JobSeekerOverviewProps) {
  const profileScore = stats?.profile_score || 0

  return (
    <div className="dash-overview-modern">
      <div className="dash-overview-top">
        <div className="dash-greeting-card dash-greeting-card-job">
          <div className="dash-greeting-shimmer" />
          <h2 className="dash-greeting-title">
            Welcome back, <span className="dash-greeting-name">{profile?.first_name || 'Professional'}</span>
          </h2>
          <p className="dash-greeting-sub">
            {jobs.length > 0
              ? `We found ${jobs.length} matching opportunities for you.`
              : 'Ready to find your next opportunity?'}
          </p>
          <div className="dash-greeting-stats">
            <div className="dash-greeting-stat">
              <span className="dash-greeting-stat-val">{stats?.jobs_applied || 0}</span>
              <span className="dash-greeting-stat-lbl">Applied</span>
            </div>
            <div className="dash-greeting-stat">
              <span className="dash-greeting-stat-val">{jobs.length}</span>
              <span className="dash-greeting-stat-lbl">Jobs Found</span>
            </div>
            <div className="dash-greeting-stat">
              <span className="dash-greeting-stat-val">{conversations.length}</span>
              <span className="dash-greeting-stat-lbl">AI Sessions</span>
            </div>
          </div>
        </div>

        <div className="dash-profile-score-card">
          <RadialProgress value={profileScore} size={160} label="Profile Score" color="var(--accent2)" />
          <div className="dash-profile-score-actions">
            <button className="dash-ghost-btn" onClick={onSearchJobs}>
              <Search size={14} /> Search Jobs
            </button>
            <button className="dash-ghost-btn" onClick={onStartChat}>
              <Bot size={14} /> AI Coach
            </button>
          </div>
        </div>
      </div>

      <div className="dash-stat-row">
        <StatCard icon={Briefcase} value={jobs.length} label="Jobs Found" color="var(--accent4)" />
        <StatCard icon={Target} value={stats?.jobs_applied || 0} label="Jobs Applied" color="var(--accent2)" />
        <StatCard icon={Map} value={roadmaps.length} label="Roadmaps" color="var(--accent3)" />
        <StatCard icon={MessageSquare} value={conversations.length} label="AI Sessions" color="var(--accent)" />
      </div>

      <div className="dash-insight-grid">
        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <Target size={18} />
            <h3>Career Match Scores</h3>
          </div>
          <div className="dash-insight-body">
            {recommendations.length > 0 ? (
              <JobMatchChart recommendations={recommendations} />
            ) : (
              <div className="dash-insight-empty">
                <PieChart size={32} strokeWidth={1.5} />
                <p>Generate career matches</p>
                <button className="dash-action-btn-sm" onClick={onGenerateRecommendations} disabled={loadingRecommendations}>
                  <Zap size={14} /> Generate
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <Award size={18} />
            <h3>Skills & Experience</h3>
          </div>
          <div className="dash-insight-body">
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="dash-skills-compact">
                {profile.skills.slice(0, 12).map((s: string, i: number) => (
                  <span key={i} className="dash-skill-chip">{s}</span>
                ))}
                {profile.skills.length > 12 && (
                  <span className="dash-skill-chip dash-skill-chip-more">+{profile.skills.length - 12}</span>
                )}
              </div>
            ) : (
              <div className="dash-insight-empty">
                <Award size={32} strokeWidth={1.5} />
                <p>No skills listed</p>
                <button className="dash-ghost-btn" onClick={() => onSectionChange('roadmaps')}>
                  <Upload size={14} /> Update Profile
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <Briefcase size={18} />
            <h3>Recent Jobs</h3>
          </div>
          <div className="dash-insight-body">
            {jobs.length > 0 ? (
              <div className="dash-jobs-mini">
                {jobs.slice(0, 4).map((job: any) => (
                  <div key={job.id} className="dash-job-mini-item">
                    <div className="dash-job-mini-title">{job.title}</div>
                    <div className="dash-job-mini-meta">{job.company} • {job.location}</div>
                  </div>
                ))}
                {jobs.length > 4 && (
                  <button className="dash-ghost-btn" onClick={onSearchJobs} style={{ marginTop: 8 }}>
                    View all {jobs.length} jobs →
                  </button>
                )}
              </div>
            ) : (
              <div className="dash-insight-empty">
                <Search size={32} strokeWidth={1.5} />
                <p>Search for matching jobs</p>
                <button className="dash-action-btn-sm" onClick={onSearchJobs}>
                  <Search size={14} /> Search Now
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <Clock size={18} />
            <h3>Recent Activity</h3>
          </div>
          <div className="dash-insight-body">
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <Timeline activities={stats.recent_activity} />
            ) : (
              <div className="dash-insight-empty">
                <Clock size={32} strokeWidth={1.5} />
                <p>No activity yet</p>
                <button className="dash-ghost-btn" onClick={onStartChat}>
                  <MessageSquare size={14} /> Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-quick-actions">
        <button className="dash-quick-action-btn" onClick={onSearchJobs}>
          <Search size={18} />
          <span>Smart Job Search</span>
        </button>
        <button className="dash-quick-action-btn" onClick={() => onSectionChange('resume')}>
          <FileText size={18} />
          <span>Resume Builder</span>
        </button>
        <button className="dash-quick-action-btn" onClick={onStartChat}>
          <Bot size={18} />
          <span>Interview Prep</span>
        </button>
        <button className="dash-quick-action-btn" onClick={() => onSectionChange('roadmaps')}>
          <Map size={18} />
          <span>Roadmaps</span>
        </button>
      </div>
    </div>
  )
}
