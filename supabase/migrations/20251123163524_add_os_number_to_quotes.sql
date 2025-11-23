/*
  # Ajout du numéro d'OS aux devis
  
  1. Modifications
    - Ajout de la colonne `os_number` dans la table `quotes`
    - Cette colonne est obligatoire uniquement lorsque le statut est 'accepted'
    - Elle stocke le numéro d'ordre de service associé au devis accepté
*/

-- Ajouter la colonne os_number à la table quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'os_number'
  ) THEN
    ALTER TABLE quotes ADD COLUMN os_number text;
  END IF;
END $$;

-- Créer un index pour rechercher rapidement par numéro d'OS
CREATE INDEX IF NOT EXISTS idx_quotes_os_number ON quotes(os_number) WHERE os_number IS NOT NULL;
