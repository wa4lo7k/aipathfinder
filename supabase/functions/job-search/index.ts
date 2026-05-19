// @ts-nocheck
// Pathfinder-AI — Job Search Edge Function (Deno)
// Proxies JSearch API via RapidAPI, normalizes & caches results.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

// ── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Types ────────────────────────────────────────────────────────────────────
interface JobSearchRequest {
  query?: string
  location?: string
  job_type?: string
  page?: number
}

interface JSearchJob {
  job_id?: string
  job_title?: string
  employer_name?: string
  job_city?: string
  job_state?: string
  job_country?: string
  job_description?: string
  job_min_salary?: number
  job_max_salary?: number
  job_salary_currency?: string
  job_employment_type?: string
  job_is_remote?: boolean
  job_apply_link?: string
  job_posted_at_datetime_utc?: string
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

/**
 * Authenticate the caller. Supports both user JWT and service role key.
 * For job-search, we don't need a specific user_id — just auth verification.
 */
async function verifyAuth(
  supabase: SupabaseClient,
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader) throw new Error('Missing Authorization header')
  const token = authHeader.replace('Bearer ', '')

  // Check if this is a service-role call from our Next.js backend
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (token === serviceKey) return null // Authenticated as service role

  // Otherwise, verify as user token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid or expired token')
  return user.id
}

function normalizeJobType(raw?: string): string | null {
  if (!raw) return null
  const lower = raw.toLowerCase()
  if (lower.includes('full')) return 'full_time'
  if (lower.includes('part')) return 'part_time'
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('intern')) return 'internship'
  if (lower.includes('freelance') || lower.includes('gig')) return 'freelance'
  return null
}

function mapJSearchToJob(row: JSearchJob, source = 'jsearch') {
  return {
    title: row.job_title || 'Untitled Job',
    company: row.employer_name || null,
    location: [row.job_city, row.job_state, row.job_country].filter(Boolean).join(', ') || null,
    description: row.job_description || null,
    salary_min: row.job_min_salary ?? null,
    salary_max: row.job_max_salary ?? null,
    salary_currency: row.job_salary_currency || 'USD',
    job_type: normalizeJobType(row.job_employment_type),
    remote: row.job_is_remote ?? false,
    source,
    external_id: row.job_id || null,
    url: row.job_apply_link || null,
    posted_date: row.job_posted_at_datetime_utc ? new Date(row.job_posted_at_datetime_utc).toISOString() : null,
    scraped_at: new Date().toISOString(),
    cached_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
    const rapidApiKey = getEnv('RAPIDAPI_KEY')
    const rapidApiHost = Deno.env.get('RAPIDAPI_HOST') || 'jsearch.p.rapidapi.com'

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    await verifyAuth(supabase, req.headers.get('authorization'))

    const body: JobSearchRequest = await req.json()
    const query = body.query || 'software engineer'
    const location = body.location || ''
    const page = Math.max(1, body.page || 1)

    // Check cache first (simple heuristic: any cached results for this query within 24h)
    const cacheThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: cachedJobs, error: cacheErr } = await supabase
      .from('jobs')
      .select('*')
      .ilike('title', `%${query}%`)
      .gt('cached_until', cacheThreshold)
      .order('posted_date', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1)

    if (!cacheErr && cachedJobs && cachedJobs.length >= 5) {
      return jsonResponse({
        data: cachedJobs,
        page,
        total: cachedJobs.length,
        source: 'cache',
      })
    }

    // Call JSearch API
    const searchParams = new URLSearchParams()
    searchParams.set('query', query)
    if (location) searchParams.set('location', location)
    searchParams.set('page', String(page))
    searchParams.set('num_pages', '1')

    const apiRes = await fetch(`https://${rapidApiHost}/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost,
      },
    })

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('RapidAPI error:', errText)
      return errorResponse('Job search API unavailable', 'EXTERNAL_API_ERROR', 502)
    }

    const apiData = await apiRes.json()
    const rawJobs: JSearchJob[] = apiData.data || []

    const normalized = rawJobs.map((j) => mapJSearchToJob(j, 'jsearch'))

    // Upsert into jobs table keyed by external_id
    if (normalized.length > 0) {
      const { error: upsertErr } = await supabase.from('jobs').upsert(normalized, {
        onConflict: 'external_id',
        ignoreDuplicates: false,
      })
      if (upsertErr) {
        console.error('Failed to upsert jobs:', upsertErr.message)
      }
    }

    return jsonResponse({
      data: normalized,
      page,
      total: apiData?.parameters?.num_pages ? apiData.parameters.num_pages * 10 : normalized.length,
      source: 'api',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Edge function error:', message)
    return errorResponse(message, 'INTERNAL_ERROR', 500)
  }
})
