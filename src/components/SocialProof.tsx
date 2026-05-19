'use client'

import { GraduationCap, Briefcase, Rocket, Bot, Link as LinkIcon, CheckCircle } from 'lucide-react'

export default function SocialProof() {
  const testimonials = [
    {
      quote: "Finally found direction. The AI matched me to UX design — something I'd never considered.",
      author: "Sarah K.",
      role: "Computer Science Student",
      icon: GraduationCap
    },
    {
      quote: "Sent 200+ applications with zero results. Pathfinder got me 3 interviews in a week.",
      author: "Marcus T.",
      role: "Job Seeker",
      icon: Briefcase
    },
    {
      quote: "Graduated feeling lost. Now I have a clear roadmap and my first job offer.",
      author: "Jamie L.",
      role: "Recent Graduate",
      icon: Rocket
    }
  ]

  return (
    <section className="social-proof-section" aria-label="Social proof">
      <div className="section-inner">
        {/* Testimonials */}
        <div className="testimonials-row">
          {testimonials.map((testimonial, index) => {
            const IconComponent = testimonial.icon
            return (
              <div key={index} className="testimonial-card fade-in">
                <div className="testimonial-avatar">
                  <IconComponent size={24} strokeWidth={2} />
                </div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <span className="author-name">{testimonial.author}</span>
                  <span className="author-role">{testimonial.role}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Logo Bar */}
        <div className="logo-bar" aria-label="Technology partners">
          <div className="logo-item">
            <Bot size={20} strokeWidth={2} />
            <span className="logo-text">Built with Claude AI</span>
          </div>
          <div className="logo-divider" aria-hidden="true"></div>
          <div className="logo-item">
            <LinkIcon size={20} strokeWidth={2} />
            <span className="logo-text">Integrated with LinkedIn</span>
          </div>
          <div className="logo-divider" aria-hidden="true"></div>
          <div className="logo-item">
            <CheckCircle size={20} strokeWidth={2} />
            <span className="logo-text">Trusted by 10,000+</span>
          </div>
        </div>
      </div>
    </section>
  )
}
