// Pathfinder-AI — Google Gemini API wrapper (REST API)

import { z } from 'zod'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GeminiRequestOptions {
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  topK?: number
}

interface GeminiContent {
  role: string
  parts: { text: string }[]
}

interface GeminiRequest {
  contents: GeminiContent[]
  systemInstruction?: { parts: { text: string }[] }
  generationConfig: {
    temperature: number
    maxOutputTokens: number
    topP: number
    topK: number
    responseMimeType?: string
  }
}

// Convert chat messages to Gemini format
function convertToGeminiFormat(messages: ChatMessage[]) {
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  const contents: GeminiContent[] = conversationMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))

  return {
    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
    contents
  }
}

async function geminiFetch(endpoint: string, body: GeminiRequest) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const url = `${GEMINI_BASE_URL}/${endpoint}?key=${GEMINI_API_KEY}`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Gemini API error (${res.status}): ${text}`)
  }

  return res.json()
}

export async function chatCompletion(
  messages: ChatMessage[],
  model: string = GEMINI_MODEL,
  options: GeminiRequestOptions = {}
): Promise<string> {
  const { systemInstruction, contents } = convertToGeminiFormat(messages)

  const body: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40,
    }
  }

  if (systemInstruction) {
    body.systemInstruction = systemInstruction
  }

  const data = await geminiFetch(`models/${model}:generateContent`, body)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function* streamCompletion(
  messages: ChatMessage[],
  model: string = GEMINI_MODEL,
  options: GeminiRequestOptions = {}
): AsyncGenerator<string, void, unknown> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const { systemInstruction, contents } = convertToGeminiFormat(messages)

  const body: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40,
    }
  }

  if (systemInstruction) {
    body.systemInstruction = systemInstruction
  }

  const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Gemini API error (${res.status}): ${text}`)
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

      try {
        const parsed = JSON.parse(dataStr)
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text
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
  model: string = GEMINI_MODEL,
  options: GeminiRequestOptions = {}
): Promise<T> {
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a structured JSON output generator. Output pure JSON only, no markdown, no code blocks, just valid JSON.' },
    { role: 'user', content: prompt },
  ]

  const { systemInstruction, contents } = convertToGeminiFormat(messages)

  const body: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.5,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40,
      responseMimeType: 'application/json',
    }
  }

  if (systemInstruction) {
    body.systemInstruction = systemInstruction
  }

  const data = await geminiFetch(`models/${model}:generateContent`, body)

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
  const parsed = JSON.parse(cleaned)
  return schema.parse(parsed)
}

export async function generateText(
  prompt: string,
  model: string = GEMINI_MODEL,
  options: GeminiRequestOptions = {}
): Promise<string> {
  const body: GeminiRequest = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40,
    }
  }

  const data = await geminiFetch(`models/${model}:generateContent`, body)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
