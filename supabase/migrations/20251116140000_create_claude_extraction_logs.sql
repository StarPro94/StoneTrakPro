/*
  # Create Claude Extraction Logs Table

  1. New Tables
    - `claude_extraction_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `pdf_filename` (text)
      - `extraction_status` (text) - 'success', 'needs_review', 'failed'
      - `raw_data` (jsonb) - Contains extraction method, PDF sample, full logs
      - `parsed_data` (jsonb) - The structured extracted data
      - `errors` (text[]) - Array of error/warning messages
      - `processing_time_ms` (integer)
      - `confidence_score` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `claude_extraction_logs` table
    - Add policies for authenticated users to read their own logs
    - Add policies for authenticated users to insert their own logs

  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for sorting
    - Index on extraction_status for filtering
*/

-- Create the claude_extraction_logs table
CREATE TABLE IF NOT EXISTS claude_extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_filename text NOT NULL,
  extraction_status text NOT NULL DEFAULT 'success',
  raw_data jsonb DEFAULT '{}'::jsonb,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  errors text[] DEFAULT ARRAY[]::text[],
  processing_time_ms integer DEFAULT 0,
  confidence_score numeric(3,2) DEFAULT 0.80,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE claude_extraction_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own extraction logs"
  ON claude_extraction_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own extraction logs"
  ON claude_extraction_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update own extraction logs"
  ON claude_extraction_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claude_logs_user_id
  ON claude_extraction_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_claude_logs_created_at
  ON claude_extraction_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claude_logs_status
  ON claude_extraction_logs(extraction_status);

CREATE INDEX IF NOT EXISTS idx_claude_logs_filename
  ON claude_extraction_logs(pdf_filename);

-- Add helpful comment
COMMENT ON TABLE claude_extraction_logs IS 'Logs all PDF extractions performed using Claude Vision API, including raw responses, parsed data, and performance metrics';
