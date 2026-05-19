import { Bot, Target, TrendingUp, GraduationCap, Map, LayoutDashboard, Link, Globe, FileText, Sparkles } from 'lucide-react'

export default function Features() {
  const features = [
    { 
      icon: Bot, 
      title: 'AI Career Assistant', 
      desc: 'Chat with a real AI that understands your goals and gives actionable career advice — powered by Claude.',
      color: 'icon-purple'
    },
    { 
      icon: Target, 
      title: 'Smart Job Matching', 
      desc: 'AI-powered job recommendations calibrated to your skills, experience level, and desired role.',
      color: 'icon-pink'
    },
    { 
      icon: TrendingUp, 
      title: 'Skill Tracking', 
      desc: 'Visualize your skill progression and get smart recommendations on what to learn next.',
      color: 'icon-green'
    },
    { 
      icon: GraduationCap, 
      title: 'University Finder', 
      desc: 'Discover local and global universities and degree programs that align with your career goals.',
      color: 'icon-blue'
    },
    { 
      icon: Map, 
      title: 'Career Roadmaps', 
      desc: 'Step-by-step personalized roadmaps from where you are to where you want to be.',
      color: 'icon-orange'
    },
    { 
      icon: LayoutDashboard, 
      title: 'Progress Dashboard', 
      desc: 'One beautiful dashboard to track everything — applications, skills, career progress, and goals.',
      color: 'icon-teal'
    },
    { 
      icon: Link, 
      title: 'LinkedIn Integration', 
      desc: 'Browse curated LinkedIn job listings matched to your profile without leaving the platform.',
      color: 'icon-purple'
    },
    { 
      icon: Globe, 
      title: 'Remote Jobs', 
      desc: 'Discover remote work opportunities from top global companies matched to your skill set.',
      color: 'icon-pink'
    },
    { 
      icon: FileText, 
      title: 'Resume Analyzer', 
      desc: 'Upload your CV and get AI-powered feedback with specific improvement suggestions instantly.',
      color: 'icon-green'
    },
    { 
      icon: Sparkles, 
      title: 'Future Skills', 
      desc: 'Discover which skills will be most in-demand in your field over the next 5 years.',
      color: 'icon-blue'
    },
  ]

  return (
    <section id="features-sec" className="section bg-surface2" aria-labelledby="features-heading">
      <div className="section-inner">
        <div className="section-head center">
          <div className="section-label">Features</div>
          <h2 className="section-title" id="features-heading">Everything You <span className="gradient-text">Need</span></h2>
          <p className="section-sub">A complete AI-powered toolkit for students and professionals.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="feature-card fade-in">
                <div className={`feature-icon-wrap ${feature.color}`}>
                  <IconComponent size={24} strokeWidth={2} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
