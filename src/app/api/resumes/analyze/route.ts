import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface ResumeAnalysis {
  overall_score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  keywords_missing: string[]
  ats_score: number
  improved_summary: string
  skills_identified: string[]
  experience_years: string
  education: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const body = await request.json()
    const { fileName, fileType, fileSize, fileContent } = body

    if (!fileName || !fileContent) {
      throw new ApiError('fileName and fileContent are required', ErrorCode.VALIDATION_ERROR, 400)
    }

    if (!GEMINI_API_KEY) {
      throw new ApiError('Gemini API key not configured', ErrorCode.INTERNAL_ERROR, 500)
    }

    // Determine MIME type
    let mimeType = 'application/pdf'
    if (fileType) {
      mimeType = fileType
    } else if (fileName.endsWith('.pdf')) {
      mimeType = 'application/pdf'
    } else if (fileName.endsWith('.doc')) {
      mimeType = 'application/msword'
    } else if (fileName.endsWith('.docx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (fileName.endsWith('.txt')) {
      mimeType = 'text/plain'
    }

    // Upload file to Gemini File API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`
    
    // First, create the file metadata
    const metadataResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          display_name: fileName,
        }
      })
    })

    if (!metadataResponse.ok) {
      const error = await metadataResponse.text()
      console.error('Gemini file upload metadata error:', error)
      throw new ApiError('Failed to initialize file upload', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    const uploadUrlFromHeader = metadataResponse.headers.get('X-Goog-Upload-URL')
    if (!uploadUrlFromHeader) {
      throw new ApiError('Failed to get upload URL', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    // Upload the actual file content
    const fileBuffer = Buffer.from(fileContent, 'base64')
    const uploadResponse = await fetch(uploadUrlFromHeader, {
      method: 'POST',
      headers: {
        'Content-Length': fileBuffer.length.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: fileBuffer,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.error('Gemini file upload error:', error)
      throw new ApiError('Failed to upload file', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    const uploadResult = await uploadResponse.json()
    const fileUri = uploadResult.file?.uri

    if (!fileUri) {
      throw new ApiError('Failed to get file URI', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    // Wait for file to be processed (Gemini needs time to process uploaded files)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Analyze the resume with Gemini
    const prompt = `You are an expert resume reviewer and ATS optimization specialist.

Analyze this resume document and return ONLY a valid JSON object with these exact keys:
- overall_score (number 0-100): overall resume quality
- strengths (string[]): 3-5 specific strengths
- weaknesses (string[]): 3-5 specific weaknesses
- suggestions (string[]): 3-5 actionable improvements
- keywords_missing (string[]): important industry keywords that are missing
- ats_score (number 0-100): how well the resume will perform in Applicant Tracking Systems
- improved_summary (string): a rewritten professional summary (2-3 sentences)
- skills_identified (string[]): all technical and soft skills found in the resume
- experience_years (string): estimated years of experience (e.g., "3-5 years", "Entry level")
- education (string[]): degrees and certifications found

Output pure JSON only. Do NOT wrap in markdown code blocks.`

    const analyzeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    
    const analyzeResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { file_data: { mime_type: mimeType, file_uri: fileUri } }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        }
      }),
    })

    if (!analyzeResponse.ok) {
      const error = await analyzeResponse.text()
      console.error('Gemini analysis error:', error)
      throw new ApiError('Failed to analyze resume', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    const analyzeResult = await analyzeResponse.json()
    const rawContent = analyzeResult.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    let analysis: ResumeAnalysis
    try {
      const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
      analysis = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', rawContent)
      throw new ApiError('Failed to parse AI response', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    // Save resume to database
    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        file_url: fileUri, // Store Gemini file URI
        file_name: fileName,
        file_size: fileSize,
        resume_text: `Analyzed with Gemini 1.5 Flash - File URI: ${fileUri}`,
        status: 'analyzed',
        analysis,
        ai_raw: { gemini_response: analyzeResult, file_uri: fileUri },
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new ApiError(dbError.message, ErrorCode.DB_ERROR, 500)
    }

    return NextResponse.json({ 
      data: resume,
      analysis,
      message: 'Resume analyzed successfully with Gemini 1.5 Flash'
    }, { status: 201 })

  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}
