/*
  # Update find_compatible_slabs Function

  1. Changes
    - Make all dimension parameters optional (nullable)
    - Accept slabs that are larger than requested dimensions (not just within tolerance)
    - Adjust compatibility score to favor optimally sized slabs
    - Handle cases where some dimensions are not specified

  2. Benefits
    - More flexible search allowing partial criteria
    - Finds slabs that can be cut to size (larger slabs)
    - Better user experience with optional fields
*/

-- Drop and recreate the function with optional parameters
CREATE OR REPLACE FUNCTION find_compatible_slabs(
  p_user_id uuid,
  p_length numeric DEFAULT NULL,
  p_width numeric DEFAULT NULL,
  p_thickness numeric DEFAULT NULL,
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
DECLARE
  length_weight numeric := 30;
  width_weight numeric := 30;
  thickness_weight numeric := 40;
BEGIN
  -- Adjust weights based on which dimensions are provided
  IF p_length IS NULL THEN
    length_weight := 0;
    width_weight := 50;
    thickness_weight := 50;
  END IF;

  IF p_width IS NULL THEN
    width_weight := 0;
    IF p_length IS NOT NULL THEN
      length_weight := 50;
      thickness_weight := 50;
    END IF;
  END IF;

  IF p_thickness IS NULL THEN
    thickness_weight := 0;
    IF p_length IS NOT NULL AND p_width IS NOT NULL THEN
      length_weight := 50;
      width_weight := 50;
    ELSIF p_length IS NOT NULL THEN
      length_weight := 100;
    ELSIF p_width IS NOT NULL THEN
      width_weight := 100;
    END IF;
  END IF;

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
        COALESCE(
          CASE
            WHEN p_length IS NOT NULL AND s.length >= p_length THEN
              -- Favoriser les tranches légèrement plus grandes (surplus raisonnable)
              CASE
                WHEN s.length <= p_length + 10 THEN (s.length - p_length) / p_length * length_weight * 0.5
                ELSE (s.length - p_length) / p_length * length_weight
              END
            WHEN p_length IS NOT NULL THEN
              -- Pénaliser les tranches trop petites
              (p_length - s.length) / p_length * length_weight * 2
            ELSE 0
          END, 0
        ) +
        COALESCE(
          CASE
            WHEN p_width IS NOT NULL AND s.width >= p_width THEN
              CASE
                WHEN s.width <= p_width + 10 THEN (s.width - p_width) / p_width * width_weight * 0.5
                ELSE (s.width - p_width) / p_width * width_weight
              END
            WHEN p_width IS NOT NULL THEN
              (p_width - s.width) / p_width * width_weight * 2
            ELSE 0
          END, 0
        ) +
        COALESCE(
          CASE
            WHEN p_thickness IS NOT NULL THEN
              ABS(s.thickness - p_thickness) / NULLIF(p_thickness, 0) * thickness_weight
            ELSE 0
          END, 0
        )
      ))::integer
    ) as compatibility_score
  FROM slabs s
  WHERE s.user_id = p_user_id
    AND s.status = 'dispo'
    -- Accepter les tranches plus grandes ou égales aux dimensions demandées
    AND (p_length IS NULL OR s.length >= p_length - p_tolerance)
    AND (p_width IS NULL OR s.width >= p_width - p_tolerance)
    AND (p_thickness IS NULL OR ABS(s.thickness - p_thickness) <= p_tolerance)
    AND (p_material IS NULL OR s.material ILIKE '%' || p_material || '%')
  ORDER BY compatibility_score DESC, s.length ASC, s.width ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
