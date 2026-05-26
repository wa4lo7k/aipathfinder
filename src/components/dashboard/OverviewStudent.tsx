'use client'

import { Compass, Map, MessageSquare, TrendingUp, BookOpen, Zap, Target, GraduationCap, Bot, Clock, Award, BarChart3 } from 'lucide-react'

interface StudentOverviewProps {
  stats: any
  profile: any
  roadmaps: any[]
  recommendations: any[]
  conversations: any[]
  loadingRecommendations: boolean
  onSectionChange: (section: string) => void
  onGenerateRecommendations: () => void
  onStartChat: () => void
}

function RadialProgress({ value, size = 140, strokeWidth = 10, label }: { value: number; size?: number; strokeWidth?: number; label: string }) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="chart-radial-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent2)" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#radialGrad)" strokeWidth={strokeWidth}
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

function BarChart({ items, color = 'var(--accent)' }: { items: { label: string; value: number; max: number }[]; color?: string }) {
  if (items.length === 0) return null
  return (
    <div className="chart-bar-vertical">
      {items.map((item, i) => (
        <div key={i} className="chart-bar-item">
          <div className="chart-bar-label">{item.label}</div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{
              width: `${(item.value / item.max) * 100}%`,
              background: color,
              transitionDelay: `${i * 0.08}s`,
            }} />
          </div>
          <div className="chart-bar-value">{item.value}%</div>
        </div>
      ))}
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

function RadarSkills({ skills }: { skills: string[] }) {
  if (!skills || skills.length === 0) return null
  const display = skills.slice(0, 8)
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 80
  const angleStep = (2 * Math.PI) / display.length

  const points = display.map((_, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="chart-radar-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map(mult => (
          <polygon key={mult} points={points.map(p => {
            const px = cx + (p.x - cx) * mult
            const py = cy + (p.y - cy) * mult
            return `${px},${py}`
          }).join(' ')} fill="none" stroke="var(--border)" strokeWidth={1} />
        ))}
        {points.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />
        ))}
        <polygon points={polygonPoints} fill="rgba(120,110,255,0.12)" stroke="var(--accent)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
        ))}
        {display.map((skill, i) => {
          const labelAngle = -Math.PI / 2 + i * angleStep
          const lr = r + 22
          const lx = cx + lr * Math.cos(labelAngle)
          const ly = cy + lr * Math.sin(labelAngle)
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fill="var(--text-muted)" fontSize={10} fontWeight={500}>
              {skill.length > 10 ? skill.slice(0, 10) + '…' : skill}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function ActivityHeatmap({ stats }: { stats: any }) {
  const activityTypes = [
    { label: 'AI Sessions', value: stats?.conversations_count || 0, icon: '💬' },
    { label: 'Roadmaps', value: stats?.active_roadmaps || 0, icon: '🗺️' },
    { label: 'Recommendations', value: 0, icon: '🎯' },
  ]
  const maxVal = Math.max(...activityTypes.map(a => a.value), 1)
  return (
    <div className="chart-heat-compact">
      {activityTypes.map((a, i) => (
        <div key={i} className="chart-heat-item">
          <div className="chart-heat-icon">{a.icon}</div>
          <div className="chart-heat-track">
            <div className="chart-heat-fill" style={{
              height: `${(a.value / maxVal) * 100}%`,
              background: i === 0 ? 'var(--accent4)' : i === 1 ? 'var(--accent3)' : 'var(--accent)',
              transitionDelay: `${i * 0.1}s`,
            }} />
          </div>
          <div className="chart-heat-label">{a.label}</div>
          <div className="chart-heat-value">{a.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function OverviewStudent({
  stats, profile, roadmaps, recommendations, conversations,
  loadingRecommendations, onSectionChange, onGenerateRecommendations, onStartChat,
}: StudentOverviewProps) {
  const profileScore = stats?.profile_score || 0
  const topRoadmaps = roadmaps.slice(0, 3)
  const skills = profile?.skills || []

  return (
    <div className="dash-overview-modern">
      <div className="dash-overview-top">
        <div className="dash-greeting-card">
          <div className="dash-greeting-shimmer" />
          <h2 className="dash-greeting-title">
            Welcome back, <span className="dash-greeting-name">{profile?.first_name || 'Explorer'}</span>
          </h2>
          <p className="dash-greeting-sub">
            {recommendations.length > 0
              ? `You have ${recommendations.length} personalized career paths waiting.`
              : 'Let\'s discover your ideal career path today.'}
          </p>
          <div className="dash-greeting-stats">
            <div className="dash-greeting-stat">
              <span className="dash-greeting-stat-val">{recommendations.length}</span>
              <span className="dash-greeting-stat-lbl">Career Paths</span>
            </div>
            <div className="dash-greeting-stat">
              <span className="dash-greeting-stat-val">{roadmaps.length}</span>
              <span className="dash-greeting-stat-lbl">Roadmaps</span>
            </div>
            <div className="dash-greeting-stat">
              <span className="dash-greeting-stat-val">{conversations.length}</span>
              <span className="dash-greeting-stat-lbl">AI Sessions</span>
            </div>
          </div>
        </div>

        <div className="dash-profile-score-card">
          <RadialProgress value={profileScore} size={160} label="Profile Score" />
          <div className="dash-profile-score-actions">
            <button className="dash-ghost-btn" onClick={() => onSectionChange('roadmaps')}>
              <Map size={14} /> View Roadmaps
            </button>
            <button className="dash-ghost-btn" onClick={onStartChat}>
              <Bot size={14} /> AI Coach
            </button>
          </div>
        </div>
      </div>

      <div className="dash-insight-grid">
        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <GraduationCap size={18} />
            <h3>Career Recommendations</h3>
          </div>
          <div className="dash-insight-body">
            {recommendations.length > 0 ? (
              <BarChart items={recommendations.slice(0, 5).map((r: any) => ({
                label: r.title.length > 20 ? r.title.slice(0, 20) + '…' : r.title,
                value: r.match_score || 0,
                max: 100,
              }))} color="var(--accent)" />
            ) : (
              <div className="dash-insight-empty">
                <Target size={32} strokeWidth={1.5} />
                <p>No recommendations yet</p>
                <button className="dash-action-btn-sm" onClick={onGenerateRecommendations} disabled={loadingRecommendations}>
                  <Zap size={14} /> Generate Now
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <BarChart3 size={18} />
            <h3>Activity Overview</h3>
          </div>
          <div className="dash-insight-body">
            <ActivityHeatmap stats={stats} />
          </div>
        </div>

        <div className="dash-insight-card">
          <div className="dash-insight-header">
            <Award size={18} />
            <h3>Your Skills</h3>
          </div>
          <div className="dash-insight-body">
            {skills.length > 0 ? (
              <RadarSkills skills={skills} />
            ) : (
              <div className="dash-insight-empty">
                <Award size={32} strokeWidth={1.5} />
                <p>No skills added yet</p>
                <button className="dash-ghost-btn" onClick={() => onSectionChange('roadmaps')}>
                  <BookOpen size={14} /> Start Learning
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
                  <MessageSquare size={14} /> Start Exploring
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-roadmap-mini">
        <div className="dash-insight-header">
          <Map size={18} />
          <h3>Learning Roadmaps</h3>
          <button className="dash-ghost-btn" onClick={() => onSectionChange('roadmaps')}>View All →</button>
        </div>
        {topRoadmaps.length > 0 ? (
          <div className="dash-roadmap-mini-grid">
            {topRoadmaps.map((rm: any) => (
              <div key={rm.id} className="dash-roadmap-mini-card" onClick={() => onSectionChange('roadmaps')}>
                <div className="dash-roadmap-mini-top">
                  <span className="dash-roadmap-mini-title">{rm.title}</span>
                  <span className="dash-roadmap-mini-target">{rm.target_role}</span>
                </div>
                <div className="dash-roadmap-mini-progress">
                  <div className="dash-roadmap-mini-track">
                    <div className="dash-roadmap-mini-fill" style={{ width: `${rm.progress || 0}%` }} />
                  </div>
                  <span className="dash-roadmap-mini-pct">{rm.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-insight-empty" style={{ padding: '24px' }}>
            <Map size={32} strokeWidth={1.5} />
            <p>No roadmaps yet. Create one to start learning!</p>
            <button className="dash-action-btn-sm" onClick={() => onSectionChange('roadmaps')}>
              <BookOpen size={14} /> Create Roadmap
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
