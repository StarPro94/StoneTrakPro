import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MaterialCMUPHistory } from '../types';
import { useAuth } from './useAuth';

export function useMaterialCMUPHistory(materialId?: string) {
  const { user } = useAuth();
  const [history, setHistory] = useState<MaterialCMUPHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCMUPHistory = async (matId: string) => {
    if (!isSupabaseConfigured()) {
      setHistory([]);
      setLoading(false);
      setError('Configuration Supabase manquante');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase!
        .from('material_cmup_history')
        .select('*')
        .eq('material_id', matId)
        .order('changed_at', { ascending: false });

      if (fetchError) throw fetchError;

      setHistory(
        (data || []).map((h) => ({
          id: h.id,
          materialId: h.material_id,
          oldCmup: h.old_cmup,
          newCmup: h.new_cmup,
          changedAt: new Date(h.changed_at),
          changedBy: h.changed_by,
          source: h.source,
          notes: h.notes,
        }))
      );
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement de l\'historique CMUP:', err);
    } finally {
      setLoading(false);
    }
  };

  const addManualCMUPChange = async (
    matId: string,
    newCmup: number,
    notes?: string
  ) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const { data: materialData, error: fetchError } = await supabase!
        .from('materials')
        .select('cmup')
        .eq('id', matId)
        .single();

      if (fetchError) throw fetchError;

      const oldCmup = materialData?.cmup ?? null;

      const { error: insertError } = await supabase!
        .from('material_cmup_history')
        .insert({
          material_id: matId,
          old_cmup: oldCmup,
          new_cmup: newCmup,
          changed_by: user.id,
          source: 'manual',
          notes: notes,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase!
        .from('materials')
        .update({ cmup: newCmup })
        .eq('id', matId);

      if (updateError) throw updateError;

      await fetchCMUPHistory(matId);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de changement CMUP:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (materialId) {
      fetchCMUPHistory(materialId);
    }
  }, [materialId]);

  return {
    history,
    loading,
    error,
    fetchCMUPHistory,
    addManualCMUPChange,
  };
}
