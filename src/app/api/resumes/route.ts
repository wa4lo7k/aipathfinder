import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient } from '@/lib/supabase'
import { ResumeUploadSchema } from '@/lib/validations'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createApiSupabaseClient(request)
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    return applyCookies(NextResponse.json({ data: data || [] }))
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return applyCookies(NextResponse.json({ error: errMsg, code }, { status }))
  }
}

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = createApiSupabaseClient(request)
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const body = await request.json()
    const parsed = ResumeUploadSchema.parse(body)

    const { data: resume, error } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: parsed.title,
        file_url: parsed.file_url,
        file_name: parsed.file_name,
        file_size: parsed.file_size ?? null,
        resume_text: parsed.resume_text ?? null,
        status: 'uploaded',
      })
      .select()
      .single()

    if (error || !resume) {
      throw new ApiError(error?.message || 'Failed to create resume', ErrorCode.DB_ERROR, 500)
    }

    // Trigger resume-analyzer edge function asynchronously
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && parsed.resume_text) {
      fetch(`${SUPABASE_URL}/functions/v1/resume-analyzer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume_id: resume.id, user_id: user.id }),
      }).catch((err) => {
        console.error('Failed to trigger resume analyzer:', err)
      })
    }

    return applyCookies(NextResponse.json({ data: resume }, { status: 201 }))
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return applyCookies(NextResponse.json({ error: errMsg, code }, { status }))
  }
}
