/*
  # Fix Missing Foreign Key Indexes

  This migration adds missing indexes on foreign key columns to improve query performance.

  ## Changes
  1. Add index on debit_sheet_comments.user_id
  2. Add index on debit_sheet_history.user_id
  3. Add index on debit_sheet_validations.sheet_id
  4. Add index on debit_sheets.last_modified_by
  5. Add index on machines.user_id
  6. Add index on scaffolding_layher_stock.catalog_item_id
  7. Add index on scaffolding_stock_movements.list_id
  8. Add index on slab_history.user_id
  9. Add index on slab_photos.user_id

  ## Performance Impact
  - Improves JOIN performance on foreign key relationships
  - Reduces query execution time for related data lookups
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_debit_sheet_comments_user_id_fk 
  ON public.debit_sheet_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheet_history_user_id_fk 
  ON public.debit_sheet_history(user_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheet_validations_sheet_id_fk 
  ON public.debit_sheet_validations(sheet_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheets_last_modified_by_fk 
  ON public.debit_sheets(last_modified_by);

CREATE INDEX IF NOT EXISTS idx_machines_user_id_fk 
  ON public.machines(user_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_stock_catalog_item_id_fk 
  ON public.scaffolding_layher_stock(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_stock_movements_list_id_fk 
  ON public.scaffolding_stock_movements(list_id);

CREATE INDEX IF NOT EXISTS idx_slab_history_user_id_fk 
  ON public.slab_history(user_id);

CREATE INDEX IF NOT EXISTS idx_slab_photos_user_id_fk 
  ON public.slab_photos(user_id);
