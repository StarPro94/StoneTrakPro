/*
  # Allow Atelier to Update Items for Assigned Machine Orders

  ## Summary
  This migration fixes the permissions for the "atelier" role to allow them to update
  progress on orders (debit_items) that are assigned to their machine.
  
  ## Problem
  The previous migration blocked ALL updates from atelier role, but atelier users need
  to be able to:
  - Toggle item completion status (termine field)
  - Update item details for orders assigned to their machine
  
  ## Solution
  
  ### debit_items Table - UPDATE Policy
  - Admin and Bureau: Can update ALL items
  - Atelier: Can update items ONLY for orders assigned to their machine
  - Stock Matière: CANNOT update items (read-only)
  
  ### debit_sheets Table - UPDATE Policy
  - Admin and Bureau: Can update ALL sheets
  - Atelier: Can update sheets ONLY if assigned to their machine (for auto-completion when all items done)
  - Stock Matière: CANNOT update sheets (read-only)
  
  ## Security
  - Atelier can only modify data for their assigned machine
  - Database enforces machine_id check via get_user_machine_id() function
  - Frontend also enforces these restrictions for double protection
*/

-- ============================================================================
-- STEP 1: Update debit_items UPDATE policy to allow atelier
-- ============================================================================

DROP POLICY IF EXISTS "New role-based UPDATE for debit_items" ON public.debit_items;

CREATE POLICY "New role-based UPDATE for debit_items"
ON public.debit_items
FOR UPDATE
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'atelier'::user_role THEN (
      -- Atelier can update items for sheets assigned to their machine
      EXISTS (
        SELECT 1
        FROM public.debit_sheets ds
        WHERE ds.id = debit_items.sheet_id
        AND ds.machine_id = get_user_machine_id()
      )
    )
    ELSE false
  END
)
WITH CHECK (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'atelier'::user_role THEN (
      -- Atelier can update items for sheets assigned to their machine
      EXISTS (
        SELECT 1
        FROM public.debit_sheets ds
        WHERE ds.id = debit_items.sheet_id
        AND ds.machine_id = get_user_machine_id()
      )
    )
    ELSE false
  END
);

-- ============================================================================
-- STEP 2: Update debit_sheets UPDATE policy to allow atelier for their machine
-- ============================================================================

DROP POLICY IF EXISTS "New role-based UPDATE for debit_sheets" ON public.debit_sheets;

CREATE POLICY "New role-based UPDATE for debit_sheets"
ON public.debit_sheets
FOR UPDATE
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'atelier'::user_role THEN (machine_id = get_user_machine_id())
    ELSE false
  END
)
WITH CHECK (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'atelier'::user_role THEN (machine_id = get_user_machine_id())
    ELSE false
  END
);

-- ============================================================================
-- VERIFICATION: Confirm policies are correctly set
-- ============================================================================

-- Verify UPDATE policy for debit_items exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debit_items' 
    AND policyname = 'New role-based UPDATE for debit_items'
  ) THEN
    RAISE EXCEPTION 'UPDATE policy for debit_items was not created!';
  END IF;
  
  RAISE NOTICE '✓ UPDATE policy for debit_items created successfully';
END $$;

-- Verify UPDATE policy for debit_sheets exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debit_sheets' 
    AND policyname = 'New role-based UPDATE for debit_sheets'
  ) THEN
    RAISE EXCEPTION 'UPDATE policy for debit_sheets was not created!';
  END IF;
  
  RAISE NOTICE '✓ UPDATE policy for debit_sheets created successfully';
END $$;

-- Log summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Atelier role can now:';
  RAISE NOTICE '  ✓ UPDATE debit_items for their assigned machine orders';
  RAISE NOTICE '  ✓ UPDATE debit_sheets for their assigned machine orders';
  RAISE NOTICE '  ✓ View ALL orders (read-only for unassigned orders)';
  RAISE NOTICE '========================================';
END $$;
