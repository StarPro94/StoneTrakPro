/*
  # Add Remaining Foreign Key Indexes

  This migration adds the remaining missing indexes on foreign key columns
  to improve query performance for JOIN operations.

  ## Changes
  Add indexes for:
  - ai_suggestions.user_id
  - blocks.user_id
  - chat_history.user_id
  - clients.created_by
  - debit_sheet_history.sheet_id
  - debit_sheet_validations.user_id
  - debit_sheets.user_id
  - pdf_extraction_logs.user_id
  - profiles.machine_id
  - quote_items.material_id
  - quotes.created_by
  - scaffolding_damaged_items (catalog_item_id, user_id)
  - scaffolding_layher_rentals (catalog_item_id, site_id, user_id)
  - scaffolding_layher_stock.user_id
  - scaffolding_list_items (catalog_item_id, list_id)
  - scaffolding_lists (site_id, user_id)
  - scaffolding_site_inventory.catalog_item_id
  - scaffolding_sites.user_id
  - scaffolding_stock_global.catalog_item_id
  - scaffolding_stock_movements (catalog_item_id, site_id, user_id)
  - slabs.user_id

  ## Performance Impact
  - Significantly improves JOIN performance across all tables
  - Reduces query execution time for foreign key lookups
*/

-- AI and Chat tables
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id_fk 
  ON public.ai_suggestions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id_fk 
  ON public.chat_history(user_id);

CREATE INDEX IF NOT EXISTS idx_pdf_extraction_logs_user_id_fk 
  ON public.pdf_extraction_logs(user_id);

-- Core business tables
CREATE INDEX IF NOT EXISTS idx_blocks_user_id_fk 
  ON public.blocks(user_id);

CREATE INDEX IF NOT EXISTS idx_slabs_user_id_fk 
  ON public.slabs(user_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheets_user_id_fk 
  ON public.debit_sheets(user_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheet_history_sheet_id_fk 
  ON public.debit_sheet_history(sheet_id);

CREATE INDEX IF NOT EXISTS idx_debit_sheet_validations_user_id_fk 
  ON public.debit_sheet_validations(user_id);

-- User and client management
CREATE INDEX IF NOT EXISTS idx_profiles_machine_id_fk 
  ON public.profiles(machine_id);

CREATE INDEX IF NOT EXISTS idx_clients_created_by_fk 
  ON public.clients(created_by);

-- Quotes module
CREATE INDEX IF NOT EXISTS idx_quotes_created_by_fk 
  ON public.quotes(created_by);

CREATE INDEX IF NOT EXISTS idx_quote_items_material_id_fk 
  ON public.quote_items(material_id);

-- Scaffolding module - damaged items
CREATE INDEX IF NOT EXISTS idx_scaffolding_damaged_items_catalog_item_id_fk 
  ON public.scaffolding_damaged_items(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_damaged_items_user_id_fk 
  ON public.scaffolding_damaged_items(user_id);

-- Scaffolding module - Layher rentals
CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_catalog_item_id_fk 
  ON public.scaffolding_layher_rentals(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_site_id_fk 
  ON public.scaffolding_layher_rentals(site_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_rentals_user_id_fk 
  ON public.scaffolding_layher_rentals(user_id);

-- Scaffolding module - Layher stock
CREATE INDEX IF NOT EXISTS idx_scaffolding_layher_stock_user_id_fk 
  ON public.scaffolding_layher_stock(user_id);

-- Scaffolding module - list items
CREATE INDEX IF NOT EXISTS idx_scaffolding_list_items_catalog_item_id_fk 
  ON public.scaffolding_list_items(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_list_items_list_id_fk 
  ON public.scaffolding_list_items(list_id);

-- Scaffolding module - lists
CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_site_id_fk 
  ON public.scaffolding_lists(site_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_lists_user_id_fk 
  ON public.scaffolding_lists(user_id);

-- Scaffolding module - sites
CREATE INDEX IF NOT EXISTS idx_scaffolding_sites_user_id_fk 
  ON public.scaffolding_sites(user_id);

-- Scaffolding module - inventory
CREATE INDEX IF NOT EXISTS idx_scaffolding_site_inventory_catalog_item_id_fk 
  ON public.scaffolding_site_inventory(catalog_item_id);

-- Scaffolding module - stock global
CREATE INDEX IF NOT EXISTS idx_scaffolding_stock_global_catalog_item_id_fk 
  ON public.scaffolding_stock_global(catalog_item_id);

-- Scaffolding module - stock movements
CREATE INDEX IF NOT EXISTS idx_scaffolding_stock_movements_catalog_item_id_fk 
  ON public.scaffolding_stock_movements(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_stock_movements_site_id_fk 
  ON public.scaffolding_stock_movements(site_id);

CREATE INDEX IF NOT EXISTS idx_scaffolding_stock_movements_user_id_fk 
  ON public.scaffolding_stock_movements(user_id);
