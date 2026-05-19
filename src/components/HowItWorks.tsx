export default function HowItWorks() {
  return (
    <section id="how-it-works-sec" className="section" aria-labelledby="hiw-heading">
      <div className="section-inner">
        <div className="section-head center">
          <div className="section-label">Process</div>
          <h2 className="section-title" id="hiw-heading">From Sign-Up to <span className="gradient-text">Success</span></h2>
          <p className="section-sub">Five simple steps to unlock your personalized career journey.</p>
        </div>
        <div className="steps-row" role="list">
          <div className="step-item fade-in" role="listitem">
            <div className="step-num step-active" aria-label="Step 1">01</div>
            <h3>Create Account</h3>
            <p>Sign up free in under a minute. No credit card needed.</p>
          </div>
          <div className="step-connector" aria-hidden="true">→</div>
          <div className="step-item fade-in" role="listitem">
            <div className="step-num step-active" aria-label="Step 2">02</div>
            <h3>Choose Your Role</h3>
            <p>Tell us if you're a student or job seeker. We tailor everything.</p>
          </div>
          <div className="step-connector" aria-hidden="true">→</div>
          <div className="step-item fade-in" role="listitem">
            <div className="step-num step-active" aria-label="Step 3">03</div>
            <h3>Build Profile</h3>
            <p>Fill in your skills, goals, and experience for precise matching.</p>
          </div>
          <div className="step-connector" aria-hidden="true">→</div>
          <div className="step-item fade-in" role="listitem">
            <div className="step-num step-active" aria-label="Step 4">04</div>
            <h3>Get AI Guidance</h3>
            <p>Your personalized dashboard with career suggestions goes live instantly.</p>
          </div>
          <div className="step-connector" aria-hidden="true">→</div>
          <div className="step-item fade-in" role="listitem">
            <div className="step-num step-active" aria-label="Step 5">05</div>
            <h3>Track Progress</h3>
            <p>Monitor skills, applications, and growth — all in one dashboard.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
