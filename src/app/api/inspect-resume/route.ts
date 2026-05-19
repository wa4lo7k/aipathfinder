/**
 * Resume Inspector API Route
 * Uses @google/genai SDK for multimodal resume analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createServerSupabaseClient } from '@/lib/supabase'

// Initialize Google GenAI with API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not configured')
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null

// Supported file types
const SUPPORTED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
}

interface InspectionResult {
  analysis: string
  score?: number
  strengths?: string[]
  weaknesses?: string[]
  suggestions?: string[]
}

/**
 * Convert file buffer to base64 data part for Gemini
 */
function fileToDataPart(buffer: Buffer, mimeType: string) {
  const base64Data = buffer.toString('base64')
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  }
}

/**
 * POST /api/inspect-resume
 * Accepts FormData with file and prompt
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI is initialized
    if (!ai) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
      )
    }

    // Authenticate user (optional but recommended)
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prompt = formData.get('prompt') as string | null
    const focusArea = formData.get('focusArea') as string | null

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!prompt && !focusArea) {
      return NextResponse.json(
        { error: 'No prompt or focus area provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!Object.keys(SUPPORTED_MIME_TYPES).includes(file.type)) {
      return NextResponse.json(
        { 
          error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, PNG, JPEG` 
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create data part for Gemini
    const filePart = fileToDataPart(buffer, file.type)

    // Build the prompt
    const systemPrompt = `You are an expert resume reviewer and career advisor. Analyze the provided resume thoroughly and provide detailed, actionable feedback.`
    
    const userPrompt = prompt || `Focus Area: ${focusArea}\n\nPlease analyze this resume and provide:
1. Overall assessment and score (0-100)
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Specific actionable suggestions (5-7 recommendations)
5. ATS (Applicant Tracking System) compatibility assessment

Be specific, constructive, and professional in your feedback.`

    console.log('Sending request to Gemini API...')

    // Call Gemini API with multimodal input
    // Note: systemInstruction is passed separately in the config
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n${userPrompt}` },
            filePart,
          ],
        },
      ],
      config: {
        temperature: 0.4, // Lower temperature for more consistent analysis
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 40,
      },
    })

    // Extract response text
    const analysisText = response.text || 'No analysis generated'

    console.log('Analysis completed successfully')

    // Parse structured data from response (optional)
    const result: InspectionResult = {
      analysis: analysisText,
    }

    // Try to extract structured data if present
    try {
      // Look for score in format "Score: 85/100" or "85/100"
      const scoreMatch = analysisText.match(/(?:score|rating):\s*(\d+)(?:\/100)?/i)
      if (scoreMatch) {
        result.score = parseInt(scoreMatch[1], 10)
      }

      // Extract strengths (look for numbered or bulleted lists after "strengths")
      const strengthsMatch = analysisText.match(/strengths?:?\s*\n((?:[-•*\d.]\s*.+\n?)+)/i)
      if (strengthsMatch) {
        result.strengths = strengthsMatch[1]
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      }

      // Extract weaknesses
      const weaknessesMatch = analysisText.match(/(?:weaknesses?|areas?\s+for\s+improvement):?\s*\n((?:[-•*\d.]\s*.+\n?)+)/i)
      if (weaknessesMatch) {
        result.weaknesses = weaknessesMatch[1]
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      }

      // Extract suggestions
      const suggestionsMatch = analysisText.match(/(?:suggestions?|recommendations?):?\s*\n((?:[-•*\d.]\s*.+\n?)+)/i)
      if (suggestionsMatch) {
        result.suggestions = suggestionsMatch[1]
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      }
    } catch (parseError) {
      console.warn('Could not parse structured data from response:', parseError)
    }

    // ============================================================
    // SUPABASE LOGGING PLACEHOLDER
    // ============================================================
    // Log the inspection to Supabase for analytics and history
    try {
      const { error: logError } = await supabase
        .from('resume_inspections')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          prompt: userPrompt,
          focus_area: focusArea,
          analysis: analysisText,
          score: result.score,
          model_used: GEMINI_MODEL,
          created_at: new Date().toISOString(),
        })

      if (logError) {
        console.error('Failed to log inspection to Supabase:', logError)
        // Don't fail the request if logging fails
      } else {
        console.log('Inspection logged to Supabase successfully')
      }
    } catch (logError) {
      console.error('Error logging to Supabase:', logError)
      // Continue even if logging fails
    }
    // ============================================================

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        model: GEMINI_MODEL,
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error: any) {
    console.error('Error inspecting resume:', error)

    // Handle specific error types
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key configuration' },
        { status: 500 }
      )
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout. Please try with a smaller file.' },
        { status: 504 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Failed to inspect resume',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/inspect-resume
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Resume Inspector API',
    model: GEMINI_MODEL,
    configured: !!ai,
    supportedFormats: Object.values(SUPPORTED_MIME_TYPES),
  })
}
