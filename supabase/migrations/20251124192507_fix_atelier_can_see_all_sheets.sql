/*
  # Fix Atelier Role - Allow Viewing All Sheets

  ## Problem
  The current RLS policy only allows Atelier users to see sheets assigned to their machine.
  This is too restrictive - Atelier users should be able to VIEW all sheets from all machines,
  but only EDIT items on their own machine.

  ## Changes
  1. Update the SELECT policy for debit_sheets to allow Atelier to see ALL sheets
  2. Keep the UPDATE/DELETE restrictions in place (Admin and Bureau only)
  3. The debit_items UPDATE policy already correctly restricts Atelier to only edit items on their machine

  ## Security Impact
  - Atelier users can now VIEW all sheets (READ-ONLY for other machines)
  - Atelier users can still only EDIT items on sheets assigned to their machine
  - No security degradation - only improved visibility for planning
*/

-- Drop the existing consolidated SELECT policy
DROP POLICY IF EXISTS "Consolidated SELECT for debit_sheets" ON public.debit_sheets;

-- Create new policy that allows Atelier to see ALL sheets
CREATE POLICY "Consolidated SELECT for debit_sheets"
  ON public.debit_sheets FOR SELECT
  TO authenticated
  USING (
    -- Admin and Bureau can see all sheets
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'bureau')
    )
    OR
    -- Atelier users can see ALL sheets (not just their machine)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'atelier'
    )
    OR
    -- Stock Matière can see all sheets
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'stock_matiere'
    )
    OR
    -- Users can see their own sheets
    user_id = (SELECT auth.uid())
  );
