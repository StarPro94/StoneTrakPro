/*
  # Add new fields for enhanced debit sheet parsing

  1. New Columns for debit_sheets table
    - `bloc_tranche` (text, nullable) - Type de matériau (BLOC ou TRANCHE)
    - `stock_commande_ext` (text, nullable) - Source du matériau (STOCK ou COMMANDE EXT)
    - `ref_chantier` (text, nullable) - Référence/adresse du chantier
    - `devis_numero` (text, nullable) - Numéro de devis

  2. New Columns for debit_items table
    - `numero_appareil` (text, nullable) - Numéro d'appareil pour chaque élément
    - `matiere_item` (text, nullable) - Matière spécifique de l'élément
    - `finition` (text, nullable) - Type de finition de l'élément
    - `m2_item` (numeric, nullable) - Surface M² individuelle de l'élément
    - `m3_item` (numeric, nullable) - Volume M³ individuel de l'élément

  3. Security
    - Maintain existing RLS policies
    - No additional policies needed as new columns inherit table-level security
*/

-- Add new columns to debit_sheets table
ALTER TABLE debit_sheets 
ADD COLUMN IF NOT EXISTS bloc_tranche text,
ADD COLUMN IF NOT EXISTS stock_commande_ext text,
ADD COLUMN IF NOT EXISTS ref_chantier text,
ADD COLUMN IF NOT EXISTS devis_numero text;

-- Add new columns to debit_items table
ALTER TABLE debit_items 
ADD COLUMN IF NOT EXISTS numero_appareil text,
ADD COLUMN IF NOT EXISTS matiere_item text,
ADD COLUMN IF NOT EXISTS finition text,
ADD COLUMN IF NOT EXISTS m2_item numeric(10,2),
ADD COLUMN IF NOT EXISTS m3_item numeric(10,3);

-- Add indexes for better query performance on new searchable fields
CREATE INDEX IF NOT EXISTS idx_debit_sheets_devis_numero ON debit_sheets(devis_numero);
CREATE INDEX IF NOT EXISTS idx_debit_sheets_ref_chantier ON debit_sheets(ref_chantier);
CREATE INDEX IF NOT EXISTS idx_debit_items_matiere ON debit_items(matiere_item);
CREATE INDEX IF NOT EXISTS idx_debit_items_finition ON debit_items(finition);