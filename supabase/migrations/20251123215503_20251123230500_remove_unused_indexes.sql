/*
  # Remove Unused Indexes

  This migration removes indexes that are not being used by queries.
  Keeping unused indexes wastes storage space and slows down write operations.

  ## Changes
  - Remove unused indexes identified by Supabase analysis
  - Keep only indexes that are actively used for query optimization

  ## Performance Impact
  - Reduces storage usage
  - Improves INSERT/UPDATE/DELETE performance
  - Maintains all necessary indexes for query optimization
*/

-- Remove unused indexes from various tables
DROP INDEX IF EXISTS public.idx_debit_sheets_user_id;
DROP INDEX IF EXISTS public.idx_debit_sheets_numero_os;
DROP INDEX IF EXISTS public.idx_debit_sheet_validations_status;
DROP INDEX IF EXISTS public.idx_debit_sheets_priority;
DROP INDEX IF EXISTS public.idx_debit_sheets_validation_status;
DROP INDEX IF EXISTS public.idx_debit_sheets_fini_livre;
DROP INDEX IF EXISTS public.idx_ai_learning_data_field_name;
DROP INDEX IF EXISTS public.idx_ai_suggestions_user_id;
DROP INDEX IF EXISTS public.idx_ai_suggestions_context_type;
DROP INDEX IF EXISTS public.idx_pdf_extraction_logs_user_id;
DROP INDEX IF EXISTS public.idx_pdf_extraction_logs_status;
DROP INDEX IF EXISTS public.idx_user_ai_preferences_user_id;
DROP INDEX IF EXISTS public.idx_scaffolding_damaged_items_status;
DROP INDEX IF EXISTS public.idx_chat_history_user_id;
DROP INDEX IF EXISTS public.idx_chat_history_session_id;
DROP INDEX IF EXISTS public.idx_chat_history_created_at;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_machine_id;
DROP INDEX IF EXISTS public.idx_slabs_user_id;
DROP INDEX IF EXISTS public.idx_slabs_status;
DROP INDEX IF EXISTS public.idx_debit_items_matiere;
DROP INDEX IF EXISTS public.idx_debit_items_finition;
DROP INDEX IF EXISTS public.idx_blocks_user_id;
DROP INDEX IF EXISTS public.idx_blocks_ligne;
DROP INDEX IF EXISTS public.idx_blocks_material;
DROP INDEX IF EXISTS public.idx_debit_sheets_devis_numero;
DROP INDEX IF EXISTS public.idx_debit_sheets_ref_chantier;
DROP INDEX IF EXISTS public.idx_stock_global_user;
DROP INDEX IF EXISTS public.idx_stock_global_catalog;
DROP INDEX IF EXISTS public.idx_materials_type;
DROP INDEX IF EXISTS public.idx_debit_items_numero_palette;
DROP INDEX IF EXISTS public.idx_stock_movements_user;
DROP INDEX IF EXISTS public.idx_stock_movements_catalog;
DROP INDEX IF EXISTS public.idx_stock_movements_site;
DROP INDEX IF EXISTS public.idx_stock_movements_type;
DROP INDEX IF EXISTS public.idx_site_inventory_site;
DROP INDEX IF EXISTS public.idx_site_inventory_catalog;
DROP INDEX IF EXISTS public.idx_materials_ref;
DROP INDEX IF EXISTS public.idx_layher_stock_user;
DROP INDEX IF EXISTS public.idx_layher_stock_status;
DROP INDEX IF EXISTS public.idx_scaffolding_catalog_reference;
DROP INDEX IF EXISTS public.idx_scaffolding_catalog_designation;
DROP INDEX IF EXISTS public.idx_scaffolding_catalog_category;
DROP INDEX IF EXISTS public.idx_scaffolding_sites_user_id;
DROP INDEX IF EXISTS public.idx_scaffolding_sites_numero;
DROP INDEX IF EXISTS public.idx_scaffolding_sites_status;
DROP INDEX IF EXISTS public.idx_quotes_status;
DROP INDEX IF EXISTS public.idx_quotes_client;
DROP INDEX IF EXISTS public.idx_quotes_created_by;
DROP INDEX IF EXISTS public.idx_quote_items_quote_id;
DROP INDEX IF EXISTS public.idx_quote_items_material_id;
DROP INDEX IF EXISTS public.idx_scaffolding_lists_user_id;
DROP INDEX IF EXISTS public.idx_scaffolding_lists_numero;
DROP INDEX IF EXISTS public.idx_scaffolding_lists_site_id;
DROP INDEX IF EXISTS public.idx_scaffolding_lists_type;
DROP INDEX IF EXISTS public.idx_slab_history_created_at;
DROP INDEX IF EXISTS public.idx_slabs_last_moved_at;
DROP INDEX IF EXISTS public.idx_scaffolding_list_items_list_id;
DROP INDEX IF EXISTS public.idx_scaffolding_list_items_catalog_id;
DROP INDEX IF EXISTS public.idx_scaffolding_layher_rentals_user_id;
DROP INDEX IF EXISTS public.idx_scaffolding_layher_rentals_catalog_id;
DROP INDEX IF EXISTS public.idx_scaffolding_layher_rentals_site_id;
DROP INDEX IF EXISTS public.idx_scaffolding_damaged_items_user_id;
DROP INDEX IF EXISTS public.idx_scaffolding_damaged_items_catalog_id;
DROP INDEX IF EXISTS public.idx_debit_sheet_history_sheet_id;
DROP INDEX IF EXISTS public.idx_debit_sheet_history_created_at;
DROP INDEX IF EXISTS public.idx_debit_sheet_validations_user_id;
DROP INDEX IF EXISTS public.idx_quotes_os_number;
DROP INDEX IF EXISTS public.idx_quotes_site_name;
DROP INDEX IF EXISTS public.idx_quotes_reference;
DROP INDEX IF EXISTS public.idx_clients_email;
DROP INDEX IF EXISTS public.idx_clients_created_by;
