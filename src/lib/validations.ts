// Pathfinder-AI — Zod validation schemas

import { z } from 'zod'

export const ProfileUpdateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: z.enum(['student', 'jobseeker']).optional(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  current_role: z.string().max(200).optional().nullable(),
  skills: z.array(z.string().min(1)).max(50).optional(),
  career_goals: z.string().max(2000).optional().nullable(),
  experience_level: z.string().max(100).optional().nullable(),
})

export const ConversationCreateSchema = z.object({
  title: z.string().min(1).max(200).default('New Conversation'),
})

export const MessageCreateSchema = z.object({
  message: z.string().min(1).max(10000),
})

export const JobSearchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional(),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']).optional(),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
})

export const RoadmapCreateSchema = z.object({
  title: z.string().min(1).max(200),
  target_role: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
})

export const ResumeUploadSchema = z.object({
  title: z.string().min(1).max(200),
  file_url: z.string().url(),
  file_name: z.string().min(1).max(500),
  file_size: z.coerce.number().int().min(1).optional(),
  resume_text: z.string().max(50000).optional().nullable(),
})

export const JobApplicationCreateSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(['applied', 'interview', 'offer', 'rejected']).optional().default('applied'),
  notes: z.string().max(5000).optional().nullable(),
})

export const SkillProgressSchema = z.object({
  skill_name: z.string().min(1).max(200),
  proficiency: z.coerce.number().int().min(0).max(100).optional().default(0),
  target_proficiency: z.coerce.number().int().min(0).max(100).optional().default(100),
  notes: z.string().max(2000).optional().nullable(),
})
