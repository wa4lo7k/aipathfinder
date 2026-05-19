// Pathfinder-AI — Groq SDK wrapper

import { z } from 'zod'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqRequestOptions {
  temperature?: number
  max_tokens?: number
  max_completion_tokens?: number
  top_p?: number
  stop?: string | string[] | null
  reasoning_effort?: 'low' | 'medium' | 'high'
  response_format?: { type: 'json_object' }
}

async function groqFetch(path: string, body: unknown) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const res = await fetch(`${GROQ_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Groq API error (${res.status}): ${text}`)
  }

  return res.json()
}

export async function chatCompletion(
  messages: ChatMessage[],
  model: string = GROQ_MODEL,
  options: GroqRequestOptions = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_completion_tokens: options.max_completion_tokens ?? options.max_tokens ?? 2048,
    top_p: options.top_p ?? 1,
    stop: options.stop ?? null,
  }
  if (options.reasoning_effort) {
    body.reasoning_effort = options.reasoning_effort
  }
  if (options.response_format) {
    body.response_format = options.response_format
  }
  const data = await groqFetch('/chat/completions', body)
  return data.choices?.[0]?.message?.content || ''
}

export async function* streamCompletion(
  messages: ChatMessage[],
  model: string = GROQ_MODEL,
  options: GroqRequestOptions = {}
): AsyncGenerator<string, void, unknown> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_completion_tokens: options.max_completion_tokens ?? options.max_tokens ?? 2048,
    top_p: options.top_p ?? 1,
    stop: options.stop ?? null,
    stream: true,
  }
  if (options.reasoning_effort) {
    body.reasoning_effort = options.reasoning_effort
  }

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Groq API error (${res.status}): ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('Failed to get stream reader')

  const decoder = new TextDecoder()
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
      if (dataStr === '[DONE]') return

      try {
        const parsed = JSON.parse(dataStr)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}

export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string = GROQ_MODEL,
  options: GroqRequestOptions = {}
): Promise<T> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: 'You are a structured JSON output generator. Output pure JSON only, no markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: options.temperature ?? 0.5,
    max_completion_tokens: options.max_completion_tokens ?? options.max_tokens ?? 4096,
    top_p: options.top_p ?? 1,
    stop: options.stop ?? null,
    response_format: options.response_format ?? { type: 'json_object' },
  }
  if (options.reasoning_effort) {
    body.reasoning_effort = options.reasoning_effort
  }
  const data = await groqFetch('/chat/completions', body)

  const raw = data.choices?.[0]?.message?.content || ''
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
  const parsed = JSON.parse(cleaned)
  return schema.parse(parsed)
}
