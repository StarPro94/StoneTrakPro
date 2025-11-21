/*
  # Tables pour Intelligence Artificielle - Tableau de Suivi v2

  ## Tables créées
  
  1. **ai_learning_data**
     - Stocke les corrections manuelles pour améliorer le parsing
     - Champs : id, user_id, pdf_filename, field_name, extracted_value, corrected_value, confidence_score, created_at
  
  2. **ai_suggestions**
     - Cache des suggestions IA pour performance
     - Champs : id, user_id, context_type, context_data, suggestion_text, relevance_score, applied, created_at
  
  3. **pdf_extraction_logs**
     - Logs détaillés de chaque extraction PDF pour debugging
     - Champs : id, user_id, pdf_filename, extraction_status, raw_data, parsed_data, errors, processing_time, created_at
  
  4. **user_ai_preferences**
     - Préférences IA par utilisateur
     - Champs : id, user_id, auto_suggestions_enabled, anomaly_detection_enabled, smart_matching_enabled, preferences_data, updated_at

  ## Sécurité
  - RLS activé sur toutes les tables
  - Politiques restrictives : utilisateurs authentifiés uniquement
  - Chaque utilisateur ne voit que ses propres données
*/

-- Table pour l'apprentissage IA (corrections manuelles)
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pdf_filename text NOT NULL,
  field_name text NOT NULL,
  extracted_value text,
  corrected_value text NOT NULL,
  confidence_score decimal(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning data"
  ON ai_learning_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning data"
  ON ai_learning_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table pour les suggestions IA
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_type text NOT NULL,
  context_data jsonb DEFAULT '{}'::jsonb,
  suggestion_text text NOT NULL,
  relevance_score decimal(3,2) DEFAULT 0.5,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table pour les logs d'extraction PDF
CREATE TABLE IF NOT EXISTS pdf_extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pdf_filename text NOT NULL,
  extraction_status text NOT NULL,
  raw_data jsonb DEFAULT '{}'::jsonb,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  errors jsonb DEFAULT '[]'::jsonb,
  processing_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_extraction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extraction logs"
  ON pdf_extraction_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extraction logs"
  ON pdf_extraction_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table pour les préférences IA
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  auto_suggestions_enabled boolean DEFAULT true,
  anomaly_detection_enabled boolean DEFAULT true,
  smart_matching_enabled boolean DEFAULT true,
  chatbot_enabled boolean DEFAULT true,
  preferences_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI preferences"
  ON user_ai_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI preferences"
  ON user_ai_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI preferences"
  ON user_ai_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_id ON ai_learning_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_field_name ON ai_learning_data(field_name);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_context_type ON ai_suggestions(context_type);
CREATE INDEX IF NOT EXISTS idx_pdf_extraction_logs_user_id ON pdf_extraction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_extraction_logs_status ON pdf_extraction_logs(extraction_status);
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);
