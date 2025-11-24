/*
  # Add CMUP (Coût Moyen Unitaire Pondéré) and Make Ref Required

  1. Changes to materials table
    - Add `cmup` column (numeric with 3 decimal precision) to store average unit cost (HT price)
    - Update existing materials without ref to have auto-generated references
    - Make `ref` column NOT NULL and UNIQUE
    - Add indexes for performance optimization

  2. New Tables
    - `material_cmup_history` to track CMUP changes over time
      - Stores old and new CMUP values
      - Tracks who made the change and when
      - Records the source (import/manual/system)
      - Allows notes for manual changes

  3. Functions and Triggers
    - `track_cmup_changes()` function to automatically log CMUP modifications
    - Trigger on materials table to call the function after updates

  4. Security
    - Enable RLS on material_cmup_history table
    - Allow authenticated users to view CMUP history
    - Only allow inserts through the trigger or manual updates

  5. Notes
    - CMUP is nullable as some materials may not have a cost defined
    - Existing materials without ref will get "MAT-{uuid_prefix}" format
    - History tracking is automatic and transparent to users
    - All prices are stored as HT (Hors Taxes)
*/

-- Add CMUP column to materials table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'cmup'
  ) THEN
    ALTER TABLE materials ADD COLUMN cmup numeric(10, 3);
    CREATE INDEX IF NOT EXISTS idx_materials_cmup ON materials(cmup) WHERE cmup IS NOT NULL;
  END IF;
END $$;

-- Update materials without ref to have auto-generated references
UPDATE materials
SET ref = 'MAT-' || substring(id::text, 1, 8)
WHERE ref IS NULL OR ref = '';

-- Make ref column NOT NULL and UNIQUE
DO $$
BEGIN
  -- Only alter if not already NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials'
    AND column_name = 'ref'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE materials ALTER COLUMN ref SET NOT NULL;
  END IF;
END $$;

-- Add unique constraint on ref if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'materials_ref_unique'
  ) THEN
    ALTER TABLE materials ADD CONSTRAINT materials_ref_unique UNIQUE(ref);
  END IF;
END $$;

-- Create material_cmup_history table
CREATE TABLE IF NOT EXISTS material_cmup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  old_cmup numeric(10, 3),
  new_cmup numeric(10, 3),
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id),
  source text CHECK (source IN ('import', 'manual', 'system')),
  notes text
);

-- Add indexes for CMUP history queries
CREATE INDEX IF NOT EXISTS idx_cmup_history_material ON material_cmup_history(material_id);
CREATE INDEX IF NOT EXISTS idx_cmup_history_date ON material_cmup_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cmup_history_source ON material_cmup_history(source);

-- Enable RLS on material_cmup_history
ALTER TABLE material_cmup_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone authenticated can view CMUP history
DROP POLICY IF EXISTS "Anyone authenticated can view CMUP history" ON material_cmup_history;
CREATE POLICY "Anyone authenticated can view CMUP history"
  ON material_cmup_history FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Authenticated users can insert CMUP history (for manual updates)
DROP POLICY IF EXISTS "Authenticated users can insert CMUP history" ON material_cmup_history;
CREATE POLICY "Authenticated users can insert CMUP history"
  ON material_cmup_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Create function to track CMUP changes automatically
CREATE OR REPLACE FUNCTION track_cmup_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if CMUP actually changed
  IF (OLD.cmup IS DISTINCT FROM NEW.cmup) THEN
    INSERT INTO material_cmup_history (
      material_id,
      old_cmup,
      new_cmup,
      changed_by,
      source
    ) VALUES (
      NEW.id,
      OLD.cmup,
      NEW.cmup,
      auth.uid(),
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track CMUP changes
DROP TRIGGER IF EXISTS materials_cmup_change_trigger ON materials;
CREATE TRIGGER materials_cmup_change_trigger
  AFTER UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION track_cmup_changes();