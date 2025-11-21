/*
  # Refonte complète du système de contrôle d'accès basé sur les rôles

  ## Résumé des permissions par rôle

  ### Administrateur (admin)
  - Accès COMPLET à toutes les tables et fonctionnalités
  - Peut gérer les utilisateurs (profiles)
  - Peut tout voir, créer, modifier et supprimer

  ### Bureau d'études (bureau)
  - Accès à TOUT sauf la gestion des utilisateurs (pas d'accès à l'onglet Admin)
  - Peut voir, créer, modifier et supprimer : debit_sheets, debit_items, slabs, blocks, machines
  - Peut tout faire sur le planning
  - Accès complet aux rapports et dashboard
  - Accès complet au module échafaudage

  ### Stock Matière (stock_matiere)
  - Tableau de suivi (tracking) : LECTURE SEULE sur debit_sheets et debit_items
  - Stock Matière : ACCÈS COMPLET sur slabs et blocks
  - Planning : LECTURE SEULE
  - Pas d'accès : Dashboard, Rapports, Échafaudage, Admin

  ### Atelier (atelier)
  - Tableau de suivi : LECTURE SEULE sur debit_sheets et debit_items (filtrés par machine assignée)
  - Stock Matière : LECTURE SEULE sur slabs et blocks
  - Planning : LECTURE SEULE sur tout, ÉDITION uniquement sur les chantiers assignés à SA MACHINE
  - Pas d'accès : Dashboard, Rapports, Échafaudage, Admin

  ## Tables concernées
  1. debit_sheets - Feuilles de débit
  2. debit_items - Items des feuilles de débit
  3. slabs - Tranches/dalles en stock
  4. blocks - Blocs en stock
  5. machines - Machines de production
  6. profiles - Profils utilisateurs (admin uniquement)
  7. materials - Matériaux (tous peuvent lire, admin/bureau peuvent modifier)
  8. scaffolding_* - Tables d'échafaudage (admin/bureau uniquement)

  ## Sécurité
  - Suppression de toutes les anciennes politiques incohérentes
  - Création de nouvelles politiques restrictives par défaut
  - Utilisation des fonctions helper get_user_role() et get_user_machine_id()
  - Protection contre les accès non autorisés
  - Isolation des données par machine pour le rôle Atelier
*/

-- ============================================================================
-- ÉTAPE 1: SUPPRESSION DES ANCIENNES POLITIQUES SUR DEBIT_SHEETS
-- ============================================================================

DROP POLICY IF EXISTS "Temporary SELECT for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based DELETE for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based INSERT for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based UPDATE for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based SELECT for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Users can view own debit sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Users can insert own debit sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Users can update own debit sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Users can delete own debit sheets" ON public.debit_sheets;

-- ============================================================================
-- ÉTAPE 2: SUPPRESSION DES ANCIENNES POLITIQUES SUR DEBIT_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "Temporary SELECT for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based DELETE for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based INSERT for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based UPDATE for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based SELECT for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Users can view own debit items" ON public.debit_items;
DROP POLICY IF EXISTS "Users can insert own debit items" ON public.debit_items;
DROP POLICY IF EXISTS "Users can update own debit items" ON public.debit_items;
DROP POLICY IF EXISTS "Users can delete own debit items" ON public.debit_items;

-- ============================================================================
-- ÉTAPE 3: SUPPRESSION DES ANCIENNES POLITIQUES SUR SLABS
-- ============================================================================

DROP POLICY IF EXISTS "Temporary SELECT for slabs" ON public.slabs;
DROP POLICY IF EXISTS "Role-based SELECT for slabs" ON public.slabs;
DROP POLICY IF EXISTS "Role-based INSERT for slabs" ON public.slabs;
DROP POLICY IF EXISTS "Role-based UPDATE for slabs" ON public.slabs;
DROP POLICY IF EXISTS "Role-based DELETE for slabs" ON public.slabs;
DROP POLICY IF EXISTS "Users can view own slabs" ON public.slabs;
DROP POLICY IF EXISTS "Users can insert own slabs" ON public.slabs;
DROP POLICY IF EXISTS "Users can update own slabs" ON public.slabs;
DROP POLICY IF EXISTS "Users can delete own slabs" ON public.slabs;

-- ============================================================================
-- ÉTAPE 4: SUPPRESSION DES ANCIENNES POLITIQUES SUR BLOCKS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all blocks" ON public.blocks;
DROP POLICY IF EXISTS "Authorized users can insert blocks" ON public.blocks;
DROP POLICY IF EXISTS "Authorized users can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Authorized users can delete blocks" ON public.blocks;

-- ============================================================================
-- ÉTAPE 5: SUPPRESSION DES ANCIENNES POLITIQUES SUR MACHINES
-- ============================================================================

DROP POLICY IF EXISTS "All authenticated users can view machines" ON public.machines;
DROP POLICY IF EXISTS "Role-based INSERT for machines" ON public.machines;
DROP POLICY IF EXISTS "Role-based UPDATE for machines" ON public.machines;
DROP POLICY IF EXISTS "Role-based DELETE for machines" ON public.machines;
DROP POLICY IF EXISTS "Users can read own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can insert own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can update own machines" ON public.machines;
DROP POLICY IF EXISTS "Users can delete own machines" ON public.machines;

-- ============================================================================
-- NOUVELLES POLITIQUES POUR DEBIT_SHEETS
-- ============================================================================

-- SELECT: Admin et Bureau voient tout. Stock Matière voit tout. Atelier voit uniquement sa machine.
CREATE POLICY "New role-based SELECT for debit_sheets"
ON public.debit_sheets
FOR SELECT
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'stock_matiere'::user_role THEN true
    WHEN 'atelier'::user_role THEN (machine_id = get_user_machine_id())
    ELSE false
  END
);

-- INSERT: Admin et Bureau peuvent créer des feuilles
CREATE POLICY "New role-based INSERT for debit_sheets"
ON public.debit_sheets
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
  AND auth.uid() = user_id
);

-- UPDATE: Admin et Bureau peuvent tout modifier. Stock Matière NE PEUT PAS modifier. Atelier NE PEUT PAS modifier.
CREATE POLICY "New role-based UPDATE for debit_sheets"
ON public.debit_sheets
FOR UPDATE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- DELETE: Admin et Bureau uniquement
CREATE POLICY "New role-based DELETE for debit_sheets"
ON public.debit_sheets
FOR DELETE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- ============================================================================
-- NOUVELLES POLITIQUES POUR DEBIT_ITEMS
-- ============================================================================

-- SELECT: Basé sur l'accès à la feuille parente
CREATE POLICY "New role-based SELECT for debit_items"
ON public.debit_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
    AND (
      CASE get_user_role()
        WHEN 'admin'::user_role THEN true
        WHEN 'bureau'::user_role THEN true
        WHEN 'stock_matiere'::user_role THEN true
        WHEN 'atelier'::user_role THEN (ds.machine_id = get_user_machine_id())
        ELSE false
      END
    )
  )
);

-- INSERT: Admin et Bureau uniquement
CREATE POLICY "New role-based INSERT for debit_items"
ON public.debit_items
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
  AND EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
  )
);

-- UPDATE: Admin et Bureau uniquement (Stock Matière et Atelier ne peuvent PAS modifier)
CREATE POLICY "New role-based UPDATE for debit_items"
ON public.debit_items
FOR UPDATE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
  AND EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
  )
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
  AND EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
  )
);

-- DELETE: Admin et Bureau uniquement
CREATE POLICY "New role-based DELETE for debit_items"
ON public.debit_items
FOR DELETE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
  AND EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
  )
);

-- ============================================================================
-- NOUVELLES POLITIQUES POUR SLABS (Tranches)
-- ============================================================================

-- SELECT: Admin, Bureau, Stock Matière voient tout. Atelier voit tout (lecture seule).
CREATE POLICY "New role-based SELECT for slabs"
ON public.slabs
FOR SELECT
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role, 'atelier'::user_role])
);

-- INSERT: Admin, Bureau, Stock Matière uniquement
CREATE POLICY "New role-based INSERT for slabs"
ON public.slabs
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
  AND auth.uid() = user_id
);

-- UPDATE: Admin, Bureau, Stock Matière uniquement
CREATE POLICY "New role-based UPDATE for slabs"
ON public.slabs
FOR UPDATE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
);

-- DELETE: Admin, Bureau, Stock Matière uniquement
CREATE POLICY "New role-based DELETE for slabs"
ON public.slabs
FOR DELETE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
);

-- ============================================================================
-- NOUVELLES POLITIQUES POUR BLOCKS (Blocs)
-- ============================================================================

-- SELECT: Admin, Bureau, Stock Matière voient tout. Atelier voit tout (lecture seule).
CREATE POLICY "New role-based SELECT for blocks"
ON public.blocks
FOR SELECT
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role, 'atelier'::user_role])
);

-- INSERT: Admin, Bureau, Stock Matière uniquement
CREATE POLICY "New role-based INSERT for blocks"
ON public.blocks
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
);

-- UPDATE: Admin, Bureau, Stock Matière uniquement
CREATE POLICY "New role-based UPDATE for blocks"
ON public.blocks
FOR UPDATE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
);

-- DELETE: Admin, Bureau, Stock Matière uniquement
CREATE POLICY "New role-based DELETE for blocks"
ON public.blocks
FOR DELETE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role, 'stock_matiere'::user_role])
);

-- ============================================================================
-- NOUVELLES POLITIQUES POUR MACHINES
-- ============================================================================

-- SELECT: Tout le monde peut voir les machines
CREATE POLICY "New all users can view machines"
ON public.machines
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Admin et Bureau uniquement
CREATE POLICY "New role-based INSERT for machines"
ON public.machines
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
  AND auth.uid() = user_id
);

-- UPDATE: Admin et Bureau uniquement
CREATE POLICY "New role-based UPDATE for machines"
ON public.machines
FOR UPDATE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- DELETE: Admin et Bureau uniquement
CREATE POLICY "New role-based DELETE for machines"
ON public.machines
FOR DELETE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- ============================================================================
-- NOUVELLES POLITIQUES POUR MATERIALS (Matériaux master list)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone authenticated can view materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can update materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON public.materials;

-- SELECT: Tout le monde peut voir les matériaux
CREATE POLICY "New all users can view materials"
ON public.materials
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Admin et Bureau uniquement
CREATE POLICY "New role-based INSERT for materials"
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- UPDATE: Admin et Bureau uniquement
CREATE POLICY "New role-based UPDATE for materials"
ON public.materials
FOR UPDATE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
)
WITH CHECK (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- DELETE: Admin et Bureau uniquement
CREATE POLICY "New role-based DELETE for materials"
ON public.materials
FOR DELETE
TO authenticated
USING (
  get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])
);

-- ============================================================================
-- POLITIQUES POUR SCAFFOLDING (Échafaudage) - Admin et Bureau uniquement
-- ============================================================================

-- scaffolding_catalog
DROP POLICY IF EXISTS "Authenticated users can view catalog" ON public.scaffolding_catalog;
DROP POLICY IF EXISTS "Authenticated users can insert catalog" ON public.scaffolding_catalog;
DROP POLICY IF EXISTS "Authenticated users can update catalog" ON public.scaffolding_catalog;
DROP POLICY IF EXISTS "Authenticated users can delete catalog" ON public.scaffolding_catalog;

CREATE POLICY "Admin and Bureau can view scaffolding_catalog"
ON public.scaffolding_catalog FOR SELECT TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can insert scaffolding_catalog"
ON public.scaffolding_catalog FOR INSERT TO authenticated
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can update scaffolding_catalog"
ON public.scaffolding_catalog FOR UPDATE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can delete scaffolding_catalog"
ON public.scaffolding_catalog FOR DELETE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

-- scaffolding_sites
DROP POLICY IF EXISTS "Users can view all sites" ON public.scaffolding_sites;
DROP POLICY IF EXISTS "Users can insert own sites" ON public.scaffolding_sites;
DROP POLICY IF EXISTS "Users can update own sites" ON public.scaffolding_sites;
DROP POLICY IF EXISTS "Users can delete own sites" ON public.scaffolding_sites;

CREATE POLICY "Admin and Bureau can view scaffolding_sites"
ON public.scaffolding_sites FOR SELECT TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can insert scaffolding_sites"
ON public.scaffolding_sites FOR INSERT TO authenticated
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can update scaffolding_sites"
ON public.scaffolding_sites FOR UPDATE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can delete scaffolding_sites"
ON public.scaffolding_sites FOR DELETE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

-- scaffolding_lists
DROP POLICY IF EXISTS "Users can view all lists" ON public.scaffolding_lists;
DROP POLICY IF EXISTS "Users can insert own lists" ON public.scaffolding_lists;
DROP POLICY IF EXISTS "Users can update own lists" ON public.scaffolding_lists;
DROP POLICY IF EXISTS "Users can delete own lists" ON public.scaffolding_lists;

CREATE POLICY "Admin and Bureau can view scaffolding_lists"
ON public.scaffolding_lists FOR SELECT TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can insert scaffolding_lists"
ON public.scaffolding_lists FOR INSERT TO authenticated
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can update scaffolding_lists"
ON public.scaffolding_lists FOR UPDATE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can delete scaffolding_lists"
ON public.scaffolding_lists FOR DELETE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

-- scaffolding_list_items
DROP POLICY IF EXISTS "Users can view list items" ON public.scaffolding_list_items;
DROP POLICY IF EXISTS "Users can insert list items" ON public.scaffolding_list_items;
DROP POLICY IF EXISTS "Users can update list items" ON public.scaffolding_list_items;
DROP POLICY IF EXISTS "Users can delete list items" ON public.scaffolding_list_items;

CREATE POLICY "Admin and Bureau can view scaffolding_list_items"
ON public.scaffolding_list_items FOR SELECT TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can insert scaffolding_list_items"
ON public.scaffolding_list_items FOR INSERT TO authenticated
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can update scaffolding_list_items"
ON public.scaffolding_list_items FOR UPDATE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

CREATE POLICY "Admin and Bureau can delete scaffolding_list_items"
ON public.scaffolding_list_items FOR DELETE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

-- Autres tables scaffolding (stock, movements, inventory, layher, etc.)
DROP POLICY IF EXISTS "Users can view own stock" ON public.scaffolding_stock_global;
DROP POLICY IF EXISTS "Users can insert own stock" ON public.scaffolding_stock_global;
DROP POLICY IF EXISTS "Users can update own stock" ON public.scaffolding_stock_global;
DROP POLICY IF EXISTS "Users can delete own stock" ON public.scaffolding_stock_global;

CREATE POLICY "Admin and Bureau can manage scaffolding_stock_global"
ON public.scaffolding_stock_global FOR ALL TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

DROP POLICY IF EXISTS "Users can view own movements" ON public.scaffolding_stock_movements;
DROP POLICY IF EXISTS "Users can insert own movements" ON public.scaffolding_stock_movements;

CREATE POLICY "Admin and Bureau can manage scaffolding_stock_movements"
ON public.scaffolding_stock_movements FOR ALL TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

DROP POLICY IF EXISTS "Users can view site inventory through sites" ON public.scaffolding_site_inventory;
DROP POLICY IF EXISTS "Users can insert site inventory through sites" ON public.scaffolding_site_inventory;
DROP POLICY IF EXISTS "Users can update site inventory through sites" ON public.scaffolding_site_inventory;
DROP POLICY IF EXISTS "Users can delete site inventory through sites" ON public.scaffolding_site_inventory;

CREATE POLICY "Admin and Bureau can manage scaffolding_site_inventory"
ON public.scaffolding_site_inventory FOR ALL TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

DROP POLICY IF EXISTS "Users can view own layher stock" ON public.scaffolding_layher_stock;
DROP POLICY IF EXISTS "Users can insert own layher stock" ON public.scaffolding_layher_stock;
DROP POLICY IF EXISTS "Users can update own layher stock" ON public.scaffolding_layher_stock;
DROP POLICY IF EXISTS "Users can delete own layher stock" ON public.scaffolding_layher_stock;

CREATE POLICY "Admin and Bureau can manage scaffolding_layher_stock"
ON public.scaffolding_layher_stock FOR ALL TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

DROP POLICY IF EXISTS "Users can view all rentals" ON public.scaffolding_layher_rentals;
DROP POLICY IF EXISTS "Users can insert own rentals" ON public.scaffolding_layher_rentals;
DROP POLICY IF EXISTS "Users can update own rentals" ON public.scaffolding_layher_rentals;
DROP POLICY IF EXISTS "Users can delete own rentals" ON public.scaffolding_layher_rentals;

CREATE POLICY "Admin and Bureau can manage scaffolding_layher_rentals"
ON public.scaffolding_layher_rentals FOR ALL TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));

DROP POLICY IF EXISTS "Users can view all damaged items" ON public.scaffolding_damaged_items;
DROP POLICY IF EXISTS "Users can insert own damaged items" ON public.scaffolding_damaged_items;
DROP POLICY IF EXISTS "Users can update own damaged items" ON public.scaffolding_damaged_items;
DROP POLICY IF EXISTS "Users can delete own damaged items" ON public.scaffolding_damaged_items;

CREATE POLICY "Admin and Bureau can manage scaffolding_damaged_items"
ON public.scaffolding_damaged_items FOR ALL TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]));
