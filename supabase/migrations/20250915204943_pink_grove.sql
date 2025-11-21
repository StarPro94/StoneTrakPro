/*
  # Politique RLS temporaire pour diagnostic - Rôle Atelier

  Cette migration modifie temporairement la politique RLS pour le rôle 'atelier' 
  afin de diagnostiquer le problème de chargement infini des feuilles de débit.

  1. Modifications
     - Remplace la condition complexe pour 'atelier' par un simple 'false'
     - Garde toutes les autres conditions inchangées
     - Permet de tester si la complexité de la condition RLS cause le blocage

  IMPORTANT: Cette modification est TEMPORAIRE pour diagnostic uniquement.
  Une fois le problème identifié, nous restaurerons une politique fonctionnelle.
*/

-- Supprimer l'ancienne politique RLS problématique
DROP POLICY IF EXISTS "Role-based SELECT for debit_sheets" ON debit_sheets;

-- Créer la nouvelle politique temporaire avec condition simplifiée pour atelier
CREATE POLICY "Role-based SELECT for debit_sheets" ON debit_sheets
  FOR SELECT
  TO authenticated
  USING (
    CASE get_user_role()
      WHEN 'admin'::user_role THEN true
      WHEN 'bureau'::user_role THEN true
      WHEN 'atelier'::user_role THEN false  -- TEMPORAIRE: empêche tout accès pour diagnostiquer
      WHEN 'stock_matiere'::user_role THEN true
      ELSE false
    END
  );

-- Vérifier que la politique est correctement appliquée
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'debit_sheets' AND policyname = 'Role-based SELECT for debit_sheets';