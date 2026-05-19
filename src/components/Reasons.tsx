import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react'

export default function Reasons() {
  return (
    <section id="reasons-sec" className="section bg-surface2" aria-labelledby="reasons-heading">
      <div className="section-inner">
        <div className="section-head center">
          <div className="section-label">The Problem</div>
          <h2 className="section-title" id="reasons-heading">You Deserve Better <span className="gradient-text">Guidance</span></h2>
          <p className="section-sub">Most career tools are outdated, generic, or overwhelming. Pathfinder-AI was built to fix that.</p>
        </div>
        <div className="reasons-grid">
          <div className="reason-card reason-student fade-in">
            <div className="reason-tag tag-student">
              <GraduationCap size={16} strokeWidth={2.5} />
              <span>Students</span>
            </div>
            <h3>Lost in a Sea of Options</h3>
            <p>With hundreds of career paths to choose from, most students feel overwhelmed. Generic advice doesn't match your unique skills and passions. Pathfinder-AI maps a personalized journey — just for you.</p>
            <ul className="reason-list">
              <li><ArrowRight size={16} className="arrow accent-arrow" aria-hidden="true" /> No clear direction after graduation</li>
              <li><ArrowRight size={16} className="arrow accent-arrow" aria-hidden="true" /> Unsure which skills to build</li>
              <li><ArrowRight size={16} className="arrow accent-arrow" aria-hidden="true" /> No mentor or career roadmap</li>
            </ul>
          </div>
          <div className="reason-card reason-jobseeker fade-in">
            <div className="reason-tag tag-jobseeker">
              <Briefcase size={16} strokeWidth={2.5} />
              <span>Job Seekers</span>
            </div>
            <h3>Applying Blind, Hoping for the Best</h3>
            <p>Sending hundreds of applications with no results is exhausting. Most job boards aren't intelligent — they don't match your actual skills. Pathfinder-AI uses smart matching so your effort finally converts.</p>
            <ul className="reason-list">
              <li><ArrowRight size={16} className="arrow pink-arrow" aria-hidden="true" /> Hundreds of apps, zero callbacks</li>
              <li><ArrowRight size={16} className="arrow pink-arrow" aria-hidden="true" /> Skills don't match job descriptions</li>
              <li><ArrowRight size={16} className="arrow pink-arrow" aria-hidden="true" /> No way to track progress</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
