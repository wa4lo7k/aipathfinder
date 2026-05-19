// Pathfinder-AI — Unified AI wrapper (Gemini primary, Groq fallback)

import * as gemini from './gemini'
import * as groq from './groq'
import { z } from 'zod'

const GROQ_AVAILABLE = !!process.env.GROQ_API_KEY

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
}

/**
 * Chat completion with Gemini → Groq fallback
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<string> {
  try {
    return await gemini.chatCompletion(messages, undefined, {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      topP: options.topP,
    })
  } catch (err) {
    if (!GROQ_AVAILABLE) throw err
    console.warn('[AI] Gemini chatCompletion failed, falling back to Groq:', err instanceof Error ? err.message : err)
    return await groq.chatCompletion(messages, undefined, {
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens,
      top_p: options.topP,
    })
  }
}

/**
 * Streaming chat completion with Gemini → Groq fallback
 */
export async function* streamCompletion(
  messages: ChatMessage[],
  options: AIOptions = {}
): AsyncGenerator<string, void, unknown> {
  try {
    const stream = gemini.streamCompletion(messages, undefined, {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      topP: options.topP,
    })
    for await (const chunk of stream) {
      yield chunk
    }
    return
  } catch (err) {
    if (!GROQ_AVAILABLE) throw err
    console.warn('[AI] Gemini stream failed, falling back to Groq:', err instanceof Error ? err.message : err)
  }

  const stream = groq.streamCompletion(messages, undefined, {
    temperature: options.temperature,
    max_completion_tokens: options.maxTokens,
    top_p: options.topP,
  })
  for await (const chunk of stream) {
    yield chunk
  }
}

/**
 * Structured JSON generation with Gemini → Groq fallback
 */
export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options: AIOptions = {}
): Promise<T> {
  try {
    return await gemini.generateJSON(prompt, schema, undefined, {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      topP: options.topP,
    })
  } catch (err) {
    if (!GROQ_AVAILABLE) throw err
    console.warn('[AI] Gemini generateJSON failed, falling back to Groq:', err instanceof Error ? err.message : err)
    return await groq.generateJSON(prompt, schema, undefined, {
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens,
      top_p: options.topP,
    })
  }
}

/**
 * Simple text generation with Gemini → Groq fallback
 */
export async function generateText(
  prompt: string,
  options: AIOptions = {}
): Promise<string> {
  try {
    return await gemini.generateText(prompt, undefined, {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      topP: options.topP,
    })
  } catch (err) {
    if (!GROQ_AVAILABLE) throw err
    console.warn('[AI] Gemini generateText failed, falling back to Groq:', err instanceof Error ? err.message : err)

    const messages: ChatMessage[] = [
      { role: 'user', content: prompt },
    ]
    return await groq.chatCompletion(messages, undefined, {
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens,
      top_p: options.topP,
    })
  }
}
