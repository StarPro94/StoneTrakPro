/*
  # Add Final Missing Foreign Key Indexes

  This migration adds the last remaining missing indexes on foreign key columns
  that were flagged by Supabase security analysis.

  ## Changes
  Add indexes for:
  - debit_sheet_comments.user_id
  - debit_sheet_history.user_id
  - debit_sheets.last_modified_by
  - machines.user_id
  - scaffolding_layher_stock.catalog_item_id
  - scaffolding_stock_movements.list_id
  - slab_history.user_id
  - slab_photos.user_id

  ## Performance Impact
  - Improves JOIN performance for these foreign key relationships
  - Reduces query execution time for related data lookups
*/

CREATE INDEX IF NOT EXISTS idx_debit_sheet_comments_user_id_fk2 
  ON public.debit_sheet_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheet_history_user_id_fk2 
  ON public.debit_sheet_history(user_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheets_last_modified_by_fk2 
  ON public.debit_sheets(last_modified_by);

CREATE INDEX IF NOT EXISTS idx_machines_user_id_fk2 
  ON public.machines(user_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_stock_catalog_item_id_fk2 
  ON public.scaffolding_layher_stock(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_stock_movements_list_id_fk2 
  ON public.scaffolding_stock_movements(list_id);

CREATE INDEX IF NOT EXISTS idx_slab_history_user_id_fk2 
  ON public.slab_history(user_id);

CREATE INDEX IF NOT EXISTS idx_slab_photos_user_id_fk2 
  ON public.slab_photos(user_id);
