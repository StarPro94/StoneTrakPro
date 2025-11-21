/*
  # Fonctions et Vues pour le Module Échafaudage

  ## Fonctions créées
  
  1. **calculate_item_poids_total()**
     Trigger pour calculer automatiquement le poids total d'un item de liste
  
  2. **get_stock_disponible(catalog_item_id)**
     Retourne la quantité disponible en stock pour un élément
  
  3. **get_material_on_site(site_id)**
     Retourne tout le matériel actuellement sur un chantier
  
  4. **generate_scaffolding_list_numero()**
     Génère un numéro automatique pour une liste (format: 2025-0001)
  
  ## Vues créées
  
  1. **v_stock_global**
     Vue consolidée du stock global avec quantités par référence
  
  2. **v_layher_rentals_active**
     Vue des locations Layher en cours avec durée
  
  3. **v_sites_summary**
     Vue résumée des chantiers avec statistiques
*/

-- ============================================================================
-- FONCTION: Calcul automatique du poids total d'un item
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_item_poids_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer le poids unitaire depuis le catalogue
  SELECT poids_unitaire INTO NEW.poids_total
  FROM scaffolding_catalog
  WHERE id = NEW.catalog_item_id;
  
  -- Multiplier par la quantité
  NEW.poids_total := NEW.poids_total * NEW.quantite;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_poids_total ON scaffolding_list_items;
CREATE TRIGGER trigger_calculate_poids_total
  BEFORE INSERT OR UPDATE OF quantite, catalog_item_id
  ON scaffolding_list_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_poids_total();

-- ============================================================================
-- FONCTION: Générer un numéro automatique pour les listes
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_scaffolding_list_numero()
RETURNS TRIGGER AS $$
DECLARE
  year_part text;
  next_number integer;
  new_numero text;
BEGIN
  -- Si le numéro est déjà défini, ne rien faire
  IF NEW.numero IS NOT NULL AND NEW.numero != '' THEN
    RETURN NEW;
  END IF;
  
  -- Obtenir l'année actuelle
  year_part := to_char(CURRENT_DATE, 'YYYY');
  
  -- Trouver le prochain numéro pour cette année
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '\d+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM scaffolding_lists
  WHERE numero LIKE year_part || '%';
  
  -- Générer le nouveau numéro (format: 2025-0001)
  new_numero := year_part || '-' || LPAD(next_number::text, 4, '0');
  
  NEW.numero := new_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_generate_list_numero ON scaffolding_lists;
CREATE TRIGGER trigger_generate_list_numero
  BEFORE INSERT ON scaffolding_lists
  FOR EACH ROW
  EXECUTE FUNCTION generate_scaffolding_list_numero();

-- ============================================================================
-- FONCTION: Calculer le stock disponible pour un élément
-- ============================================================================

CREATE OR REPLACE FUNCTION get_stock_disponible(p_catalog_item_id uuid)
RETURNS TABLE (
  catalog_item_id uuid,
  reference text,
  designation text,
  quantite_livree bigint,
  quantite_recue bigint,
  quantite_sur_chantier bigint,
  quantite_hs bigint,
  quantite_disponible bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH livraisons AS (
    SELECT 
      sli.catalog_item_id,
      COALESCE(SUM(sli.quantite), 0) as total_livraisons
    FROM scaffolding_list_items sli
    JOIN scaffolding_lists sl ON sl.id = sli.list_id
    WHERE sl.type = 'livraison' 
      AND sl.status = 'termine'
      AND sli.catalog_item_id = p_catalog_item_id
    GROUP BY sli.catalog_item_id
  ),
  receptions AS (
    SELECT 
      sli.catalog_item_id,
      COALESCE(SUM(sli.quantite), 0) as total_receptions
    FROM scaffolding_list_items sli
    JOIN scaffolding_lists sl ON sl.id = sli.list_id
    WHERE sl.type = 'reception'
      AND sl.status = 'termine'
      AND sli.catalog_item_id = p_catalog_item_id
    GROUP BY sli.catalog_item_id
  ),
  damages AS (
    SELECT 
      catalog_item_id,
      COALESCE(SUM(quantite), 0) as total_hs
    FROM scaffolding_damaged_items
    WHERE status IN ('en_attente', 'en_reparation')
      AND catalog_item_id = p_catalog_item_id
    GROUP BY catalog_item_id
  )
  SELECT 
    sc.id as catalog_item_id,
    sc.reference,
    sc.designation,
    COALESCE(l.total_livraisons, 0)::bigint as quantite_livree,
    COALESCE(r.total_receptions, 0)::bigint as quantite_recue,
    (COALESCE(l.total_livraisons, 0) - COALESCE(r.total_receptions, 0))::bigint as quantite_sur_chantier,
    COALESCE(d.total_hs, 0)::bigint as quantite_hs,
    (COALESCE(r.total_receptions, 0) - COALESCE(l.total_livraisons, 0) - COALESCE(d.total_hs, 0))::bigint as quantite_disponible
  FROM scaffolding_catalog sc
  LEFT JOIN livraisons l ON l.catalog_item_id = sc.id
  LEFT JOIN receptions r ON r.catalog_item_id = sc.id
  LEFT JOIN damages d ON d.catalog_item_id = sc.id
  WHERE sc.id = p_catalog_item_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION: Obtenir le matériel sur un chantier spécifique
-- ============================================================================

CREATE OR REPLACE FUNCTION get_material_on_site(p_site_id uuid)
RETURNS TABLE (
  catalog_item_id uuid,
  reference text,
  designation text,
  quantite_livree bigint,
  quantite_recue bigint,
  quantite_actuelle bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH livraisons AS (
    SELECT 
      sli.catalog_item_id,
      COALESCE(SUM(sli.quantite), 0) as total
    FROM scaffolding_list_items sli
    JOIN scaffolding_lists sl ON sl.id = sli.list_id
    WHERE sl.type = 'livraison'
      AND sl.status = 'termine'
      AND sl.site_id = p_site_id
    GROUP BY sli.catalog_item_id
  ),
  receptions AS (
    SELECT 
      sli.catalog_item_id,
      COALESCE(SUM(sli.quantite), 0) as total
    FROM scaffolding_list_items sli
    JOIN scaffolding_lists sl ON sl.id = sli.list_id
    WHERE sl.type = 'reception'
      AND sl.status = 'termine'
      AND sl.site_id = p_site_id
    GROUP BY sli.catalog_item_id
  )
  SELECT 
    sc.id as catalog_item_id,
    sc.reference,
    sc.designation,
    COALESCE(l.total, 0)::bigint as quantite_livree,
    COALESCE(r.total, 0)::bigint as quantite_recue,
    (COALESCE(l.total, 0) - COALESCE(r.total, 0))::bigint as quantite_actuelle
  FROM scaffolding_catalog sc
  INNER JOIN livraisons l ON l.catalog_item_id = sc.id
  LEFT JOIN receptions r ON r.catalog_item_id = sc.id
  WHERE (COALESCE(l.total, 0) - COALESCE(r.total, 0)) > 0
  ORDER BY sc.reference;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VUE: Stock global consolidé
-- ============================================================================

CREATE OR REPLACE VIEW v_stock_global AS
WITH livraisons AS (
  SELECT 
    sli.catalog_item_id,
    COALESCE(SUM(sli.quantite), 0) as total_livraisons
  FROM scaffolding_list_items sli
  JOIN scaffolding_lists sl ON sl.id = sli.list_id
  WHERE sl.type = 'livraison' AND sl.status = 'termine'
  GROUP BY sli.catalog_item_id
),
receptions AS (
  SELECT 
    sli.catalog_item_id,
    COALESCE(SUM(sli.quantite), 0) as total_receptions
  FROM scaffolding_list_items sli
  JOIN scaffolding_lists sl ON sl.id = sli.list_id
  WHERE sl.type = 'reception' AND sl.status = 'termine'
  GROUP BY sli.catalog_item_id
),
damages AS (
  SELECT 
    catalog_item_id,
    COALESCE(SUM(quantite), 0) as total_hs
  FROM scaffolding_damaged_items
  WHERE status IN ('en_attente', 'en_reparation')
  GROUP BY catalog_item_id
)
SELECT 
  sc.id,
  sc.reference,
  sc.designation,
  sc.poids_unitaire,
  sc.category,
  COALESCE(l.total_livraisons, 0)::bigint as quantite_livree,
  COALESCE(r.total_receptions, 0)::bigint as quantite_recue,
  (COALESCE(l.total_livraisons, 0) - COALESCE(r.total_receptions, 0))::bigint as quantite_sur_chantier,
  COALESCE(d.total_hs, 0)::bigint as quantite_hs,
  (COALESCE(r.total_receptions, 0) - COALESCE(l.total_livraisons, 0) - COALESCE(d.total_hs, 0))::bigint as quantite_disponible,
  (COALESCE(r.total_receptions, 0) - COALESCE(l.total_livraisons, 0) - COALESCE(d.total_hs, 0)) * sc.poids_unitaire as poids_disponible
FROM scaffolding_catalog sc
LEFT JOIN livraisons l ON l.catalog_item_id = sc.id
LEFT JOIN receptions r ON r.catalog_item_id = sc.id
LEFT JOIN damages d ON d.catalog_item_id = sc.id
WHERE sc.is_active = true
ORDER BY sc.reference;

-- ============================================================================
-- VUE: Locations Layher actives avec durée
-- ============================================================================

CREATE OR REPLACE VIEW v_layher_rentals_active AS
SELECT 
  slr.id,
  slr.catalog_item_id,
  sc.reference,
  sc.designation,
  slr.site_id,
  ss.numero as site_numero,
  ss.nom as site_nom,
  slr.quantite,
  slr.date_location,
  slr.date_retour_prevue,
  slr.status,
  slr.cout_estime,
  CURRENT_DATE - slr.date_location as duree_jours,
  CASE 
    WHEN CURRENT_DATE > slr.date_retour_prevue THEN true
    ELSE false
  END as en_retard
FROM scaffolding_layher_rentals slr
JOIN scaffolding_catalog sc ON sc.id = slr.catalog_item_id
LEFT JOIN scaffolding_sites ss ON ss.id = slr.site_id
WHERE slr.status = 'en_cours'
ORDER BY slr.date_location DESC;

-- ============================================================================
-- VUE: Résumé des chantiers avec statistiques
-- ============================================================================

CREATE OR REPLACE VIEW v_sites_summary AS
WITH site_stats AS (
  SELECT 
    sl.site_id,
    COUNT(DISTINCT CASE WHEN sl.type = 'livraison' THEN sl.id END) as nb_livraisons,
    COUNT(DISTINCT CASE WHEN sl.type = 'reception' THEN sl.id END) as nb_receptions,
    MAX(CASE WHEN sl.type = 'livraison' THEN sl.date END) as derniere_livraison,
    MAX(CASE WHEN sl.type = 'reception' THEN sl.date END) as derniere_reception
  FROM scaffolding_lists sl
  WHERE sl.status = 'termine'
  GROUP BY sl.site_id
)
SELECT 
  ss.id,
  ss.numero,
  ss.nom,
  ss.adresse,
  ss.status,
  ss.date_debut,
  ss.date_fin,
  COALESCE(st.nb_livraisons, 0)::bigint as nb_livraisons,
  COALESCE(st.nb_receptions, 0)::bigint as nb_receptions,
  st.derniere_livraison,
  st.derniere_reception,
  CASE 
    WHEN ss.status = 'actif' AND st.derniere_livraison IS NOT NULL 
    THEN CURRENT_DATE - st.derniere_livraison
    ELSE NULL
  END as jours_depuis_derniere_livraison
FROM scaffolding_sites ss
LEFT JOIN site_stats st ON st.site_id = ss.id
ORDER BY ss.created_at DESC;