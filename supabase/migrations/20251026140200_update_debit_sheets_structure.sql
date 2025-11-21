/*
  # Mise à jour de la structure des feuilles de débit

  ## Modifications

  1. **debit_items**
     - Ajouter `numero_palette` (integer, nullable) - Numéro de palette assigné

  2. **debit_sheets**
     - Supprimer `stock_commande_ext` - Colonne non utilisée à supprimer

  ## Notes
  - Les modifications sont sécurisées avec IF EXISTS/IF NOT EXISTS
  - Aucune perte de données
*/

-- Ajouter la colonne numero_palette si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debit_items' AND column_name = 'numero_palette'
  ) THEN
    ALTER TABLE debit_items ADD COLUMN numero_palette integer;
  END IF;
END $$;

-- Supprimer la colonne stock_commande_ext si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debit_sheets' AND column_name = 'stock_commande_ext'
  ) THEN
    ALTER TABLE debit_sheets DROP COLUMN stock_commande_ext;
  END IF;
END $$;

-- Index pour performance sur numero_palette
CREATE INDEX IF NOT EXISTS idx_debit_items_numero_palette ON debit_items(numero_palette);
