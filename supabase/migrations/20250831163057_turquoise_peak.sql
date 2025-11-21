/*
  # Création des tables pour le système de gestion des feuilles de débit

  1. Nouvelles Tables
    - `debit_sheets`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence à auth.users)
      - `cial` (text, commercial responsable)
      - `numero_os` (text, numéro d'ordre de service)
      - `nom_client` (text, nom du client)
      - `fourniture` (text, type de matériau)
      - `epaisseur` (text, épaisseur du matériau)
      - `numero_arc` (text, numéro ARC)
      - `date_arc` (text, date ARC)
      - `delai` (text, délai de livraison)
      - `m2` (numeric, surface en mètres carrés)
      - `m3` (numeric, volume en mètres cubes)
      - `fini` (boolean, statut de finition)
      - `livre` (boolean, statut de livraison)
      - `date_creation` (text, date de création de la commande)
      - `date_finition` (timestamptz, date de finition)
      - `date_livraison` (timestamptz, date de livraison)
      - `created_at` (timestamptz, horodatage de création)
      - `updated_at` (timestamptz, horodatage de mise à jour)

    - `debit_items`
      - `id` (uuid, clé primaire)
      - `sheet_id` (uuid, référence à debit_sheets)
      - `description` (text, description de l'élément)
      - `longueur` (numeric, longueur en cm)
      - `largeur` (numeric, largeur en cm)
      - `epaisseur` (numeric, épaisseur en cm)
      - `quantite` (integer, quantité)
      - `termine` (boolean, statut de l'élément)
      - `created_at` (timestamptz, horodatage de création)
      - `updated_at` (timestamptz, horodatage de mise à jour)

  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques pour que les utilisateurs ne voient que leurs propres données
    - Politiques CRUD complètes pour les utilisateurs authentifiés

  3. Fonctionnalités
    - Triggers pour mise à jour automatique des timestamps
    - Index pour optimiser les performances
    - Contraintes de clés étrangères
*/

-- Création de la table debit_sheets
CREATE TABLE IF NOT EXISTS debit_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cial text NOT NULL DEFAULT '',
  numero_os text NOT NULL DEFAULT '',
  nom_client text NOT NULL DEFAULT '',
  fourniture text NOT NULL DEFAULT '',
  epaisseur text NOT NULL DEFAULT '',
  numero_arc text NOT NULL DEFAULT '',
  date_arc text NOT NULL DEFAULT '',
  delai text NOT NULL DEFAULT '',
  m2 numeric(10,2) NOT NULL DEFAULT 0,
  m3 numeric(10,3) NOT NULL DEFAULT 0,
  fini boolean NOT NULL DEFAULT false,
  livre boolean NOT NULL DEFAULT false,
  date_creation text NOT NULL DEFAULT '',
  date_finition timestamptz,
  date_livraison timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création de la table debit_items
CREATE TABLE IF NOT EXISTS debit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid REFERENCES debit_sheets(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL DEFAULT '',
  longueur numeric(8,2) NOT NULL DEFAULT 0,
  largeur numeric(8,2) NOT NULL DEFAULT 0,
  epaisseur numeric(8,2) NOT NULL DEFAULT 0,
  quantite integer NOT NULL DEFAULT 1,
  termine boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE debit_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour debit_sheets
CREATE POLICY "Users can view own debit sheets"
  ON debit_sheets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debit sheets"
  ON debit_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debit sheets"
  ON debit_sheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debit sheets"
  ON debit_sheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques pour debit_items
CREATE POLICY "Users can view own debit items"
  ON debit_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM debit_sheets 
      WHERE debit_sheets.id = debit_items.sheet_id 
      AND debit_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own debit items"
  ON debit_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM debit_sheets 
      WHERE debit_sheets.id = debit_items.sheet_id 
      AND debit_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own debit items"
  ON debit_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM debit_sheets 
      WHERE debit_sheets.id = debit_items.sheet_id 
      AND debit_sheets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM debit_sheets 
      WHERE debit_sheets.id = debit_items.sheet_id 
      AND debit_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own debit items"
  ON debit_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM debit_sheets 
      WHERE debit_sheets.id = debit_items.sheet_id 
      AND debit_sheets.user_id = auth.uid()
    )
  );

-- Fonction pour mise à jour automatique du timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mise à jour automatique
CREATE TRIGGER update_debit_sheets_updated_at
  BEFORE UPDATE ON debit_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debit_items_updated_at
  BEFORE UPDATE ON debit_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_debit_sheets_user_id ON debit_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_debit_sheets_numero_os ON debit_sheets(numero_os);
CREATE INDEX IF NOT EXISTS idx_debit_items_sheet_id ON debit_items(sheet_id);
CREATE INDEX IF NOT EXISTS idx_debit_sheets_created_at ON debit_sheets(created_at);