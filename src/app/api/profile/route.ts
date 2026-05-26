import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient } from '@/lib/supabase'
import { ProfileUpdateSchema } from '@/lib/validations'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createApiSupabaseClient(request)
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    if (!profile) {
      throw new ApiError('Profile not found', ErrorCode.NOT_FOUND, 404)
    }

    return applyCookies(NextResponse.json({ data: profile }))
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return applyCookies(NextResponse.json({ error: errMsg, code }, { status }))
  }
}

export async function PUT(request: NextRequest) {
  const { supabase, applyCookies } = createApiSupabaseClient(request)
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const body = await request.json()
    const parsed = ProfileUpdateSchema.parse(body)

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(parsed)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    if (!profile) {
      throw new ApiError('Profile not found', ErrorCode.NOT_FOUND, 404)
    }

    return applyCookies(NextResponse.json({ data: profile }))
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return applyCookies(NextResponse.json({ error: errMsg, code }, { status }))
  }
}
