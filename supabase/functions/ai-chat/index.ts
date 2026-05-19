// @ts-nocheck
// Pathfinder-AI — AI Chat Edge Function (Deno)
// Streams Google Gemini LLM response with user profile context.
// Falls back to Groq if Gemini fails.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

// ── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatRequest {
  conversation_id: string
  message: string
  user_id: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(extraHeaders || {}) },
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

/**
 * Authenticate the caller. Supports both:
 * 1. User JWT tokens (from direct client calls)
 * 2. Service role key (from Next.js API routes) — trusts user_id from body
 */
async function getCallerId(
  supabase: SupabaseClient,
  authHeader: string | null,
  bodyUserId?: string
): Promise<string> {
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.replace('Bearer ', '')

  // Check if this is a service-role call from our Next.js backend
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (token === serviceKey) {
    if (bodyUserId) return bodyUserId
    throw new Error('Service-role call requires user_id in body')
  }

  // Otherwise, verify as user token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid or expired token')
  return user.id
}

async function fetchProfileContext(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, current_role, skills, career_goals, experience_level')
    .eq('id', userId)
    .single()

  if (error || !data) return ''

  const parts: string[] = []
  if (data.first_name) parts.push(`Name: ${data.first_name} ${data.last_name || ''}`)
  if (data.role) parts.push(`Role type: ${data.role}`)
  if (data.current_role) parts.push(`Current role: ${data.current_role}`)
  if (data.skills?.length) parts.push(`Skills: ${data.skills.join(', ')}`)
  if (data.career_goals) parts.push(`Career goals: ${data.career_goals}`)
  if (data.experience_level) parts.push(`Experience level: ${data.experience_level}`)

  return parts.length ? `User Profile:\n${parts.join('\n')}\n\n` : ''
}

async function fetchLastMessages(supabase: SupabaseClient, conversationId: string, limit = 10): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data.reverse().map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

async function saveMessage(
  supabase: SupabaseClient,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed?: number
) {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
    tokens_used: tokensUsed ?? null,
  })
  if (error) console.error('Failed to save message:', error.message)
}

async function updateConversationTokens(supabase: SupabaseClient, conversationId: string, tokens: number) {
  const { error } = await supabase.rpc('increment_conversation_tokens', {
    conv_id: conversationId,
    added: tokens,
  })
  if (error) {
    // Fallback if RPC doesn't exist
    const { error: updErr } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
    if (updErr) console.error('Failed to update conversation:', updErr.message)
  }
}

// ── AI Providers ─────────────────────────────────────────────────────────────

function buildGeminiStreamUrl(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
}

function buildGroqStreamBody(messages: ChatMessage[], systemPrompt: string, model: string) {
  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
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
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body: ChatRequest = await req.json()
    const userId = await getCallerId(supabase, req.headers.get('authorization'), body.user_id)

    if (!body.conversation_id || !body.message) {
      return errorResponse('conversation_id and message are required', 'VALIDATION_ERROR', 400)
    }

    // Verify the conversation belongs to the user
    const { data: convCheck, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', body.conversation_id)
      .eq('user_id', userId)
      .single()

    if (convErr || !convCheck) {
      return errorResponse('Conversation not found or access denied', 'NOT_FOUND', 404)
    }

    // Save user message
    await saveMessage(supabase, body.conversation_id, 'user', body.message)

    // Build context
    const profileContext = await fetchProfileContext(supabase, userId)
    const history = await fetchLastMessages(supabase, body.conversation_id, 10)

    const systemPrompt =
      `You are Pathfinder-AI, an expert AI career companion. ` +
      `You provide personalized, actionable career advice. ` +
      `Be concise, supportive, and data-driven. ` +
      `When appropriate, suggest next steps, learning resources, or job-search tactics.\n\n` +
      profileContext

    // Convert to Gemini format
    const geminiContents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
    geminiContents.push({ role: 'user', parts: [{ text: body.message }] })

    // ── Try Gemini first ──
    let aiRes: Response | null = null
    let useGroq = false

    try {
      const geminiUrl = buildGeminiStreamUrl(GEMINI_MODEL, geminiApiKey)
      aiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      })

      if (!aiRes.ok) {
        const errText = await aiRes.text()
        console.error('Gemini API error:', errText)
        useGroq = true
      }
    } catch (geminiErr) {
      console.error('Gemini request failed:', geminiErr)
      useGroq = true
    }

    // ── Fallback to Groq if Gemini failed ──
    if (useGroq) {
      if (!GROQ_API_KEY) {
        return errorResponse('AI service unavailable (Gemini failed, Groq not configured)', 'AI_SERVICE_ERROR', 502)
      }

      console.log('[AI] Falling back to Groq for streaming chat')
      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: body.message },
      ]

      aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        }),
      })

      if (!aiRes || !aiRes.ok) {
        const errText = aiRes ? await aiRes.text() : 'No response'
        console.error('Groq API error:', errText)
        return errorResponse('AI service unavailable', 'AI_SERVICE_ERROR', 502)
      }
    }

    const reader = aiRes!.body?.getReader()
    if (!reader) {
      return errorResponse('Failed to start AI stream', 'STREAM_ERROR', 500)
    }

    let assistantContent = ''
    let tokenEstimate = 0
    const isGroqStream = useGroq

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        try {
          let buffer = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const dataStr = trimmed.replace(/^data:\s*/, '').trim()

              if (dataStr === '[DONE]') continue

              try {
                const data = JSON.parse(dataStr)
                let delta: string | undefined

                if (isGroqStream) {
                  // Groq uses OpenAI-compatible SSE format
                  delta = data.choices?.[0]?.delta?.content
                } else {
                  // Gemini SSE format
                  delta = data.candidates?.[0]?.content?.parts?.[0]?.text
                }

                if (delta) {
                  assistantContent += delta
                  tokenEstimate += 1
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
                }
              } catch {
                // Ignore malformed SSE lines
              }
            }
          }

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
          controller.close()

          // Persist assistant reply after stream ends
          await saveMessage(supabase, body.conversation_id, 'assistant', assistantContent, tokenEstimate)
          await updateConversationTokens(supabase, body.conversation_id, tokenEstimate)
        } catch (e) {
          console.error('Stream error:', e)
          controller.error(e)
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Edge function error:', message)
    return errorResponse(message, 'INTERNAL_ERROR', 500)
  }
})
