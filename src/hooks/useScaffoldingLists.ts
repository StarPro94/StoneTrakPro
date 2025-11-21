import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScaffoldingList, ScaffoldingListItem, ScaffoldingFilter } from '../types';
import { useAuth } from './useAuth';

export function useScaffoldingLists(filter?: ScaffoldingFilter) {
  const { user } = useAuth();
  const [lists, setLists] = useState<ScaffoldingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLists();

      const subscription = supabase
        .channel('scaffolding_lists_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'scaffolding_lists'
        }, () => {
          fetchLists();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, filter]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('scaffolding_lists')
        .select(`
          *,
          site:scaffolding_sites(*),
          items:scaffolding_list_items(
            *,
            catalogItem:scaffolding_catalog(*)
          )
        `)
        .order('date', { ascending: false });

      if (filter?.type) {
        query = query.eq('type', filter.type);
      }

      if (filter?.siteId) {
        query = query.eq('site_id', filter.siteId);
      }

      if (filter?.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter?.dateDebut) {
        query = query.gte('date', filter.dateDebut.toISOString().split('T')[0]);
      }

      if (filter?.dateFin) {
        query = query.lte('date', filter.dateFin.toISOString().split('T')[0]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const listsList: ScaffoldingList[] = (data || []).map((list: any) => ({
        id: list.id,
        userId: list.user_id,
        numero: list.numero,
        type: list.type as 'livraison' | 'reception',
        siteId: list.site_id,
        site: list.site ? {
          id: list.site.id,
          userId: list.site.user_id,
          numero: list.site.numero,
          nom: list.site.nom,
          adresse: list.site.adresse,
          status: list.site.status,
          dateDebut: list.site.date_debut ? new Date(list.site.date_debut) : undefined,
          dateFin: list.site.date_fin ? new Date(list.site.date_fin) : undefined,
          notes: list.site.notes,
          createdAt: new Date(list.site.created_at),
          updatedAt: new Date(list.site.updated_at)
        } : undefined,
        date: new Date(list.date),
        preparateur: list.preparateur,
        receptionnaire: list.receptionnaire,
        transporteur: list.transporteur,
        status: list.status as 'brouillon' | 'pret' | 'en_cours' | 'termine',
        notes: list.notes,
        createdAt: new Date(list.created_at),
        updatedAt: new Date(list.updated_at),
        items: (list.items || []).map((item: any) => ({
          id: item.id,
          listId: item.list_id,
          catalogItemId: item.catalog_item_id,
          catalogItem: item.catalogItem ? {
            id: item.catalogItem.id,
            reference: item.catalogItem.reference,
            designation: item.catalogItem.designation,
            poidsUnitaire: parseFloat(item.catalogItem.poids_unitaire),
            category: item.catalogItem.category,
            layherReference: item.catalogItem.layher_reference,
            isActive: item.catalogItem.is_active,
            createdAt: new Date(item.catalogItem.created_at),
            updatedAt: new Date(item.catalogItem.updated_at)
          } : undefined,
          quantite: item.quantite,
          poidsTotal: parseFloat(item.poids_total),
          locationAbbeville: item.location_abbeville ? parseFloat(item.location_abbeville) : undefined,
          locationBeauvais: item.location_beauvais ? parseFloat(item.location_beauvais) : undefined,
          locationSemi: item.location_semi ? parseFloat(item.location_semi) : undefined,
          isLayherRental: item.is_layher_rental,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        }))
      }));

      setLists(listsList);
    } catch (err: any) {
      console.error('Erreur lors du chargement des listes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addList = async (list: Omit<ScaffoldingList, 'id' | 'userId' | 'numero' | 'createdAt' | 'updatedAt' | 'items'>) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const { data, error: insertError } = await supabase
        .from('scaffolding_lists')
        .insert({
          user_id: user.id,
          type: list.type,
          site_id: list.siteId,
          date: list.date.toISOString().split('T')[0],
          preparateur: list.preparateur,
          receptionnaire: list.receptionnaire,
          transporteur: list.transporteur,
          status: list.status || 'brouillon',
          notes: list.notes
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchLists();
      return data.id;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de la liste:', err);
      throw err;
    }
  };

  const updateList = async (id: string, updates: Partial<ScaffoldingList>) => {
    try {
      const updateData: any = {};
      if (updates.siteId !== undefined) updateData.site_id = updates.siteId;
      if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0];
      if (updates.preparateur !== undefined) updateData.preparateur = updates.preparateur;
      if (updates.receptionnaire !== undefined) updateData.receptionnaire = updates.receptionnaire;
      if (updates.transporteur !== undefined) updateData.transporteur = updates.transporteur;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error: updateError } = await supabase
        .from('scaffolding_lists')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchLists();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la liste:', err);
      throw err;
    }
  };

  const deleteList = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('scaffolding_lists')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchLists();
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la liste:', err);
      throw err;
    }
  };

  const addListItem = async (listId: string, item: Omit<ScaffoldingListItem, 'id' | 'createdAt' | 'updatedAt' | 'poidsTotal'>) => {
    try {
      const { error: insertError } = await supabase
        .from('scaffolding_list_items')
        .insert({
          list_id: listId,
          catalog_item_id: item.catalogItemId,
          quantite: item.quantite,
          location_abbeville: item.locationAbbeville,
          location_beauvais: item.locationBeauvais,
          location_semi: item.locationSemi,
          is_layher_rental: item.isLayherRental
        });

      if (insertError) throw insertError;

      await fetchLists();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout d\'un élément:', err);
      throw err;
    }
  };

  const updateListItem = async (itemId: string, updates: Partial<ScaffoldingListItem>) => {
    try {
      const updateData: any = {};
      if (updates.quantite !== undefined) updateData.quantite = updates.quantite;
      if (updates.locationAbbeville !== undefined) updateData.location_abbeville = updates.locationAbbeville;
      if (updates.locationBeauvais !== undefined) updateData.location_beauvais = updates.locationBeauvais;
      if (updates.locationSemi !== undefined) updateData.location_semi = updates.locationSemi;
      if (updates.isLayherRental !== undefined) updateData.is_layher_rental = updates.isLayherRental;

      const { error: updateError } = await supabase
        .from('scaffolding_list_items')
        .update(updateData)
        .eq('id', itemId);

      if (updateError) throw updateError;

      await fetchLists();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de l\'élément:', err);
      throw err;
    }
  };

  const deleteListItem = async (itemId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('scaffolding_list_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      await fetchLists();
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'élément:', err);
      throw err;
    }
  };

  return {
    lists,
    loading,
    error,
    addList,
    updateList,
    deleteList,
    addListItem,
    updateListItem,
    deleteListItem,
    refetch: fetchLists
  };
}
