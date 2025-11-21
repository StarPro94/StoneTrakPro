import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Slab } from '../types';
import { useAuth } from './useAuth';

export function useSlabs() {
  const { user } = useAuth();
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlabs = async () => {
    if (!user) {
      setSlabs([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: slabsData, error: slabsError } = await supabase
        .from('slabs')
        .select(`
          *,
          debit_sheets (
            numero_os,
            ref_chantier
          )
        `)
        .order('position', { ascending: true });

      if (slabsError) throw slabsError;

      const formattedSlabs: Slab[] = slabsData.map(slab => ({
        id: slab.id,
        userId: slab.user_id,
        position: slab.position,
        material: slab.material,
        length: parseFloat(slab.length),
        width: parseFloat(slab.width),
        thickness: parseFloat(slab.thickness),
        status: slab.status as 'dispo' | 'réservé',
        debitSheetId: slab.debit_sheet_id || undefined,
        createdAt: new Date(slab.created_at),
        updatedAt: new Date(slab.updated_at),
        numeroOS: slab.debit_sheets?.numero_os || undefined,
        refChantier: slab.debit_sheets?.ref_chantier || undefined
      }));

      setSlabs(formattedSlabs);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des tranches:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSlab = async (newSlabData: Omit<Slab, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { data: slabData, error: slabError } = await supabase
        .from('slabs')
        .insert({
          user_id: user.id,
          position: newSlabData.position,
          material: newSlabData.material,
          length: newSlabData.length,
          width: newSlabData.width,
          thickness: newSlabData.thickness,
          status: newSlabData.status,
          debit_sheet_id: newSlabData.debitSheetId || null
        })
        .select()
        .single();

      if (slabError) throw slabError;

      await fetchSlabs();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de la tranche:', err);
    }
  };

  const updateSlab = async (updatedSlab: Slab) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { error: slabError } = await supabase
        .from('slabs')
        .update({
          position: updatedSlab.position,
          material: updatedSlab.material,
          length: updatedSlab.length,
          width: updatedSlab.width,
          thickness: updatedSlab.thickness,
          status: updatedSlab.status,
          debit_sheet_id: updatedSlab.debitSheetId || null
        })
        .eq('id', updatedSlab.id);

      if (slabError) throw slabError;

      await fetchSlabs();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour de la tranche:', err);
    }
  };

  const deleteSlab = async (slabId: string) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('slabs')
        .delete()
        .eq('id', slabId);

      if (error) throw error;

      await fetchSlabs();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la tranche:', err);
    }
  };

  useEffect(() => {
    fetchSlabs();

    if (user) {
      const slabsSubscription = supabase
        .channel('slabs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slabs'
          },
          async (payload) => {
            console.log('Changement détecté sur slabs:', payload);
            await fetchSlabs();
          }
        )
        .subscribe();

      return () => {
        slabsSubscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    slabs,
    loading,
    error,
    addSlab,
    updateSlab,
    deleteSlab,
    refetch: fetchSlabs
  };
}