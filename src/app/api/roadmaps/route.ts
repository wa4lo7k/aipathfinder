import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { RoadmapCreateSchema } from '@/lib/validations'
import { handleApiError, ApiError, ErrorCode } from '@/lib/errors'
import { generateJSON } from '@/lib/ai'
import { z } from 'zod'

const MilestoneSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimated_weeks: z.number(),
  resources: z.array(z.object({ name: z.string(), url: z.string().optional() })),
})

const RoadmapResponseSchema = z.object({
  milestones: z.array(MilestoneSchema),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new ApiError('Unauthorized', ErrorCode.AUTHENTICATION_ERROR, 401)
    }

    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

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
    const parsed = RoadmapCreateSchema.parse(body)

    // Fetch profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, experience_level, career_goals')
      .eq('id', user.id)
      .single()

    const skills = (profile?.skills || []).join(', ') || 'N/A'
    const experience = profile?.experience_level || 'N/A'
    const goals = profile?.career_goals || 'N/A'

    const prompt = `Create a personalized career roadmap for someone aiming to become a "${parsed.target_role}".

User Context:
- Current skills: ${skills}
- Experience level: ${experience}
- Career goals: ${goals}

Return a JSON object with a single key "milestones" containing an array of exactly 7 milestone objects.
Each milestone must be highly actionable, specific, and tailored to the user's current skills and goals.
Each milestone must have: title (string), description (string), estimated_weeks (number), resources (array of {name, url?}).

Output pure JSON only.`

    let milestones: z.infer<typeof MilestoneSchema>[] = []
    try {
      const generated: z.infer<typeof RoadmapResponseSchema> = await generateJSON(prompt, RoadmapResponseSchema)
      milestones = generated.milestones
    } catch (genErr) {
      console.error('Gemini roadmap generation failed:', genErr)
      // fallback milestones
      milestones = [
        { title: 'Assess Current Skills', description: 'Evaluate existing skills against target role requirements.', estimated_weeks: 2, resources: [{ name: 'Self-assessment guide' }] },
        { title: 'Learn Missing Fundamentals', description: 'Study core concepts and tools required for the target role.', estimated_weeks: 8, resources: [{ name: 'Online courses' }] },
        { title: 'Build First Project', description: 'Create a foundational project that demonstrates relevant capabilities.', estimated_weeks: 4, resources: [{ name: 'Project ideas' }] },
        { title: 'Advanced Concepts', description: 'Deep dive into complex topics and specialized tools.', estimated_weeks: 6, resources: [{ name: 'Advanced tutorials' }] },
        { title: 'Build Advanced Portfolio', description: 'Create 2 comprehensive projects demonstrating mastery.', estimated_weeks: 8, resources: [{ name: 'Portfolio guide' }] },
        { title: 'Network & Mentorship', description: 'Connect with professionals in the target field.', estimated_weeks: 4, resources: [{ name: 'LinkedIn networking' }] },
        { title: 'Apply & Interview', description: 'Start applying to roles and practice interviewing.', estimated_weeks: 6, resources: [{ name: 'Interview prep' }] },
      ]
    }

    const { data, error } = await supabase
      .from('roadmaps')
      .insert({
        user_id: user.id,
        title: parsed.title,
        target_role: parsed.target_role,
        description: parsed.description,
        milestones,
        ai_raw: { generated_milestones: milestones },
      })
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
