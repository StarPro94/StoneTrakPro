/*
  # Correction inversion m2/m3 dans les données existantes
  
  1. Problème identifié
    - Les matériaux en K (K2, K3, etc.) devraient avoir des valeurs en m² mais ont des m³
    - Les matériaux en Q devraient avoir des valeurs en m³ mais ont des m²
    
  2. Correction
    - Inverser les valeurs m2 et m3 pour toutes les commandes existantes
    - Inverser les valeurs m2_item et m3_item pour tous les items existants
    
  3. Sécurité
    - Opération réversible (on peut réappliquer cette migration pour ré-inverser si besoin)
    - Pas de perte de données
*/

-- Inverser les valeurs m2 et m3 dans la table debit_sheets
UPDATE debit_sheets
SET 
  m2 = m3,
  m3 = m2
WHERE m2 > 0 OR m3 > 0;

-- Inverser les valeurs m2_item et m3_item dans la table debit_items
UPDATE debit_items
SET 
  m2_item = m3_item,
  m3_item = m2_item
WHERE m2_item IS NOT NULL OR m3_item IS NOT NULL;
