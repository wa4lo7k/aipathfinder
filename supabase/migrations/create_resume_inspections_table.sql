-- Create resume_inspections table for logging AI resume analysis
-- This table stores all resume inspection requests and results

CREATE TABLE IF NOT EXISTS resume_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  
  -- Analysis parameters
  prompt TEXT,
  focus_area TEXT,
  
  -- Results
  analysis TEXT NOT NULL,
  score INTEGER,
  
  -- Metadata
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT resume_inspections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_inspections_user_id ON resume_inspections(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_resume_inspections_created_at ON resume_inspections(created_at DESC);

-- Enable Row Level Security
ALTER TABLE resume_inspections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own inspections
CREATE POLICY "Users can view own inspections"
  ON resume_inspections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own inspections
CREATE POLICY "Users can insert own inspections"
  ON resume_inspections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own inspections
CREATE POLICY "Users can delete own inspections"
  ON resume_inspections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE resume_inspections IS 'Stores AI-powered resume inspection logs and results';
