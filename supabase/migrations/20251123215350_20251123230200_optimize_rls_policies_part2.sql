/*
  # Optimize RLS Policies - Part 2 (History & Photos)

  This migration continues optimizing RLS policies for slab_history, slab_photos,
  debit_sheet_history, debit_sheet_validations, and debit_sheet_comments tables.

  ## Changes
  1. Optimize slab_history policies
  2. Optimize slab_photos policies
  3. Optimize debit_sheet_history policies
  4. Optimize debit_sheet_validations policies
  5. Optimize debit_sheet_comments policies

  ## Performance Impact
  - Further improves query performance across all related tables
*/

-- Optimize slab_history policies
DROP POLICY IF EXISTS "System can insert history" ON public.slab_history;
DROP POLICY IF EXISTS "Users can view history of own slabs" ON public.slab_history;

CREATE POLICY "System can insert history" 
  ON public.slab_history FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view history of own slabs" 
  ON public.slab_history FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.slabs 
      WHERE slabs.id = slab_history.slab_id 
      AND slabs.user_id = (SELECT auth.uid())
    )
  );

-- Optimize slab_photos policies
DROP POLICY IF EXISTS "Users can delete own photos" ON public.slab_photos;
DROP POLICY IF EXISTS "Users can insert photos to own slabs" ON public.slab_photos;
DROP POLICY IF EXISTS "Users can view photos of own slabs" ON public.slab_photos;

CREATE POLICY "Users can delete own photos" 
  ON public.slab_photos FOR DELETE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert photos to own slabs" 
  ON public.slab_photos FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.slabs 
      WHERE slabs.id = slab_photos.slab_id 
      AND slabs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view photos of own slabs" 
  ON public.slab_photos FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.slabs 
      WHERE slabs.id = slab_photos.slab_id 
      AND slabs.user_id = (SELECT auth.uid())
    )
  );

-- Optimize debit_sheet_history policies
DROP POLICY IF EXISTS "System can insert history" ON public.debit_sheet_history;
DROP POLICY IF EXISTS "Users can view history of own sheets" ON public.debit_sheet_history;

CREATE POLICY "System can insert history" 
  ON public.debit_sheet_history FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view history of own sheets" 
  ON public.debit_sheet_history FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.debit_sheets 
      WHERE debit_sheets.id = debit_sheet_history.sheet_id 
      AND debit_sheets.user_id = (SELECT auth.uid())
    )
  );

-- Optimize debit_sheet_validations policies
DROP POLICY IF EXISTS "Users can delete own validations" ON public.debit_sheet_validations;
DROP POLICY IF EXISTS "Users can insert own validations" ON public.debit_sheet_validations;
DROP POLICY IF EXISTS "Users can update own validations" ON public.debit_sheet_validations;
DROP POLICY IF EXISTS "Users can view own validations" ON public.debit_sheet_validations;

CREATE POLICY "Users can delete own validations" 
  ON public.debit_sheet_validations FOR DELETE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own validations" 
  ON public.debit_sheet_validations FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own validations" 
  ON public.debit_sheet_validations FOR UPDATE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own validations" 
  ON public.debit_sheet_validations FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Optimize debit_sheet_comments policies
DROP POLICY IF EXISTS "Users can delete own comments" ON public.debit_sheet_comments;
DROP POLICY IF EXISTS "Users can insert comments to own sheets" ON public.debit_sheet_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.debit_sheet_comments;
DROP POLICY IF EXISTS "Users can view comments of own sheets" ON public.debit_sheet_comments;

CREATE POLICY "Users can delete own comments" 
  ON public.debit_sheet_comments FOR DELETE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert comments to own sheets" 
  ON public.debit_sheet_comments FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.debit_sheets 
      WHERE debit_sheets.id = debit_sheet_comments.sheet_id 
      AND debit_sheets.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own comments" 
  ON public.debit_sheet_comments FOR UPDATE 
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view comments of own sheets" 
  ON public.debit_sheet_comments FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.debit_sheets 
      WHERE debit_sheets.id = debit_sheet_comments.sheet_id 
      AND debit_sheets.user_id = (SELECT auth.uid())
    )
  );
