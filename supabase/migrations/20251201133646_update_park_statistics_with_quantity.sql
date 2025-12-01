/*
  # Update Park Statistics Function to Include Quantity

  1. Changes
    - Update `get_park_statistics` function to include quantity in calculations
    - Surface (m²) calculation: (length * width * quantity) / 10000
    - Volume (m³) calculation: (length * width * thickness * quantity) / 1000000
    - Total slabs now counts actual quantity (sum of all quantity fields)

  2. Notes
    - This ensures statistics accurately reflect the total number of slabs
    - Maintains backward compatibility with existing code
*/

-- Update the park statistics function to include quantity
CREATE OR REPLACE FUNCTION get_park_statistics(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_slabs', COALESCE(SUM(quantity), 0),
    'available_slabs', COALESCE(SUM(quantity) FILTER (WHERE status = 'dispo'), 0),
    'reserved_slabs', COALESCE(SUM(quantity) FILTER (WHERE status = 'réservé'), 0),
    'total_positions_occupied', COUNT(DISTINCT "position"),
    'total_surface_m2', COALESCE(SUM((length * width * quantity) / 10000), 0),
    'total_volume_m3', COALESCE(SUM((length * width * thickness * quantity) / 1000000), 0),
    'total_estimated_value', COALESCE(SUM(price_estimate * quantity), 0),
    'old_slabs_count', COALESCE(SUM(quantity) FILTER (WHERE created_at < now() - interval '60 days'), 0),
    'materials', jsonb_agg(DISTINCT material)
  ) INTO stats
  FROM slabs
  WHERE user_id = p_user_id;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;