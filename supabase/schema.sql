-- ============================================================================
-- Pathfinder-AI — Production Database Schema
-- Idempotent. Run in Supabase SQL Editor.
-- ============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 2. ENUMS (idempotent via DO blocks)
-- =============================================================================
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'jobseeker');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'user_role already exists, skipping.';
END $$;

DO $$
BEGIN
  CREATE TYPE application_status AS ENUM ('applied', 'interview', 'offer', 'rejected');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'application_status already exists, skipping.';
END $$;

DO $$
BEGIN
  CREATE TYPE roadmap_status AS ENUM ('active', 'completed', 'paused', 'abandoned');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'roadmap_status already exists, skipping.';
END $$;

DO $$
BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'message_role already exists, skipping.';
END $$;

DO $$
BEGIN
  CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'job_type already exists, skipping.';
END $$;

DO $$
BEGIN
  CREATE TYPE resume_status AS ENUM ('uploaded', 'analyzing', 'analyzed', 'error');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'resume_status already exists, skipping.';
END $$;

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ' ')
  ) STORED,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  "current_role" TEXT,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  career_goals TEXT,
  experience_level TEXT,
  profile_score INTEGER DEFAULT 0 CHECK (profile_score >= 0 AND profile_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  tokens_used INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- career_recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  missing_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  avg_salary INTEGER,
  growth_outlook TEXT,
  time_to_ready TEXT,
  resources JSONB DEFAULT '[]',
  ai_raw JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- roadmaps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_role TEXT NOT NULL,
  description TEXT,
  milestones JSONB DEFAULT '[]',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status roadmap_status NOT NULL DEFAULT 'active',
  ai_raw JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- resumes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  resume_text TEXT,
  status resume_status NOT NULL DEFAULT 'uploaded',
  analysis JSONB DEFAULT '{}',
  ai_raw JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  job_type job_type,
  remote BOOLEAN DEFAULT FALSE,
  source TEXT NOT NULL,
  external_id TEXT,
  url TEXT,
  posted_date TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cached_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ---------------------------------------------------------------------------
-- job_applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- skill_progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency INTEGER DEFAULT 0 CHECK (proficiency >= 0 AND proficiency <= 100),
  target_proficiency INTEGER DEFAULT 100 CHECK (target_proficiency >= 0 AND target_proficiency <= 100),
  notes TEXT,
  last_practiced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

CREATE INDEX IF NOT EXISTS idx_career_recommendations_user ON career_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_career_recommendations_match ON career_recommendations(match_score);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);

CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_cached ON jobs(cached_until);
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm ON jobs USING gin (company gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

CREATE INDEX IF NOT EXISTS idx_skill_progress_user ON skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_name ON skill_progress(skill_name);

-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;

-- profiles
DO $$
BEGIN
  CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- career_recommendations
DO $$
BEGIN
  CREATE POLICY "career_recs_select_own" ON career_recommendations FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "career_recs_insert_own" ON career_recommendations FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "career_recs_delete_own" ON career_recommendations FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- conversations
DO $$
BEGIN
  CREATE POLICY "conv_select_own" ON conversations FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "conv_insert_own" ON conversations FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "conv_update_own" ON conversations FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "conv_delete_own" ON conversations FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- messages
DO $$
BEGIN
  CREATE POLICY "messages_select_own" ON messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "messages_insert_own" ON messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- roadmaps
DO $$
BEGIN
  CREATE POLICY "roadmaps_select_own" ON roadmaps FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "roadmaps_insert_own" ON roadmaps FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "roadmaps_update_own" ON roadmaps FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "roadmaps_delete_own" ON roadmaps FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- resumes
DO $$
BEGIN
  CREATE POLICY "resumes_select_own" ON resumes FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "resumes_insert_own" ON resumes FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "resumes_delete_own" ON resumes FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- job_applications
DO $$
BEGIN
  CREATE POLICY "job_apps_select_own" ON job_applications FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "job_apps_insert_own" ON job_applications FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "job_apps_update_own" ON job_applications FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "job_apps_delete_own" ON job_applications FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- skill_progress
DO $$
BEGIN
  CREATE POLICY "skill_prog_select_own" ON skill_progress FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "skill_prog_insert_own" ON skill_progress FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "skill_prog_update_own" ON skill_progress FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "skill_prog_delete_own" ON skill_progress FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- jobs is publicly readable
DO $$
BEGIN
  CREATE POLICY "jobs_select_public" ON jobs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 6. HELPER FUNCTIONS
-- =============================================================================

-- Calculate profile score (0-100) based on filled fields
CREATE OR REPLACE FUNCTION calculate_profile_score(p profiles)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  total_fields INTEGER := 10;
BEGIN
  IF p.first_name IS NOT NULL AND LENGTH(TRIM(p.first_name)) > 0 THEN score := score + 1; END IF;
  IF p.last_name IS NOT NULL AND LENGTH(TRIM(p.last_name)) > 0 THEN score := score + 1; END IF;
  IF p.role IS NOT NULL THEN score := score + 1; END IF;
  IF p.bio IS NOT NULL AND LENGTH(TRIM(p.bio)) > 0 THEN score := score + 1; END IF;
  IF p."current_role" IS NOT NULL AND LENGTH(TRIM(p."current_role")) > 0 THEN score := score + 1; END IF;
  IF p.skills IS NOT NULL AND array_length(p.skills, 1) > 0 THEN score := score + 1; END IF;
  IF p.career_goals IS NOT NULL AND LENGTH(TRIM(p.career_goals)) > 0 THEN score := score + 1; END IF;
  IF p.experience_level IS NOT NULL AND LENGTH(TRIM(p.experience_level)) > 0 THEN score := score + 1; END IF;
  IF p.avatar_url IS NOT NULL AND LENGTH(TRIM(p.avatar_url)) > 0 THEN score := score + 1; END IF;
  IF p.email IS NOT NULL AND LENGTH(TRIM(p.email)) > 0 THEN score := score + 1; END IF;
  RETURN (score * 100) / total_fields;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get user stats for dashboard
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  jobs_applied INTEGER;
  conversations_count INTEGER;
  active_roadmaps INTEGER;
  profile_pct INTEGER;
  recent_activity JSONB;
BEGIN
  SELECT COUNT(*) INTO jobs_applied FROM job_applications WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO conversations_count FROM conversations WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO active_roadmaps FROM roadmaps WHERE user_id = target_user_id AND status = 'active';
  SELECT profile_score INTO profile_pct FROM profiles WHERE id = target_user_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'type', CASE
        WHEN ta.table_name = 'job_applications' THEN 'job_applied'
        WHEN ta.table_name = 'conversations' THEN 'conversation'
        WHEN ta.table_name = 'roadmaps' THEN 'roadmap_created'
        ELSE 'activity'
      END,
      'title', ta.title,
      'created_at', ta.created_at
    )
  ) INTO recent_activity
  FROM (
    SELECT 'job_applications' AS table_name, 'Job Applied' AS title, applied_at AS created_at FROM job_applications WHERE user_id = target_user_id
    UNION ALL
    SELECT 'conversations', title, created_at FROM conversations WHERE user_id = target_user_id
    UNION ALL
    SELECT 'roadmaps', title, created_at FROM roadmaps WHERE user_id = target_user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) ta;

  RETURN jsonb_build_object(
    'jobs_applied', COALESCE(jobs_applied, 0),
    'conversations_count', COALESCE(conversations_count, 0),
    'active_roadmaps', COALESCE(active_roadmaps, 0),
    'profile_score', COALESCE(profile_pct, 0),
    'recent_activity', COALESCE(recent_activity, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_career_recs_updated_at BEFORE UPDATE ON career_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_skill_progress_updated_at BEFORE UPDATE ON skill_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-calculate profile_score on insert/update of profiles
CREATE OR REPLACE FUNCTION trigger_calculate_profile_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_score = calculate_profile_score(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER profiles_calculate_score BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profile_score();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 8. MISSING OBJECTS (added to fix 502/503 errors)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- resume_inspections (used by /api/inspect-resume route)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resume_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  prompt TEXT,
  focus_area TEXT,
  analysis TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_inspections_user ON resume_inspections(user_id);

ALTER TABLE resume_inspections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "resume_inspections_select_own" ON resume_inspections FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "resume_inspections_insert_own" ON resume_inspections FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- UNIQUE constraint on jobs.external_id (required for upsert in job-search)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE jobs ADD CONSTRAINT jobs_external_id_unique UNIQUE (external_id);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'jobs_external_id_unique already exists, skipping.';
END $$;

-- ---------------------------------------------------------------------------
-- increment_conversation_tokens RPC (used by ai-chat edge function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_conversation_tokens(conv_id UUID, added INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET token_count = COALESCE(token_count, 0) + added,
      updated_at = NOW()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

