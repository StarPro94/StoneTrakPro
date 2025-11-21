import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Block } from '../types';
import { useAuth } from './useAuth';

export function useBlocks() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = async () => {
    if (!isSupabaseConfigured()) {
      setBlocks([]);
      setLoading(false);
      setError('Configuration Supabase manquante');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase!
        .from('blocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setBlocks(
        (data || []).map((b) => ({
          id: b.id,
          userId: b.user_id,
          ligne: b.ligne,
          material: b.material,
          length: b.length,
          width: b.width,
          height: b.height,
          volume: parseFloat(b.volume),
          notes: b.notes,
          createdAt: new Date(b.created_at),
          updatedAt: new Date(b.updated_at),
        }))
      );
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des blocs:', err);
    } finally {
      setLoading(false);
    }
  };

  const addBlock = async (block: Omit<Block, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const volume = (block.length * block.width * block.height) / 1000000;

      const { error: insertError } = await supabase!
        .from('blocks')
        .insert({
          user_id: user.id,
          ligne: block.ligne,
          material: block.material,
          length: block.length,
          width: block.width,
          height: block.height,
          volume: volume.toFixed(3),
          notes: block.notes,
        });

      if (insertError) throw insertError;

      await fetchBlocks();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout du bloc:', err);
      throw err;
    }
  };

  const updateBlock = async (block: Block) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const volume = (block.length * block.width * block.height) / 1000000;

      const { error: updateError } = await supabase!
        .from('blocks')
        .update({
          ligne: block.ligne,
          material: block.material,
          length: block.length,
          width: block.width,
          height: block.height,
          volume: volume.toFixed(3),
          notes: block.notes,
        })
        .eq('id', block.id);

      if (updateError) throw updateError;

      await fetchBlocks();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour du bloc:', err);
      throw err;
    }
  };

  const deleteBlock = async (id: string) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase!
        .from('blocks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchBlocks();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression du bloc:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBlocks();

    if (user && isSupabaseConfigured()) {
      const subscription = supabase!
        .channel('blocks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
          },
          () => {
            fetchBlocks();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    blocks,
    loading,
    error,
    addBlock,
    updateBlock,
    deleteBlock,
    refetch: fetchBlocks,
  };
}
