/*
  # Mise à jour des informations client dans les devis
  
  1. Modifications
    - Renommer `client_name` en `client_company` (entreprise)
    - Ajouter `client_name` (nom de la personne)
    - Ajouter `client_address` (adresse)
    - Ajouter `client_phone` (téléphone)
    - Ajouter `client_email` (email)
    - Renommer `project_name` en `site_name` (chantier)
    - Remplacer `validity_period` par `estimated_delay` (délai estimé)
    - Supprimer `payment_conditions` (non nécessaire ici)
*/

-- Renommer client_name en client_company
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE quotes RENAME COLUMN client_name TO client_company;
  END IF;
END $$;

-- Ajouter les nouveaux champs client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'client_contact_name'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'client_address'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'client_email'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_email text;
  END IF;
END $$;

-- Renommer project_name en site_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE quotes RENAME COLUMN project_name TO site_name;
  END IF;
END $$;

-- Remplacer validity_period par estimated_delay
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'validity_period'
  ) THEN
    ALTER TABLE quotes RENAME COLUMN validity_period TO estimated_delay;
  END IF;
END $$;

-- Supprimer payment_conditions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'payment_conditions'
  ) THEN
    ALTER TABLE quotes DROP COLUMN payment_conditions;
  END IF;
END $$;

-- Créer des index pour les recherches
CREATE INDEX IF NOT EXISTS idx_quotes_client_company ON quotes(client_company);
CREATE INDEX IF NOT EXISTS idx_quotes_site_name ON quotes(site_name);
