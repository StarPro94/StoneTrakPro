import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Quote, QuoteItem, QuoteStatus } from '../types';
import { useAuth } from './useAuth';
import { calculateQuoteTotals } from '../utils/pricingCalculations';

export function useQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    if (!isSupabaseConfigured() || !user) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase!
        .from('quotes')
        .select(`
          *,
          items:quote_items(*)
        `)
        .order('quote_date', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedQuotes: Quote[] = (data || []).map((q: any) => ({
        id: q.id,
        clientName: q.client_name,
        projectName: q.project_name,
        quoteDate: new Date(q.quote_date),
        validityPeriod: q.validity_period,
        status: q.status as QuoteStatus,
        subtotalHt: Number(q.subtotal_ht),
        discountPercent: Number(q.discount_percent),
        discountAmount: Number(q.discount_amount),
        totalHt: Number(q.total_ht),
        tvaPercent: Number(q.tva_percent),
        totalTva: Number(q.total_tva),
        totalTtc: Number(q.total_ttc),
        notes: q.notes,
        paymentConditions: q.payment_conditions,
        createdBy: q.created_by,
        createdAt: new Date(q.created_at),
        updatedAt: new Date(q.updated_at),
        items: q.items?.map((item: any) => mapQuoteItem(item)) || []
      }));

      setQuotes(mappedQuotes);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des devis:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapQuoteItem = (item: any): QuoteItem => ({
    id: item.id,
    quoteId: item.quote_id,
    itemOrder: item.item_order,
    description: item.description,
    materialId: item.material_id,
    materialName: item.material_name,
    quantity: Number(item.quantity),
    unit: item.unit,
    thickness: item.thickness ? Number(item.thickness) : null,
    calculationMethod: item.calculation_method,
    sourcePrice: item.source_price ? Number(item.source_price) : null,
    sawingCost: item.sawing_cost ? Number(item.sawing_cost) : null,
    wasteFactor: Number(item.waste_factor),
    marginCoefficient: Number(item.margin_coefficient),
    laborCost: Number(item.labor_cost),
    consumablesCost: Number(item.consumables_cost),
    fabricationCost: Number(item.fabrication_cost),
    unitCostPrice: item.unit_cost_price ? Number(item.unit_cost_price) : null,
    unitSellingPrice: Number(item.unit_selling_price),
    totalPrice: Number(item.total_price),
    notes: item.notes,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at)
  });

  const fetchQuoteById = async (id: string): Promise<Quote | null> => {
    if (!isSupabaseConfigured()) {
      setError('Configuration Supabase manquante');
      return null;
    }

    try {
      const { data, error: fetchError } = await supabase!
        .from('quotes')
        .select(`
          *,
          items:quote_items(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) return null;

      return {
        id: data.id,
        clientName: data.client_name,
        projectName: data.project_name,
        quoteDate: new Date(data.quote_date),
        validityPeriod: data.validity_period,
        status: data.status as QuoteStatus,
        subtotalHt: Number(data.subtotal_ht),
        discountPercent: Number(data.discount_percent),
        discountAmount: Number(data.discount_amount),
        totalHt: Number(data.total_ht),
        tvaPercent: Number(data.tva_percent),
        totalTva: Number(data.total_tva),
        totalTtc: Number(data.total_ttc),
        notes: data.notes,
        paymentConditions: data.payment_conditions,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        items: data.items?.map((item: any) => mapQuoteItem(item)) || []
      };
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement du devis:', err);
      return null;
    }
  };

  const createQuote = async (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string | null> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return null;
    }

    try {
      setError(null);

      const { data, error: insertError } = await supabase!
        .from('quotes')
        .insert({
          client_name: quote.clientName,
          project_name: quote.projectName,
          quote_date: quote.quoteDate.toISOString().split('T')[0],
          validity_period: quote.validityPeriod,
          status: quote.status,
          subtotal_ht: quote.subtotalHt,
          discount_percent: quote.discountPercent,
          discount_amount: quote.discountAmount,
          total_ht: quote.totalHt,
          tva_percent: quote.tvaPercent,
          total_tva: quote.totalTva,
          total_ttc: quote.totalTtc,
          notes: quote.notes,
          payment_conditions: quote.paymentConditions,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchQuotes();
      return data.id;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la création du devis:', err);
      return null;
    }
  };

  const updateQuote = async (quote: Quote): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase!
        .from('quotes')
        .update({
          client_name: quote.clientName,
          project_name: quote.projectName,
          quote_date: quote.quoteDate.toISOString().split('T')[0],
          validity_period: quote.validityPeriod,
          status: quote.status,
          subtotal_ht: quote.subtotalHt,
          discount_percent: quote.discountPercent,
          discount_amount: quote.discountAmount,
          total_ht: quote.totalHt,
          tva_percent: quote.tvaPercent,
          total_tva: quote.totalTva,
          total_ttc: quote.totalTtc,
          notes: quote.notes,
          payment_conditions: quote.paymentConditions
        })
        .eq('id', quote.id);

      if (updateError) throw updateError;

      await fetchQuotes();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour du devis:', err);
      return false;
    }
  };

  const deleteQuote = async (id: string): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase!
        .from('quotes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchQuotes();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression du devis:', err);
      return false;
    }
  };

  const addQuoteItem = async (item: Omit<QuoteItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: insertError } = await supabase!
        .from('quote_items')
        .insert({
          quote_id: item.quoteId,
          item_order: item.itemOrder,
          description: item.description,
          material_id: item.materialId,
          material_name: item.materialName,
          quantity: item.quantity,
          unit: item.unit,
          thickness: item.thickness,
          calculation_method: item.calculationMethod,
          source_price: item.sourcePrice,
          sawing_cost: item.sawingCost,
          waste_factor: item.wasteFactor,
          margin_coefficient: item.marginCoefficient,
          labor_cost: item.laborCost,
          consumables_cost: item.consumablesCost,
          fabrication_cost: item.fabricationCost,
          unit_cost_price: item.unitCostPrice,
          unit_selling_price: item.unitSellingPrice,
          total_price: item.totalPrice,
          notes: item.notes
        });

      if (insertError) throw insertError;

      // Recalculer les totaux du devis
      await recalculateQuoteTotals(item.quoteId);
      await fetchQuotes();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de la ligne:', err);
      return false;
    }
  };

  const updateQuoteItem = async (item: QuoteItem): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase!
        .from('quote_items')
        .update({
          item_order: item.itemOrder,
          description: item.description,
          material_id: item.materialId,
          material_name: item.materialName,
          quantity: item.quantity,
          unit: item.unit,
          thickness: item.thickness,
          calculation_method: item.calculationMethod,
          source_price: item.sourcePrice,
          sawing_cost: item.sawingCost,
          waste_factor: item.wasteFactor,
          margin_coefficient: item.marginCoefficient,
          labor_cost: item.laborCost,
          consumables_cost: item.consumablesCost,
          fabrication_cost: item.fabricationCost,
          unit_cost_price: item.unitCostPrice,
          unit_selling_price: item.unitSellingPrice,
          total_price: item.totalPrice,
          notes: item.notes
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      await recalculateQuoteTotals(item.quoteId);
      await fetchQuotes();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour de la ligne:', err);
      return false;
    }
  };

  const deleteQuoteItem = async (itemId: string, quoteId: string): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase!
        .from('quote_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      await recalculateQuoteTotals(quoteId);
      await fetchQuotes();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la ligne:', err);
      return false;
    }
  };

  const recalculateQuoteTotals = async (quoteId: string): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      // Récupérer le devis et ses items
      const { data: quoteData } = await supabase!
        .from('quotes')
        .select('discount_percent, tva_percent')
        .eq('id', quoteId)
        .single();

      const { data: itemsData } = await supabase!
        .from('quote_items')
        .select('total_price')
        .eq('quote_id', quoteId);

      if (!quoteData || !itemsData) return;

      const totals = calculateQuoteTotals(
        itemsData.map(item => ({ totalPrice: Number(item.total_price) })),
        Number(quoteData.discount_percent),
        Number(quoteData.tva_percent)
      );

      await supabase!
        .from('quotes')
        .update({
          subtotal_ht: totals.subtotalHt,
          discount_amount: totals.discountAmount,
          total_ht: totals.totalHt,
          total_tva: totals.totalTva,
          total_ttc: totals.totalTtc
        })
        .eq('id', quoteId);
    } catch (err) {
      console.error('Erreur lors du recalcul des totaux:', err);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase!
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      await fetchQuotes();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour du statut:', err);
      return false;
    }
  };

  const duplicateQuote = async (quoteId: string): Promise<string | null> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return null;
    }

    try {
      setError(null);

      const originalQuote = await fetchQuoteById(quoteId);
      if (!originalQuote) throw new Error('Devis introuvable');

      // Créer un nouveau devis
      const newQuoteId = await createQuote({
        ...originalQuote,
        clientName: originalQuote.clientName + ' (Copie)',
        status: 'draft',
        quoteDate: new Date()
      });

      if (!newQuoteId) throw new Error('Erreur lors de la duplication');

      // Copier les items
      if (originalQuote.items && originalQuote.items.length > 0) {
        for (const item of originalQuote.items) {
          await addQuoteItem({
            ...item,
            quoteId: newQuoteId
          });
        }
      }

      await fetchQuotes();
      return newQuoteId;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la duplication:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchQuotes();

    if (user && isSupabaseConfigured()) {
      const quotesChannel = supabase!
        .channel('quotes_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quotes'
          },
          () => {
            fetchQuotes();
          }
        )
        .subscribe();

      const itemsChannel = supabase!
        .channel('quote_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quote_items'
          },
          () => {
            fetchQuotes();
          }
        )
        .subscribe();

      return () => {
        quotesChannel.unsubscribe();
        itemsChannel.unsubscribe();
      };
    }
  }, [user]);

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
    fetchQuoteById,
    createQuote,
    updateQuote,
    deleteQuote,
    addQuoteItem,
    updateQuoteItem,
    deleteQuoteItem,
    updateQuoteStatus,
    duplicateQuote,
    recalculateQuoteTotals
  };
}
