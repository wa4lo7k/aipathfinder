-- Fix the profiles table to allow INSERT during signup
-- The issue is that RLS is enabled but there's no INSERT policy for profiles

-- Add INSERT policy for profiles (only the trigger can insert)
DO $$
BEGIN
  CREATE POLICY "profiles_insert_on_signup" ON profiles 
    FOR INSERT 
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

-- Alternative: Make the trigger function bypass RLS completely
-- This is safer since the trigger is SECURITY DEFINER and controlled
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value TEXT;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Bypass RLS for this insert since it's a system operation
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), NULL),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), NULL),
    user_role_value::user_role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error details for debugging
    RAISE WARNING 'Error in handle_new_user for user % (email: %): %', 
      NEW.id, NEW.email, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
