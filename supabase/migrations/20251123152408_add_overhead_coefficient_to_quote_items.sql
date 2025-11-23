/*
  # Ajout du coefficient de frais généraux aux lignes de devis

  1. Modifications
    - Ajoute la colonne `overhead_coefficient` à la table `quote_items`
    - Valeur par défaut : 1.23 (23% de frais généraux)
    - Type : numeric pour gérer les décimales
  
  2. Notes
    - Les frais généraux s'appliquent après le calcul de la marge
    - Permet d'ajouter automatiquement 23% au prix de vente avant marge
    - Compatible avec les lignes existantes grâce à la valeur par défaut
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'overhead_coefficient'
  ) THEN
    ALTER TABLE quote_items 
    ADD COLUMN overhead_coefficient numeric DEFAULT 1.23 NOT NULL;
    
    COMMENT ON COLUMN quote_items.overhead_coefficient IS 'Coefficient de frais généraux appliqué après la marge (ex: 1.23 = +23%)';
  END IF;
END $$;