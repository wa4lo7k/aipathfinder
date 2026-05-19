import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="main-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="nav-logo footer-logo">Pathfinder<span>AI</span></div>
          <p className="footer-tagline">Guiding careers with the power of artificial intelligence. Your next step starts here.</p>
          <div className="footer-social">
            <a href="mailto:maroofabbx@gmail.com" className="social-link" title="Email us" aria-label="Email us">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
        </div>
        <div className="footer-links-group">
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><Link href="#features-sec">Features</Link></li>
              <li><Link href="#how-it-works-sec">How It Works</Link></li>
              <li><Link href="#reasons-sec">Why Us</Link></li>
              <li><Link href="/dashboard">Get Started</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>For You</h4>
            <ul>
              <li><Link href="/dashboard">Students</Link></li>
              <li><Link href="/dashboard">Job Seekers</Link></li>
              <li><Link href="#features-sec">Career Paths</Link></li>
              <li><Link href="/dashboard">AI Assistant</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:maroofabbx@gmail.com">maroofabbx@gmail.com</a></li>
              <li><span className="footer-muted">Support available</span></li>
              <li><span className="footer-muted">Mon–Fri, 9am–6pm</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 Pathfinder-AI. All rights reserved.</p>
        <p className="footer-dev">Crafted by <strong>Maroof Abbas &amp; Umair</strong></p>
      </div>
    </footer>
  )
}
