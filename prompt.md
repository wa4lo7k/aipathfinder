
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SKELETON LOADING — GLOBAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Remove every triple-dot spinner, 'loading…' text, and circular loader.
• Replace with skeleton components that mirror the exact shape and layout of real content.
• Base <Skeleton> interface: className?, width?, height?, rounded ('sm'|'md'|'lg'|'full').
• Shimmer animation: CSS keyframe sliding background-position from -200% to 200% on a gradient.
• Light mode bg: #f0f0f0→#e0e0e0. Dark mode: #2a2a2a→#3a3a3a. Support via prefers-color-scheme or data-theme.
• No border, no shadow — flat rectangle only. Duration: 1.4s ease-in-out infinite.
• Composite components: <SkeletonCard>, <SkeletonParagraph>, <SkeletonAvatar>, <SkeletonChatBubble>.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. NEXT.JS LOADING FILES — PER PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• For every route segment in app/, create a loading.tsx with the skeleton layout for that page.
• loading.tsx must mirror the real page layout exactly: same columns, same hierarchy, same item count.
• Wrap each independently-fetched section in its own <Suspense fallback={<SkeletonX />}>.
• Do NOT wrap the entire page in a single Suspense boundary.
• Use revalidatePath() or revalidateTag() in Server Actions for server component refresh.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. AI CHAT FEATURES PAGE — SPECIAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• A) Conversation history: render <SkeletonChatBubble> items (alternating left/right) while loading.
• B) Streaming response: show typing skeleton ONLY before first token. Swap immediately on first token.
• C) Sending: optimistically append user message instantly, then show AI skeleton below it.
• D) Sidebar: independent Suspense boundary with <SkeletonSidebarItem> placeholders. Switching conversations must NOT reload the page.
• E) Use useRef to scroll to bottom after new messages. Never trigger page reload for scroll.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. PARTIAL RELOADS — ALL OTHER PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Replace every router.push() / window.location.reload() used only to refresh data.
• Server Components: use revalidatePath() or revalidateTag() in Server Actions.
• Client Components: use SWR's mutate() or React Query's invalidateQueries().
• After a mutation: show skeleton in affected section only → revalidate → replace with fresh content.
• Everything outside the section stays untouched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ACCESSIBILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Every skeleton container: aria-busy='true', aria-label='Loading…', role='status'.
• When content replaces skeleton: set aria-busy='false' on the container.
• Add aria-live='polite' on the chat message list for meaningful announcements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. DO NOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ✗ No third-party skeleton libraries (react-loading-skeleton, MUI Skeleton, etc.).
• ✗ No full-page loading state when only one section is loading.
• ✗ No window.location.reload() anywhere in the codebase.
• ✗ No empty layout flash between navigation — loading.tsx must always be filled.
• ✗ No setTimeout to fake loading states.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. SUPABASE SQL — STUDENT & JOB SEEKER TABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[student table]
• Table: students — id (uuid PK), user_id (FK → auth.users), full_name, email, avatar_url, date_of_birth, gender, nationality, current_education_level (enum: high_school | undergraduate | postgraduate | phd), field_of_study, institution_name, graduation_year, gpa, skills (text[]), interests (text[]), preferred_career_paths (text[]), learning_style (enum), availability_hours_per_week, onboarding_completed (bool), onboarding_step (int), created_at, updated_at.
• Table: student_roadmaps — id, student_id (FK), career_path_id (FK), progress_percent, milestones (jsonb), started_at, last_active_at.
• Table: student_courses — id, student_id, course_name, platform, status (not_started|in_progress|completed), completion_date.
• Table: student_certifications — id, student_id, cert_name, issuer, issued_date, expiry_date, credential_url.
• RLS: students can only read/write their own rows. Enable Row Level Security on all tables.

[job seeker table]
• Table: job_seekers — id (uuid PK), user_id (FK → auth.users), full_name, email, avatar_url, phone, date_of_birth, gender, nationality, years_of_experience, current_job_title, current_employer, employment_status (enum: employed|unemployed|freelancing|open_to_work), desired_job_titles (text[]), desired_industries (text[]), desired_locations (text[]), remote_preference (enum: remote|hybrid|onsite|any), expected_salary_min, expected_salary_max, currency, resume_url, linkedin_url, portfolio_url, skills (text[]), languages (jsonb), onboarding_completed (bool), onboarding_step (int), created_at, updated_at.
• Table: job_applications — id, job_seeker_id, job_id, company_name, job_title, applied_at, status (enum: applied|screening|interview|offer|rejected|withdrawn), notes.
• Table: job_seeker_career_paths — id, job_seeker_id, career_path_id, target_role, timeline_months, skill_gaps (text[]), recommended_courses (jsonb).
• Table: work_experiences — id, job_seeker_id, company, title, start_date, end_date, is_current, description, skills_used (text[]).
• Table: educations — id, job_seeker_id, institution, degree, field, start_year, end_year, grade.
• RLS: job_seekers can only read/write their own rows.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. ACCOUNT TYPE SELECTION & ONBOARDING SCREENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[account type selection]
• After email verification, show a full-screen account type selector: 'I am a Student' vs 'I am a Job Seeker'.
• Store selection in user_metadata and in the respective table immediately.
• Do not proceed to onboarding until account type is confirmed.

[student onboarding steps (6 screens)]
• Step 1 — Personal info: full name, date of birth, gender, nationality.
• Step 2 — Education: current level, field of study, institution, graduation year, GPA.
• Step 3 — Skills & interests: multi-select skill tags + interest tags (pre-populated from DB, searchable).
• Step 4 — Career goals: select up to 3 preferred career paths from a visual card grid.
• Step 5 — Learning preferences: learning style quiz (visual/auditory/reading/kinesthetic) + availability hours/week.
• Step 6 — Review & confirm: summary of all answers, editable inline before submit.

[job seeker onboarding steps (8 screens)]
• Step 1 — Personal info: full name, phone, date of birth, gender, nationality.
• Step 2 — Employment status & current role: status enum, current title, employer.
• Step 3 — Experience: add work experiences (company, title, dates, description). At least 1 required.
• Step 4 — Education: degree, institution, field, years.
• Step 5 — Skills & languages: multi-select skills + language proficiency pairs.
• Step 6 — Job preferences: desired titles, industries, locations, remote preference.
• Step 7 — Salary & links: salary range, currency, resume upload, LinkedIn, portfolio URL.
• Step 8 — Review & confirm: full summary, editable before submit.

[onboarding UX rules]
• Each screen is a separate React component rendered in a stepper layout with a top progress bar (step N of N).
• Persist each step to Supabase on 'Next' so progress is never lost on refresh.
• Allow going back to previous steps without losing data.
• All inputs validated client-side before advancing. Show inline field errors, not toasts.
• Stepper header is fixed; only the content area scrolls.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. POST-ONBOARDING SETUP LOADER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[accuracy-weighted progress bar]
• After the final 'Finish' click, show a full-screen setup loader — NOT a spinner, NOT a fake timer.
• Progress bar reflects actual async task completion. Each task has a real weight (see below).
• Task weights (total = 100%): Generate career roadmap 25%, Fetch matching jobs 20%, Build recommended courses list 15%, Configure AI assistant persona 15%, Set up skill gap analysis 10%, Load career path content 10%, Finalize profile scoring 5%.
• Each task runs in parallel where possible (Promise.allSettled). Progress increments only when a task resolves.
• Bar fills smoothly using CSS transitions — update percentage state in React, let CSS animate width.

[loader screen UI]
• Full-screen centered layout: logo at top, large circular or horizontal progress bar in center, current task label below bar ('Setting up your roadmap…'), percentage number prominently displayed.
• Below the bar: a live checklist of tasks — each item shows a spinner while pending, a checkmark when done.
• Tone: warm and encouraging. E.g. 'Almost there — personalizing your job matches.'
• Do NOT allow navigation away during setup. Disable browser back button via beforeunload.
• On completion, animate the bar to 100%, show a 'You're all set!' message, then auto-navigate to dashboard after 1.5s.

[pre-configured dashboard on first load]
• When the user lands on the dashboard for the first time, ALL sections are pre-populated — no empty states.
• Road map section: shows their generated roadmap with milestones expanded.
• Career paths section: 3 recommended paths rendered as cards with match % badge.
• Jobs section: first page of matched jobs pre-fetched and cached.
• Courses section: top 5 recommended courses pre-loaded.
• AI assistant: pre-configured with their profile context — first message is already personalized.
• Use React Query with initialData hydrated from server to avoid any loading flash on first render.
• Each section uses its own Suspense boundary with a skeleton fallback for subsequent refreshes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. FLOW SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 1. User signs up → email verified → account type selection screen.
• 2. Onboarding screens (6 for student, 8 for job seeker) → each step persisted to Supabase.
• 3. Final 'Finish' → post-onboarding setup loader with accuracy-weighted progress bar.
• 4. Setup completes → auto-navigate to pre-configured dashboard.
• 5. All subsequent page loads use skeleton loading (loading.tsx per route) + targeted section updates.
• 6. AI chat page never does full-page reload — all rules from section 3 apply.


i alread ran this migration script into database

-- AI Path Finder Database Setup for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    education_level VARCHAR(100) NOT NULL DEFAULT '',
    institution VARCHAR(255) NOT NULL DEFAULT '',
    major VARCHAR(255) NOT NULL DEFAULT '',
    graduation_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    gpa VARCHAR(10),
    skills TEXT[] DEFAULT '{}',
    location VARCHAR(255) NOT NULL DEFAULT '',
    linkedin_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create job_seekers table
CREATE TABLE IF NOT EXISTS job_seekers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL DEFAULT '',
    skills TEXT[] DEFAULT '{}',
    experience INTEGER NOT NULL DEFAULT 0,
    location VARCHAR(255) NOT NULL DEFAULT '',
    salary VARCHAR(255) NOT NULL DEFAULT '',
    linkedin_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    seeker_id INTEGER NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_seekers_updated_at ON job_seekers;
CREATE TRIGGER update_job_seekers_updated_at
    BEFORE UPDATE ON job_seekers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Students can view their own data"
    ON students FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Students can update their own data"
    ON students FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Create policies for job_seekers table
CREATE POLICY "Job seekers can view their own data"
    ON job_seekers FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Job seekers can update their own data"
    ON job_seekers FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Create policies for applications table
CREATE POLICY "Job seekers can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid()::text = seeker_id::text);

CREATE POLICY "Job seekers can insert their own applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid()::text = seeker_id::text);

CREATE POLICY "Job seekers can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid()::text = seeker_id::text);

-- Grant permissions
GRANT ALL ON students TO postgres, anon, authenticated, service_role;
GRANT ALL ON job_seekers TO postgres, anon, authenticated, service_role;
GRANT ALL ON applications TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

COMMENT ON TABLE students IS 'Stores student profiles and educational information';
COMMENT ON TABLE job_seekers IS 'Stores job seeker profiles and professional information';
COMMENT ON TABLE applications IS 'Tracks all job applications submitted by job seekers';

