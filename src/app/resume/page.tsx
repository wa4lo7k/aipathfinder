'use client'

/**
 * Resume Inspector Page
 * Modern, production-ready interface for AI-powered resume analysis
 */

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, Loader2, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface InspectionResult {
  analysis: string
  score?: number
  strengths?: string[]
  weaknesses?: string[]
  suggestions?: string[]
}

interface InspectionResponse {
  success: boolean
  data: InspectionResult
  metadata: {
    fileName: string
    fileType: string
    fileSize: number
    model: string
    timestamp: string
  }
  error?: string
  details?: string
}

const FOCUS_AREAS = [
  { value: 'general', label: 'General Review', description: 'Comprehensive analysis of your resume' },
  { value: 'ats', label: 'ATS Optimization', description: 'Check compatibility with Applicant Tracking Systems' },
  { value: 'formatting', label: 'Formatting & Structure', description: 'Review layout, design, and organization' },
  { value: 'content', label: 'Content Quality', description: 'Analyze writing, achievements, and impact' },
  { value: 'keywords', label: 'Keyword Optimization', description: 'Identify missing industry keywords' },
  { value: 'job-match', label: 'Job Description Match', description: 'Compare against a specific job posting' },
]

export default function ResumeInspectorPage() {
  // State management
  const [file, setFile] = useState<File | null>(null)
  const [focusArea, setFocusArea] = useState('general')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InspectionResult | null>(null)
  const [metadata, setMetadata] = useState<InspectionResponse['metadata'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  // Validate and set file
  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ]

    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, DOCX, PNG, or JPEG files.')
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 10MB limit.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file to inspect')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Prepare FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('focusArea', focusArea)
      
      if (useCustomPrompt && customPrompt.trim()) {
        formData.append('prompt', customPrompt.trim())
      }

      console.log('Sending inspection request...')

      // Send request to API
      const response = await fetch('/api/inspect-resume', {
        method: 'POST',
        body: formData,
      })

      const data: InspectionResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to inspect resume')
      }

      if (data.success && data.data) {
        setResult(data.data)
        setMetadata(data.metadata)
        console.log('Inspection completed successfully')
      } else {
        throw new Error('Invalid response from server')
      }

    } catch (err: any) {
      console.error('Inspection error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setFile(null)
    setResult(null)
    setMetadata(null)
    setError(null)
    setCustomPrompt('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-400" size={24} />
                <h1 className="text-2xl font-bold text-white">Resume Inspector</h1>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              Powered by Gemini 2.0 Flash
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            
            {/* Upload Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={20} className="text-purple-400" />
                Upload Resume
              </h2>

              {/* File Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${dragActive 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                  }
                  ${file ? 'border-green-500 bg-green-500/5' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {!file ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 bg-purple-500/10 rounded-full">
                        <FileText className="text-purple-400" size={32} />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">Drop your resume here</p>
                      <p className="text-sm text-slate-400 mt-1">or click to browse</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Supports PDF, DOCX, PNG, JPEG (max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle className="text-green-400" size={32} />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Change file
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Focus Area Selection */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-4">Analysis Focus</h2>
              
              <div className="space-y-3">
                {FOCUS_AREAS.map((area) => (
                  <label
                    key={area.value}
                    className={`
                      flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all
                      ${focusArea === area.value
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : 'bg-slate-900/50 border-2 border-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="focusArea"
                      value={area.value}
                      checked={focusArea === area.value}
                      onChange={(e) => setFocusArea(e.target.value)}
                      className="mt-1 text-purple-500 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{area.label}</div>
                      <div className="text-sm text-slate-400 mt-1">{area.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Custom Prompt Toggle */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomPrompt}
                    onChange={(e) => setUseCustomPrompt(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-300">Use custom prompt</span>
                </label>

                {useCustomPrompt && (
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom analysis instructions..."
                    rows={4}
                    className="mt-3 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white transition-all
                flex items-center justify-center gap-2
                ${!file || loading
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-purple-500/50'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Inspecting Resume...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Inspect Resume
                </>
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-400 mb-1">Error</h3>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="animate-spin text-purple-400" size={48} />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-300" size={24} />
                  </div>
                  <div>
                    <p className="text-white font-medium">Analyzing your resume...</p>
                    <p className="text-sm text-slate-400 mt-1">This may take 10-30 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && !loading && (
              <div className="space-y-6">
                
                {/* Score Card */}
                {result.score !== undefined && (
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-2">
                        {result.score}
                        <span className="text-3xl text-slate-400">/100</span>
                      </div>
                      <p className="text-slate-300">Overall Score</p>
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {result.strengths && result.strengths.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-6">
                    <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle size={20} />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {result.weaknesses && result.weaknesses.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6">
                    <h3 className="font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                      <AlertCircle size={20} />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {result.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                      <Sparkles size={20} />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Full Analysis */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-4">Detailed Analysis</h3>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {result.analysis}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {metadata && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Model:</span>
                        <span className="text-slate-300 ml-2">{metadata.model}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Analyzed:</span>
                        <span className="text-slate-300 ml-2">
                          {new Date(metadata.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Analyze Another
                  </button>
                  <button
                    onClick={() => {
                      const text = `Resume Analysis\n\n${result.analysis}`
                      const blob = new Blob([text], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'resume-analysis.txt'
                      a.click()
                    }}
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export Report
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !loading && !error && (
              <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-full">
                    <FileText className="text-slate-400" size={48} />
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">No analysis yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Upload a resume and click "Inspect Resume" to get started
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
