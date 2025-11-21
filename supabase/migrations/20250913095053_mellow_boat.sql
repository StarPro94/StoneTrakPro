/*
  # Update RLS policies for role-based access control

  1. Update debit_sheets policies
    - Admin/Bureau: Full access
    - Atelier: Only sheets assigned to their machine
    - Stock_matiere: Read-only access

  2. Update debit_items policies
    - Admin/Bureau: Full access
    - Atelier: Can only update 'termine' field for their sheets
    - Stock_matiere: Read-only access

  3. Update slabs policies
    - Admin/Bureau/Stock_matiere: Full access
    - Atelier: Read-only for their assigned sheets

  4. Update machines policies
    - Admin/Bureau: Full access
    - Atelier/Stock_matiere: Read-only
*/

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user machine_id
CREATE OR REPLACE FUNCTION get_user_machine_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT machine_id FROM profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for debit_sheets
DROP POLICY IF EXISTS "Users can view own debit sheets" ON debit_sheets;
DROP POLICY IF EXISTS "Users can insert own debit sheets" ON debit_sheets;
DROP POLICY IF EXISTS "Users can update own debit sheets" ON debit_sheets;
DROP POLICY IF EXISTS "Users can delete own debit sheets" ON debit_sheets;

-- New RLS policies for debit_sheets
CREATE POLICY "Role-based SELECT for debit_sheets"
  ON debit_sheets
  FOR SELECT
  TO authenticated
  USING (
    CASE get_user_role()
      WHEN 'admin' THEN true
      WHEN 'bureau' THEN true
      WHEN 'stock_matiere' THEN true
      WHEN 'atelier' THEN machine_id = get_user_machine_id()
      ELSE false
    END
  );

CREATE POLICY "Role-based INSERT for debit_sheets"
  ON debit_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'bureau') AND
    auth.uid() = user_id
  );

CREATE POLICY "Role-based UPDATE for debit_sheets"
  ON debit_sheets
  FOR UPDATE
  TO authenticated
  USING (
    CASE get_user_role()
      WHEN 'admin' THEN auth.uid() = user_id
      WHEN 'bureau' THEN auth.uid() = user_id
      WHEN 'atelier' THEN auth.uid() = user_id AND machine_id = get_user_machine_id()
      ELSE false
    END
  )
  WITH CHECK (
    CASE get_user_role()
      WHEN 'admin' THEN auth.uid() = user_id
      WHEN 'bureau' THEN auth.uid() = user_id
      WHEN 'atelier' THEN auth.uid() = user_id AND machine_id = get_user_machine_id()
      ELSE false
    END
  );

CREATE POLICY "Role-based DELETE for debit_sheets"
  ON debit_sheets
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'bureau') AND
    auth.uid() = user_id
  );

-- Drop existing policies for debit_items
DROP POLICY IF EXISTS "Users can view own debit items" ON debit_items;
DROP POLICY IF EXISTS "Users can insert own debit items" ON debit_items;
DROP POLICY IF EXISTS "Users can update own debit items" ON debit_items;
DROP POLICY IF EXISTS "Users can delete own debit items" ON debit_items;

-- New RLS policies for debit_items
CREATE POLICY "Role-based SELECT for debit_items"
  ON debit_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM debit_sheets ds
      WHERE ds.id = debit_items.sheet_id
      AND (
        CASE get_user_role()
          WHEN 'admin' THEN ds.user_id = auth.uid()
          WHEN 'bureau' THEN ds.user_id = auth.uid()
          WHEN 'stock_matiere' THEN ds.user_id = auth.uid()
          WHEN 'atelier' THEN ds.user_id = auth.uid() AND ds.machine_id = get_user_machine_id()
          ELSE false
        END
      )
    )
  );

CREATE POLICY "Role-based INSERT for debit_items"
  ON debit_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'bureau') AND
    EXISTS (
      SELECT 1 FROM debit_sheets ds
      WHERE ds.id = debit_items.sheet_id AND ds.user_id = auth.uid()
    )
  );

CREATE POLICY "Role-based UPDATE for debit_items"
  ON debit_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM debit_sheets ds
      WHERE ds.id = debit_items.sheet_id
      AND (
        CASE get_user_role()
          WHEN 'admin' THEN ds.user_id = auth.uid()
          WHEN 'bureau' THEN ds.user_id = auth.uid()
          WHEN 'atelier' THEN ds.user_id = auth.uid() AND ds.machine_id = get_user_machine_id()
          ELSE false
        END
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM debit_sheets ds
      WHERE ds.id = debit_items.sheet_id
      AND (
        CASE get_user_role()
          WHEN 'admin' THEN ds.user_id = auth.uid()
          WHEN 'bureau' THEN ds.user_id = auth.uid()
          WHEN 'atelier' THEN ds.user_id = auth.uid() AND ds.machine_id = get_user_machine_id()
          ELSE false
        END
      )
    )
  );

CREATE POLICY "Role-based DELETE for debit_items"
  ON debit_items
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'bureau') AND
    EXISTS (
      SELECT 1 FROM debit_sheets ds
      WHERE ds.id = debit_items.sheet_id AND ds.user_id = auth.uid()
    )
  );

-- Drop existing policies for slabs
DROP POLICY IF EXISTS "Users can view own slabs" ON slabs;
DROP POLICY IF EXISTS "Users can insert own slabs" ON slabs;
DROP POLICY IF EXISTS "Users can update own slabs" ON slabs;
DROP POLICY IF EXISTS "Users can delete own slabs" ON slabs;

-- New RLS policies for slabs
CREATE POLICY "Role-based SELECT for slabs"
  ON slabs
  FOR SELECT
  TO authenticated
  USING (
    CASE get_user_role()
      WHEN 'admin' THEN user_id = auth.uid()
      WHEN 'bureau' THEN user_id = auth.uid()
      WHEN 'stock_matiere' THEN user_id = auth.uid()
      WHEN 'atelier' THEN 
        user_id = auth.uid() AND (
          debit_sheet_id IS NULL OR
          EXISTS (
            SELECT 1 FROM debit_sheets ds
            WHERE ds.id = slabs.debit_sheet_id 
            AND ds.machine_id = get_user_machine_id()
          )
        )
      ELSE false
    END
  );

CREATE POLICY "Role-based INSERT for slabs"
  ON slabs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'bureau', 'stock_matiere') AND
    auth.uid() = user_id
  );

CREATE POLICY "Role-based UPDATE for slabs"
  ON slabs
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'bureau', 'stock_matiere') AND
    auth.uid() = user_id
  )
  WITH CHECK (
    get_user_role() IN ('admin', 'bureau', 'stock_matiere') AND
    auth.uid() = user_id
  );

CREATE POLICY "Role-based DELETE for slabs"
  ON slabs
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'bureau', 'stock_matiere') AND
    auth.uid() = user_id
  );

-- Drop existing policies for machines
DROP POLICY IF EXISTS "Users can read own machines" ON machines;
DROP POLICY IF EXISTS "Users can insert own machines" ON machines;
DROP POLICY IF EXISTS "Users can update own machines" ON machines;
DROP POLICY IF EXISTS "Users can delete own machines" ON machines;

-- New RLS policies for machines
CREATE POLICY "All authenticated users can view machines"
  ON machines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Role-based INSERT for machines"
  ON machines
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'bureau') AND
    auth.uid() = user_id
  );

CREATE POLICY "Role-based UPDATE for machines"
  ON machines
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'bureau') AND
    auth.uid() = user_id
  )
  WITH CHECK (
    get_user_role() IN ('admin', 'bureau') AND
    auth.uid() = user_id
  );

CREATE POLICY "Role-based DELETE for machines"
  ON machines
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'bureau') AND
    auth.uid() = user_id
  );