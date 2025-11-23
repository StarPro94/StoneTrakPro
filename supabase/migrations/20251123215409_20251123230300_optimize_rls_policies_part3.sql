/*
  # Optimize RLS Policies - Part 3 (AI & Chat)

  This migration optimizes RLS policies for AI-related tables and chat history.

  ## Changes
  1. Optimize ai_learning_data policies
  2. Optimize ai_suggestions policies
  3. Optimize pdf_extraction_logs policies
  4. Optimize user_ai_preferences policies
  5. Optimize chat_history policies

  ## Performance Impact
  - Completes optimization of all AI and chat-related tables
*/

-- Optimize ai_learning_data policies
DROP POLICY IF EXISTS "Users can insert own learning data" ON public.ai_learning_data;
DROP POLICY IF EXISTS "Users can view own learning data" ON public.ai_learning_data;

CREATE POLICY "Users can insert own learning data" 
  ON public.ai_learning_data FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own learning data" 
  ON public.ai_learning_data FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Optimize ai_suggestions policies
DROP POLICY IF EXISTS "Users can insert own suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.ai_suggestions;

CREATE POLICY "Users can insert own suggestions" 
  ON public.ai_suggestions FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own suggestions" 
  ON public.ai_suggestions FOR UPDATE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own suggestions" 
  ON public.ai_suggestions FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Optimize pdf_extraction_logs policies
DROP POLICY IF EXISTS "Users can insert own extraction logs" ON public.pdf_extraction_logs;
DROP POLICY IF EXISTS "Users can view own extraction logs" ON public.pdf_extraction_logs;

CREATE POLICY "Users can insert own extraction logs" 
  ON public.pdf_extraction_logs FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own extraction logs" 
  ON public.pdf_extraction_logs FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Optimize user_ai_preferences policies
DROP POLICY IF EXISTS "Users can insert own AI preferences" ON public.user_ai_preferences;
DROP POLICY IF EXISTS "Users can update own AI preferences" ON public.user_ai_preferences;
DROP POLICY IF EXISTS "Users can view own AI preferences" ON public.user_ai_preferences;

CREATE POLICY "Users can insert own AI preferences" 
  ON public.user_ai_preferences FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own AI preferences" 
  ON public.user_ai_preferences FOR UPDATE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own AI preferences" 
  ON public.user_ai_preferences FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Optimize chat_history policies
DROP POLICY IF EXISTS "Users can delete own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_history;
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;

CREATE POLICY "Users can delete own chat history" 
  ON public.chat_history FOR DELETE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own messages" 
  ON public.chat_history FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own chat history" 
  ON public.chat_history FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
