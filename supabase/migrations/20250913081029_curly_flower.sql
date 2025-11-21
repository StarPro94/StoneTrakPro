/*
  # Create slabs table for slab park management

  1. New Tables
    - `slabs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `position` (text, position in park like "A1", "B5")
      - `material` (text, material type)
      - `length` (numeric, length in cm)
      - `width` (numeric, width in cm)
      - `thickness` (numeric, thickness in cm)
      - `status` (text, 'dispo' or 'réservé')
      - `debit_sheet_id` (uuid, nullable, links to debit_sheets when reserved)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `slabs` table
    - Add policies for authenticated users to manage their own slabs

  3. Indexes
    - Add indexes for performance on user_id, position, status
*/

CREATE TABLE IF NOT EXISTS slabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position text NOT NULL DEFAULT '',
  material text NOT NULL DEFAULT '',
  length numeric(8,2) NOT NULL DEFAULT 0,
  width numeric(8,2) NOT NULL DEFAULT 0,
  thickness numeric(8,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'dispo',
  debit_sheet_id uuid DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE slabs ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint
ALTER TABLE slabs 
ADD CONSTRAINT slabs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE slabs 
ADD CONSTRAINT slabs_debit_sheet_id_fkey 
FOREIGN KEY (debit_sheet_id) REFERENCES debit_sheets(id) ON DELETE SET NULL;

-- Add check constraint for status
ALTER TABLE slabs 
ADD CONSTRAINT slabs_status_check 
CHECK (status IN ('dispo', 'réservé'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slabs_user_id ON slabs(user_id);
CREATE INDEX IF NOT EXISTS idx_slabs_position ON slabs(position);
CREATE INDEX IF NOT EXISTS idx_slabs_status ON slabs(status);
CREATE INDEX IF NOT EXISTS idx_slabs_debit_sheet_id ON slabs(debit_sheet_id);

-- Create RLS policies
CREATE POLICY "Users can view own slabs"
  ON slabs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own slabs"
  ON slabs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slabs"
  ON slabs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own slabs"
  ON slabs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_slabs_updated_at
    BEFORE UPDATE ON slabs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();