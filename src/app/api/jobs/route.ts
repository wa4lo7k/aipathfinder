import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { JobSearchSchema } from '@/lib/validations'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'
import { searchJobs } from '@/lib/rapidapi'

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

function mapJSearchToJob(row: any, source = 'jsearch') {
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

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const location = searchParams.get('location') || ''
    const jobType = searchParams.get('job_type') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

    // Try cached results first
    const cacheThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    let dbQuery = supabase
      .from('jobs')
      .select('*')
      .gt('cached_until', cacheThreshold)
      .order('posted_date', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1)

    if (query) {
      dbQuery = dbQuery.ilike('title', `%${query}%`)
    }
    if (location) {
      dbQuery = dbQuery.ilike('location', `%${location}%`)
    }
    if (jobType) {
      dbQuery = dbQuery.eq('job_type', jobType)
    }

    const { data, error } = await dbQuery

    if (error) {
      throw new ApiError(error.message, ErrorCode.DB_ERROR, 500)
    }

    const jobs = data || []

    // If insufficient cache, try direct API
    if (jobs.length < 3) {
      try {
        const result: any = await searchJobs(query || 'software engineer', location || undefined, page)
        const rawJobs = result.data || []
        const normalized = rawJobs.map((j: any) => mapJSearchToJob(j, 'jsearch'))
        
        if (normalized.length > 0) {
          // Upsert silently
          const { error: upsertErr } = await supabase.from('jobs').upsert(normalized, {
            onConflict: 'external_id',
            ignoreDuplicates: false,
          })
          if (upsertErr) console.error('Failed to upsert jobs:', upsertErr.message)
        }
        
        return NextResponse.json({
          data: normalized,
          page,
          total: result?.parameters?.num_pages ? result.parameters.num_pages * 10 : normalized.length,
          source: 'api',
        })
      } catch (apiError) {
        console.error('RapidAPI search failed:', apiError)
        // If API fails but we have some cached jobs, return them, else throw
        if (jobs.length > 0) {
           return NextResponse.json({ data: jobs, page, source: 'cache_fallback' })
        }
        throw new ApiError('Failed to search jobs', ErrorCode.EXTERNAL_API_ERROR, 502)
      }
    }

    return NextResponse.json({ data: jobs, page, source: 'cache' })
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
    const parsed = JobSearchSchema.parse(body)

    const result: any = await searchJobs(parsed.query || 'software engineer', parsed.location || undefined, parsed.page)
    const rawJobs = result.data || []
    const normalized = rawJobs.map((j: any) => mapJSearchToJob(j, 'jsearch'))
    
    if (normalized.length > 0) {
      const { error: upsertErr } = await supabase.from('jobs').upsert(normalized, {
        onConflict: 'external_id',
        ignoreDuplicates: false,
      })
      if (upsertErr) console.error('Failed to upsert jobs:', upsertErr.message)
    }

    return NextResponse.json({
      data: normalized,
      page: parsed.page,
      total: result?.parameters?.num_pages ? result.parameters.num_pages * 10 : normalized.length,
      source: 'api',
    })
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return NextResponse.json({ error: errMsg, code }, { status })
  }
}
