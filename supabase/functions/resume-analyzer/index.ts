// @ts-nocheck
// Pathfinder-AI — Resume Analyzer Edge Function (Deno)
// Analyzes resume text via Google Gemini (with Groq fallback) and persists structured analysis.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

// ── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ResumeAnalyzerRequest {
  resume_id: string
  user_id: string
}

interface ResumeAnalysis {
  overall_score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  keywords_missing: string[]
  ats_score: number
  improved_summary: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(error: string, code: string, status = 400) {
  return jsonResponse({ error, code, message: error }, status)
}

function getEnv(key: string): string {
  const value = Deno.env.get(key)
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

async function getCallerId(
  supabase: SupabaseClient,
  authHeader: string | null,
  bodyUserId?: string
): Promise<string> {
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.replace('Bearer ', '')

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (token === serviceKey) {
    if (bodyUserId) return bodyUserId
    throw new Error('Service-role call requires user_id in body')
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid or expired token')
  return user.id
}

async function fetchResume(supabase: SupabaseClient, resumeId: string, userId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('id, resume_text, status')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()
  if (error || !data) throw new Error('Resume not found or access denied')
  if (!data.resume_text || data.resume_text.trim().length === 0) {
    throw new Error('Resume text is empty. Extract text before analyzing.')
  }
  return data
}

function buildPrompt(resumeText: string): string {
  return `You are an expert resume reviewer and ATS optimization specialist.

Analyze the following resume and return ONLY a valid JSON object with these exact keys:
- overall_score (number 0-100): overall resume quality
- strengths (string[]): 3-5 specific strengths
- weaknesses (string[]): 3-5 specific weaknesses
- suggestions (string[]): 3-5 actionable improvements
- keywords_missing (string[]): important industry keywords that are missing
- ats_score (number 0-100): how well the resume will perform in Applicant Tracking Systems
- improved_summary (string): a rewritten professional summary (2-3 sentences)

Resume Text:
"""
${resumeText}
"""

Output pure JSON. Do NOT wrap in markdown code blocks.`
}

async function callGemini(prompt: string, geminiApiKey: string, geminiModel: string): Promise<ResumeAnalysis> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
      systemInstruction: {
        parts: [{ text: 'You are a structured JSON output generator. Output pure JSON only, no markdown.' }]
      }
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini API error: ${text}`)
  }

  const data = await res.json()
  return parseAnalysis(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

async function callGroq(prompt: string, groqApiKey: string, groqModel: string): Promise<ResumeAnalysis> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [
        { role: 'system', content: 'You are a structured JSON output generator. Output pure JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API error: ${text}`)
  }

  const data = await res.json()
  return parseAnalysis(data.choices?.[0]?.message?.content || '')
}

function parseAnalysis(rawContent: string): ResumeAnalysis {
  const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
  try {
    return JSON.parse(cleaned) as ResumeAnalysis
  } catch (e) {
    console.error('Failed to parse AI response. Raw:', rawContent)
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const geminiApiKey = getEnv('GEMINI_API_KEY')
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body: ResumeAnalyzerRequest = await req.json()
    const callerId = await getCallerId(supabase, req.headers.get('authorization'), body.user_id)

    if (!body.resume_id || !body.user_id) {
      return errorResponse('resume_id and user_id are required', 'VALIDATION_ERROR', 400)
    }

    // Security: caller must match user_id or be a service-role call
    if (body.user_id !== callerId) {
      return errorResponse('Unauthorized to analyze this resume', 'FORBIDDEN', 403)
    }

    // Mark as analyzing
    await supabase.from('resumes').update({ status: 'analyzing' }).eq('id', body.resume_id)

    const resume = await fetchResume(supabase, body.resume_id, body.user_id)
    const prompt = buildPrompt(resume.resume_text || '')

    // Generate via Gemini (primary) → Groq (fallback)
    let analysis: ResumeAnalysis
    try {
      analysis = await callGemini(prompt, geminiApiKey, geminiModel)
    } catch (geminiErr) {
      console.warn('[AI] Gemini failed, trying Groq fallback:', geminiErr instanceof Error ? geminiErr.message : geminiErr)
      if (!GROQ_API_KEY) throw geminiErr
      analysis = await callGroq(prompt, GROQ_API_KEY, GROQ_MODEL)
    }

    // Persist analysis
    const { data: updated, error: updErr } = await supabase
      .from('resumes')
      .update({
        analysis,
        status: 'analyzed',
        ai_raw: analysis,
      })
      .eq('id', body.resume_id)
      .select()
      .single()

    if (updErr) {
      console.error('Failed to update resume analysis:', updErr.message)
      return errorResponse('Failed to save analysis', 'DB_ERROR', 500)
    }

    return jsonResponse({ data: { analysis, resume: updated } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Edge function error:', message)

    // Try to mark resume as error
    try {
      const supabaseUrl = getEnv('SUPABASE_URL')
      const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const body = await req.clone().json().catch(() => ({}))
      if (body.resume_id) {
        await supabase.from('resumes').update({ status: 'error' }).eq('id', body.resume_id)
      }
    } catch {
      // ignore
    }

    return errorResponse(message, 'INTERNAL_ERROR', 500)
  }
})
