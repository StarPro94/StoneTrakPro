/*
  # Create RLS Helper Functions

  This migration creates the helper functions needed for Row Level Security policies.
  
  1. Helper Functions
     - `get_user_role()` - Returns the role of the current authenticated user
     - `get_user_machine_id()` - Returns the machine_id of the current authenticated user
     - `uid()` - Alias for auth.uid() for convenience
  
  2. Security
     - Functions are marked as SECURITY DEFINER to run with elevated privileges
     - Functions are stable and can be used in RLS policies
*/

-- Helper function to get current user ID (alias for auth.uid())
CREATE OR REPLACE FUNCTION public.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'atelier'::user_role
  );
$$;

-- Helper function to get the current user's machine_id
CREATE OR REPLACE FUNCTION public.get_user_machine_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT machine_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_machine_id() TO authenticated;