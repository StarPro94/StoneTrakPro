/*
  # Add machine_id column to debit_sheets table

  1. Changes
    - Add `machine_id` column to `debit_sheets` table
    - Set up foreign key constraint to `machines` table
    - Add index for performance

  2. Security
    - Column allows NULL values (sheets can be unassigned)
    - Foreign key with CASCADE delete protection
*/

-- Add machine_id column to debit_sheets table
ALTER TABLE debit_sheets 
ADD COLUMN machine_id uuid REFERENCES machines(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_debit_sheets_machine_id 
ON debit_sheets(machine_id);