/*
  # Optimize RLS Policies - Part 4 (Quotes & Clients)

  This migration optimizes RLS policies for quotes, quote_items, and clients tables.

  ## Changes
  1. Optimize quotes table policies
  2. Optimize quote_items table policies
  3. Optimize clients table policies

  ## Performance Impact
  - Completes optimization of all quote-related tables
*/

-- Optimize quotes policies
DROP POLICY IF EXISTS "Admin and Bureau can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admin and Bureau can update all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admin and Bureau can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admin can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own draft quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

CREATE POLICY "Admin and Bureau can create quotes" 
  ON public.quotes FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Admin and Bureau can update all quotes" 
  ON public.quotes FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Admin and Bureau can view all quotes" 
  ON public.quotes FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Admin can delete quotes" 
  ON public.quotes FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own draft quotes" 
  ON public.quotes FOR UPDATE 
  TO authenticated
  USING (
    created_by = (SELECT auth.uid()) 
    AND status = 'draft'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid()) 
    AND status = 'draft'
  );

CREATE POLICY "Users can view own quotes" 
  ON public.quotes FOR SELECT 
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- Optimize quote_items policies
DROP POLICY IF EXISTS "Admin and Bureau can insert quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Admin and Bureau can update all quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Admin can delete quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete items of own draft quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert items to own quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update items of own draft quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can view quote items if they can view quote" ON public.quote_items;

CREATE POLICY "Admin and Bureau can insert quote items" 
  ON public.quote_items FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Admin and Bureau can update all quote items" 
  ON public.quote_items FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'bureau')
    )
  );

CREATE POLICY "Admin can delete quote items" 
  ON public.quote_items FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete items of own draft quotes" 
  ON public.quote_items FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid()) 
      AND quotes.status = 'draft'
    )
  );

CREATE POLICY "Users can insert items to own quotes" 
  ON public.quote_items FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update items of own draft quotes" 
  ON public.quote_items FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid()) 
      AND quotes.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid()) 
      AND quotes.status = 'draft'
    )
  );

CREATE POLICY "Users can view quote items if they can view quote" 
  ON public.quote_items FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.created_by = (SELECT auth.uid())
    )
  );

-- Optimize clients policies
DROP POLICY IF EXISTS "Seuls les admins peuvent supprimer des clients" ON public.clients;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent créer des clients" ON public.clients;

CREATE POLICY "Seuls les admins peuvent supprimer des clients" 
  ON public.clients FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Utilisateurs authentifiés peuvent créer des clients" 
  ON public.clients FOR INSERT 
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
