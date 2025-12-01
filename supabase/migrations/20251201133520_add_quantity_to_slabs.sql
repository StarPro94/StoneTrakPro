/*
  # Add Quantity Field to Slabs Table

  1. Changes to slabs table
    - Add `quantity` column (integer, default 1) to track number of identical slabs at the same position
    - This represents the NBRE field from Excel imports
    - Existing slabs will automatically have quantity = 1

  2. Notes
    - Quantity must be at least 1
    - This allows tracking multiple identical slabs without creating duplicate rows
    - Impacts surface and volume calculations (m² and m³ are multiplied by quantity)
*/

-- Add quantity column to slabs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE slabs ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1);
    CREATE INDEX IF NOT EXISTS idx_slabs_quantity ON slabs(quantity) WHERE quantity > 1;
  END IF;
END $$;