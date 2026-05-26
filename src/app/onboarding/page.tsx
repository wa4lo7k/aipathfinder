'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface OnboardingData {
  firstName: string; lastName: string; phone: string; dateOfBirth: string
  gender: string; nationality: string
  currentEducationLevel: string; fieldOfStudy: string; institutionName: string
  graduationYear: string; gpa: string
  skills: string[]; interests: string[]; preferredCareerPaths: string[]
  learningStyle: string; availabilityHours: string
  employmentStatus: string; currentJobTitle: string; currentEmployer: string; yearsOfExperience: string
  workExperiences: Array<{company:string;title:string;startDate:string;endDate:string;isCurrent:boolean;description:string;skillsUsed:string}>
  eduDegree: string; eduInstitution: string; eduField: string
  eduStartYear: string; eduEndYear: string; eduGrade: string
  jobSeekerSkills: string[]; languages: string
  desiredTitles: string; desiredIndustries: string; desiredLocations: string; remotePreference: string
  expectedSalaryMin: string; expectedSalaryMax: string; currency: string
  linkedinUrl: string; portfolioUrl: string
}

const SKILL_OPTIONS = ['JavaScript','TypeScript','Python','Java','C++','React','Node.js','SQL','Data Analysis','Machine Learning','UI/UX Design','Project Management','Cloud Computing','DevOps','Cybersecurity','Communication','Leadership','Writing','Public Speaking','Research','Critical Thinking','Problem Solving']
const INTEREST_OPTIONS = ['Web Development','Mobile Apps','AI/ML','Data Science','Cybersecurity','Cloud','DevOps','Design','Product','Entrepreneurship','Open Source','Tech Writing','Teaching','Gaming','Blockchain','IoT']
const CAREER_PATHS = [
  {title:'Software Engineering',desc:'Build applications and systems'},{title:'Data Science',desc:'Analyze data for insights'},
  {title:'Product Management',desc:'Lead product development'},{title:'UX Design',desc:'Design user experiences'},
  {title:'DevOps',desc:'Manage infrastructure and deployments'},{title:'Machine Learning',desc:'Build AI and ML systems'},
  {title:'Cybersecurity',desc:'Protect systems and data'},{title:'Cloud Architecture',desc:'Design cloud solutions'},
]
const EMPLOYMENT_STATUSES = ['employed','unemployed','freelancing','open_to_work']
const LEARNING_STYLES = ['visual','auditory','reading','kinesthetic']

const INITIAL: OnboardingData = {
  firstName:'',lastName:'',phone:'',dateOfBirth:'',gender:'',nationality:'',
  currentEducationLevel:'',fieldOfStudy:'',institutionName:'',graduationYear:'',gpa:'',
  skills:[],interests:[],preferredCareerPaths:[],
  learningStyle:'',availabilityHours:'',
  employmentStatus:'',currentJobTitle:'',currentEmployer:'',yearsOfExperience:'',
  workExperiences:[],
  eduDegree:'',eduInstitution:'',eduField:'',eduStartYear:'',eduEndYear:'',eduGrade:'',
  jobSeekerSkills:[],languages:'',
  desiredTitles:'',desiredIndustries:'',desiredLocations:'',remotePreference:'',
  expectedSalaryMin:'',expectedSalaryMax:'',currency:'USD',linkedinUrl:'',portfolioUrl:'',
}

function DateInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="form-group date-picker-wrap">
      <label>Date of Birth</label>
      <div className="date-input-container">
        <Calendar size={18} className="date-input-icon" />
        <input type="date" value={value} onChange={e => onChange(e.target.value)} className="date-picker-input" />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student'|'jobseeker'|null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) return
      const json = await res.json()
      const prof = json.data
      if (prof?.onboarding_completed) { router.push('/dashboard'); return }
      if (prof?.role) setRole(prof.role)
      if (prof?.first_name) setData(d => ({...d, firstName: prof.first_name}))
      if (prof?.last_name) setData(d => ({...d, lastName: prof.last_name}))
      if (prof?.skills) setData(d => ({...d, skills: prof.skills}))
      if (prof?.onboarding_data) setData(d => ({...d, ...prof.onboarding_data}))
    } catch (e) { console.error(e) }
  }

  const saveStep = async () => {
    try {
      await fetch('/api/profile', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          first_name: data.firstName || undefined,
          last_name: data.lastName || undefined,
          role: role || undefined,
          onboarding_step: step,
          onboarding_data: data,
          skills: data.skills.length > 0 ? data.skills : data.jobSeekerSkills.length > 0 ? data.jobSeekerSkills : undefined,
        })
      })
    } catch (e) { console.error(e) }
  }

  const totalSteps = role === 'student' ? 6 : role === 'jobseeker' ? 8 : 0

  const validate = (): boolean => {
    const e: Record<string,string> = {}
    if (role === 'student') {
      if (step === 1) { if (!data.firstName) e.firstName='Required'; if (!data.lastName) e.lastName='Required'; if (!data.dateOfBirth) e.dateOfBirth='Required'; if (!data.gender) e.gender='Required'; if (!data.nationality) e.nationality='Required' }
      if (step === 2) { if (!data.currentEducationLevel) e.currentEducationLevel='Required'; if (!data.fieldOfStudy) e.fieldOfStudy='Required'; if (!data.institutionName) e.institutionName='Required'; if (!data.graduationYear) e.graduationYear='Required' }
      if (step === 5) { if (!data.learningStyle) e.learningStyle='Required'; if (!data.availabilityHours) e.availabilityHours='Required' }
    } else {
      if (step === 1) { if (!data.firstName) e.firstName='Required'; if (!data.lastName) e.lastName='Required'; if (!data.phone) e.phone='Required'; if (!data.dateOfBirth) e.dateOfBirth='Required'; if (!data.gender) e.gender='Required'; if (!data.nationality) e.nationality='Required' }
      if (step === 2) { if (!data.employmentStatus) e.employmentStatus='Required' }
      if (step === 3) { if (data.workExperiences.length===0) e.workExperiences='At least 1 required' }
      if (step === 4) { if (!data.eduDegree) e.eduDegree='Required'; if (!data.eduInstitution) e.eduInstitution='Required' }
      if (step === 6) { if (!data.desiredTitles) e.desiredTitles='Required'; if (!data.desiredIndustries) e.desiredIndustries='Required'; if (!data.remotePreference) e.remotePreference='Required' }
      if (step === 7) { if (!data.expectedSalaryMin) e.expectedSalaryMin='Required' }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = async () => {
    if (!validate()) return
    await saveStep()
    setStep(s => s + 1)
  }

  const prev = () => { setStep(s => Math.max(1, s - 1)); setErrors({}) }

  const handleRoleSelect = async (r: 'student'|'jobseeker') => {
    setRole(r); setLoading(true)
    try {
      await fetch('/api/profile', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ role: r, onboarding_step: 1 })
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const finish = async () => {
    setLoading(true)
    try {
      await fetch('/api/profile', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          first_name: data.firstName, last_name: data.lastName, role,
          onboarding_step: totalSteps, onboarding_completed: true,
          onboarding_data: data,
          skills: data.skills.length > 0 ? data.skills : data.jobSeekerSkills.length > 0 ? data.jobSeekerSkills : undefined,
        })
      })
      router.push('/setup')
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const upd = (f: Partial<OnboardingData>) => { setData(d => ({...d, ...f})); setErrors({}) }

  const toggle = (item: string, key: 'skills'|'jobSeekerSkills'|'interests') => {
    setData(d => ({...d, [key]: d[key].includes(item) ? d[key].filter(s=>s!==item) : [...d[key], item]}))
  }
  const togglePath = (p: string) => {
    setData(d => ({...d, preferredCareerPaths: d.preferredCareerPaths.includes(p) ? d.preferredCareerPaths.filter(x=>x!==p) : d.preferredCareerPaths.length>=3 ? d.preferredCareerPaths : [...d.preferredCareerPaths, p]}))
  }

  const addExp = () => upd({ workExperiences: [...data.workExperiences, {company:'',title:'',startDate:'',endDate:'',isCurrent:false,description:'',skillsUsed:''}] })
  const updExp = (i:number,f:Partial<OnboardingData['workExperiences'][0]>) => {
    const w = [...data.workExperiences]; w[i]={...w[i],...f}; upd({workExperiences:w})
  }
  const delExp = (i:number) => upd({workExperiences:data.workExperiences.filter((_,j)=>j!==i)})

  if (!role) {
    return (
      <div id="page-onboarding" className="page active">
        <div className="auth-bg-orbs"><div className="orb orb-1"></div><div className="orb orb-2"></div></div>
        <div className="onboard-shell"><div className="onboard-box">
          <Link href="/" className="nav-logo onboard-logo">Pathfinder<span>AI</span></Link>
          <div className="onboarding-step">
            <div className="role-header">
              <div className="section-label center">Welcome aboard!</div>
              <h2 className="role-title">Who are you?</h2>
              <p className="role-sub">Choose your path so we can personalize every part of your experience.</p>
            </div>
            <div className="role-cards">
              <div className="role-card role-student" onClick={()=>handleRoleSelect('student')} tabIndex={0} onKeyDown={e=>e.key==='Enter'&&handleRoleSelect('student')}>
                <h3>Student</h3>
                <p>I'm exploring career options and need guidance on my future path.</p>
                <div className="role-card-features"><span>✓ Career Recommendations</span><span>✓ Degree Suggestions</span><span>✓ University Finder</span><span>✓ AI Guidance</span></div>
                <div className="role-card-cta">Choose Student →</div>
              </div>
              <div className="role-card role-jobseeker" onClick={()=>handleRoleSelect('jobseeker')} tabIndex={0} onKeyDown={e=>e.key==='Enter'&&handleRoleSelect('jobseeker')}>
                <h3>Job Seeker</h3>
                <p>I'm actively looking for opportunities and need smart matching.</p>
                <div className="role-card-features"><span>✓ Smart Job Matching</span><span>✓ LinkedIn Jobs</span><span>✓ Remote Opportunities</span><span>✓ AI Assistance</span></div>
                <div className="role-card-cta">Choose Job Seeker →</div>
              </div>
            </div>
          </div>
        </div></div>
      </div>
    )
  }

  const pct = ((step - 1) / totalSteps) * 100
  const isLast = step === totalSteps
  const stepDesc = role === 'student'
    ? ['Personal Info','Education','Skills & Interests','Career Goals','Learning Preferences','Review & Confirm']
    : ['Personal Info','Employment','Experience','Education','Skills & Languages','Job Preferences','Salary & Links','Review & Confirm']

  return (
    <div id="page-onboarding" className="page active">
      <div className="auth-bg-orbs"><div className="orb orb-1"></div><div className="orb orb-2"></div></div>
      <div className="onboard-shell"><div className="onboard-box">
        <div className="pf-progress-wrap"><div className="pf-progress-bar" style={{ width: `${pct}%` }}></div></div>
        <div className="pf-back-row">
          {step > 1 && <button className="back-link inline" onClick={prev}>← Back</button>}
          <span className="step-indicator">Step {step} of {totalSteps} — {stepDesc[step-1]}</span>
        </div>
        <Link href="/" className="nav-logo onboard-logo">Pathfinder<span>AI</span></Link>

        <div className="onboarding-step scroll-content">
          {/* ===== STUDENT STEPS ===== */}
          {role === 'student' && step === 1 && (
            <><h2>Personal Information</h2><p className="pf-sub">Tell us about yourself</p>
            <div className="form-grid">
              <div className="form-group"><label>First Name</label><input type="text" placeholder="John" value={data.firstName} onChange={e=>upd({firstName:e.target.value})} />{errors.firstName&&<span className="field-error">{errors.firstName}</span>}</div>
              <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe" value={data.lastName} onChange={e=>upd({lastName:e.target.value})} />{errors.lastName&&<span className="field-error">{errors.lastName}</span>}</div>
              <DateInput value={data.dateOfBirth} onChange={v=>upd({dateOfBirth:v})} error={errors.dateOfBirth} />
              <div className="form-group"><label>Gender</label><select value={data.gender} onChange={e=>upd({gender:e.target.value})}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option><option value="prefer-not">Prefer not to say</option></select>{errors.gender&&<span className="field-error">{errors.gender}</span>}</div>
              <div className="form-group full"><label>Nationality</label><input type="text" placeholder="e.g., American" value={data.nationality} onChange={e=>upd({nationality:e.target.value})} />{errors.nationality&&<span className="field-error">{errors.nationality}</span>}</div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'student' && step === 2 && (
            <><h2>Education</h2><p className="pf-sub">What are you currently studying?</p>
            <div className="form-grid">
              <div className="form-group full"><label>Current Education Level</label><select value={data.currentEducationLevel} onChange={e=>upd({currentEducationLevel:e.target.value})}><option value="">Select level</option>{['high_school','undergraduate','postgraduate','phd'].map(l=><option key={l} value={l}>{l.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}</select>{errors.currentEducationLevel&&<span className="field-error">{errors.currentEducationLevel}</span>}</div>
              <div className="form-group full"><label>Field of Study</label><select value={data.fieldOfStudy} onChange={e=>upd({fieldOfStudy:e.target.value})}><option value="">Select field</option>{['Computer Science','Engineering','Business','Mathematics','Physics','Biology','Chemistry','Economics','Psychology','Design','Other'].map(f=><option key={f} value={f}>{f}</option>)}</select>{errors.fieldOfStudy&&<span className="field-error">{errors.fieldOfStudy}</span>}</div>
              <div className="form-group full"><label>Institution Name</label><input type="text" placeholder="e.g., MIT" value={data.institutionName} onChange={e=>upd({institutionName:e.target.value})} />{errors.institutionName&&<span className="field-error">{errors.institutionName}</span>}</div>
              <div className="form-group"><label>Graduation Year</label><input type="number" placeholder="2026" value={data.graduationYear} onChange={e=>upd({graduationYear:e.target.value})} />{errors.graduationYear&&<span className="field-error">{errors.graduationYear}</span>}</div>
              <div className="form-group"><label>GPA (optional)</label><input type="text" placeholder="3.8" value={data.gpa} onChange={e=>upd({gpa:e.target.value})} /></div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'student' && step === 3 && (
            <><h2>Skills & Interests</h2><p className="pf-sub">Select your skills and interests (click to toggle)</p>
            <div className="form-grid">
              <div className="form-group full"><label>Skills</label><div className="tag-grid">{SKILL_OPTIONS.map(s=><button key={s} type="button" className={`tag-chip ${data.skills.includes(s)?'active':''}`} onClick={()=>toggle(s,'skills')}>{s}</button>)}</div></div>
              <div className="form-group full"><label>Interests</label><div className="tag-grid">{INTEREST_OPTIONS.map(s=><button key={s} type="button" className={`tag-chip ${data.interests.includes(s)?'active':''}`} onClick={()=>toggle(s,'interests')}>{s}</button>)}</div></div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'student' && step === 4 && (
            <><h2>Career Goals</h2><p className="pf-sub">Select up to 3 career paths that interest you</p>
            <div className="selection-counter">{data.preferredCareerPaths.length}/3 selected</div>
            <div className="career-path-grid">{CAREER_PATHS.map(p=><button key={p.title} type="button" className={`career-path-card ${data.preferredCareerPaths.includes(p.title)?'active':''}`} onClick={()=>togglePath(p.title)}><div className="career-path-title">{p.title}</div><div className="career-path-desc">{p.desc}</div></button>)}</div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'student' && step === 5 && (
            <><h2>Learning Preferences</h2><p className="pf-sub">How do you learn best?</p>
            <div className="form-grid">
              <div className="form-group full"><label>Learning Style</label><div className="tag-grid">{LEARNING_STYLES.map(s=><button key={s} type="button" className={`tag-chip ${data.learningStyle===s?'active':''}`} onClick={()=>upd({learningStyle:s})}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>)}</div>{errors.learningStyle&&<span className="field-error">{errors.learningStyle}</span>}</div>
              <div className="form-group full"><label>Availability (hours/week)</label><input type="number" placeholder="e.g., 20" value={data.availabilityHours} onChange={e=>upd({availabilityHours:e.target.value})} />{errors.availabilityHours&&<span className="field-error">{errors.availabilityHours}</span>}</div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}

          {/* ===== JOB SEEKER STEPS ===== */}
          {role === 'jobseeker' && step === 1 && (
            <><h2>Personal Information</h2><p className="pf-sub">Tell us about yourself</p>
            <div className="form-grid">
              <div className="form-group"><label>First Name</label><input type="text" placeholder="John" value={data.firstName} onChange={e=>upd({firstName:e.target.value})} />{errors.firstName&&<span className="field-error">{errors.firstName}</span>}</div>
              <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe" value={data.lastName} onChange={e=>upd({lastName:e.target.value})} />{errors.lastName&&<span className="field-error">{errors.lastName}</span>}</div>
              <div className="form-group"><label>Phone</label><input type="tel" placeholder="+1 555-0000" value={data.phone} onChange={e=>upd({phone:e.target.value})} />{errors.phone&&<span className="field-error">{errors.phone}</span>}</div>
              <DateInput value={data.dateOfBirth} onChange={v=>upd({dateOfBirth:v})} error={errors.dateOfBirth} />
              <div className="form-group"><label>Gender</label><select value={data.gender} onChange={e=>upd({gender:e.target.value})}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option><option value="prefer-not">Prefer not to say</option></select>{errors.gender&&<span className="field-error">{errors.gender}</span>}</div>
              <div className="form-group full"><label>Nationality</label><input type="text" placeholder="e.g., American" value={data.nationality} onChange={e=>upd({nationality:e.target.value})} />{errors.nationality&&<span className="field-error">{errors.nationality}</span>}</div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'jobseeker' && step === 2 && (
            <><h2>Employment Status</h2><p className="pf-sub">What's your current situation?</p>
            <div className="form-grid">
              <div className="form-group full"><label>Employment Status</label><div className="tag-grid">{EMPLOYMENT_STATUSES.map(s=><button key={s} type="button" className={`tag-chip ${data.employmentStatus===s?'active':''}`} onClick={()=>upd({employmentStatus:s})}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>)}</div>{errors.employmentStatus&&<span className="field-error">{errors.employmentStatus}</span>}</div>
              <div className="form-group"><label>Current Job Title</label><input type="text" placeholder="e.g., Software Engineer" value={data.currentJobTitle} onChange={e=>upd({currentJobTitle:e.target.value})} /></div>
              <div className="form-group"><label>Current Employer</label><input type="text" placeholder="e.g., Google" value={data.currentEmployer} onChange={e=>upd({currentEmployer:e.target.value})} /></div>
              <div className="form-group full"><label>Years of Experience</label><input type="number" placeholder="e.g., 5" value={data.yearsOfExperience} onChange={e=>upd({yearsOfExperience:e.target.value})} /></div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'jobseeker' && step === 3 && (
            <><h2>Work Experience</h2><p className="pf-sub">Add your work history (at least 1 required)</p>
            {data.workExperiences.map((exp,i)=>(
              <div key={i} className="dash-card" style={{marginBottom:12,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><strong>Experience {i+1}</strong><button type="button" onClick={()=>delExp(i)} style={{background:'none',border:'none',color:'var(--accent2)',cursor:'pointer',fontSize:14}}>Remove</button></div>
                <div className="form-grid" style={{gap:10}}>
                  <div className="form-group"><label>Company</label><input type="text" placeholder="Company" value={exp.company} onChange={e=>updExp(i,{company:e.target.value})} /></div>
                  <div className="form-group"><label>Title</label><input type="text" placeholder="Title" value={exp.title} onChange={e=>updExp(i,{title:e.target.value})} /></div>
                  <div className="form-group"><label>Start</label><input type="month" value={exp.startDate} onChange={e=>updExp(i,{startDate:e.target.value})} /></div>
                  <div className="form-group"><label>End</label><input type="month" value={exp.endDate} onChange={e=>updExp(i,{endDate:e.target.value})} disabled={exp.isCurrent} /></div>
                  <div className="form-group" style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8}}><input type="checkbox" id={`cur-${i}`} checked={exp.isCurrent} onChange={e=>updExp(i,{isCurrent:e.target.checked,endDate:e.target.checked?'':exp.endDate})} /><label htmlFor={`cur-${i}`}>Current</label></div>
                  <div className="form-group full"><label>Description</label><textarea placeholder="Describe your role..." rows={2} value={exp.description} onChange={e=>updExp(i,{description:e.target.value})} /></div>
                  <div className="form-group full"><label>Skills Used</label><input type="text" placeholder="e.g., JavaScript, React" value={exp.skillsUsed} onChange={e=>updExp(i,{skillsUsed:e.target.value})} /></div>
                </div>
              </div>
            ))}
            {errors.workExperiences&&<span className="field-error" style={{display:'block',marginBottom:8}}>{errors.workExperiences}</span>}
            <button type="button" onClick={addExp} className="dash-action-btn" style={{marginBottom:16}}>+ Add Experience</button>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'jobseeker' && step === 4 && (
            <><h2>Education</h2><p className="pf-sub">Your educational background</p>
            <div className="form-grid">
              <div className="form-group"><label>Degree</label><input type="text" placeholder="e.g., B.S. Computer Science" value={data.eduDegree} onChange={e=>upd({eduDegree:e.target.value})} />{errors.eduDegree&&<span className="field-error">{errors.eduDegree}</span>}</div>
              <div className="form-group"><label>Institution</label><input type="text" placeholder="e.g., Stanford" value={data.eduInstitution} onChange={e=>upd({eduInstitution:e.target.value})} />{errors.eduInstitution&&<span className="field-error">{errors.eduInstitution}</span>}</div>
              <div className="form-group"><label>Field</label><input type="text" placeholder="Field of study" value={data.eduField} onChange={e=>upd({eduField:e.target.value})} /></div>
              <div className="form-group"><label>Start Year</label><input type="number" placeholder="2018" value={data.eduStartYear} onChange={e=>upd({eduStartYear:e.target.value})} /></div>
              <div className="form-group"><label>End Year</label><input type="number" placeholder="2022" value={data.eduEndYear} onChange={e=>upd({eduEndYear:e.target.value})} /></div>
              <div className="form-group"><label>Grade (optional)</label><input type="text" placeholder="3.8 GPA" value={data.eduGrade} onChange={e=>upd({eduGrade:e.target.value})} /></div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'jobseeker' && step === 5 && (
            <><h2>Skills & Languages</h2><p className="pf-sub">Tell us about your skills and language proficiency</p>
            <div className="form-grid">
              <div className="form-group full"><label>Skills</label><div className="tag-grid">{SKILL_OPTIONS.map(s=><button key={s} type="button" className={`tag-chip ${data.jobSeekerSkills.includes(s)?'active':''}`} onClick={()=>toggle(s,'jobSeekerSkills')}>{s}</button>)}</div></div>
              <div className="form-group full"><label>Languages (comma separated: English:Native, Spanish:Fluent)</label><input type="text" placeholder="English:Native, Spanish:Fluent" value={data.languages} onChange={e=>upd({languages:e.target.value})} /></div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'jobseeker' && step === 6 && (
            <><h2>Job Preferences</h2><p className="pf-sub">What kind of role are you looking for?</p>
            <div className="form-grid">
              <div className="form-group full"><label>Desired Job Titles</label><input type="text" placeholder="e.g., Software Engineer, Senior Developer" value={data.desiredTitles} onChange={e=>upd({desiredTitles:e.target.value})} />{errors.desiredTitles&&<span className="field-error">{errors.desiredTitles}</span>}</div>
              <div className="form-group full"><label>Desired Industries</label><input type="text" placeholder="e.g., Tech, Finance, Healthcare" value={data.desiredIndustries} onChange={e=>upd({desiredIndustries:e.target.value})} />{errors.desiredIndustries&&<span className="field-error">{errors.desiredIndustries}</span>}</div>
              <div className="form-group full"><label>Desired Locations</label><input type="text" placeholder="e.g., New York, SF, Remote" value={data.desiredLocations} onChange={e=>upd({desiredLocations:e.target.value})} /></div>
              <div className="form-group full"><label>Remote Preference</label><div className="tag-grid">{['remote','hybrid','onsite','any'].map(s=><button key={s} type="button" className={`tag-chip ${data.remotePreference===s?'active':''}`} onClick={()=>upd({remotePreference:s})}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>)}</div>{errors.remotePreference&&<span className="field-error">{errors.remotePreference}</span>}</div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}
          {role === 'jobseeker' && step === 7 && (
            <><h2>Salary & Links</h2><p className="pf-sub">Expected compensation and your professional links</p>
            <div className="form-grid">
              <div className="form-group"><label>Salary Min</label><input type="number" placeholder="80000" value={data.expectedSalaryMin} onChange={e=>upd({expectedSalaryMin:e.target.value})} />{errors.expectedSalaryMin&&<span className="field-error">{errors.expectedSalaryMin}</span>}</div>
              <div className="form-group"><label>Salary Max</label><input type="number" placeholder="120000" value={data.expectedSalaryMax} onChange={e=>upd({expectedSalaryMax:e.target.value})} /></div>
              <div className="form-group"><label>Currency</label><select value={data.currency} onChange={e=>upd({currency:e.target.value})}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="CAD">CAD</option><option value="AUD">AUD</option></select></div>
              <div className="form-group full"><label>LinkedIn URL</label><input type="url" placeholder="https://linkedin.com/in/yourprofile" value={data.linkedinUrl} onChange={e=>upd({linkedinUrl:e.target.value})} /></div>
              <div className="form-group full"><label>Portfolio URL</label><input type="url" placeholder="https://yourportfolio.com" value={data.portfolioUrl} onChange={e=>upd({portfolioUrl:e.target.value})} /></div>
            </div>
            <button onClick={next} className="btn-auth" disabled={loading}><span className="btn-text">Next →</span></button></>
          )}

          {/* ===== REVIEW (final step for both) ===== */}
          {isLast && (
            <><h2>Review & Confirm</h2><p className="pf-sub">Please review your information before finishing</p>
            <div className="review-summary">
              <div className="review-section"><h3>Personal Info</h3><p><strong>Name:</strong> {data.firstName} {data.lastName}</p><p><strong>DOB:</strong> {data.dateOfBirth}</p><p><strong>Gender:</strong> {data.gender}</p><p><strong>Nationality:</strong> {data.nationality}</p></div>
              {role === 'student' ? (
                <>
                  <div className="review-section"><h3>Education</h3><p><strong>Level:</strong> {data.currentEducationLevel}</p><p><strong>Field:</strong> {data.fieldOfStudy}</p><p><strong>Institution:</strong> {data.institutionName}</p><p><strong>Graduation:</strong> {data.graduationYear}</p><p><strong>GPA:</strong> {data.gpa || 'N/A'}</p></div>
                  <div className="review-section"><h3>Skills & Interests</h3><p><strong>Skills:</strong> {data.skills.join(', ')}</p><p><strong>Interests:</strong> {data.interests.join(', ')}</p></div>
                  <div className="review-section"><h3>Career Goals</h3><p><strong>Paths:</strong> {data.preferredCareerPaths.join(', ')}</p></div>
                  <div className="review-section"><h3>Learning Preferences</h3><p><strong>Style:</strong> {data.learningStyle}</p><p><strong>Availability:</strong> {data.availabilityHours}h/week</p></div>
                </>
              ) : (
                <>
                  <div className="review-section"><h3>Employment</h3><p><strong>Status:</strong> {data.employmentStatus}</p><p><strong>Title:</strong> {data.currentJobTitle}</p><p><strong>Employer:</strong> {data.currentEmployer}</p><p><strong>Experience:</strong> {data.yearsOfExperience} years</p></div>
                  <div className="review-section"><h3>Work Experience</h3>{data.workExperiences.length === 0 ? <p>None added</p> : data.workExperiences.map((e,i)=><p key={i}>{e.title} @ {e.company} ({e.startDate} - {e.isCurrent ? 'Present' : e.endDate})</p>)}</div>
                  <div className="review-section"><h3>Education</h3><p><strong>Degree:</strong> {data.eduDegree}</p><p><strong>Institution:</strong> {data.eduInstitution}</p><p><strong>Field:</strong> {data.eduField}</p></div>
                  <div className="review-section"><h3>Skills & Languages</h3><p><strong>Skills:</strong> {data.jobSeekerSkills.join(', ')}</p><p><strong>Languages:</strong> {data.languages || 'N/A'}</p></div>
                  <div className="review-section"><h3>Job Preferences</h3><p><strong>Titles:</strong> {data.desiredTitles}</p><p><strong>Industries:</strong> {data.desiredIndustries}</p><p><strong>Remote:</strong> {data.remotePreference}</p></div>
                  <div className="review-section"><h3>Salary & Links</h3><p><strong>Salary:</strong> {data.currency} {data.expectedSalaryMin} - {data.expectedSalaryMax}</p><p><strong>LinkedIn:</strong> {data.linkedinUrl || 'N/A'}</p></div>
                </>
              )}
            </div>
            <button onClick={finish} className="btn-auth" disabled={loading}><span className="btn-text">{loading ? 'Setting up...' : 'Finish & Launch Dashboard →'}</span></button></>
          )}
        </div>
      </div></div>
    </div>
  )
}
