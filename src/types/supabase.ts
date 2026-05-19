export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'jobseeker'
export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected'
export type RoadmapStatus = 'active' | 'completed' | 'paused' | 'abandoned'
export type MessageRole = 'user' | 'assistant' | 'system'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
export type ResumeStatus = 'uploaded' | 'analyzing' | 'analyzed' | 'error'

// ── Helper Generics ────────────────────────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Insert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Update<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// ── Database ───────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          role: UserRole
          avatar_url: string | null
          bio: string | null
          current_role: string | null
          skills: string[]
          career_goals: string | null
          experience_level: string | null
          profile_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          bio?: string | null
          current_role?: string | null
          skills?: string[]
          career_goals?: string | null
          experience_level?: string | null
          profile_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          bio?: string | null
          current_role?: string | null
          skills?: string[]
          career_goals?: string | null
          experience_level?: string | null
          profile_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          token_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          token_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          token_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: MessageRole
          content: string
          tokens_used: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role?: MessageRole
          content: string
          tokens_used?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: MessageRole
          content?: string
          tokens_used?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      career_recommendations: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          match_score: number | null
          required_skills: string[]
          missing_skills: string[]
          avg_salary: number | null
          growth_outlook: string | null
          time_to_ready: string | null
          resources: Json
          ai_raw: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          match_score?: number | null
          required_skills?: string[]
          missing_skills?: string[]
          avg_salary?: number | null
          growth_outlook?: string | null
          time_to_ready?: string | null
          resources?: Json
          ai_raw?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          match_score?: number | null
          required_skills?: string[]
          missing_skills?: string[]
          avg_salary?: number | null
          growth_outlook?: string | null
          time_to_ready?: string | null
          resources?: Json
          ai_raw?: Json
          created_at?: string
          updated_at?: string
        }
      }
      roadmaps: {
        Row: {
          id: string
          user_id: string
          title: string
          target_role: string
          description: string | null
          milestones: Json
          progress: number
          status: RoadmapStatus
          ai_raw: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_role: string
          description?: string | null
          milestones?: Json
          progress?: number
          status?: RoadmapStatus
          ai_raw?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_role?: string
          description?: string | null
          milestones?: Json
          progress?: number
          status?: RoadmapStatus
          ai_raw?: Json
          created_at?: string
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          file_url: string
          file_name: string
          file_size: number | null
          resume_text: string | null
          status: ResumeStatus
          analysis: Json
          ai_raw: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_url: string
          file_name: string
          file_size?: number | null
          resume_text?: string | null
          status?: ResumeStatus
          analysis?: Json
          ai_raw?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_url?: string
          file_name?: string
          file_size?: number | null
          resume_text?: string | null
          status?: ResumeStatus
          analysis?: Json
          ai_raw?: Json
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          company: string | null
          location: string | null
          description: string | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          job_type: JobType | null
          remote: boolean
          source: string
          external_id: string | null
          url: string | null
          posted_date: string | null
          scraped_at: string
          cached_until: string
        }
        Insert: {
          id?: string
          title: string
          company?: string | null
          location?: string | null
          description?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          job_type?: JobType | null
          remote?: boolean
          source: string
          external_id?: string | null
          url?: string | null
          posted_date?: string | null
          scraped_at?: string
          cached_until?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string | null
          location?: string | null
          description?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          job_type?: JobType | null
          remote?: boolean
          source?: string
          external_id?: string | null
          url?: string | null
          posted_date?: string | null
          scraped_at?: string
          cached_until?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: ApplicationStatus
          applied_at: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          status?: ApplicationStatus
          applied_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          status?: ApplicationStatus
          applied_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skill_progress: {
        Row: {
          id: string
          user_id: string
          skill_name: string
          proficiency: number
          target_proficiency: number
          notes: string | null
          last_practiced: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_name: string
          proficiency?: number
          target_proficiency?: number
          notes?: string | null
          last_practiced?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_name?: string
          proficiency?: number
          target_proficiency?: number
          notes?: string | null
          last_practiced?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_user_stats: {
        Args: { target_user_id: string }
        Returns: Json
      }
      calculate_profile_score: {
        Args: { p: Tables<'profiles'> }
        Returns: number
      }
    }
    Enums: {
      user_role: UserRole
      application_status: ApplicationStatus
      roadmap_status: RoadmapStatus
      message_role: MessageRole
      job_type: JobType
      resume_status: ResumeStatus
    }
  }
}
