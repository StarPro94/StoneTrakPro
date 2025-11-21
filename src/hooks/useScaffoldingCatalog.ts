import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScaffoldingCatalogItem } from '../types';
import { useAuth } from './useAuth';

export function useScaffoldingCatalog() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<ScaffoldingCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCatalog();
    }
  }, [user]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('scaffolding_catalog')
        .select('*')
        .eq('is_active', true)
        .order('reference');

      if (fetchError) throw fetchError;

      const catalogItems: ScaffoldingCatalogItem[] = (data || []).map((item: any) => ({
        id: item.id,
        reference: item.reference,
        designation: item.designation,
        poidsUnitaire: parseFloat(item.poids_unitaire),
        category: item.category,
        layherReference: item.layher_reference,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      setCatalog(catalogItems);
    } catch (err: any) {
      console.error('Erreur lors du chargement du catalogue:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCatalogItem = async (item: Omit<ScaffoldingCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('scaffolding_catalog')
        .insert({
          reference: item.reference,
          designation: item.designation,
          poids_unitaire: item.poidsUnitaire,
          category: item.category,
          layher_reference: item.layherReference,
          is_active: item.isActive
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchCatalog();
      return data.id;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout au catalogue:', err);
      throw err;
    }
  };

  const updateCatalogItem = async (id: string, updates: Partial<ScaffoldingCatalogItem>) => {
    try {
      const updateData: any = {};
      if (updates.reference !== undefined) updateData.reference = updates.reference;
      if (updates.designation !== undefined) updateData.designation = updates.designation;
      if (updates.poidsUnitaire !== undefined) updateData.poids_unitaire = updates.poidsUnitaire;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.layherReference !== undefined) updateData.layher_reference = updates.layherReference;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error: updateError } = await supabase
        .from('scaffolding_catalog')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchCatalog();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du catalogue:', err);
      throw err;
    }
  };

  const deleteCatalogItem = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('scaffolding_catalog')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchCatalog();
    } catch (err: any) {
      console.error('Erreur lors de la suppression du catalogue:', err);
      throw err;
    }
  };

  const searchCatalog = (searchTerm: string): ScaffoldingCatalogItem[] => {
    if (!searchTerm) return catalog;

    const lower = searchTerm.toLowerCase();
    return catalog.filter(item =>
      item.reference.toLowerCase().includes(lower) ||
      item.designation.toLowerCase().includes(lower) ||
      item.layherReference?.toLowerCase().includes(lower)
    );
  };

  return {
    catalog,
    loading,
    error,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    searchCatalog,
    refetch: fetchCatalog
  };
}
