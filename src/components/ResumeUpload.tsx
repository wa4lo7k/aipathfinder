'use client'

import { useState } from 'react'
import { Upload, Loader2, FileText, CheckCircle, XCircle } from 'lucide-react'

interface ResumeUploadProps {
  onUploadComplete: () => void
}

export default function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    setSuccess('')
    setUploading(true)

    try {
      // Convert file to base64 for Gemini API
      const reader = new FileReader()
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string
          const base64Content = base64Data.split(',')[1] // Remove data:mime;base64, prefix

          setAnalyzing(true)
          
          // Call our API to analyze with Gemini
          const response = await fetch('/api/resumes/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileContent: base64Content,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to analyze resume')
          }

          const result = await response.json()
          setSuccess('Resume uploaded and analyzed successfully!')
          onUploadComplete()
          
          // Reset file input
          e.target.value = ''
        } catch (err: any) {
          setError(err.message || 'Failed to analyze resume')
        } finally {
          setUploading(false)
          setAnalyzing(false)
        }
      }

      reader.onerror = () => {
        setError('Failed to read file')
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume')
      setUploading(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
      <Upload size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
      <h3 style={{ marginBottom: '8px' }}>Upload Your Resume</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        Upload your resume to get AI-powered analysis with Gemini 1.5 Flash
      </p>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', marginBottom: '16px', color: '#c00' }}>
          <XCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#efe', border: '1px solid #cfc', borderRadius: '8px', marginBottom: '16px', color: '#060' }}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {uploading || analyzing ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {uploading && !analyzing && 'Uploading resume...'}
            {analyzing && 'Analyzing with Gemini AI...'}
          </p>
        </div>
      ) : (
        <>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="resume-upload-input"
            disabled={uploading || analyzing}
          />
          <label
            htmlFor="resume-upload-input"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 500,
            }}
          >
            <FileText size={18} />
            Choose File
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
          </p>
        </>
      )}
    </div>
  )
}
