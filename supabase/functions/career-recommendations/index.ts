// @ts-nocheck
// Pathfinder-AI — Career Recommendations Edge Function (Deno)
// Generates 5 career path recommendations via Google Gemini (with Groq fallback) and persists them.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

// ── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Types ────────────────────────────────────────────────────────────────────
interface CareerRecRequest {
  user_id: string
}

interface CareerRecommendation {
  title: string
  description: string
  match_score: number
  required_skills: string[]
  missing_skills: string[]
  avg_salary: number
  growth_outlook: string
  time_to_ready: string
  resources: { name: string; url: string; type: string }[]
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

async function fetchProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, current_role, skills, career_goals, experience_level, bio')
    .eq('id', userId)
    .single()
  if (error || !data) throw new Error('Profile not found')
  return data
}

function buildPrompt(profile: Awaited<ReturnType<typeof fetchProfile>>): string {
  return `You are an expert career advisor. Based on the following user profile, generate exactly 5 personalized career path recommendations.

User Profile:
- Name: ${profile.first_name || ''} ${profile.last_name || ''}
- Role Type: ${profile.role || 'N/A'}
- Current Role: ${profile.current_role || 'N/A'}
- Experience Level: ${profile.experience_level || 'N/A'}
- Skills: ${(profile.skills || []).join(', ') || 'N/A'}
- Career Goals: ${profile.career_goals || 'N/A'}
- Bio: ${profile.bio || 'N/A'}

Return ONLY a valid JSON array with exactly 5 objects, each with these keys:
- title (string): job title
- description (string): 2-3 sentence overview
- match_score (number 0-100): how well this fits the user
- required_skills (string[])
- missing_skills (string[]): skills the user needs to acquire
- avg_salary (number): approximate average annual salary in USD
- growth_outlook (string): e.g., "High", "Moderate", "Low"
- time_to_ready (string): e.g., "3-6 months", "1-2 years"
- resources (array of {name, url, type}): 2-3 learning resources

Do NOT wrap in markdown code blocks. Output pure JSON.`
}

async function callGemini(prompt: string, geminiApiKey: string, geminiModel: string): Promise<CareerRecommendation[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 4096,
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
  return parseRecommendations(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

async function callGroq(prompt: string, groqApiKey: string, groqModel: string): Promise<CareerRecommendation[]> {
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
      temperature: 0.6,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API error: ${text}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  return parseRecommendations(raw)
}

function parseRecommendations(rawContent: string): CareerRecommendation[] {
  const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()

  try {
    let parsed = JSON.parse(cleaned)
    // Handle case where Groq wraps in an object with a key
    if (!Array.isArray(parsed) && parsed.recommendations) {
      parsed = parsed.recommendations
    }
    if (!Array.isArray(parsed)) throw new Error('Response is not an array')
    return parsed as CareerRecommendation[]
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

    const body: CareerRecRequest = await req.json()
    const callerId = await getCallerId(supabase, req.headers.get('authorization'), body.user_id)
    const targetUserId = body.user_id || callerId

    // Fetch profile and build prompt
    const profile = await fetchProfile(supabase, targetUserId)
    const prompt = buildPrompt(profile)

    // Generate via Gemini (primary) → Groq (fallback)
    let recommendations: CareerRecommendation[]
    try {
      recommendations = await callGemini(prompt, geminiApiKey, geminiModel)
    } catch (geminiErr) {
      console.warn('[AI] Gemini failed, trying Groq fallback:', geminiErr instanceof Error ? geminiErr.message : geminiErr)
      if (!GROQ_API_KEY) throw geminiErr
      recommendations = await callGroq(prompt, GROQ_API_KEY, GROQ_MODEL)
    }

    // Prepare DB rows
    const rows = recommendations.map((rec) => ({
      user_id: targetUserId,
      title: rec.title,
      description: rec.description,
      match_score: rec.match_score,
      required_skills: rec.required_skills || [],
      missing_skills: rec.missing_skills || [],
      avg_salary: rec.avg_salary,
      growth_outlook: rec.growth_outlook,
      time_to_ready: rec.time_to_ready,
      resources: rec.resources || [],
      ai_raw: rec,
    }))

    // Delete old recommendations for user
    const { error: delErr } = await supabase
      .from('career_recommendations')
      .delete()
      .eq('user_id', targetUserId)
    if (delErr) console.error('Failed to delete old recommendations:', delErr.message)

    // Insert new recommendations
    const { data: saved, error: insertErr } = await supabase
      .from('career_recommendations')
      .insert(rows)
      .select()

    if (insertErr) {
      console.error('Failed to save recommendations:', insertErr.message)
      return errorResponse('Failed to persist recommendations', 'DB_ERROR', 500)
    }

    return jsonResponse({ data: saved || recommendations })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Edge function error:', message)
    return errorResponse(message, 'INTERNAL_ERROR', 500)
  }
})
