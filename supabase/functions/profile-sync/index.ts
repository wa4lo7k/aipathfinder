// @ts-nocheck
// Pathfinder-AI — Profile Sync Edge Function (Deno)
// Webhook triggered after profile update. Recalculates score and triggers recommendations if >= 80%.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

// ── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ProfileSyncRequest {
  user_id: string
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

async function triggerCareerRecommendations(supabase: SupabaseClient, userId: string, functionUrl: string, serviceKey: string) {
  try {
    const res = await fetch(`${functionUrl}/career-recommendations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    })
    return res.ok
  } catch (e) {
    console.error('Failed to trigger career-recommendations:', e)
    return false
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body: ProfileSyncRequest = await req.json()
    const callerId = await getCallerId(supabase, req.headers.get('authorization'), body.user_id)
    const targetUserId = body.user_id || callerId

    // Fetch current profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, profile_score, first_name, last_name, role, current_role, skills, career_goals, experience_level, bio, avatar_url, email')
      .eq('id', targetUserId)
      .single()

    if (profileErr || !profile) {
      return errorResponse('Profile not found', 'NOT_FOUND', 404)
    }

    // Recalculate score via DB function
    const { data: newScore, error: scoreErr } = await supabase.rpc('calculate_profile_score', {
      p: profile,
    })

    let finalScore = profile.profile_score ?? 0
    if (!scoreErr && typeof newScore === 'number') {
      finalScore = newScore
    }

    // Update profile score
    const { data: updatedProfile, error: updErr } = await supabase
      .from('profiles')
      .update({ profile_score: finalScore })
      .eq('id', targetUserId)
      .select()
      .single()

    if (updErr) {
      console.error('Failed to update profile score:', updErr.message)
      return errorResponse('Failed to update profile score', 'DB_ERROR', 500)
    }

    let triggered = false
    if (finalScore >= 80) {
      // Auto-trigger career recommendations
      const functionsUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1`
      triggered = await triggerCareerRecommendations(supabase, targetUserId, functionsUrl, supabaseServiceKey)
    }

    return jsonResponse({
      data: {
        profile: updatedProfile,
        profile_score: finalScore,
        career_recommendations_triggered: triggered,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Edge function error:', message)
    return errorResponse(message, 'INTERNAL_ERROR', 500)
  }
})
