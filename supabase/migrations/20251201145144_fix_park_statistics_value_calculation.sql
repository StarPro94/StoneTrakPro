/*
  # Fix Park Statistics Value Calculation

  1. Changes
    - Update `get_park_statistics` to correctly calculate total_estimated_value
    - If price_estimate is null or 0, calculate it dynamically from material CMUP
    - Formula: total_estimated_value = SUM((length * width * quantity / 10000) * material.cmup)
    - Filter out materials with quantity = 0 from the materials list

  2. Purpose
    - Ensure the value displayed in the park dashboard is accurate
    - Handle legacy slabs that don't have price_estimate set
    - Show only materials that actually have stock

  3. Notes
    - This function now joins with materials table to get CMUP values
    - Backwards compatible with existing slabs table structure
*/

-- Update the park statistics function to fix value calculation
CREATE OR REPLACE FUNCTION get_park_statistics(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_slabs', COALESCE(SUM(s.quantity), 0),
    'available_slabs', COALESCE(SUM(s.quantity) FILTER (WHERE s.status = 'dispo'), 0),
    'reserved_slabs', COALESCE(SUM(s.quantity) FILTER (WHERE s.status = 'réservé'), 0),
    'total_positions_occupied', COUNT(DISTINCT s."position"),
    'total_surface_m2', COALESCE(SUM((s.length * s.width * s.quantity) / 10000), 0),
    'total_volume_m3', COALESCE(SUM((s.length * s.width * s.thickness * s.quantity) / 1000000), 0),
    'total_estimated_value', COALESCE(
      SUM(
        CASE
          WHEN s.price_estimate IS NOT NULL AND s.price_estimate > 0 THEN s.price_estimate
          ELSE ((s.length * s.width * s.quantity) / 10000) * COALESCE(m.cmup, 0)
        END
      ), 0
    ),
    'old_slabs_count', COALESCE(SUM(s.quantity) FILTER (WHERE s.created_at < now() - interval '60 days'), 0),
    'materials', (
      SELECT jsonb_agg(DISTINCT material)
      FROM slabs
      WHERE user_id = p_user_id AND quantity > 0
    )
  ) INTO stats
  FROM slabs s
  LEFT JOIN materials m ON LOWER(s.material) = LOWER(m.name)
  WHERE s.user_id = p_user_id;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;