/*
  # Fix Duplicate Indexes

  This migration removes duplicate indexes on the quotes table.
  The indexes idx_quotes_client and idx_quotes_client_company are identical.

  ## Changes
  - Remove duplicate index idx_quotes_client_company
  - Keep idx_quotes_client as it was created first

  ## Performance Impact
  - Reduces storage usage
  - Improves write performance on quotes table
*/

-- Remove duplicate index
DROP INDEX IF EXISTS public.idx_quotes_client_company;
