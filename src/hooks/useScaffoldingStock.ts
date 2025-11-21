import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ScaffoldingStockGlobal,
  ScaffoldingStockMovement,
  ScaffoldingSiteInventory,
  ScaffoldingLayherStock,
  StockAvailability
} from '../types';
import { useAuth } from './useAuth';

export function useScaffoldingStock() {
  const { user } = useAuth();
  const [stockGlobal, setStockGlobal] = useState<ScaffoldingStockGlobal[]>([]);
  const [movements, setMovements] = useState<ScaffoldingStockMovement[]>([]);
  const [siteInventories, setSiteInventories] = useState<ScaffoldingSiteInventory[]>([]);
  const [layherStock, setLayherStock] = useState<ScaffoldingLayherStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllStockData();
    }
  }, [user]);

  const fetchAllStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchStockGlobal(),
        fetchMovements(),
        fetchSiteInventories(),
        fetchLayherStock()
      ]);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données de stock:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockGlobal = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('v_stock_global_details')
        .select('*')
        .order('reference');

      if (fetchError) throw fetchError;

      const stock: ScaffoldingStockGlobal[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        catalogItemId: item.catalog_item_id,
        reference: item.reference,
        designation: item.designation,
        poidsUnitaire: item.poids_unitaire,
        quantiteTotale: item.quantite_totale || 0,
        quantiteDisponible: item.quantite_disponible || 0,
        quantiteSurChantier: item.quantite_sur_chantier || 0,
        quantiteHs: item.quantite_hs || 0,
        quantiteLayher: item.quantite_layher || 0,
        poidsTotal: item.poids_total || 0,
        poidsDisponible: item.poids_disponible || 0,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      setStockGlobal(stock);
    } catch (err: any) {
      console.error('Erreur lors du chargement du stock global:', err);
      throw err;
    }
  };

  const fetchMovements = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('scaffolding_stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const mvts: ScaffoldingStockMovement[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        catalogItemId: item.catalog_item_id,
        type: item.type,
        quantite: item.quantite,
        source: item.source,
        destination: item.destination,
        siteId: item.site_id,
        listId: item.list_id,
        notes: item.notes,
        createdAt: new Date(item.created_at)
      }));

      setMovements(mvts);
    } catch (err: any) {
      console.error('Erreur lors du chargement des mouvements:', err);
      throw err;
    }
  };

  const fetchSiteInventories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('v_site_inventory_details')
        .select('*')
        .order('site_numero, reference');

      if (fetchError) throw fetchError;

      const inventories: ScaffoldingSiteInventory[] = (data || []).map((item: any) => ({
        id: item.id,
        siteId: item.site_id,
        catalogItemId: item.catalog_item_id,
        reference: item.reference,
        designation: item.designation,
        poidsUnitaire: item.poids_unitaire,
        quantiteLivree: item.quantite_livree || 0,
        quantiteRecue: item.quantite_recue || 0,
        quantiteActuelle: item.quantite_actuelle || 0,
        poidsActuel: item.poids_actuel || 0,
        lastMovementAt: new Date(item.last_movement_at),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      setSiteInventories(inventories);
    } catch (err: any) {
      console.error('Erreur lors du chargement des inventaires chantier:', err);
      throw err;
    }
  };

  const fetchLayherStock = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('scaffolding_layher_stock')
        .select(`
          *,
          catalog_item:scaffolding_catalog(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const layher: ScaffoldingLayherStock[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        catalogItemId: item.catalog_item_id,
        catalogItem: item.catalog_item ? {
          id: item.catalog_item.id,
          reference: item.catalog_item.reference,
          designation: item.catalog_item.designation,
          poidsUnitaire: item.catalog_item.poids_unitaire,
          category: item.catalog_item.category,
          layherReference: item.catalog_item.layher_reference,
          isActive: item.catalog_item.is_active,
          createdAt: new Date(item.catalog_item.created_at),
          updatedAt: new Date(item.catalog_item.updated_at)
        } : undefined,
        quantite: item.quantite,
        dateLocation: new Date(item.date_location),
        dateRetourPrevue: item.date_retour_prevue ? new Date(item.date_retour_prevue) : undefined,
        dateRetourEffective: item.date_retour_effective ? new Date(item.date_retour_effective) : undefined,
        numeroCommande: item.numero_commande,
        coutLocation: item.cout_location,
        status: item.status,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      setLayherStock(layher);
    } catch (err: any) {
      console.error('Erreur lors du chargement du stock Layher:', err);
      throw err;
    }
  };

  const initializeStock = async (items: Array<{ catalogItemId: string; quantite: number }>) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      for (const item of items) {
        await supabase
          .from('scaffolding_stock_global')
          .insert({
            user_id: user.id,
            catalog_item_id: item.catalogItemId,
            quantite_totale: item.quantite,
            quantite_disponible: item.quantite,
            quantite_sur_chantier: 0,
            quantite_hs: 0,
            quantite_layher: 0
          })
          .select()
          .single();

        await addMovement({
          catalogItemId: item.catalogItemId,
          type: 'entree',
          quantite: item.quantite,
          source: 'Inventaire initial',
          notes: 'Initialisation du stock'
        });
      }

      await fetchAllStockData();
    } catch (err: any) {
      console.error('Erreur lors de l\'initialisation du stock:', err);
      throw err;
    }
  };

  const addMovement = async (movement: Omit<ScaffoldingStockMovement, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const { error: insertError } = await supabase
        .from('scaffolding_stock_movements')
        .insert({
          user_id: user.id,
          catalog_item_id: movement.catalogItemId,
          type: movement.type,
          quantite: movement.quantite,
          source: movement.source,
          destination: movement.destination,
          site_id: movement.siteId,
          list_id: movement.listId,
          notes: movement.notes
        });

      if (insertError) throw insertError;

      await fetchAllStockData();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du mouvement:', err);
      throw err;
    }
  };

  const checkAvailability = async (catalogItemId: string, quantite: number): Promise<StockAvailability> => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const { data, error: checkError } = await supabase
        .rpc('check_stock_availability', {
          p_user_id: user.id,
          p_catalog_item_id: catalogItemId,
          p_quantite: quantite
        });

      if (checkError) throw checkError;

      if (!data || data.length === 0) {
        return {
          disponible: false,
          quantiteDisponible: 0,
          quantiteManquante: quantite
        };
      }

      return {
        disponible: data[0].disponible,
        quantiteDisponible: data[0].quantite_disponible,
        quantiteManquante: data[0].quantite_manquante
      };
    } catch (err: any) {
      console.error('Erreur lors de la vérification de disponibilité:', err);
      throw err;
    }
  };

  const addLayherRental = async (rental: Omit<ScaffoldingLayherStock, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const { error: insertError } = await supabase
        .from('scaffolding_layher_stock')
        .insert({
          user_id: user.id,
          catalog_item_id: rental.catalogItemId,
          quantite: rental.quantite,
          date_location: rental.dateLocation.toISOString().split('T')[0],
          date_retour_prevue: rental.dateRetourPrevue?.toISOString().split('T')[0],
          numero_commande: rental.numeroCommande,
          cout_location: rental.coutLocation,
          status: rental.status,
          notes: rental.notes
        });

      if (insertError) throw insertError;

      await addMovement({
        catalogItemId: rental.catalogItemId,
        type: 'layher_location',
        quantite: rental.quantite,
        source: 'Layher',
        notes: `Location ${rental.numeroCommande}`
      });

      await fetchAllStockData();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de la location Layher:', err);
      throw err;
    }
  };

  const returnLayherRental = async (rentalId: string, quantite: number) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      const rental = layherStock.find(r => r.id === rentalId);
      if (!rental) throw new Error('Location non trouvée');

      const { error: updateError } = await supabase
        .from('scaffolding_layher_stock')
        .update({
          date_retour_effective: new Date().toISOString().split('T')[0],
          status: 'retourne'
        })
        .eq('id', rentalId);

      if (updateError) throw updateError;

      await addMovement({
        catalogItemId: rental.catalogItemId,
        type: 'layher_retour',
        quantite: quantite,
        destination: 'Layher',
        notes: `Retour ${rental.numeroCommande}`
      });

      await fetchAllStockData();
    } catch (err: any) {
      console.error('Erreur lors du retour Layher:', err);
      throw err;
    }
  };

  const markAsRepaired = async (catalogItemId: string, quantite: number) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      await addMovement({
        catalogItemId,
        type: 'reparation',
        quantite,
        source: 'Réparation',
        destination: 'Stock disponible',
        notes: 'Élément réparé et remis en stock'
      });

      await fetchAllStockData();
    } catch (err: any) {
      console.error('Erreur lors du marquage comme réparé:', err);
      throw err;
    }
  };

  const markAsDiscarded = async (catalogItemId: string, quantite: number) => {
    if (!user) throw new Error('Utilisateur non authentifié');

    try {
      await addMovement({
        catalogItemId,
        type: 'rebut',
        quantite,
        source: 'Éléments HS',
        destination: 'Rebut',
        notes: 'Élément mis au rebut définitivement'
      });

      await fetchAllStockData();
    } catch (err: any) {
      console.error('Erreur lors du marquage comme rebuté:', err);
      throw err;
    }
  };

  const getStockByReference = (reference: string): ScaffoldingStockGlobal | undefined => {
    return stockGlobal.find(s => s.reference === reference);
  };

  const getInventoryBySite = (siteId: string): ScaffoldingSiteInventory[] => {
    return siteInventories.filter(inv => inv.siteId === siteId);
  };

  const getActiveLayherRentals = (): ScaffoldingLayherStock[] => {
    return layherStock.filter(l => l.status === 'en_cours');
  };

  const getDamagedItems = (): ScaffoldingStockGlobal[] => {
    return stockGlobal.filter(s => s.quantiteHs > 0);
  };

  return {
    stockGlobal,
    movements,
    siteInventories,
    layherStock,
    loading,
    error,
    initializeStock,
    addMovement,
    checkAvailability,
    addLayherRental,
    returnLayherRental,
    markAsRepaired,
    markAsDiscarded,
    getStockByReference,
    getInventoryBySite,
    getActiveLayherRentals,
    getDamagedItems,
    refetch: fetchAllStockData
  };
}
