/*
  # Add entry_number column to slabs table for import deduplication

  1. Changes
    - Add `entry_number` column to `slabs` table (unique identifier from Excel import)
    - Add unique constraint on entry_number to prevent duplicate imports
    - Add index for performance on entry_number lookups
    - Update existing slabs to have entry_number = NULL (will be filled on next import)

  2. Purpose
    - Prevent duplicate imports when the same Excel file is imported multiple times
    - Enable upsert logic (update existing or insert new) based on entry_number
    - Maintain data integrity across multiple imports

  3. Notes
    - Existing slabs will have NULL entry_number until re-imported
    - New imports will populate this field from the "n°saisie" column in Excel
    - The unique constraint allows NULL values (multiple rows can have NULL)
*/

-- Add entry_number column to slabs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'entry_number'
  ) THEN
    ALTER TABLE slabs ADD COLUMN entry_number text DEFAULT NULL;
  END IF;
END $$;

-- Add unique constraint on entry_number (allows multiple NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'slabs_entry_number_unique'
  ) THEN
    ALTER TABLE slabs
    ADD CONSTRAINT slabs_entry_number_unique
    UNIQUE (entry_number);
  END IF;
END $$;

-- Create index for performance on entry_number
CREATE INDEX IF NOT EXISTS idx_slabs_entry_number ON slabs(entry_number) WHERE entry_number IS NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN slabs.entry_number IS 'Unique entry number from Excel import file (n°saisie). Used to prevent duplicate imports and enable upsert operations.';