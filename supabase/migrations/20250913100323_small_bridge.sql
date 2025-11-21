/*
  # Temporarily Relax RLS Policies

  This migration temporarily relaxes the Row Level Security policies to fix the infinite loading issue.
  
  ## Changes Made
  1. **debit_sheets SELECT policy**: Allow all authenticated users to view all records
  2. **debit_items SELECT policy**: Allow all authenticated users to view all records
  3. **slabs SELECT policy**: Allow all authenticated users to view all records
  
  ## Why This Is Needed
  - Users without proper role/machine assignments are blocked by strict RLS policies
  - This prevents the application from loading any data
  - Once the app loads, admin can assign proper roles via the UI
  
  ## Security Note
  This is a TEMPORARY measure. Once roles are properly assigned, we should restore
  the original restrictive policies for better security.
*/

-- Temporarily relax SELECT policy for debit_sheets
DROP POLICY IF EXISTS "Role-based SELECT for debit_sheets" ON debit_sheets;

CREATE POLICY "Temporary SELECT for debit_sheets"
  ON debit_sheets
  FOR SELECT
  TO authenticated
  USING (true);

-- Temporarily relax SELECT policy for debit_items  
DROP POLICY IF EXISTS "Role-based SELECT for debit_items" ON debit_items;

CREATE POLICY "Temporary SELECT for debit_items"
  ON debit_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Temporarily relax SELECT policy for slabs
DROP POLICY IF EXISTS "Role-based SELECT for slabs" ON slabs;

CREATE POLICY "Temporary SELECT for slabs"
  ON slabs
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep other policies (INSERT, UPDATE, DELETE) as they are
-- Only SELECT policies are relaxed to allow data loading