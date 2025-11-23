/*
  # Activation de Realtime pour toutes les tables

  1. Modifications
    - Ajoute toutes les tables principales à la publication Realtime
    - Permet la synchronisation temps réel pour tous les modules
    
  2. Tables ajoutées à la publication
    - quotes, quote_items - Module de chiffrage
    - clients - Base de données clients
    - slabs, blocks - Parc de tranches et blocs
    - machines, materials, profiles - Données de base
    - scaffolding_sites, scaffolding_lists, scaffolding_catalog, scaffolding_stock - Module échafaudage
    - ai_insights, ai_anomalies, chat_history - Intelligence artificielle
    - claude_extraction_logs, scaffolding_extraction_logs - Logs d'extraction
    
  3. Notes
    - debit_sheets et debit_items sont déjà dans la publication
    - Cela permettra la synchronisation en temps réel entre les utilisateurs
    - Les hooks React avec Realtime fonctionneront automatiquement
    - On ignore les erreurs si la table est déjà dans la publication
*/

-- Fonction helper pour ajouter une table à la publication en toute sécurité
DO $$
DECLARE
  table_name text;
  tables_to_add text[] := ARRAY[
    'quotes', 'quote_items', 'clients', 'slabs', 'blocks',
    'machines', 'materials', 'profiles',
    'scaffolding_sites', 'scaffolding_lists', 'scaffolding_catalog', 'scaffolding_stock',
    'ai_insights', 'ai_anomalies', 'chat_history',
    'claude_extraction_logs', 'scaffolding_extraction_logs'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_add
  LOOP
    -- Vérifier si la table existe et n'est pas déjà dans la publication
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = table_name
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
      RAISE NOTICE 'Table % ajoutée à la publication Realtime', table_name;
    END IF;
  END LOOP;
END $$;
