/*
  # Création de la liste maîtresse des matières

  ## Nouvelle Table

  1. **materials**
     - `id` (uuid, primary key)
     - `name` (text, unique) - Nom de la matière (ex: K2, K3, K5, Q, PBQ)
     - `type` (text) - Type de matière: 'tranche' pour K, 'bloc' pour Q/PBQ
     - `thickness` (integer, nullable) - Épaisseur extraite du nom (ex: 2 pour K2)
     - `is_active` (boolean) - Si la matière est active dans le système
     - `description` (text, nullable) - Description optionnelle
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Sécurité
  - RLS activé
  - Tous les utilisateurs authentifiés peuvent lire
  - Seuls les admins peuvent créer/modifier/supprimer
*/

-- Créer la table materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('tranche', 'bloc')),
  thickness integer,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : tous peuvent lire, seuls admins peuvent modifier
CREATE POLICY "Anyone authenticated can view materials"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete materials"
  ON materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON materials(is_active);

-- Insérer quelques matières par défaut
INSERT INTO materials (name, type, thickness, description) VALUES
  ('K2', 'tranche', 2, 'Tranche épaisseur 2cm'),
  ('K3', 'tranche', 3, 'Tranche épaisseur 3cm'),
  ('K5', 'tranche', 5, 'Tranche épaisseur 5cm'),
  ('K8', 'tranche', 8, 'Tranche épaisseur 8cm'),
  ('Q', 'bloc', NULL, 'Bloc de pierre brut'),
  ('PBQ', 'bloc', NULL, 'Bloc de pierre brut (PBQ)')
ON CONFLICT (name) DO NOTHING;
