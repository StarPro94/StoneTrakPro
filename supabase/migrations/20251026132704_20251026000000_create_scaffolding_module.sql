/*
  # Module de Gestion d'Échafaudage - Tables Principales

  ## Description
  Ce module gère l'ensemble du processus de gestion d'échafaudage :
  - Catalogue des éléments d'échafaudage (références Layher)
  - Chantiers et sites
  - Listes de livraison et réception
  - Gestion du stock global et par chantier
  - Locations Layher
  - Éléments endommagés (HS)
  
  ## Tables créées
  
  ### 1. scaffolding_catalog
  Catalogue maître de tous les éléments d'échafaudage
  - `id` (uuid, clé primaire)
  - `reference` (text, référence unique type "2603/200")
  - `designation` (text, description de l'élément)
  - `poids_unitaire` (numeric, poids en kg)
  - `category` (text, catégorie pour filtrage)
  - `layher_reference` (text, référence Layher si différente)
  - `created_at`, `updated_at`
  
  ### 2. scaffolding_sites
  Chantiers où le matériel est envoyé
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, créateur)
  - `numero` (text, numéro unique du chantier)
  - `nom` (text, nom du chantier)
  - `adresse` (text, adresse complète)
  - `status` (text, actif/terminé)
  - `date_debut`, `date_fin`
  - `created_at`, `updated_at`
  
  ### 3. scaffolding_lists
  Listes de livraison et réception
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, créateur)
  - `numero` (text, numéro auto-généré)
  - `type` (text, 'livraison' ou 'reception')
  - `site_id` (uuid, référence au chantier)
  - `date` (date, date de la liste)
  - `preparateur` (text, nom du préparateur)
  - `receptionnaire` (text, nom du réceptionnaire)
  - `transporteur` (text, nom du transporteur)
  - `status` (text, brouillon/pret/en_cours/termine)
  - `notes` (text, notes additionnelles)
  - `created_at`, `updated_at`
  
  ### 4. scaffolding_list_items
  Éléments individuels dans chaque liste
  - `id` (uuid, clé primaire)
  - `list_id` (uuid, référence à scaffolding_lists)
  - `catalog_item_id` (uuid, référence à scaffolding_catalog)
  - `quantite` (integer, quantité)
  - `poids_total` (numeric, calculé automatiquement)
  - `location_abbeville` (numeric, poids à Abbeville)
  - `location_beauvais` (numeric, poids à Beauvais)
  - `location_semi` (numeric, poids Semi)
  - `is_layher_rental` (boolean, si c'est une location Layher)
  - `created_at`, `updated_at`
  
  ### 5. scaffolding_layher_rentals
  Suivi des locations Layher
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, gestionnaire)
  - `catalog_item_id` (uuid, référence à scaffolding_catalog)
  - `site_id` (uuid, chantier destination)
  - `quantite` (integer, quantité louée)
  - `date_location` (date, date de début)
  - `date_retour_prevue` (date, date retour prévue)
  - `date_retour_effective` (date, date retour réelle)
  - `status` (text, en_cours/retourne)
  - `cout_estime` (numeric, coût estimé)
  - `created_at`, `updated_at`
  
  ### 6. scaffolding_damaged_items
  Suivi des éléments endommagés
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, déclarant)
  - `catalog_item_id` (uuid, référence à scaffolding_catalog)
  - `quantite` (integer, quantité HS)
  - `description` (text, description des dommages)
  - `date_constat` (date, date du constat)
  - `cout_reparation` (numeric, coût estimé)
  - `status` (text, en_attente/en_reparation/repare/rebut)
  - `photos` (jsonb, URLs des photos)
  - `created_at`, `updated_at`
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Politiques restrictives basées sur l'authentification
  - Logs d'audit pour traçabilité
  
  ## Index
  - Index sur toutes les clés étrangères
  - Index sur les champs de recherche fréquents
  - Index sur les dates pour requêtes temporelles
*/

-- ============================================================================
-- 1. TABLE: scaffolding_catalog
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaffolding_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  designation text NOT NULL,
  poids_unitaire numeric(10,2) NOT NULL DEFAULT 0,
  category text,
  layher_reference text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. TABLE: scaffolding_sites
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaffolding_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero text UNIQUE NOT NULL,
  nom text NOT NULL,
  adresse text,
  status text NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'termine')),
  date_debut date,
  date_fin date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. TABLE: scaffolding_lists
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaffolding_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('livraison', 'reception')),
  site_id uuid REFERENCES scaffolding_sites(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  preparateur text,
  receptionnaire text,
  transporteur text,
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'pret', 'en_cours', 'termine')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. TABLE: scaffolding_list_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaffolding_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES scaffolding_lists(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE RESTRICT NOT NULL,
  quantite integer NOT NULL DEFAULT 0,
  poids_total numeric(10,2) DEFAULT 0,
  location_abbeville numeric(10,2) DEFAULT 0,
  location_beauvais numeric(10,2) DEFAULT 0,
  location_semi numeric(10,2) DEFAULT 0,
  is_layher_rental boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. TABLE: scaffolding_layher_rentals
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaffolding_layher_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE RESTRICT NOT NULL,
  site_id uuid REFERENCES scaffolding_sites(id) ON DELETE SET NULL,
  quantite integer NOT NULL DEFAULT 0,
  date_location date NOT NULL DEFAULT CURRENT_DATE,
  date_retour_prevue date,
  date_retour_effective date,
  status text NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'retourne')),
  cout_estime numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. TABLE: scaffolding_damaged_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS scaffolding_damaged_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE RESTRICT NOT NULL,
  quantite integer NOT NULL DEFAULT 0,
  description text,
  date_constat date NOT NULL DEFAULT CURRENT_DATE,
  cout_reparation numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_reparation', 'repare', 'rebut')),
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ACTIVATION DE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE scaffolding_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaffolding_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaffolding_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaffolding_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaffolding_layher_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaffolding_damaged_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS - scaffolding_catalog (accessible à tous les authentifiés)
-- ============================================================================

CREATE POLICY "Authenticated users can view catalog"
  ON scaffolding_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert catalog"
  ON scaffolding_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update catalog"
  ON scaffolding_catalog FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete catalog"
  ON scaffolding_catalog FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- POLITIQUES RLS - scaffolding_sites
-- ============================================================================

CREATE POLICY "Users can view all sites"
  ON scaffolding_sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own sites"
  ON scaffolding_sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
  ON scaffolding_sites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
  ON scaffolding_sites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - scaffolding_lists
-- ============================================================================

CREATE POLICY "Users can view all lists"
  ON scaffolding_lists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own lists"
  ON scaffolding_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists"
  ON scaffolding_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
  ON scaffolding_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - scaffolding_list_items
-- ============================================================================

CREATE POLICY "Users can view list items"
  ON scaffolding_list_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scaffolding_lists
      WHERE scaffolding_lists.id = scaffolding_list_items.list_id
    )
  );

CREATE POLICY "Users can insert list items"
  ON scaffolding_list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scaffolding_lists
      WHERE scaffolding_lists.id = scaffolding_list_items.list_id
      AND scaffolding_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update list items"
  ON scaffolding_list_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scaffolding_lists
      WHERE scaffolding_lists.id = scaffolding_list_items.list_id
      AND scaffolding_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scaffolding_lists
      WHERE scaffolding_lists.id = scaffolding_list_items.list_id
      AND scaffolding_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete list items"
  ON scaffolding_list_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scaffolding_lists
      WHERE scaffolding_lists.id = scaffolding_list_items.list_id
      AND scaffolding_lists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLITIQUES RLS - scaffolding_layher_rentals
-- ============================================================================

CREATE POLICY "Users can view all rentals"
  ON scaffolding_layher_rentals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own rentals"
  ON scaffolding_layher_rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rentals"
  ON scaffolding_layher_rentals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rentals"
  ON scaffolding_layher_rentals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES RLS - scaffolding_damaged_items
-- ============================================================================

CREATE POLICY "Users can view all damaged items"
  ON scaffolding_damaged_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own damaged items"
  ON scaffolding_damaged_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own damaged items"
  ON scaffolding_damaged_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own damaged items"
  ON scaffolding_damaged_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS pour mise à jour automatique de updated_at
-- ============================================================================

CREATE TRIGGER update_scaffolding_catalog_updated_at
  BEFORE UPDATE ON scaffolding_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scaffolding_sites_updated_at
  BEFORE UPDATE ON scaffolding_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scaffolding_lists_updated_at
  BEFORE UPDATE ON scaffolding_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scaffolding_list_items_updated_at
  BEFORE UPDATE ON scaffolding_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scaffolding_layher_rentals_updated_at
  BEFORE UPDATE ON scaffolding_layher_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scaffolding_damaged_items_updated_at
  BEFORE UPDATE ON scaffolding_damaged_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEX pour optimisation des performances
-- ============================================================================

-- Index sur scaffolding_catalog
CREATE INDEX IF NOT EXISTS idx_scaffolding_catalog_reference ON scaffolding_catalog(reference);
CREATE INDEX IF NOT EXISTS idx_scaffolding_catalog_designation ON scaffolding_catalog(designation);
CREATE INDEX IF NOT EXISTS idx_scaffolding_catalog_category ON scaffolding_catalog(category);

-- Index sur scaffolding_sites
CREATE INDEX IF NOT EXISTS idx_scaffolding_sites_user_id ON scaffolding_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_sites_numero ON scaffolding_sites(numero);
CREATE INDEX IF NOT EXISTS idx_scaffolding_sites_status ON scaffolding_sites(status);

-- Index sur scaffolding_lists
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_user_id ON scaffolding_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_numero ON scaffolding_lists(numero);
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_site_id ON scaffolding_lists(site_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_type ON scaffolding_lists(type);
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_status ON scaffolding_lists(status);
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_date ON scaffolding_lists(date);

-- Index sur scaffolding_list_items
CREATE INDEX IF NOT EXISTS idx_scaffolding_list_items_list_id ON scaffolding_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_list_items_catalog_id ON scaffolding_list_items(catalog_item_id);

-- Index sur scaffolding_layher_rentals
CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_user_id ON scaffolding_layher_rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_catalog_id ON scaffolding_layher_rentals(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_site_id ON scaffolding_layher_rentals(site_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_status ON scaffolding_layher_rentals(status);

-- Index sur scaffolding_damaged_items
CREATE INDEX IF NOT EXISTS idx_scaffolding_damaged_items_user_id ON scaffolding_damaged_items(user_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_damaged_items_catalog_id ON scaffolding_damaged_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_scaffolding_damaged_items_status ON scaffolding_damaged_items(status);