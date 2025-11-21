/*
  # Mise à jour de la politique RLS SELECT pour le rôle atelier

  1. Modification de politique
    - Met à jour la politique SELECT pour `debit_sheets`
    - Les utilisateurs `atelier` voient uniquement les feuilles qu'ils ont créées ET qui sont assignées à leur machine
    - Les autres rôles (admin, bureau, stock_matiere) restent inchangés
    
  2. Logique de filtrage pour atelier
    - `machine_id = get_user_machine_id()` : Feuille assignée à sa machine
    - `user_id = auth.uid()` : Feuille créée par l'utilisateur connecté
    - Les deux conditions doivent être vraies (AND)
*/

-- Supprimer la politique SELECT existante pour la recréer avec la nouvelle logique
DROP POLICY IF EXISTS "Role-based SELECT for debit_sheets" ON public.debit_sheets;

-- Recréer la politique SELECT avec la logique mise à jour pour le rôle 'atelier'
-- SELECT: Admin, Bureau, Stock Matière voient tout. 
--         Atelier voit les feuilles qu'il a créées ET qui sont assignées à sa machine.
CREATE POLICY "Role-based SELECT for debit_sheets"
ON public.debit_sheets
FOR SELECT
TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin'::user_role THEN true
    WHEN 'bureau'::user_role THEN true
    WHEN 'atelier'::user_role THEN (machine_id = get_user_machine_id() AND user_id = auth.uid())
    WHEN 'stock_matiere'::user_role THEN true
    ELSE false
  END
);