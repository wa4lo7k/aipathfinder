import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { MessageCreateSchema } from '@/lib/validations'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface RouteContext {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const conversationId = params.id

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!conv) {
      throw new ApiError('Conversation not found', ErrorCode.NOT_FOUND, 404)
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const conversationId = params.id
    const body = await request.json()
    const parsed = MessageCreateSchema.parse(body)

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!conv) {
      throw new ApiError('Conversation not found', ErrorCode.NOT_FOUND, 404)
    }

    // If edge function is configured, proxy to ai-chat for streaming
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: parsed.message,
            user_id: user.id,
          }),
        })

        if (!res.ok) {
          const text = await res.text().catch(() => 'Unknown error')
          console.error('AI chat edge function error:', text)
          // Fall through to fallback instead of throwing
        } else {
          // If edge function returns SSE stream, forward it
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('text/event-stream')) {
            return new Response(res.body, {
              status: 200,
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
              },
            })
          }

          const result = await res.json()
          return NextResponse.json(result, { status: 201 })
        }
      } catch (edgeFunctionError) {
        console.error('Edge function call failed:', edgeFunctionError)
        // Fall through to fallback
      }
    }

    // Fallback: Use unified AI wrapper (Gemini → Groq) directly from Next.js API route
    const { generateText } = await import('@/lib/ai')
    
    // Fetch conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, current_role, skills, career_goals, experience_level')
      .eq('id', user.id)
      .single()

    let profileContext = ''
    if (profile) {
      const parts: string[] = []
      if (profile.first_name) parts.push(`Name: ${profile.first_name} ${profile.last_name || ''}`)
      if (profile.role) parts.push(`Role type: ${profile.role}`)
      if (profile.current_role) parts.push(`Current role: ${profile.current_role}`)
      if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(', ')}`)
      if (profile.career_goals) parts.push(`Career goals: ${profile.career_goals}`)
      if (profile.experience_level) parts.push(`Experience level: ${profile.experience_level}`)
      profileContext = parts.length ? `User Profile:\n${parts.join('\n')}\n\n` : ''
    }

    const systemPrompt = 
      `You are Pathfinder-AI, an expert AI career companion. ` +
      `You provide personalized, actionable career advice. ` +
      `Be concise, supportive, and data-driven. ` +
      `When appropriate, suggest next steps, learning resources, or job-search tactics.\n\n` +
      profileContext

    // Build conversation history
    let conversationHistory = systemPrompt
    if (messages && messages.length > 0) {
      conversationHistory += '\n\nConversation History:\n'
      messages.forEach((msg: any) => {
        conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
      })
    }
    conversationHistory += `\nUser: ${parsed.message}\nAssistant:`

    // Generate AI response
    const aiResponse = await generateText(conversationHistory)

    // Save both messages
    await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        role: 'user',
        content: parsed.message,
      },
      {
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      }
    ])

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ 
      data: { 
        user_message: parsed.message, 
        assistant_message: aiResponse 
      } 
    }, { status: 201 })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const conversationId = params.id

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!conv) {
      throw new ApiError('Conversation not found', ErrorCode.NOT_FOUND, 404)
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}
