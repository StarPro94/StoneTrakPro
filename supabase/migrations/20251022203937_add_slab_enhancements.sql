/*
  # Slab Park Enhancements - Extended Features

  1. Extensions to slabs table
    - `notes` (text) - User notes and comments about the slab
    - `photos` (jsonb) - Array of photo URLs with metadata
    - `price_estimate` (numeric) - Estimated value of the slab
    - `supplier` (text) - Supplier or origin information
    - `last_moved_at` (timestamp) - Track when slab was last moved
    - `qr_code` (text) - QR code identifier for physical tracking

  2. New Tables
    - `slab_history`
      - Tracks all changes made to slabs for full traceability
      - Records who changed what and when
    - `slab_photos`
      - Dedicated photo storage with captions and metadata
      - Links to slabs table

  3. Functions
    - `get_park_statistics()` - Returns occupation stats, value, alerts
    - `get_slab_age_days()` - Calculates days since slab creation
    - `find_compatible_slabs()` - Intelligent matching based on dimensions

  4. Security
    - RLS policies for new tables
    - Proper access control for history and photos

  5. Indexes
    - Performance indexes for common queries
*/

-- Add new columns to slabs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'notes'
  ) THEN
    ALTER TABLE slabs ADD COLUMN notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'photos'
  ) THEN
    ALTER TABLE slabs ADD COLUMN photos jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'price_estimate'
  ) THEN
    ALTER TABLE slabs ADD COLUMN price_estimate numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE slabs ADD COLUMN supplier text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'last_moved_at'
  ) THEN
    ALTER TABLE slabs ADD COLUMN last_moved_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slabs' AND column_name = 'qr_code'
  ) THEN
    ALTER TABLE slabs ADD COLUMN qr_code text DEFAULT '';
  END IF;
END $$;

-- Create slab_history table for tracking changes
CREATE TABLE IF NOT EXISTS slab_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slab_id uuid NOT NULL REFERENCES slabs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create slab_photos table for dedicated photo storage
CREATE TABLE IF NOT EXISTS slab_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slab_id uuid NOT NULL REFERENCES slabs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text DEFAULT '',
  file_size integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE slab_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE slab_photos ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slab_history_slab_id ON slab_history(slab_id);
CREATE INDEX IF NOT EXISTS idx_slab_history_created_at ON slab_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slab_photos_slab_id ON slab_photos(slab_id);
CREATE INDEX IF NOT EXISTS idx_slabs_last_moved_at ON slabs(last_moved_at);

-- RLS Policies for slab_history
CREATE POLICY "Users can view history of own slabs"
  ON slab_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM slabs
      WHERE slabs.id = slab_history.slab_id
      AND slabs.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert history"
  ON slab_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for slab_photos
CREATE POLICY "Users can view photos of own slabs"
  ON slab_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM slabs
      WHERE slabs.id = slab_photos.slab_id
      AND slabs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to own slabs"
  ON slab_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM slabs
      WHERE slabs.id = slab_photos.slab_id
      AND slabs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos"
  ON slab_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to calculate slab age in days
CREATE OR REPLACE FUNCTION get_slab_age_days(slab_created_at timestamptz)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(DAY FROM (now() - slab_created_at))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get park statistics
CREATE OR REPLACE FUNCTION get_park_statistics(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_slabs', COUNT(*),
    'available_slabs', COUNT(*) FILTER (WHERE status = 'dispo'),
    'reserved_slabs', COUNT(*) FILTER (WHERE status = 'réservé'),
    'total_positions_occupied', COUNT(DISTINCT "position"),
    'total_surface_m2', COALESCE(SUM((length * width) / 10000), 0),
    'total_volume_m3', COALESCE(SUM((length * width * thickness) / 1000000), 0),
    'total_estimated_value', COALESCE(SUM(price_estimate), 0),
    'old_slabs_count', COUNT(*) FILTER (WHERE created_at < now() - interval '60 days'),
    'materials', jsonb_agg(DISTINCT material)
  ) INTO stats
  FROM slabs
  WHERE user_id = p_user_id;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find compatible slabs based on dimensions
CREATE OR REPLACE FUNCTION find_compatible_slabs(
  p_user_id uuid,
  p_length numeric,
  p_width numeric,
  p_thickness numeric,
  p_material text DEFAULT NULL,
  p_tolerance numeric DEFAULT 5
)
RETURNS TABLE (
  slab_id uuid,
  slab_position text,
  slab_material text,
  slab_length numeric,
  slab_width numeric,
  slab_thickness numeric,
  slab_status text,
  compatibility_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s."position",
    s.material,
    s.length,
    s.width,
    s.thickness,
    s.status,
    (
      100 -
      LEAST(100, (
        ABS(s.length - p_length) / NULLIF(p_length, 0) * 30 +
        ABS(s.width - p_width) / NULLIF(p_width, 0) * 30 +
        ABS(s.thickness - p_thickness) / NULLIF(p_thickness, 0) * 40
      ))::integer
    ) as compatibility_score
  FROM slabs s
  WHERE s.user_id = p_user_id
    AND s.status = 'dispo'
    AND s.length >= p_length - p_tolerance
    AND s.width >= p_width - p_tolerance
    AND ABS(s.thickness - p_thickness) <= p_tolerance
    AND (p_material IS NULL OR s.material ILIKE '%' || p_material || '%')
  ORDER BY compatibility_score DESC, s.length ASC, s.width ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log changes to slab_history
CREATE OR REPLACE FUNCTION log_slab_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO slab_history (slab_id, user_id, action, old_values, new_values)
    VALUES (
      NEW.id,
      NEW.user_id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO slab_history (slab_id, user_id, action, old_values, new_values)
    VALUES (
      NEW.id,
      NEW.user_id,
      'create',
      NULL,
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER slabs_history_trigger
  AFTER INSERT OR UPDATE ON slabs
  FOR EACH ROW
  EXECUTE FUNCTION log_slab_changes();

-- Trigger to update last_moved_at when position changes
CREATE OR REPLACE FUNCTION update_slab_last_moved()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."position" IS DISTINCT FROM NEW."position" THEN
    NEW.last_moved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER slabs_position_change_trigger
  BEFORE UPDATE ON slabs
  FOR EACH ROW
  EXECUTE FUNCTION update_slab_last_moved();