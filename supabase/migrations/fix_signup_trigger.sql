-- Fix the handle_new_user trigger to properly handle signup errors
-- This addresses the "Database error saving new user" issue

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value TEXT;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
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
    -- Log the error details
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
