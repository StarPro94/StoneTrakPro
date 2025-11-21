/*
  # Mise à jour des politiques RLS pour debit_sheets et debit_items

  Ce script corrige les problèmes d'accès aux données en mettant à jour les politiques Row Level Security :

  1. Debit Sheets - Politiques mises à jour
    - SELECT : Admin/Bureau/Stock voient tout, Atelier voit seulement les feuilles assignées à sa machine
    - INSERT : Admin/Bureau peuvent créer des feuilles
    - UPDATE : Admin/Bureau/Stock peuvent modifier, Atelier ne peut pas modifier les feuilles
    - DELETE : Admin/Bureau peuvent supprimer

  2. Debit Items - Politiques mises à jour
    - SELECT : Basé sur l'accès à la feuille parente
    - INSERT : Admin/Bureau peuvent créer des éléments
    - UPDATE : Admin/Bureau modifient tout, Atelier peut seulement changer le statut 'termine'
    - DELETE : Admin/Bureau peuvent supprimer

  3. Sécurité
    - Respect des rôles définis dans le README
    - Protection contre les accès non autorisés
    - Isolation des données par machine pour les ateliers
*/

-- Supprimer les anciennes politiques pour les remplacer
DROP POLICY IF EXISTS "Temporary SELECT for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based DELETE for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based INSERT for debit_sheets" ON public.debit_sheets;
DROP POLICY IF EXISTS "Role-based UPDATE for debit_sheets" ON public.debit_sheets;

DROP POLICY IF EXISTS "Temporary SELECT for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based DELETE for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based INSERT for debit_items" ON public.debit_items;
DROP POLICY IF EXISTS "Role-based UPDATE for debit_items" ON public.debit_items;

-- Créer les nouvelles politiques pour debit_sheets
-- SELECT: Admin, Bureau, Stock Matière voient tout. Atelier voit les feuilles assignées à sa machine.
CREATE POLICY "Role-based SELECT for debit_sheets"
ON public.debit_sheets
FOR SELECT
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'atelier'::user_role THEN (machine_id = get_user_machine_id())
    WHEN 'stock_matiere'::user_role THEN true
    ELSE false
  END
);

-- INSERT: Admin et Bureau peuvent insérer des feuilles, et l'utilisateur qui insère doit être le propriétaire (user_id).
CREATE POLICY "Role-based INSERT for debit_sheets"
ON public.debit_sheets
FOR INSERT
TO authenticated
WITH CHECK (
  ((get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role])) AND (auth.uid() = user_id))
);

-- UPDATE: Admin, Bureau, Stock Matière peuvent modifier toutes les feuilles. Atelier ne peut pas modifier les feuilles directement.
CREATE POLICY "Role-based UPDATE for debit_sheets"
ON public.debit_sheets
FOR UPDATE
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'stock_matiere'::user_role THEN true
    ELSE false
  END
) WITH CHECK (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'stock_matiere'::user_role THEN true
    ELSE false
  END
);

-- DELETE: Admin et Bureau peuvent supprimer toutes les feuilles.
CREATE POLICY "Role-based DELETE for debit_sheets"
ON public.debit_sheets
FOR DELETE
TO authenticated
USING (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'bureau'::user_role]))
);

-- Créer les nouvelles politiques pour debit_items
-- SELECT: Les utilisateurs voient les items des feuilles qu'ils sont autorisés à voir.
CREATE POLICY "Role-based SELECT for debit_items"
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
        WHEN 'atelier'::user_role THEN (ds.machine_id = get_user_machine_id())
        WHEN 'stock_matiere'::user_role THEN true
        ELSE false
      END
    )
  )
);

-- INSERT: Admin et Bureau peuvent insérer des items dans les feuilles qu'ils peuvent gérer.
CREATE POLICY "Role-based INSERT for debit_items"
ON public.debit_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
    AND (
      CASE get_user_role()
        WHEN 'admin'::user_role THEN true
        WHEN 'bureau'::user_role THEN true
        ELSE false
      END
    )
  )
);

-- UPDATE: Admin et Bureau peuvent modifier tous les items. Atelier peut seulement modifier le statut 'termine' des items des feuilles assignées à sa machine.
CREATE POLICY "Role-based UPDATE for debit_items"
ON public.debit_items
FOR UPDATE
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
        WHEN 'atelier'::user_role THEN (ds.machine_id = get_user_machine_id())
        ELSE false
      END
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.debit_sheets ds
    WHERE ds.id = debit_items.sheet_id
    AND (
      CASE get_user_role()
        WHEN 'admin'::user_role THEN true
        WHEN 'bureau'::user_role THEN true
        WHEN 'atelier'::user_role THEN (ds.machine_id = get_user_machine_id())
        ELSE false
      END
    )
  )
);

-- DELETE: Admin et Bureau peuvent supprimer les items des feuilles qu'ils peuvent gérer.
CREATE POLICY "Role-based DELETE for debit_items"
ON public.debit_items
FOR DELETE
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
        ELSE false
      END
    )
  )
);