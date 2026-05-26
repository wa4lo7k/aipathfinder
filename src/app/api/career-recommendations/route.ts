import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient } from '@/lib/supabase'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'
import { generateJSON } from '@/lib/ai'
import { z } from 'zod'

const CareerRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    match_score: z.number(),
    required_skills: z.array(z.string()),
    missing_skills: z.array(z.string()),
    avg_salary: z.number(),
    growth_outlook: z.string(),
    time_to_ready: z.string(),
    resources: z.array(z.object({
      name: z.string(),
      url: z.string().optional(),
      type: z.string().optional(),
    })),
  })),
})

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createApiSupabaseClient(request)
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { data, error } = await supabase
      .from('career_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('match_score', { ascending: false })
      .limit(10)

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

    // Fetch profile for context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, current_role, skills, career_goals, experience_level, bio')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new ApiError('Profile not found. Please complete your profile first.', ErrorCode.VALIDATION_ERROR, 400)
    }

    const prompt = `You are an expert career advisor. Based on the following user profile, generate exactly 5 personalized career path recommendations.

User Profile:
- Name: ${profile.first_name || ''} ${profile.last_name || ''}
- Role Type: ${profile.role || 'N/A'}
- Current Role: ${profile.current_role || 'N/A'}
- Experience Level: ${profile.experience_level || 'N/A'}
- Skills: ${(profile.skills || []).join(', ') || 'N/A'}
- Career Goals: ${profile.career_goals || 'N/A'}
- Bio: ${profile.bio || 'N/A'}

Return a JSON object with a single key "recommendations" containing an array of exactly 5 objects, each with these keys:
- title (string): job title
- description (string): 2-3 sentence overview
- match_score (number 0-100): how well this fits the user
- required_skills (string[]): skills needed for this role
- missing_skills (string[]): skills the user needs to acquire
- avg_salary (number): approximate average annual salary in USD
- growth_outlook (string): e.g., "High", "Moderate", "Low"
- time_to_ready (string): e.g., "3-6 months", "1-2 years"
- resources (array of {name, url?, type?}): 2-3 learning resources

Output pure JSON only.`

    let recommendations: z.infer<typeof CareerRecommendationSchema>['recommendations']
    try {
      const generated = await generateJSON(prompt, CareerRecommendationSchema)
      recommendations = generated.recommendations
    } catch (genErr) {
      console.error('AI career recommendations generation failed:', genErr)
      throw new ApiError('Failed to generate career recommendations. Please try again.', ErrorCode.AI_SERVICE_ERROR, 502)
    }

    // Prepare DB rows
    const rows = recommendations.map((rec) => ({
      user_id: user.id,
      title: rec.title,
      description: rec.description,
      match_score: rec.match_score,
      required_skills: rec.required_skills || [],
      missing_skills: rec.missing_skills || [],
      avg_salary: rec.avg_salary,
      growth_outlook: rec.growth_outlook,
      time_to_ready: rec.time_to_ready,
      resources: rec.resources || [],
      ai_raw: rec,
    }))

    // Delete old recommendations for user
    const { error: delErr } = await supabase
      .from('career_recommendations')
      .delete()
      .eq('user_id', user.id)
    if (delErr) console.error('Failed to delete old recommendations:', delErr.message)

    // Insert new recommendations
    const { data: saved, error: insertErr } = await supabase
      .from('career_recommendations')
      .insert(rows)
      .select()

    if (insertErr) {
      console.error('Failed to save recommendations:', insertErr.message)
      throw new ApiError('Failed to persist recommendations', ErrorCode.DB_ERROR, 500)
    }

    return applyCookies(NextResponse.json({ data: saved || recommendations }, { status: 201 }))
  } catch (error) {
    const { error: errMsg, code, status } = handleApiError(error)
    return applyCookies(NextResponse.json({ error: errMsg, code }, { status }))
  }
}

