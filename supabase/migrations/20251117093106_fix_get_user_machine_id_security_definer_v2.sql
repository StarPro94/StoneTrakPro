/*
  # Fix get_user_machine_id Function - Add SECURITY DEFINER

  ## Problem
  The function get_user_machine_id() is not defined with SECURITY DEFINER,
  which may cause permission issues when RLS policies try to execute it.

  ## Solution
  Use CREATE OR REPLACE to update the function with SECURITY DEFINER
  without breaking dependent RLS policies.

  ## Security
  - SECURITY DEFINER allows the function to run with the privileges of the function owner
  - STABLE indicates the function doesn't modify data and returns consistent results
  - Only reads from profiles table with auth.uid() filter, which is secure
*/

-- Recreate get_user_machine_id with SECURITY DEFINER (using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.get_user_machine_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT machine_id 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_machine_id() TO authenticated;

-- Verify the function was created correctly
DO $$
DECLARE
  func_security_definer boolean;
  func_volatility text;
BEGIN
  SELECT prosecdef, provolatile INTO func_security_definer, func_volatility
  FROM pg_proc 
  WHERE proname = 'get_user_machine_id';
  
  IF NOT func_security_definer THEN
    RAISE EXCEPTION 'Function get_user_machine_id does not have SECURITY DEFINER!';
  END IF;
  
  IF func_volatility != 's' THEN
    RAISE WARNING 'Function get_user_machine_id volatility is % (expected: s for STABLE)', func_volatility;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Function get_user_machine_id updated successfully';
  RAISE NOTICE '  - SECURITY DEFINER: %', func_security_definer;
  RAISE NOTICE '  - STABLE: %', (func_volatility = 's');
  RAISE NOTICE '========================================';
END $$;
