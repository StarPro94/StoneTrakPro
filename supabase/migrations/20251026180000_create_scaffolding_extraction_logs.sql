/*
  # Table de logs pour les imports IA d'échafaudage

  1. Nouvelle Table
    - `scaffolding_extraction_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `file_name` (text) - Nom du fichier importé
      - `file_type` (text) - Type de document détecté (stock, commande)
      - `extraction_status` (text) - success, needs_review, failed
      - `extraction_method` (text) - mistral, openai, fallback
      - `raw_data` (jsonb) - Données brutes extraites
      - `parsed_data` (jsonb) - Données parsées et structurées
      - `confidence_score` (integer) - Score de confiance global (0-100)
      - `anomalies` (jsonb) - Liste des anomalies détectées
      - `suggestions` (jsonb) - Suggestions de correction
      - `user_corrections` (jsonb) - Corrections manuelles de l'utilisateur
      - `processing_time_ms` (integer) - Temps de traitement
      - `items_count` (integer) - Nombre d'items extraits
      - `references_matched` (integer) - Nombre de références trouvées
      - `references_unknown` (integer) - Nombre de références inconnues
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Policies pour que chaque utilisateur ne voie que ses propres logs
*/

CREATE TABLE IF NOT EXISTS scaffolding_extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text,
  extraction_status text NOT NULL DEFAULT 'processing',
  extraction_method text,
  raw_data jsonb,
  parsed_data jsonb,
  confidence_score integer,
  anomalies jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  user_corrections jsonb,
  processing_time_ms integer,
  items_count integer DEFAULT 0,
  references_matched integer DEFAULT 0,
  references_unknown integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scaffolding_extraction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extraction logs"
  ON scaffolding_extraction_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extraction logs"
  ON scaffolding_extraction_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extraction logs"
  ON scaffolding_extraction_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_extraction_logs_user_id
  ON scaffolding_extraction_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_extraction_logs_created_at
  ON scaffolding_extraction_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scaffolding_extraction_logs_status
  ON scaffolding_extraction_logs(extraction_status);
