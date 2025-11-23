/*
  # Module de Chiffrage et Devis (Quoting & Costing)
  
  1. Nouvelles Tables
    - `quotes` : Table principale des devis
      - Informations client et projet
      - Totaux calculés (HT, TVA, TTC)
      - Statut du devis
      - Période de validité
      
    - `quote_items` : Lignes de devis avec calculs détaillés
      - Référence au devis parent
      - Référence optionnelle à une matière
      - Paramètres de calcul (pour historique et traçabilité)
      - Méthode de calcul (bloc, tranche, manuel)
      - Prix de vente calculé
      
  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques basées sur les rôles :
      - Admin/Bureau : accès complet
      - Autres rôles : uniquement leurs propres devis
      
  3. Index et Optimisations
    - Index sur quote_date, status, client_name
    - Index sur quote_id dans quote_items
    - Triggers pour updated_at automatique
*/

-- Créer les types ENUM
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE calculation_method AS ENUM ('block', 'slab', 'manual');

-- Table des devis
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations client et projet
  client_name text NOT NULL,
  project_name text,
  
  -- Dates et validité
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  validity_period text DEFAULT '1 mois',
  
  -- Statut
  status quote_status NOT NULL DEFAULT 'draft',
  
  -- Totaux calculés
  subtotal_ht numeric(10, 2) NOT NULL DEFAULT 0,
  discount_percent numeric(5, 2) DEFAULT 0,
  discount_amount numeric(10, 2) DEFAULT 0,
  total_ht numeric(10, 2) NOT NULL DEFAULT 0,
  tva_percent numeric(5, 2) NOT NULL DEFAULT 20,
  total_tva numeric(10, 2) NOT NULL DEFAULT 0,
  total_ttc numeric(10, 2) NOT NULL DEFAULT 0,
  
  -- Notes et conditions
  notes text,
  payment_conditions text DEFAULT 'Paiement à 30 jours',
  
  -- Métadonnées
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des lignes de devis
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Ordre d'affichage
  item_order integer NOT NULL DEFAULT 0,
  
  -- Description et matière
  description text NOT NULL,
  material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  material_name text, -- Copie du nom pour historique
  
  -- Quantité et unité
  quantity numeric(10, 2) NOT NULL,
  unit text NOT NULL DEFAULT 'm2', -- m2, ml, u, forfait
  thickness numeric(5, 2), -- Épaisseur en cm
  
  -- Méthode de calcul
  calculation_method calculation_method NOT NULL,
  
  -- Paramètres de calcul (pour historique et traçabilité)
  -- Utilisés pour "block" et "slab"
  source_price numeric(10, 2), -- Prix d'achat (m3 pour bloc, m2 pour tranche)
  sawing_cost numeric(10, 2), -- Coût sciage (si bloc)
  waste_factor numeric(5, 2) DEFAULT 1.2, -- Coefficient de perte
  margin_coefficient numeric(5, 2) DEFAULT 1.55, -- Coefficient de marge
  labor_cost numeric(10, 2) DEFAULT 0, -- Coût main d'œuvre
  consumables_cost numeric(10, 2) DEFAULT 0, -- Coût consommables
  fabrication_cost numeric(10, 2) DEFAULT 0, -- Coût façonnage (si tranche)
  
  -- Prix calculés
  unit_cost_price numeric(10, 2), -- Prix de revient unitaire
  unit_selling_price numeric(10, 2) NOT NULL, -- Prix de vente unitaire HT
  total_price numeric(10, 2) NOT NULL, -- Total ligne (quantité × prix unitaire)
  
  -- Notes
  notes text,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(quote_date DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_name);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_material_id ON quote_items(material_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_order ON quote_items(quote_id, item_order);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

CREATE TRIGGER quote_items_updated_at
  BEFORE UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Activer RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour quotes
-- Admin et Bureau peuvent tout voir
CREATE POLICY "Admin and Bureau can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau')
    )
  );

-- Les autres utilisateurs ne voient que leurs propres devis
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Admin et Bureau peuvent créer des devis
CREATE POLICY "Admin and Bureau can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau')
    )
  );

-- Admin et Bureau peuvent modifier tous les devis
CREATE POLICY "Admin and Bureau can update all quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau')
    )
  );

-- Les autres utilisateurs peuvent modifier leurs propres devis en brouillon
CREATE POLICY "Users can update own draft quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'draft')
  WITH CHECK (created_by = auth.uid());

-- Seul Admin peut supprimer
CREATE POLICY "Admin can delete quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politiques RLS pour quote_items
-- Même logique que quotes mais basée sur le quote_id parent
CREATE POLICY "Users can view quote items if they can view quote"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (
        quotes.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'bureau')
        )
      )
    )
  );

CREATE POLICY "Admin and Bureau can insert quote items"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Users can insert items to own quotes"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
    )
  );

CREATE POLICY "Admin and Bureau can update all quote items"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Users can update items of own draft quotes"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
      AND quotes.status = 'draft'
    )
  );

CREATE POLICY "Admin can delete quote items"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete items of own draft quotes"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
      AND quotes.status = 'draft'
    )
  );
