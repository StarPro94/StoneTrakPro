/*
  # Optimize RLS Policies - Part 1 (Core Tables)

  This migration optimizes RLS policies by wrapping auth functions in SELECT subqueries
  to prevent re-evaluation for each row, significantly improving query performance.

  ## Changes
  1. Optimize profiles table policies
  2. Optimize debit_sheets table policies
  3. Optimize slabs table policies
  4. Optimize machines table policies

  ## Performance Impact
  - Reduces CPU usage by evaluating auth functions once per query instead of per row
  - Improves query response time at scale
*/

-- Drop and recreate profiles policies with optimized auth calls
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile, admins can update any" ON public.profiles;

CREATE POLICY "Only admins can delete profiles" 
  ON public.profiles FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create their own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile, admins can update any" 
  ON public.profiles FOR UPDATE 
  TO authenticated
  USING (
    id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

-- Optimize debit_sheets INSERT policy
DROP POLICY IF EXISTS "New role-based INSERT for debit_sheets" ON public.debit_sheets;

CREATE POLICY "New role-based INSERT for debit_sheets" 
  ON public.debit_sheets FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

-- Optimize slabs INSERT policy
DROP POLICY IF EXISTS "New role-based INSERT for slabs" ON public.slabs;

CREATE POLICY "New role-based INSERT for slabs" 
  ON public.slabs FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

-- Optimize machines INSERT policy
DROP POLICY IF EXISTS "New role-based INSERT for machines" ON public.machines;

CREATE POLICY "New role-based INSERT for machines" 
  ON public.machines FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );
