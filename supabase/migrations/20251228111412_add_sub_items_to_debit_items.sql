/*
  # Add sub-items tracking for individual palette assignment

  ## Description
  This migration adds support for tracking individual sub-items within a debit item
  that has quantity > 1. This allows users to:
  - Mark each individual piece as completed separately
  - Assign different palette numbers to each piece

  ## Changes
  1. New columns on `debit_items` table:
     - `sub_items_termine` (JSONB): Array of booleans tracking completion status of each sub-item
     - `sub_items_palettes` (JSONB): Array of palette numbers for each sub-item

  2. Data migration:
     - Existing items with termine=true: all sub-items set to true
     - Existing items with termine=false: all sub-items set to false
     - Existing items with numero_palette: all sub-items get that palette number

  ## Notes
  - Arrays are sized based on the `quantite` field
  - NULL values in sub_items_palettes array mean "no palette assigned"
*/

-- Add the new columns
ALTER TABLE debit_items
ADD COLUMN IF NOT EXISTS sub_items_termine JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sub_items_palettes JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data using a function to generate arrays
DO $$
DECLARE
  rec RECORD;
  termine_array JSONB;
  palettes_array JSONB;
  i INTEGER;
BEGIN
  FOR rec IN SELECT id, quantite, termine, numero_palette FROM debit_items WHERE quantite > 0 LOOP
    termine_array := '[]'::jsonb;
    palettes_array := '[]'::jsonb;
    
    FOR i IN 1..rec.quantite LOOP
      termine_array := termine_array || to_jsonb(rec.termine);
      palettes_array := palettes_array || to_jsonb(rec.numero_palette);
    END LOOP;
    
    UPDATE debit_items 
    SET sub_items_termine = termine_array,
        sub_items_palettes = palettes_array
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN debit_items.sub_items_termine IS 'Array of booleans tracking completion status for each individual piece when quantity > 1';
COMMENT ON COLUMN debit_items.sub_items_palettes IS 'Array of palette numbers for each individual piece when quantity > 1';