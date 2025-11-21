import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScaffoldingSite, ScaffoldingSiteSummary } from '../types';
import { useAuth } from './useAuth';

export function useScaffoldingSites() {
  const { user } = useAuth();
  const [sites, setSites] = useState<ScaffoldingSite[]>([]);
  const [siteSummaries, setSiteSummaries] = useState<ScaffoldingSiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSites();
      fetchSiteSummaries();
    }
  }, [user]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('scaffolding_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const sitesList: ScaffoldingSite[] = (data || []).map((site: any) => ({
        id: site.id,
        userId: site.user_id,
        numero: site.numero,
        nom: site.nom,
        adresse: site.adresse,
        status: site.status as 'actif' | 'termine',
        dateDebut: site.date_debut ? new Date(site.date_debut) : undefined,
        dateFin: site.date_fin ? new Date(site.date_fin) : undefined,
        notes: site.notes,
        createdAt: new Date(site.created_at),
        updatedAt: new Date(site.updated_at)
      }));

      setSites(sitesList);
    } catch (err: any) {
      console.error('Erreur lors du chargement des chantiers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSummaries = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('v_sites_summary')
        .select('*');

      if (fetchError) throw fetchError;

      const summaries: ScaffoldingSiteSummary[] = (data || []).map((summary: any) => ({
        id: summary.id,
        numero: summary.numero,
        nom: summary.nom,
        adresse: summary.adresse,
        status: summary.status as 'actif' | 'termine',
        dateDebut: summary.date_debut ? new Date(summary.date_debut) : undefined,
        dateFin: summary.date_fin ? new Date(summary.date_fin) : undefined,
        nbLivraisons: summary.nb_livraisons || 0,
        nbReceptions: summary.nb_receptions || 0,
        derniereLivraison: summary.derniere_livraison ? new Date(summary.derniere_livraison) : undefined,
        derniereReception: summary.derniere_reception ? new Date(summary.derniere_reception) : undefined,
        joursDepuisDerniereLivraison: summary.jours_depuis_derniere_livraison
      }));

      setSiteSummaries(summaries);
    } catch (err: any) {
      console.error('Erreur lors du chargement des résumés de chantiers:', err);
    }
  };

  const addSite = async (site: Omit<ScaffoldingSite, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const { data, error: insertError } = await supabase
        .from('scaffolding_sites')
        .insert({
          user_id: user.id,
          numero: site.numero,
          nom: site.nom,
          adresse: site.adresse,
          status: site.status,
          date_debut: site.dateDebut?.toISOString().split('T')[0],
          date_fin: site.dateFin?.toISOString().split('T')[0],
          notes: site.notes
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchSites();
      await fetchSiteSummaries();
      return data.id;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du chantier:', err);
      throw err;
    }
  };

  const updateSite = async (id: string, updates: Partial<ScaffoldingSite>) => {
    try {
      const updateData: any = {};
      if (updates.numero !== undefined) updateData.numero = updates.numero;
      if (updates.nom !== undefined) updateData.nom = updates.nom;
      if (updates.adresse !== undefined) updateData.adresse = updates.adresse;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.dateDebut !== undefined) updateData.date_debut = updates.dateDebut?.toISOString().split('T')[0];
      if (updates.dateFin !== undefined) updateData.date_fin = updates.dateFin?.toISOString().split('T')[0];
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error: updateError } = await supabase
        .from('scaffolding_sites')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchSites();
      await fetchSiteSummaries();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du chantier:', err);
      throw err;
    }
  };

  const deleteSite = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('scaffolding_sites')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchSites();
      await fetchSiteSummaries();
    } catch (err: any) {
      console.error('Erreur lors de la suppression du chantier:', err);
      throw err;
    }
  };

  const searchSites = (searchTerm: string): ScaffoldingSite[] => {
    if (!searchTerm) return sites;

    const lower = searchTerm.toLowerCase();
    return sites.filter(site =>
      site.numero.toLowerCase().includes(lower) ||
      site.nom.toLowerCase().includes(lower) ||
      site.adresse?.toLowerCase().includes(lower)
    );
  };

  const getActiveSites = (): ScaffoldingSite[] => {
    return sites.filter(site => site.status === 'actif');
  };

  return {
    sites,
    siteSummaries,
    loading,
    error,
    addSite,
    updateSite,
    deleteSite,
    searchSites,
    getActiveSites,
    refetch: fetchSites
  };
}
