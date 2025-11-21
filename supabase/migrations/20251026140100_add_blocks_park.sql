/*
  # Création du Parc à Blocs

  ## Nouvelle Table

  1. **blocks**
     - `id` (uuid, primary key)
     - `user_id` (uuid) - Utilisateur qui a créé le bloc
     - `ligne` (text) - Ligne de stockage (A, B, C... Z)
     - `material` (text) - Matière du bloc (doit être de type 'bloc')
     - `length` (integer) - Longueur en cm
     - `width` (integer) - Largeur en cm
     - `height` (integer) - Hauteur en cm
     - `volume` (decimal) - Volume calculé en m³
     - `notes` (text, nullable) - Notes optionnelles
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Sécurité
  - RLS activé
  - Utilisateurs authentifiés peuvent voir tous les blocs
  - Admin, Bureau et Stock Matière peuvent créer/modifier/supprimer
*/

-- Créer la table blocks
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ligne text NOT NULL,
  material text NOT NULL,
  length integer NOT NULL CHECK (length > 0),
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  volume decimal(10,3) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view all blocks"
  ON blocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can insert blocks"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau', 'stock_matiere')
    )
  );

CREATE POLICY "Authorized users can update blocks"
  ON blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau', 'stock_matiere')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau', 'stock_matiere')
    )
  );

CREATE POLICY "Authorized users can delete blocks"
  ON blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau', 'stock_matiere')
    )
  );

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_ligne ON blocks(ligne);
CREATE INDEX IF NOT EXISTS idx_blocks_material ON blocks(material);
CREATE INDEX IF NOT EXISTS idx_blocks_created_at ON blocks(created_at);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_blocks_updated_at();
