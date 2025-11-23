/*
  # Consolidate Multiple Permissive RLS Policies

  This migration consolidates multiple permissive policies into single policies per action.
  Having multiple permissive policies can lead to confusion and performance issues.

  ## Changes
  1. Consolidate debit_sheets SELECT policies
  2. Consolidate quote_items INSERT, UPDATE, DELETE policies
  3. Consolidate quotes SELECT and UPDATE policies

  ## Security Impact
  - Maintains the same access control logic
  - Simplifies policy management
  - Improves query performance by reducing policy evaluations
*/

-- Consolidate debit_sheets SELECT policies
DROP POLICY IF EXISTS "Enable read access based on user role and machine assignment" ON public.debit_sheets;
DROP POLICY IF EXISTS "New role-based SELECT for debit_sheets" ON public.debit_sheets;

CREATE POLICY "Consolidated SELECT for debit_sheets" 
  ON public.debit_sheets FOR SELECT 
  TO authenticated
  USING (
    -- Admin and Bureau can see all sheets
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    -- Atelier users can see sheets assigned to their machine
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'atelier' 
      AND machine_id = debit_sheets.machine_id
    )
    OR
    -- Users can see their own sheets
    user_id = (SELECT auth.uid())
  );

-- Consolidate quote_items INSERT policies
DROP POLICY IF EXISTS "Admin and Bureau can insert quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert items to own quotes" ON public.quote_items;

CREATE POLICY "Consolidated INSERT for quote_items" 
  ON public.quote_items FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Admin and Bureau can insert to any quote
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    -- Users can insert items to their own quotes
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid())
    )
  );

-- Consolidate quote_items UPDATE policies
DROP POLICY IF EXISTS "Admin and Bureau can update all quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update items of own draft quotes" ON public.quote_items;

CREATE POLICY "Consolidated UPDATE for quote_items" 
  ON public.quote_items FOR UPDATE 
  TO authenticated
  USING (
    -- Admin and Bureau can update all items
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    -- Users can update items of their own draft quotes
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid()) 
      AND quotes.status = 'draft'
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid()) 
      AND quotes.status = 'draft'
    )
  );

-- Consolidate quote_items DELETE policies
DROP POLICY IF EXISTS "Admin can delete quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete items of own draft quotes" ON public.quote_items;

CREATE POLICY "Consolidated DELETE for quote_items" 
  ON public.quote_items FOR DELETE 
  TO authenticated
  USING (
    -- Admin can delete any items
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
    OR
    -- Users can delete items of their own draft quotes
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid()) 
      AND quotes.status = 'draft'
    )
  );

-- Consolidate quotes SELECT policies
DROP POLICY IF EXISTS "Admin and Bureau can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

CREATE POLICY "Consolidated SELECT for quotes" 
  ON public.quotes FOR SELECT 
  TO authenticated
  USING (
    -- Admin and Bureau can view all quotes
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    -- Users can view their own quotes
    created_by = (SELECT auth.uid())
  );

-- Consolidate quotes UPDATE policies
DROP POLICY IF EXISTS "Admin and Bureau can update all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own draft quotes" ON public.quotes;

CREATE POLICY "Consolidated UPDATE for quotes" 
  ON public.quotes FOR UPDATE 
  TO authenticated
  USING (
    -- Admin and Bureau can update all quotes
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    -- Users can update their own draft quotes
    (created_by = (SELECT auth.uid()) AND status = 'draft')
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
    OR
    (created_by = (SELECT auth.uid()) AND status = 'draft')
  );
