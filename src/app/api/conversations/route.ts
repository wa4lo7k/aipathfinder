import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ConversationCreateSchema } from '@/lib/validations'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const body = await request.json()
    const parsed = ConversationCreateSchema.parse(body)

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: parsed.title })
      .select()
      .single()

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}
