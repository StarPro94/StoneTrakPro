/*
  # Système d'identifiants de devis personnalisés
  
  1. Modifications
    - Ajouter une colonne `quote_reference` (texte, unique) pour l'identifiant personnalisé
    - Cette référence suit le format : "YY MM NN" (ex: "25 11 01" pour le premier devis de novembre 2025)
    - Créer une fonction pour générer automatiquement la prochaine référence
    - Créer un trigger pour assigner la référence lors de la création
    
  2. Format de la référence
    - YY : année sur 2 chiffres
    - MM : mois sur 2 chiffres
    - NN : numéro incrémental qui recommence à 01 chaque mois
*/

-- Ajouter la colonne quote_reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'quote_reference'
  ) THEN
    ALTER TABLE quotes ADD COLUMN quote_reference text UNIQUE;
  END IF;
END $$;

-- Fonction pour générer la prochaine référence de devis
CREATE OR REPLACE FUNCTION generate_quote_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year text;
  current_month text;
  next_number integer;
  new_reference text;
BEGIN
  -- Obtenir l'année et le mois actuels au format YY et MM
  current_year := TO_CHAR(CURRENT_DATE, 'YY');
  current_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Trouver le prochain numéro pour ce mois
  -- On cherche toutes les références du mois en cours et on prend le max
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(quote_reference, ' ', 3) AS integer
      )
    ),
    0
  ) + 1
  INTO next_number
  FROM quotes
  WHERE quote_reference LIKE current_year || ' ' || current_month || ' %';
  
  -- Construire la nouvelle référence avec padding sur 2 chiffres
  new_reference := current_year || ' ' || current_month || ' ' || LPAD(next_number::text, 2, '0');
  
  RETURN new_reference;
END;
$$;

-- Fonction trigger pour assigner automatiquement la référence
CREATE OR REPLACE FUNCTION assign_quote_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si la référence n'est pas déjà définie, en générer une
  IF NEW.quote_reference IS NULL THEN
    NEW.quote_reference := generate_quote_reference();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger (supprimer l'ancien s'il existe)
DROP TRIGGER IF EXISTS trigger_assign_quote_reference ON quotes;

CREATE TRIGGER trigger_assign_quote_reference
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION assign_quote_reference();

-- Créer un index pour les recherches par référence
CREATE INDEX IF NOT EXISTS idx_quotes_reference ON quotes(quote_reference);

-- Mettre à jour les devis existants qui n'ont pas de référence
DO $$
DECLARE
  quote_record RECORD;
  new_ref text;
BEGIN
  FOR quote_record IN 
    SELECT id, quote_date 
    FROM quotes 
    WHERE quote_reference IS NULL
    ORDER BY quote_date, created_at
  LOOP
    -- Générer une référence basée sur la date du devis
    new_ref := TO_CHAR(quote_record.quote_date, 'YY') || ' ' || 
               TO_CHAR(quote_record.quote_date, 'MM') || ' ' || 
               LPAD(
                 (
                   SELECT COALESCE(MAX(CAST(SPLIT_PART(quote_reference, ' ', 3) AS integer)), 0) + 1
                   FROM quotes
                   WHERE quote_reference LIKE TO_CHAR(quote_record.quote_date, 'YY MM') || ' %'
                 )::text,
                 2,
                 '0'
               );
    
    UPDATE quotes
    SET quote_reference = new_ref
    WHERE id = quote_record.id;
  END LOOP;
END $$;
