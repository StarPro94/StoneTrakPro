/*
  # Remove All Unused Indexes

  This migration removes all indexes that are not being used by queries
  as identified by Supabase's usage analysis. Removing unused indexes
  improves write performance and reduces storage usage.

  ## Changes
  Remove 28 unused indexes across multiple tables:
  - AI and chat tables (3 indexes)
  - Core business tables (5 indexes)
  - User management tables (2 indexes)
  - Quotes module (2 indexes)
  - Scaffolding module (16 indexes)

  ## Performance Impact
  - Reduces storage usage significantly
  - Improves INSERT/UPDATE/DELETE performance
  - No negative impact on query performance (indexes were unused)
*/

-- AI and Chat tables
DROP INDEX IF EXISTS public.idx_ai_suggestions_user_id_fk;
DROP INDEX IF EXISTS public.idx_chat_history_user_id_fk;
DROP INDEX IF EXISTS public.idx_pdf_extraction_logs_user_id_fk;

-- Core business tables
DROP INDEX IF EXISTS public.idx_blocks_user_id_fk;
DROP INDEX IF EXISTS public.idx_slabs_user_id_fk;
DROP INDEX IF EXISTS public.idx_debit_sheets_user_id_fk;
DROP INDEX IF EXISTS public.idx_debit_sheet_history_sheet_id_fk;
DROP INDEX IF EXISTS public.idx_debit_sheet_validations_user_id_fk;

-- User management
DROP INDEX IF EXISTS public.idx_profiles_machine_id_fk;
DROP INDEX IF EXISTS public.idx_clients_created_by_fk;

-- Quotes module
DROP INDEX IF EXISTS public.idx_quotes_created_by_fk;
DROP INDEX IF EXISTS public.idx_quote_items_material_id_fk;

-- Scaffolding module - damaged items
DROP INDEX IF EXISTS public.idx_scaffolding_damaged_items_catalog_item_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_damaged_items_user_id_fk;

-- Scaffolding module - Layher rentals
DROP INDEX IF EXISTS public.idx_scaffolding_layher_rentals_site_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_layher_rentals_user_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_layher_rentals_catalog_item_id_fk;

-- Scaffolding module - Layher stock
DROP INDEX IF EXISTS public.idx_scaffolding_layher_stock_user_id_fk;

-- Scaffolding module - list items
DROP INDEX IF EXISTS public.idx_scaffolding_list_items_catalog_item_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_list_items_list_id_fk;

-- Scaffolding module - lists
DROP INDEX IF EXISTS public.idx_scaffolding_lists_site_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_lists_user_id_fk;

-- Scaffolding module - sites
DROP INDEX IF EXISTS public.idx_scaffolding_sites_user_id_fk;

-- Scaffolding module - inventory and stock
DROP INDEX IF EXISTS public.idx_scaffolding_site_inventory_catalog_item_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_stock_global_catalog_item_id_fk;

-- Scaffolding module - stock movements
DROP INDEX IF EXISTS public.idx_scaffolding_stock_movements_catalog_item_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_stock_movements_site_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_stock_movements_user_id_fk;
