/*
  # Add reference column to materials table

  1. Changes
    - Add `ref` column to `materials` table to store material reference codes
    - The ref column is nullable to support existing materials without references
    - Add index on ref column for faster lookups during import/search operations
  
  2. Notes
    - Existing materials will have NULL ref values initially
    - Future imports from XLS will populate this field
    - The ref field is separate from the name field to maintain data integrity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'ref'
  ) THEN
    ALTER TABLE materials ADD COLUMN ref text;
    CREATE INDEX IF NOT EXISTS idx_materials_ref ON materials(ref);
  END IF;
END $$;