/*
  # Remove Newly Unused Indexes

  This migration removes indexes that were created but are not being used by queries.
  These were flagged by Supabase's analysis tool as unused.

  ## Changes
  Remove unused indexes:
  - idx_debit_sheet_comments_user_id_fk
  - idx_debit_sheet_history_user_id_fk
  - idx_debit_sheets_last_modified_by_fk
  - idx_machines_user_id_fk
  - idx_scaffolding_layher_stock_catalog_item_id_fk
  - idx_scaffolding_stock_movements_list_id_fk
  - idx_slab_history_user_id_fk
  - idx_slab_photos_user_id_fk

  ## Performance Impact
  - Reduces storage usage
  - Improves write performance on affected tables
  - No negative impact on query performance (indexes were not being used)
*/

DROP INDEX IF EXISTS public.idx_debit_sheet_comments_user_id_fk;
DROP INDEX IF EXISTS public.idx_debit_sheet_history_user_id_fk;
DROP INDEX IF EXISTS public.idx_debit_sheets_last_modified_by_fk;
DROP INDEX IF EXISTS public.idx_machines_user_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_layher_stock_catalog_item_id_fk;
DROP INDEX IF EXISTS public.idx_scaffolding_stock_movements_list_id_fk;
DROP INDEX IF EXISTS public.idx_slab_history_user_id_fk;
DROP INDEX IF EXISTS public.idx_slab_photos_user_id_fk;
