import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('If variables are present but you get "Failed to fetch" errors, verify that:');
  console.error('1. VITE_SUPABASE_URL points to a valid, accessible Supabase project URL');
  console.error('2. VITE_SUPABASE_ANON_KEY contains the correct anonymous key');
  console.error('3. Your Supabase project is running and reachable from your network');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
};

export type Database = {
  public: {
    Tables: {
      debit_sheets: {
        Row: {
          id: string;
          user_id: string;
          cial: string;
          numero_os: string;
          nom_client: string;
          fourniture: string;
          epaisseur: string;
          numero_arc: string;
          date_arc: string;
          delai: string;
          m2: number;
          m3: number;
          fini: boolean;
          livre: boolean;
          date_creation: string;
          date_finition: string | null;
          date_livraison: string | null;
          created_at: string;
          updated_at: string;
          bloc_tranche: string | null;
          stock_commande_ext: string | null;
          ref_chantier: string | null;
          devis_numero: string | null;
          machine_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          cial: string;
          numero_os: string;
          nom_client: string;
          fourniture: string;
          epaisseur: string;
          numero_arc: string;
          date_arc: string;
          delai: string;
          m2: number;
          m3: number;
          fini?: boolean;
          livre?: boolean;
          date_creation?: string;
          date_finition?: string | null;
          date_livraison?: string | null;
          created_at?: string;
          updated_at?: string;
          bloc_tranche?: string | null;
          stock_commande_ext?: string | null;
          ref_chantier?: string | null;
          devis_numero?: string | null;
          machine_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          cial?: string;
          numero_os?: string;
          nom_client?: string;
          fourniture?: string;
          epaisseur?: string;
          numero_arc?: string;
          date_arc?: string;
          delai?: string;
          m2?: number;
          m3?: number;
          fini?: boolean;
          livre?: boolean;
          date_creation?: string;
          date_finition?: string | null;
          date_livraison?: string | null;
          created_at?: string;
          updated_at?: string;
          bloc_tranche?: string | null;
          stock_commande_ext?: string | null;
          ref_chantier?: string | null;
          devis_numero?: string | null;
          machine_id?: string | null;
        };
      };
      debit_items: {
        Row: {
          id: string;
          sheet_id: string;
          description: string;
          longueur: number;
          largeur: number;
          epaisseur: number;
          quantite: number;
          termine: boolean;
          created_at: string;
          updated_at: string;
          numero_appareil: string | null;
          matiere_item: string | null;
          finition: string | null;
          m2_item: number | null;
          m3_item: number | null;
        };
        Insert: {
          id?: string;
          sheet_id: string;
          description: string;
          longueur: number;
          largeur: number;
          epaisseur: number;
          quantite: number;
          termine?: boolean;
          created_at?: string;
          updated_at?: string;
          numero_appareil?: string | null;
          matiere_item?: string | null;
          finition?: string | null;
          m2_item?: number | null;
          m3_item?: number | null;
        };
        Update: {
          id?: string;
          sheet_id?: string;
          description?: string;
          longueur?: number;
          largeur?: number;
          epaisseur?: number;
          quantite?: number;
          termine?: boolean;
          created_at?: string;
          updated_at?: string;
          numero_appareil?: string | null;
          matiere_item?: string | null;
          finition?: string | null;
          m2_item?: number | null;
          m3_item?: number | null;
        };
      };
      machines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      slabs: {
        Row: {
          id: string;
          user_id: string;
          position: string;
          material: string;
          length: number;
          width: number;
          thickness: number;
          status: string;
          debit_sheet_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          position: string;
          material: string;
          length: number;
          width: number;
          thickness: number;
          status?: string;
          debit_sheet_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          position?: string;
          material?: string;
          length?: number;
          width?: number;
          thickness?: number;
          status?: string;
          debit_sheet_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};