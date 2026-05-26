-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/read/delete their own resume files
-- Supabase automatically sets owner = auth.uid() on upload
DO $$
BEGIN
  CREATE POLICY "resumes_upload_own"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "resumes_select_own"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resumes' AND owner = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "resumes_delete_own"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'resumes' AND owner = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
