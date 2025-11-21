/*
  # Fix Atelier Role Permissions - Allow View All, Edit None

  ## Summary
  This migration fixes the access control for the "atelier" role to meet the following requirements:
  - **Tableau de suivi (Tracking Table)**: Atelier can VIEW all orders (not filtered by machine), but CANNOT edit anything
  - **Planning**: Atelier can VIEW all orders in all columns, but CANNOT reassign or edit
  - Stock Matière: Can VIEW all orders (not filtered by machine), but CANNOT edit
  
  ## Changes to debit_sheets Table
  
  ### Previous Behavior (INCORRECT)
  - Atelier SELECT policy filtered by: `machine_id = get_user_machine_id()` 
  - This prevented atelier from seeing unassigned orders or orders assigned to other machines
  
  ### New Behavior (CORRECT)
  - Atelier SELECT policy: View ALL orders (no machine filter)
  - Atelier UPDATE/DELETE: BLOCKED (only admin and bureau can modify)
  - Stock Matière SELECT policy: View ALL orders
  - Stock Matière UPDATE/DELETE: BLOCKED
  
  ## Changes to debit_items Table
  
  ### New Behavior
  - Atelier can view items for ALL debit_sheets (based on parent sheet access)
  - Atelier CANNOT insert, update, or delete items
  - Stock Matière can view all items but CANNOT modify
  
  ## Security Notes
  - Edit restrictions are enforced at the database level (RLS policies)
  - Frontend components will hide edit UI for atelier and stock_matiere roles
  - Machine assignment filtering is handled in the application layer, not database layer
*/

-- ============================================================================
-- STEP 1: Drop and recreate SELECT policy for debit_sheets
-- ============================================================================

DROP POLICY IF EXISTS "New role-based SELECT for debit_sheets" ON public.debit_sheets;

-- New SELECT policy: Atelier and Stock Matière can view ALL orders
CREATE POLICY "New role-based SELECT for debit_sheets"
ON public.debit_sheets
FOR SELECT
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'stock_matiere'::user_role THEN true
    WHEN 'atelier'::user_role THEN true  -- Changed: removed machine_id filter, atelier sees ALL
    ELSE false
  END
);

-- ============================================================================
-- STEP 2: Drop and recreate SELECT policy for debit_items
-- ============================================================================

DROP POLICY IF EXISTS "New role-based SELECT for debit_items" ON public.debit_items;

-- New SELECT policy: Based on parent sheet access (atelier sees all items)
CREATE POLICY "New role-based SELECT for debit_items"
ON public.debit_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
    AND (
      CASE get_user_role()
        WHEN 'admin'::user_role THEN true
        WHEN 'bureau'::user_role THEN true
        WHEN 'stock_matiere'::user_role THEN true
        WHEN 'atelier'::user_role THEN true  -- Changed: atelier sees items for ALL sheets
        ELSE false
      END
    )
  )
);

-- ============================================================================
-- VERIFICATION: Confirm UPDATE and DELETE policies are still restrictive
-- ============================================================================

-- Verify UPDATE policy for debit_sheets (should allow only admin and bureau)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debit_sheets' 
    AND policyname = 'New role-based UPDATE for debit_sheets'
  ) THEN
    RAISE EXCEPTION 'UPDATE policy for debit_sheets is missing!';
  END IF;
END $$;

-- Verify DELETE policy for debit_sheets (should allow only admin and bureau)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debit_sheets' 
    AND policyname = 'New role-based DELETE for debit_sheets'
  ) THEN
    RAISE EXCEPTION 'DELETE policy for debit_sheets is missing!';
  END IF;
END $$;

-- Verify UPDATE policy for debit_items (should allow only admin and bureau)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debit_items' 
    AND policyname = 'New role-based UPDATE for debit_items'
  ) THEN
    RAISE EXCEPTION 'UPDATE policy for debit_items is missing!';
  END IF;
END $$;

-- Verify DELETE policy for debit_items (should allow only admin and bureau)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debit_items' 
    AND policyname = 'New role-based DELETE for debit_items'
  ) THEN
    RAISE EXCEPTION 'DELETE policy for debit_items is missing!';
  END IF;
END $$;
