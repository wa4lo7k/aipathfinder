'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, Loader2, Trash2, Calendar, BarChart3, Target, Brain, Award, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

interface Resume {
  id: string
  title: string
  file_url: string
  file_name: string
  file_size: number
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error'
  analysis: any
  created_at: string
}

export default function ResumeManager() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      const res = await fetch('/api/resumes')
      if (res.ok) {
        const json = await res.json()
        setResumes(json.data || [])
      }
    } catch (e) {
      console.error('Error loading resumes:', e)
    }
  }

  const uploadAndAnalyze = async (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      setError('Please upload a PDF or DOCX file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const timestamp = Date.now()
      const storagePath = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(storagePath)

      const reader = new FileReader()
      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const data = reader.result as string
          resolve(data.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const analyzeRes = await fetch('/api/resumes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileContent: base64Content,
          permanentUrl: publicUrl,
        }),
      })

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json()
        throw new Error(errData.error || 'Failed to analyze resume')
      }

      await loadResumes()
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAndAnalyze(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadAndAnalyze(file)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'analyzed': return <CheckCircle size={16} className="status-analyzed" />
      case 'analyzing': return <Loader2 size={16} className="status-analyzing spin" />
      case 'error': return <AlertCircle size={16} className="status-error" />
      default: return <Clock size={16} className="status-uploaded" />
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'analyzed': return 'Analyzed'
      case 'analyzing': return 'Analyzing...'
      case 'error': return 'Error'
      default: return 'Uploaded'
    }
  }

  return (
    <div className="resume-manager">
      <div className="resume-manager-header">
        <div className="section-head">
          <div className="section-label">Resume Management</div>
          <h2 className="section-title">Your Resumes</h2>
        </div>
      </div>

      <div
        ref={dropRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`resume-upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={uploading}
          className="resume-file-input"
        />
        {uploading ? (
          <div className="resume-uploading-state">
            <Loader2 size={40} className="spin" />
            <p>Uploading & analyzing with Gemini...</p>
          </div>
        ) : (
          <div className="resume-upload-content">
            <Upload size={36} />
            <p className="resume-upload-title">Drop your resume here or click to browse</p>
            <p className="resume-upload-sub">PDF, DOCX, TXT — Max 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="resume-error">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="resume-error-close"><X size={16} /></button>
        </div>
      )}

      {resumes.length === 0 && !uploading ? (
        <div className="resume-empty">
          <FileText size={48} />
          <h3>No resumes yet</h3>
          <p>Upload your first resume to get AI-powered analysis and career insights</p>
        </div>
      ) : (
        <div className="resume-list">
          {resumes.map((resume) => (
            <div key={resume.id} className={`resume-card ${resume.status}`}>
              <div className="resume-card-main" onClick={() => setExpandedId(expandedId === resume.id ? null : resume.id)}>
                <div className="resume-card-icon">
                  <FileText size={22} />
                </div>
                <div className="resume-card-info">
                  <div className="resume-card-name">{resume.file_name}</div>
                  <div className="resume-card-meta">
                    <span>{formatSize(resume.file_size)}</span>
                    <span className="sep">•</span>
                    <Calendar size={12} />
                    <span>{formatDate(resume.created_at)}</span>
                  </div>
                </div>
                <div className="resume-card-status">
                  {statusIcon(resume.status)}
                  <span>{statusLabel(resume.status)}</span>
                </div>
                {resume.status === 'analyzed' && resume.analysis?.overall_score && (
                  <div className="resume-card-score">
                    <div className="resume-score-ring">
                      <svg width="44" height="44" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface3)" strokeWidth="3" />
                        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="3"
                          strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - (resume.analysis.overall_score || 0) / 100)}`}
                          transform="rotate(-90 22 22)" />
                      </svg>
                      <span className="resume-score-val">{resume.analysis.overall_score}</span>
                    </div>
                  </div>
                )}
                <div className="resume-card-expand">
                  {expandedId === resume.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedId === resume.id && resume.status === 'analyzed' && resume.analysis && (
                <div className="resume-card-details">
                  <div className="resume-detail-grid">
                    {resume.analysis.overall_score !== undefined && (
                      <div className="resume-detail-card score">
                        <div className="detail-label">Overall Score</div>
                        <div className="detail-value">{resume.analysis.overall_score}/100</div>
                      </div>
                    )}
                    {resume.analysis.ats_score !== undefined && (
                      <div className="resume-detail-card ats">
                        <div className="detail-label">ATS Score</div>
                        <div className="detail-value">{resume.analysis.ats_score}/100</div>
                      </div>
                    )}
                    {resume.analysis.experience_years && (
                      <div className="resume-detail-card exp">
                        <div className="detail-label">Experience</div>
                        <div className="detail-value">{resume.analysis.experience_years}</div>
                      </div>
                    )}
                  </div>

                  {resume.analysis.skills_identified && resume.analysis.skills_identified.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><Award size={16} /> Skills Identified</div>
                      <div className="resume-skills-list">
                        {resume.analysis.skills_identified.map((skill: string, i: number) => (
                          <span key={i} className="skill-chip">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.analysis.strengths && resume.analysis.strengths.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><CheckCircle size={16} /> Strengths</div>
                      <ul className="resume-list-items">
                        {resume.analysis.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resume.analysis.weaknesses && resume.analysis.weaknesses.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><AlertCircle size={16} /> Areas for Improvement</div>
                      <ul className="resume-list-items weakness">
                        {resume.analysis.weaknesses.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resume.analysis.suggestions && resume.analysis.suggestions.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><Sparkles size={16} /> Recommendations</div>
                      <ul className="resume-list-items">
                        {resume.analysis.suggestions.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resume.analysis.keywords_missing && resume.analysis.keywords_missing.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><Target size={16} /> Missing Keywords</div>
                      <div className="resume-skills-list">
                        {resume.analysis.keywords_missing.map((kw: string, i: number) => (
                          <span key={i} className="skill-chip missing">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.analysis.career_paths && resume.analysis.career_paths.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><BarChart3 size={16} /> Recommended Career Paths</div>
                      <div className="career-paths-grid">
                        {resume.analysis.career_paths.map((cp: any, i: number) => (
                          <div key={i} className="career-path-item">
                            <div className="cp-title">{cp.title}</div>
                            {cp.match_score && <div className="cp-match">{cp.match_score}% match</div>}
                            {cp.description && <div className="cp-desc">{cp.description}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.analysis.education && resume.analysis.education.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title"><Brain size={16} /> Education</div>
                      <ul className="resume-list-items">
                        {resume.analysis.education.map((edu: string, i: number) => (
                          <li key={i}>{edu}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resume.analysis.improved_summary && (
                    <div className="resume-section">
                      <div className="resume-section-title"><Sparkles size={16} /> Improved Professional Summary</div>
                      <div className="resume-summary-text">{resume.analysis.improved_summary}</div>
                    </div>
                  )}

                  {resume.file_url && (
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="resume-download-link">
                      <FileText size={16} /> View Original Resume
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
