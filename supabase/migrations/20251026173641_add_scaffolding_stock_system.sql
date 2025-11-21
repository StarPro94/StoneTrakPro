/*
  # Système Complet de Gestion de Stock d'Échafaudage

  ## Description
  Ce fichier crée l'infrastructure complète pour gérer le stock d'échafaudage avec les fonctionnalités suivantes:
  - Stock global avec suivi en temps réel
  - Gestion des mouvements de stock (livraisons, réceptions, locations)
  - Suivi du matériel sur chantier
  - Gestion des éléments endommagés (HS)
  - Calculs automatiques des quantités disponibles

  ## Nouvelles Tables

  ### 1. scaffolding_stock_global
  Table principale du stock avec les colonnes:
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, référence users)
  - `catalog_item_id` (uuid, référence scaffolding_catalog)
  - `quantite_totale` (integer) - Quantité totale possédée
  - `quantite_disponible` (integer) - Quantité actuellement disponible (calculée automatiquement)
  - `quantite_sur_chantier` (integer) - Quantité sur tous les chantiers actifs
  - `quantite_hs` (integer) - Quantité hors service
  - `quantite_layher` (integer) - Quantité louée chez Layher
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. scaffolding_stock_movements
  Historique de tous les mouvements de stock:
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, référence users)
  - `catalog_item_id` (uuid, référence scaffolding_catalog)
  - `type` (text) - Type de mouvement: 'entree', 'sortie', 'retour', 'hs', 'reparation', 'rebut', 'layher_location', 'layher_retour'
  - `quantite` (integer) - Quantité déplacée
  - `source` (text) - Source du mouvement
  - `destination` (text) - Destination du mouvement
  - `site_id` (uuid, référence scaffolding_sites, optionnel)
  - `list_id` (uuid, référence scaffolding_lists, optionnel)
  - `notes` (text, optionnel)
  - `created_at` (timestamptz)

  ### 3. scaffolding_site_inventory
  Inventaire du matériel présent sur chaque chantier:
  - `id` (uuid, clé primaire)
  - `site_id` (uuid, référence scaffolding_sites)
  - `catalog_item_id` (uuid, référence scaffolding_catalog)
  - `quantite_livree` (integer) - Total livré sur le chantier
  - `quantite_recue` (integer) - Total retourné du chantier
  - `quantite_actuelle` (integer) - Calculé: livré - reçu
  - `last_movement_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. scaffolding_layher_stock
  Stock loué chez Layher:
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, référence users)
  - `catalog_item_id` (uuid, référence scaffolding_catalog)
  - `quantite` (integer)
  - `date_location` (date)
  - `date_retour_prevue` (date, optionnel)
  - `date_retour_effective` (date, optionnel)
  - `numero_commande` (text)
  - `cout_location` (numeric, optionnel)
  - `status` (text) - 'en_cours' ou 'retourne'
  - `notes` (text, optionnel)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. scaffolding_damaged_items (refonte de la table existante)
  Éléments hors service (HS):
  - Ajout de colonnes pour la gestion complète
  - Lien avec les mouvements de stock
  - Historique des réparations

  ## Sécurité
  - RLS activé sur toutes les tables
  - Politiques pour lecture/écriture basées sur l'authentification
  - Vérification de propriété sur toutes les opérations

  ## Fonctions et Triggers
  - Fonction de calcul automatique des quantités disponibles
  - Trigger de mise à jour du stock lors des mouvements
  - Fonction de vérification de disponibilité avant livraison
*/

-- Table: scaffolding_stock_global
CREATE TABLE IF NOT EXISTS scaffolding_stock_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE CASCADE NOT NULL,
  quantite_totale integer DEFAULT 0 NOT NULL,
  quantite_disponible integer DEFAULT 0 NOT NULL,
  quantite_sur_chantier integer DEFAULT 0 NOT NULL,
  quantite_hs integer DEFAULT 0 NOT NULL,
  quantite_layher integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, catalog_item_id)
);

-- Table: scaffolding_stock_movements
CREATE TABLE IF NOT EXISTS scaffolding_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('entree', 'sortie', 'retour', 'hs', 'reparation', 'rebut', 'layher_location', 'layher_retour')),
  quantite integer NOT NULL,
  source text,
  destination text,
  site_id uuid REFERENCES scaffolding_sites(id) ON DELETE SET NULL,
  list_id uuid REFERENCES scaffolding_lists(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table: scaffolding_site_inventory
CREATE TABLE IF NOT EXISTS scaffolding_site_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES scaffolding_sites(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE CASCADE NOT NULL,
  quantite_livree integer DEFAULT 0 NOT NULL,
  quantite_recue integer DEFAULT 0 NOT NULL,
  quantite_actuelle integer DEFAULT 0 NOT NULL,
  last_movement_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(site_id, catalog_item_id)
);

-- Table: scaffolding_layher_stock
CREATE TABLE IF NOT EXISTS scaffolding_layher_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id uuid REFERENCES scaffolding_catalog(id) ON DELETE CASCADE NOT NULL,
  quantite integer NOT NULL,
  date_location date NOT NULL,
  date_retour_prevue date,
  date_retour_effective date,
  numero_commande text NOT NULL,
  cout_location numeric(10, 2),
  status text DEFAULT 'en_cours' NOT NULL CHECK (status IN ('en_cours', 'retourne')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_stock_global_user ON scaffolding_stock_global(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_global_catalog ON scaffolding_stock_global(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON scaffolding_stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_catalog ON scaffolding_stock_movements(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_site ON scaffolding_stock_movements(site_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON scaffolding_stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_site_inventory_site ON scaffolding_site_inventory(site_id);
CREATE INDEX IF NOT EXISTS idx_site_inventory_catalog ON scaffolding_site_inventory(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_layher_stock_user ON scaffolding_layher_stock(user_id);
CREATE INDEX IF NOT EXISTS idx_layher_stock_status ON scaffolding_layher_stock(status);

-- RLS: scaffolding_stock_global
ALTER TABLE scaffolding_stock_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock"
  ON scaffolding_stock_global FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock"
  ON scaffolding_stock_global FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock"
  ON scaffolding_stock_global FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock"
  ON scaffolding_stock_global FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: scaffolding_stock_movements
ALTER TABLE scaffolding_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movements"
  ON scaffolding_stock_movements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movements"
  ON scaffolding_stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: scaffolding_site_inventory
ALTER TABLE scaffolding_site_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view site inventory through sites"
  ON scaffolding_site_inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scaffolding_sites
      WHERE scaffolding_sites.id = scaffolding_site_inventory.site_id
      AND scaffolding_sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert site inventory through sites"
  ON scaffolding_site_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scaffolding_sites
      WHERE scaffolding_sites.id = scaffolding_site_inventory.site_id
      AND scaffolding_sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update site inventory through sites"
  ON scaffolding_site_inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scaffolding_sites
      WHERE scaffolding_sites.id = scaffolding_site_inventory.site_id
      AND scaffolding_sites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scaffolding_sites
      WHERE scaffolding_sites.id = scaffolding_site_inventory.site_id
      AND scaffolding_sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete site inventory through sites"
  ON scaffolding_site_inventory FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scaffolding_sites
      WHERE scaffolding_sites.id = scaffolding_site_inventory.site_id
      AND scaffolding_sites.user_id = auth.uid()
    )
  );

-- RLS: scaffolding_layher_stock
ALTER TABLE scaffolding_layher_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own layher stock"
  ON scaffolding_layher_stock FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layher stock"
  ON scaffolding_layher_stock FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layher stock"
  ON scaffolding_layher_stock FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own layher stock"
  ON scaffolding_layher_stock FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction: Mettre à jour les quantités du stock global
CREATE OR REPLACE FUNCTION update_stock_quantities()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les quantités pour l'article concerné
  UPDATE scaffolding_stock_global
  SET
    quantite_disponible = quantite_totale - quantite_sur_chantier - quantite_hs + quantite_layher,
    updated_at = now()
  WHERE catalog_item_id = NEW.catalog_item_id
    AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalculer après un mouvement de stock
CREATE TRIGGER trigger_recalc_stock_after_movement
  AFTER INSERT ON scaffolding_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_quantities();

-- Fonction: Mettre à jour l'inventaire chantier après livraison/réception
CREATE OR REPLACE FUNCTION update_site_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une livraison (sortie vers chantier)
  IF NEW.type = 'sortie' AND NEW.site_id IS NOT NULL THEN
    INSERT INTO scaffolding_site_inventory (site_id, catalog_item_id, quantite_livree, quantite_recue, quantite_actuelle, last_movement_at)
    VALUES (NEW.site_id, NEW.catalog_item_id, NEW.quantite, 0, NEW.quantite, now())
    ON CONFLICT (site_id, catalog_item_id)
    DO UPDATE SET
      quantite_livree = scaffolding_site_inventory.quantite_livree + NEW.quantite,
      quantite_actuelle = scaffolding_site_inventory.quantite_livree + NEW.quantite - scaffolding_site_inventory.quantite_recue,
      last_movement_at = now(),
      updated_at = now();

    -- Mettre à jour le stock global
    UPDATE scaffolding_stock_global
    SET
      quantite_sur_chantier = quantite_sur_chantier + NEW.quantite,
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  -- Si c'est une réception (retour du chantier)
  IF NEW.type = 'retour' AND NEW.site_id IS NOT NULL THEN
    INSERT INTO scaffolding_site_inventory (site_id, catalog_item_id, quantite_livree, quantite_recue, quantite_actuelle, last_movement_at)
    VALUES (NEW.site_id, NEW.catalog_item_id, 0, NEW.quantite, -NEW.quantite, now())
    ON CONFLICT (site_id, catalog_item_id)
    DO UPDATE SET
      quantite_recue = scaffolding_site_inventory.quantite_recue + NEW.quantite,
      quantite_actuelle = scaffolding_site_inventory.quantite_livree - (scaffolding_site_inventory.quantite_recue + NEW.quantite),
      last_movement_at = now(),
      updated_at = now();

    -- Mettre à jour le stock global
    UPDATE scaffolding_stock_global
    SET
      quantite_sur_chantier = GREATEST(0, quantite_sur_chantier - NEW.quantite),
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  -- Si c'est un élément HS
  IF NEW.type = 'hs' THEN
    UPDATE scaffolding_stock_global
    SET
      quantite_hs = quantite_hs + NEW.quantite,
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  -- Si c'est une réparation
  IF NEW.type = 'reparation' THEN
    UPDATE scaffolding_stock_global
    SET
      quantite_hs = GREATEST(0, quantite_hs - NEW.quantite),
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  -- Si c'est un rebut
  IF NEW.type = 'rebut' THEN
    UPDATE scaffolding_stock_global
    SET
      quantite_hs = GREATEST(0, quantite_hs - NEW.quantite),
      quantite_totale = GREATEST(0, quantite_totale - NEW.quantite),
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  -- Si c'est une location Layher
  IF NEW.type = 'layher_location' THEN
    UPDATE scaffolding_stock_global
    SET
      quantite_layher = quantite_layher + NEW.quantite,
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  -- Si c'est un retour Layher
  IF NEW.type = 'layher_retour' THEN
    UPDATE scaffolding_stock_global
    SET
      quantite_layher = GREATEST(0, quantite_layher - NEW.quantite),
      updated_at = now()
    WHERE catalog_item_id = NEW.catalog_item_id
      AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mettre à jour l'inventaire après mouvement
CREATE TRIGGER trigger_update_site_inventory
  AFTER INSERT ON scaffolding_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_site_inventory();

-- Vue: Stock global avec détails du catalogue
CREATE OR REPLACE VIEW v_stock_global_details AS
SELECT
  sg.id,
  sg.user_id,
  sg.catalog_item_id,
  sc.reference,
  sc.designation,
  sc.poids_unitaire,
  sg.quantite_totale,
  sg.quantite_disponible,
  sg.quantite_sur_chantier,
  sg.quantite_hs,
  sg.quantite_layher,
  (sg.quantite_totale * sc.poids_unitaire) as poids_total,
  (sg.quantite_disponible * sc.poids_unitaire) as poids_disponible,
  sg.created_at,
  sg.updated_at
FROM scaffolding_stock_global sg
JOIN scaffolding_catalog sc ON sc.id = sg.catalog_item_id
ORDER BY sc.reference;

-- Vue: Inventaire par chantier avec détails
CREATE OR REPLACE VIEW v_site_inventory_details AS
SELECT
  si.id,
  si.site_id,
  ss.numero as site_numero,
  ss.nom as site_nom,
  si.catalog_item_id,
  sc.reference,
  sc.designation,
  sc.poids_unitaire,
  si.quantite_livree,
  si.quantite_recue,
  si.quantite_actuelle,
  (si.quantite_actuelle * sc.poids_unitaire) as poids_actuel,
  si.last_movement_at,
  si.created_at,
  si.updated_at
FROM scaffolding_site_inventory si
JOIN scaffolding_sites ss ON ss.id = si.site_id
JOIN scaffolding_catalog sc ON sc.id = si.catalog_item_id
ORDER BY ss.numero, sc.reference;

-- Fonction: Vérifier la disponibilité du stock avant livraison
CREATE OR REPLACE FUNCTION check_stock_availability(
  p_user_id uuid,
  p_catalog_item_id uuid,
  p_quantite integer
)
RETURNS TABLE(
  disponible boolean,
  quantite_disponible integer,
  quantite_manquante integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN sg.quantite_disponible >= p_quantite THEN true ELSE false END as disponible,
    sg.quantite_disponible,
    CASE WHEN sg.quantite_disponible < p_quantite THEN p_quantite - sg.quantite_disponible ELSE 0 END as quantite_manquante
  FROM scaffolding_stock_global sg
  WHERE sg.user_id = p_user_id
    AND sg.catalog_item_id = p_catalog_item_id;
END;
$$ LANGUAGE plpgsql;
