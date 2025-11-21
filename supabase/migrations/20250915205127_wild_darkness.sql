/*
  # Diagnostic RLS Policy - Autoriser toutes les lectures pour tous les utilisateurs authentifiés

  Cette migration temporaire désactive complètement la logique RLS complexe 
  pour diagnostiquer si le problème de chargement infini vient de l'évaluation 
  des politiques RLS ou des fonctions qu'elles appellent.

  IMPORTANT: Cette politique est TEMPORAIRE pour le diagnostic uniquement.
  Elle doit être restaurée une fois le problème identifié.

  1. Changements
     - Politique SELECT pour debit_sheets : condition USING = 'true'
     - Permet à tous les utilisateurs authentifiés de voir toutes les feuilles

  2. Test attendu
     - Si le spinner disparaît → Problème dans les fonctions RLS (get_user_role, etc.)
     - Si le spinner persiste → Problème plus profond (connectivité, client Supabase)
*/

-- Mettre à jour la politique SELECT pour debit_sheets avec une condition ultra-simple
ALTER POLICY "Role-based SELECT for debit_sheets" ON debit_sheets
USING (true);

-- Log de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Politique RLS temporaire appliquée : tous les utilisateurs authentifiés peuvent lire toutes les feuilles de débit';
END $$;