/*
  # Ajout du champ commercial aux devis

  1. Modifications
    - Ajoute une colonne `commercial` à la table `quotes`
    - Ce champ permettra de stocker le nom du commercial pour chaque devis
    - Le champ est optionnel (nullable) pour les devis existants

  2. Sécurité
    - Les politiques RLS existantes s'appliquent automatiquement
*/

-- Ajouter le champ commercial à la table quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'commercial'
  ) THEN
    ALTER TABLE quotes ADD COLUMN commercial text;
  END IF;
END $$;
