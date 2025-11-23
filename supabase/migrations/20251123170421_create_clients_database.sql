/*
  # Création de la base de données clients
  
  1. Nouvelle table `clients`
    - `id` (uuid, primary key)
    - `company_name` (text, unique) - Nom de l'entreprise
    - `contact_name` (text) - Nom de la personne de contact
    - `address` (text) - Adresse complète
    - `phone` (text) - Numéro de téléphone
    - `email` (text) - Adresse email
    - `notes` (text) - Notes diverses
    - `created_at` (timestamptz) - Date de création
    - `updated_at` (timestamptz) - Date de dernière modification
    - `created_by` (uuid) - Utilisateur créateur
    
  2. Sécurité
    - Enable RLS sur la table clients
    - Politiques pour permettre aux utilisateurs authentifiés de lire et gérer les clients
    
  3. Index
    - Index sur company_name pour les recherches rapides
*/

-- Créer la table clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  address text,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Ajouter une contrainte unique sur company_name (insensible à la casse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_company_name_unique ON clients(LOWER(company_name));

-- Créer des index pour les recherches
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- Activer RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : tous les utilisateurs authentifiés peuvent voir les clients
CREATE POLICY "Utilisateurs authentifiés peuvent voir les clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

-- Politique INSERT : tous les utilisateurs authentifiés peuvent créer des clients
CREATE POLICY "Utilisateurs authentifiés peuvent créer des clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Politique UPDATE : tous les utilisateurs authentifiés peuvent modifier les clients
CREATE POLICY "Utilisateurs authentifiés peuvent modifier les clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique DELETE : seuls les admins peuvent supprimer des clients
CREATE POLICY "Seuls les admins peuvent supprimer des clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;

CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Fonction pour rechercher un client par nom d'entreprise (insensible à la casse)
CREATE OR REPLACE FUNCTION search_client_by_company(search_term text)
RETURNS TABLE (
  id uuid,
  company_name text,
  contact_name text,
  address text,
  phone text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, company_name, contact_name, address, phone, email
  FROM clients
  WHERE LOWER(company_name) = LOWER(search_term)
  LIMIT 1;
$$;
