import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { data, error } = await supabase.rpc('get_user_stats', {
      target_user_id: user.id,
    })

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    return NextResponse.json({ data })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}
