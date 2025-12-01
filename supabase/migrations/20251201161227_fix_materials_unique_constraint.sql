/*
  # Fix materials table unique constraint

  ## Problem
  The `name` column has a UNIQUE constraint but materials can have similar names
  with different references (e.g., "TERRAZO CARRARE PETIT GRAIN K2" ref 3993 and
  "TERRAZO CARRARE PETIT GRAIN K3" ref 3994 are two different materials).

  ## Solution
  1. Remove UNIQUE constraint on `name` column
  2. Add UNIQUE constraint on `ref` column (the true business key)
  3. Make `ref` column NOT NULL (required for all materials)

  ## Changes
  - Drop UNIQUE constraint on `materials.name`
  - Make `ref` column NOT NULL with default empty string for migration
  - Add UNIQUE constraint on `materials.ref`
  - Update index to reflect the new unique constraint
*/

-- First, ensure all existing materials have a ref value
-- If any materials have NULL ref, generate one from name
UPDATE materials
SET ref = COALESCE(ref, 'GEN_' || substring(md5(name || id::text), 1, 8))
WHERE ref IS NULL OR ref = '';

-- Drop the UNIQUE constraint on name column
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_name_key;

-- Make ref column NOT NULL
ALTER TABLE materials ALTER COLUMN ref SET NOT NULL;

-- Add UNIQUE constraint on ref column
ALTER TABLE materials ADD CONSTRAINT materials_ref_key UNIQUE (ref);

-- Drop old index on name (if it was unique)
-- Keep the regular index for search performance
DROP INDEX IF EXISTS materials_name_key;

-- Ensure we have a good index on ref for lookups
DROP INDEX IF EXISTS idx_materials_ref;
CREATE INDEX idx_materials_ref ON materials(ref);

-- Keep name index for search
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
