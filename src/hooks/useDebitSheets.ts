import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DebitSheet, DebitItem } from '../types';
import { useAuth } from './useAuth';

export function useDebitSheets() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<DebitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely parse dates
  const parseDate = (dateValue: any, fallback?: Date): Date | undefined => {
    if (!dateValue) return fallback;
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  };
  const fetchSheets = async (silent: boolean = false) => {
    // Si aucun utilisateur connecté, vider les données et arrêter
    if (!user) {
      setSheets([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Vérifier la configuration Supabase
    if (!isSupabaseConfigured()) {
      setSheets([]);
      setLoading(false);
      setError('Configuration Supabase manquante. Veuillez vérifier vos variables d\'environnement.');
      return;
    }

    try {
      // Ne pas afficher le spinner si c'est un refresh silencieux
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const { data: sheetsData, error: sheetsError } = await supabase!
        .from('debit_sheets')
        .select(`
          *,
          debit_items (*)
        `)
        .order('created_at', { ascending: false });

      if (sheetsError) throw sheetsError;

      const formattedSheets: DebitSheet[] = sheetsData.map(sheet => ({
        id: sheet.id,
        cial: sheet.cial,
        numeroOS: sheet.numero_os,
        nomClient: sheet.nom_client,
        fourniture: sheet.fourniture,
        epaisseur: sheet.epaisseur,
        numeroARC: sheet.numero_arc,
        dateArc: parseDate(sheet.date_arc, new Date()) || new Date(),
        delai: sheet.delai,
        m2: parseFloat(sheet.m2),
        m3: parseFloat(sheet.m3),
        fini: sheet.fini,
        livre: sheet.livre,
        dateCreation: parseDate(sheet.date_creation, new Date()) || new Date(),
        dateFinition: parseDate(sheet.date_finition),
        dateLivraison: parseDate(sheet.date_livraison),
        blocTranche: sheet.bloc_tranche || undefined,
        refChantier: sheet.ref_chantier || undefined,
        devisNumero: sheet.devis_numero || undefined,
        machineId: sheet.machine_id || undefined,
        items: (sheet.debit_items || []).map((item: any) => {
          const quantite = item.quantite || 1;
          const subItemsTermine = item.sub_items_termine && Array.isArray(item.sub_items_termine)
            ? item.sub_items_termine
            : Array(quantite).fill(item.termine);
          const subItemsPalettes = item.sub_items_palettes && Array.isArray(item.sub_items_palettes)
            ? item.sub_items_palettes
            : Array(quantite).fill(item.numero_palette || null);

          return {
            id: item.id,
            description: item.description,
            longueur: parseFloat(item.longueur),
            largeur: parseFloat(item.largeur),
            epaisseur: parseFloat(item.epaisseur),
            quantite,
            termine: item.termine,
            numeroAppareil: item.numero_appareil || undefined,
            matiereItem: item.matiere_item || undefined,
            finition: item.finition || undefined,
            m2Item: item.m2_item ? parseFloat(item.m2_item) : undefined,
            m3Item: item.m3_item ? parseFloat(item.m3_item) : undefined,
            numeroPalette: item.numero_palette || undefined,
            subItemsTermine,
            subItemsPalettes
          };
        })
      }));

      setSheets(formattedSheets);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des feuilles:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSheet = async (updatedSheet: DebitSheet) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      // Vérifier si la commande passe de "non finie" à "finie"
      const currentSheet = sheets.find(s => s.id === updatedSheet.id);
      const isBeingMarkedAsFinished = currentSheet && !currentSheet.fini && updatedSheet.fini;

      console.log('Mise à jour de la feuille:', {
        id: updatedSheet.id,
        wasFinished: currentSheet?.fini,
        nowFinished: updatedSheet.fini,
        isBeingMarkedAsFinished
      });

      // Si la commande est marquée comme finie, cocher automatiquement tous les éléments
      if (isBeingMarkedAsFinished) {
        console.log('Commande marquée comme finie - Cochage automatique de tous les éléments...');

        updatedSheet.items = (updatedSheet.items || []).map(item => ({
          ...item,
          termine: true
        }));

        console.log(`Tous les ${updatedSheet.items?.length || 0} éléments ont été marqués comme terminés`);

        // Supprimer toutes les tranches assignées
        console.log('Suppression des tranches assignées...');

        const { data: assignedSlabs, error: fetchSlabsError } = await supabase
          .from('slabs')
          .select('id, position, material')
          .eq('debit_sheet_id', updatedSheet.id);

        if (fetchSlabsError) {
          console.error('Erreur lors de la récupération des tranches assignées:', fetchSlabsError);
          throw new Error('Impossible de récupérer les tranches assignées');
        }

        if (assignedSlabs && assignedSlabs.length > 0) {
          console.log(`Suppression de ${assignedSlabs.length} tranche(s) assignée(s):`,
            assignedSlabs.map(s => `${s.position} (${s.material})`));

          const { error: deleteSlabsError } = await supabase
            .from('slabs')
            .delete()
            .eq('debit_sheet_id', updatedSheet.id);

          if (deleteSlabsError) {
            console.error('Erreur lors de la suppression des tranches:', deleteSlabsError);
            throw new Error('Impossible de supprimer les tranches assignées');
          }

          console.log('Tranches supprimées avec succès');
        } else {
          console.log('Aucune tranche assignée à supprimer');
        }
      }

      // Mettre à jour la feuille principale
      console.log('🔄 Tentative de mise à jour de debit_sheets:', {
        sheetId: updatedSheet.id,
        machineId: updatedSheet.machineId,
        fini: updatedSheet.fini
      });

      const { error: sheetError } = await supabase
        .from('debit_sheets')
        .update({
          cial: updatedSheet.cial,
          numero_os: updatedSheet.numeroOS,
          nom_client: updatedSheet.nomClient,
          fourniture: updatedSheet.fourniture,
          epaisseur: updatedSheet.epaisseur,
          numero_arc: updatedSheet.numeroARC,
          date_arc: updatedSheet.dateArc.toISOString().split('T')[0],
          delai: updatedSheet.delai,
          m2: updatedSheet.m2,
          m3: updatedSheet.m3,
          fini: updatedSheet.fini,
          livre: updatedSheet.livre,
          date_finition: updatedSheet.fini && !updatedSheet.dateFinition ? new Date().toISOString() : updatedSheet.dateFinition?.toISOString(),
          date_livraison: updatedSheet.livre && !updatedSheet.dateLivraison ? new Date().toISOString() : updatedSheet.dateLivraison?.toISOString(),
          bloc_tranche: updatedSheet.blocTranche || null,
          ref_chantier: updatedSheet.refChantier || null,
          devis_numero: updatedSheet.devisNumero || null,
          machine_id: updatedSheet.machineId || null
        })
        .eq('id', updatedSheet.id);

      if (sheetError) {
        console.error('❌ Erreur lors de la mise à jour de debit_sheets:', sheetError);
        throw sheetError;
      }

      console.log('✅ Mise à jour de debit_sheets réussie');

      // Mettre à jour les items
      const items = updatedSheet.items || [];
      console.log(`🔄 Mise à jour de ${items.length} items...`);

      for (const item of items) {
        console.log(`  📝 Mise à jour item ${item.id}:`, {
          termine: item.termine,
          description: item.description.substring(0, 30)
        });

        const allSubItemsTermine = item.subItemsTermine?.every(t => t) ?? item.termine;

        const { error: itemError } = await supabase
          .from('debit_items')
          .update({
            description: item.description,
            longueur: item.longueur,
            largeur: item.largeur,
            epaisseur: item.epaisseur,
            quantite: item.quantite,
            termine: allSubItemsTermine,
            numero_appareil: item.numeroAppareil || null,
            matiere_item: item.matiereItem || null,
            finition: item.finition || null,
            m2_item: item.m2Item || null,
            m3_item: item.m3Item || null,
            numero_palette: item.numeroPalette || null,
            sub_items_termine: item.subItemsTermine || null,
            sub_items_palettes: item.subItemsPalettes || null
          })
          .eq('id', item.id);

        if (itemError) {
          console.error(`  ❌ Erreur item ${item.id}:`, itemError);
          throw itemError;
        }

        console.log(`  ✅ Item ${item.id} mis à jour`);
      }

      console.log(`✅ Tous les ${items.length} items mis à jour avec succès`);

      // Le Realtime va automatiquement mettre à jour la feuille
      // Mais pour les updates on force le refresh car c'est plus fiable (en mode silencieux)
      console.log('Rechargement des feuilles après mise à jour...');
      await fetchSheets(true);
      console.log('Rechargement terminé après mise à jour');

    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const addSheet = async (newSheetData: Omit<DebitSheet, 'id'>) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {

      const { data: sheetData, error: sheetError } = await supabase
        .from('debit_sheets')
        .insert({
          user_id: user.id,
          cial: newSheetData.cial,
          numero_os: newSheetData.numeroOS,
          nom_client: newSheetData.nomClient,
          fourniture: newSheetData.fourniture,
          epaisseur: newSheetData.epaisseur,
          numero_arc: newSheetData.numeroARC,
          date_arc: newSheetData.dateArc.toISOString().split('T')[0],
          delai: newSheetData.delai,
          m2: newSheetData.m2,
          m3: newSheetData.m3,
          fini: newSheetData.fini,
          livre: newSheetData.livre,
          date_creation: newSheetData.dateCreation.toISOString().split('T')[0],
          bloc_tranche: newSheetData.blocTranche || null,
          ref_chantier: newSheetData.refChantier || null,
          devis_numero: newSheetData.devisNumero || null,
          machine_id: newSheetData.machineId || null
        })
        .select()
        .single();

      if (sheetError) throw sheetError;

      // Ajouter les items si présents
      const items = newSheetData.items || [];
      if (items.length > 0) {
        const itemsToInsert = items.map(item => {
          const quantite = item.quantite || 1;
          const subItemsTermine = item.subItemsTermine || Array(quantite).fill(item.termine);
          const subItemsPalettes = item.subItemsPalettes || Array(quantite).fill(item.numeroPalette || null);

          return {
            sheet_id: sheetData.id,
            description: item.description,
            longueur: item.longueur,
            largeur: item.largeur,
            epaisseur: item.epaisseur,
            quantite: item.quantite,
            termine: item.termine,
            numero_appareil: item.numeroAppareil || null,
            matiere_item: item.matiereItem || null,
            finition: item.finition || null,
            m2_item: item.m2Item || null,
            m3_item: item.m3Item || null,
            numero_palette: item.numeroPalette || null,
            sub_items_termine: subItemsTermine,
            sub_items_palettes: subItemsPalettes
          };
        });

        const { error: itemsError } = await supabase
          .from('debit_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Forcer un rechargement pour s'assurer que les données sont à jour (en mode silencieux)
      console.log('Rechargement des feuilles après ajout...');
      await fetchSheets(true);
      console.log('Rechargement terminé après ajout');

    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout:', err);
    }
  };

  const deleteSheet = async (sheetId: string) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      console.log('=== DÉBUT SUPPRESSION SHEET ===');
      console.log('ID de la feuille à supprimer:', sheetId);
      console.log('État actuel des sheets:', sheets.length, 'feuilles');
      const { error } = await supabase
        .from('debit_sheets')
        .delete()
        .eq('id', sheetId);

      console.log('Résultat de la suppression en base:', error ? 'ERREUR' : 'SUCCÈS');
      if (error) throw error;

      // Forcer un rechargement immédiat pour être sûr que la feuille disparaît (en mode silencieux)
      console.log('Rechargement des feuilles après suppression...');
      await fetchSheets(true);
      console.log('Rechargement terminé après suppression');

      console.log('=== FIN SUPPRESSION SHEET ===');
    } catch (err: any) {
      console.error('=== ERREUR SUPPRESSION SHEET ===');
      console.error('Erreur complète:', err);
      setError(err.message);
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const importExcel = async (file: File) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setImportLoading(true);
      setError(null);

      console.log('=== DÉBUT IMPORT EXCEL ===');
      console.log('Fichier Excel à importer:', file.name, file.size, 'bytes');
      console.log('Utilisateur connecté:', user.id);

      const formData = new FormData();
      formData.append('excel', file);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Session non valide');

      console.log('Session récupérée, token présent:', !!sessionData.session.access_token);
      console.log('URL de la fonction Edge:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-excel`);
      
      console.log('Envoi de la requête à la fonction Edge...');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-excel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: formData,
        }
      );

      console.log('Réponse reçue de la fonction Edge:', response.status, response.statusText);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de la fonction Edge:', errorData);
        throw new Error(errorData.error || 'Erreur lors du traitement du fichier Excel');
      }

      const result = await response.json();
      console.log('Résultat de la fonction Edge:', result);
      
      if (!result.success) {
        console.error('Échec du traitement PDF:', result);
        throw new Error(result.error || 'Erreur lors du traitement du fichier Excel');
      }

      console.log('Import Excel réussi, sheet_id:', result.sheet_id);

      // Forcer un rechargement pour s'assurer que les données sont à jour (en mode silencieux)
      console.log('Rechargement des feuilles après import Excel...');
      await fetchSheets(true);
      console.log('Rechargement terminé');
      console.log('=== FIN IMPORT EXCEL ===');

      return result;
    } catch (err: any) {
      console.error('=== ERREUR IMPORT EXCEL ===');
      console.error('Erreur complète:', err);
      console.error('Message d\'erreur:', err.message);
      console.error('Stack trace:', err.stack);
      setError(err.message);
      console.error('Erreur lors de l\'import Excel:', err);
      throw err;
    } finally {
      setImportLoading(false);
    }
  };

  const importPdf = async (file: File, useClaudeVision: boolean = true) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setImportLoading(true);
      setError(null);

      console.log('=== DÉBUT IMPORT PDF ===');
      console.log('Fichier PDF à importer:', file.name, file.size, 'bytes');
      console.log('Méthode:', useClaudeVision ? 'Claude Vision' : 'Regex');

      const formData = new FormData();
      formData.append('pdf', file);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Session non valide');

      const functionName = useClaudeVision ? 'parse-pdf-claude' : 'parse-pdf-debit';
      console.log('Appel de la fonction Edge:', functionName);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: formData,
        }
      );

      console.log('Réponse reçue:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de la fonction Edge:', errorData);
        throw new Error(errorData.error || 'Erreur lors du traitement du fichier PDF');
      }

      const result = await response.json();
      console.log('Résultat de la fonction Edge:', result);

      if (!result.success) {
        console.error('Échec du traitement PDF:', result);
        throw new Error(result.error || 'Erreur lors du traitement du fichier PDF');
      }

      console.log('Import PDF réussi, sheet_id:', result.sheet_id);

      // Forcer un rechargement pour s'assurer que les données sont à jour (en mode silencieux)
      console.log('Rechargement des feuilles après import PDF...');
      await fetchSheets(true);
      console.log('Rechargement terminé');
      console.log('=== FIN IMPORT PDF ===');

      return result;
    } catch (err: any) {
      console.error('=== ERREUR IMPORT PDF ===');
      console.error('Erreur complète:', err);
      setError(err.message);
      throw err;
    } finally {
      setImportLoading(false);
    }
  };
  useEffect(() => {
    fetchSheets();

    // Configuration de la souscription Realtime
    if (user) {
      // Souscription aux changements sur la table debit_sheets
      const sheetsSubscription = supabase
        .channel('debit_sheets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'debit_sheets'
          },
          async (payload) => {
            // Ce log affichera TOUS les événements Realtime reçus pour debit_sheets
            console.log('Realtime event received for debit_sheets:', payload.eventType, payload);
            
            if (payload.eventType === 'INSERT') {
              console.log('=== DÉBUT TRAITEMENT INSERT SHEET ===');
              console.log('Realtime INSERT event received for sheet ID:', payload.new.id);
              console.log('Payload new data (from Realtime event):', payload.new);

              // Attendre un peu que les items soient insérés
              await new Promise(resolve => setTimeout(resolve, 500));
              console.log('Attempting to fetch full sheet after 500ms delay for ID:', payload.new.id);
              
              // Récupérer la nouvelle feuille avec ses items
              const { data: newSheetData, error } = await supabase
                .from('debit_sheets')
                .select(`
                  *,
                  debit_items (*)
                `)
                .eq('id', payload.new.id)
                .single();

              console.log('Fetched new sheet data from DB:', newSheetData);
              console.log('Fetch error (if any):', error);
              console.log('Number of items fetched with new sheet:', newSheetData?.debit_items?.length || 0);

              if (!error && newSheetData) {
                const formattedSheet: DebitSheet = {
                  id: newSheetData.id,
                  cial: newSheetData.cial,
                  numeroOS: newSheetData.numero_os,
                  nomClient: newSheetData.nom_client,
                  fourniture: newSheetData.fourniture,
                  epaisseur: newSheetData.epaisseur,
                  numeroARC: newSheetData.numero_arc,
                  dateArc: new Date(newSheetData.date_arc),
                  delai: newSheetData.delai,
                  m2: parseFloat(newSheetData.m2),
                  m3: parseFloat(newSheetData.m3),
                  fini: newSheetData.fini,
                  livre: newSheetData.livre,
                  dateCreation: new Date(newSheetData.date_creation),
                  dateFinition: newSheetData.date_finition ? new Date(newSheetData.date_finition) : undefined,
                  dateLivraison: newSheetData.date_livraison ? new Date(newSheetData.date_livraison) : undefined,
                  items: (newSheetData.debit_items || []).map((item: any) => {
                    const quantite = item.quantite || 1;
                    const subItemsTermine = item.sub_items_termine && Array.isArray(item.sub_items_termine)
                      ? item.sub_items_termine
                      : Array(quantite).fill(item.termine);
                    const subItemsPalettes = item.sub_items_palettes && Array.isArray(item.sub_items_palettes)
                      ? item.sub_items_palettes
                      : Array(quantite).fill(item.numero_palette || null);

                    return {
                      id: item.id,
                      description: item.description,
                      longueur: parseFloat(item.longueur),
                      largeur: parseFloat(item.largeur),
                      epaisseur: parseFloat(item.epaisseur),
                      quantite,
                      termine: item.termine,
                      numeroAppareil: item.numero_appareil || undefined,
                      matiereItem: item.matiere_item || undefined,
                      finition: item.finition || undefined,
                      m2Item: item.m2_item ? parseFloat(item.m2_item) : undefined,
                      m3Item: item.m3_item ? parseFloat(item.m3_item) : undefined,
                      numeroPalette: item.numero_palette || undefined,
                      subItemsTermine,
                      subItemsPalettes
                    };
                  })
                };

                console.log('Formatted sheet for state update:', formattedSheet);
                console.log('Number of items in formatted sheet:', formattedSheet.items?.length || 0);

                setSheets(prevSheets => {
                  console.log('Current prevSheets count before update:', prevSheets.length);
                  // Vérifier si la feuille existe déjà pour éviter les doublons
                  const existingSheet = prevSheets.find(sheet => sheet.id === formattedSheet.id);
                  if (existingSheet) {
                    console.log('Sheet already exists in state, skipping addition (to avoid duplicates).');
                    return prevSheets;
                  }
                  console.log('Adding new sheet to state via Realtime.');
                  return [formattedSheet, ...prevSheets];
                });
                console.log('setSheets call completed for INSERT event.');
              } else {
                console.error('Failed to fetch new sheet data or data is null/undefined after INSERT event.');
              }
              console.log('=== FIN TRAITEMENT CHANGEMENT SHEET (INSERT) ===');
            } else if (payload.eventType === 'UPDATE') {
              // Mettre à jour la feuille existante
              setSheets(prevSheets => 
                prevSheets.map(sheet => 
                  sheet.id === payload.new.id 
                    ? {
                        ...sheet,
                        cial: payload.new.cial,
                        numeroOS: payload.new.numero_os,
                        nomClient: payload.new.nom_client,
                        fourniture: payload.new.fourniture,
                        epaisseur: payload.new.epaisseur,
                        numeroARC: payload.new.numero_arc,
                        dateArc: new Date(payload.new.date_arc),
                        delai: payload.new.delai,
                        m2: parseFloat(payload.new.m2),
                        m3: parseFloat(payload.new.m3),
                        fini: payload.new.fini,
                        livre: payload.new.livre,
                        dateFinition: payload.new.date_finition ? new Date(payload.new.date_finition) : undefined,
                        dateLivraison: payload.new.date_livraison ? new Date(payload.new.date_livraison) : undefined,
                        blocTranche: payload.new.bloc_tranche || undefined,
                        refChantier: payload.new.ref_chantier || undefined,
                        devisNumero: payload.new.devis_numero || undefined,
                        machineId: payload.new.machine_id || undefined
                      }
                    : sheet
                )
              );
              console.log('setSheets appelé pour mettre à jour la feuille');
            } else if (payload.eventType === 'DELETE') {
              console.log('=== DÉBUT TRAITEMENT DELETE SHEET ===');
              console.log('Realtime DELETE event received for sheet ID:', payload.old.id);
              console.log('Payload old data:', payload.old);
              console.log('Current sheets count before delete:', sheets.length);

              // Supprimer la feuille de l'état local
              setSheets(prevSheets => {
                console.log('Previous sheets count:', prevSheets.length);
                console.log('Filtering out sheet with ID:', payload.old.id);
                const filteredSheets = prevSheets.filter(sheet => sheet.id !== payload.old.id);
                console.log('Filtered sheets count:', filteredSheets.length);
                return filteredSheets;
              });
              console.log('setSheets appelé pour supprimer la feuille');
              console.log('=== FIN TRAITEMENT DELETE SHEET ===');
            }
          }
        )
        .subscribe();

      // Souscription aux changements sur la table debit_items
      const itemsSubscription = supabase
        .channel('debit_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'debit_items'
          },
          async (payload) => {
            console.log('Changement détecté sur debit_items:', payload);
            
            if (payload.eventType === 'INSERT') {
              console.log('=== DÉBUT TRAITEMENT INSERT ITEM ===');
              console.log('Payload INSERT item reçu:', payload);
              console.log('Sheet ID de l\'item:', payload.new.sheet_id);
              console.log('État actuel des sheets avant ajout item:', sheets.map(s => ({ id: s.id, itemsCount: s.items.length })));
              
              const quantite = payload.new.quantite || 1;
              const subItemsTermine = payload.new.sub_items_termine && Array.isArray(payload.new.sub_items_termine)
                ? payload.new.sub_items_termine
                : Array(quantite).fill(payload.new.termine);
              const subItemsPalettes = payload.new.sub_items_palettes && Array.isArray(payload.new.sub_items_palettes)
                ? payload.new.sub_items_palettes
                : Array(quantite).fill(payload.new.numero_palette || null);

              setSheets(prevSheets =>
                prevSheets.map(sheet =>
                  sheet.id === payload.new.sheet_id
                    ? {
                        ...sheet,
                        items: [...sheet.items, {
                          id: payload.new.id,
                          description: payload.new.description,
                          longueur: parseFloat(payload.new.longueur),
                          largeur: parseFloat(payload.new.largeur),
                          epaisseur: parseFloat(payload.new.epaisseur),
                          quantite,
                          termine: payload.new.termine,
                          numeroAppareil: payload.new.numero_appareil || undefined,
                          matiereItem: payload.new.matiere_item || undefined,
                          finition: payload.new.finition || undefined,
                          m2Item: payload.new.m2_item ? parseFloat(payload.new.m2_item) : undefined,
                          m3Item: payload.new.m3_item ? parseFloat(payload.new.m3_item) : undefined,
                          numeroPalette: payload.new.numero_palette || undefined,
                          subItemsTermine,
                          subItemsPalettes
                        }]
                      }
                    : sheet
                )
              );
              
              console.log('État des feuilles mis à jour avec le nouvel item');
              console.log('=== FIN TRAITEMENT INSERT ITEM ===');
            } else if (payload.eventType === 'UPDATE') {
              console.log('=== DÉBUT TRAITEMENT UPDATE ITEM ===');
              console.log('Payload UPDATE item reçu:', payload);

              const quantiteUpdate = payload.new.quantite || 1;
              const subItemsTermineUpdate = payload.new.sub_items_termine && Array.isArray(payload.new.sub_items_termine)
                ? payload.new.sub_items_termine
                : Array(quantiteUpdate).fill(payload.new.termine);
              const subItemsPalettesUpdate = payload.new.sub_items_palettes && Array.isArray(payload.new.sub_items_palettes)
                ? payload.new.sub_items_palettes
                : Array(quantiteUpdate).fill(payload.new.numero_palette || null);

              setSheets(prevSheets =>
                prevSheets.map(sheet =>
                  sheet.id === payload.new.sheet_id
                    ? {
                        ...sheet,
                        items: sheet.items.map(item =>
                          item.id === payload.new.id
                            ? {
                                ...item,
                                description: payload.new.description,
                                longueur: parseFloat(payload.new.longueur),
                                largeur: parseFloat(payload.new.largeur),
                                epaisseur: parseFloat(payload.new.epaisseur),
                                quantite: quantiteUpdate,
                                termine: payload.new.termine,
                                numeroAppareil: payload.new.numero_appareil || undefined,
                                matiereItem: payload.new.matiere_item || undefined,
                                finition: payload.new.finition || undefined,
                                m2Item: payload.new.m2_item ? parseFloat(payload.new.m2_item) : undefined,
                                m3Item: payload.new.m3_item ? parseFloat(payload.new.m3_item) : undefined,
                                numeroPalette: payload.new.numero_palette || undefined,
                                subItemsTermine: subItemsTermineUpdate,
                                subItemsPalettes: subItemsPalettesUpdate
                              }
                            : item
                        )
                      }
                    : sheet
                )
              );
              console.log('setSheets appelé pour mettre à jour l\'item');
              console.log('=== FIN TRAITEMENT UPDATE ITEM ===');
            } else if (payload.eventType === 'DELETE') {
              console.log('=== DÉBUT TRAITEMENT DELETE ITEM ===');
              console.log('Payload DELETE item reçu:', payload);
              console.log('Item ID à supprimer:', payload.old.id);
              console.log('État actuel des sheets avant suppression item:', sheets.map(s => ({ id: s.id, itemsCount: s.items.length })));
              
              // Supprimer l'item de la feuille correspondante
              setSheets(prevSheets => 
                prevSheets.map(sheet => ({
                  ...sheet,
                  items: sheet.items.filter(item => item.id !== payload.old.id)
                }))
              );
              console.log('setSheets appelé pour supprimer l\'item');
              console.log('=== FIN TRAITEMENT DELETE ITEM ===');
            }
          }
        )
        .subscribe();

      // Fonction de nettoyage pour désabonner les souscriptions
      return () => {
        sheetsSubscription.unsubscribe();
        itemsSubscription.unsubscribe();
      };
    }
  }, [user]);
  return {
    sheets,
    loading,
    importLoading,
    error,
    updateSheet,
    addSheet,
    deleteSheet,
    importExcel,
    importPdf,
    refetch: fetchSheets
  };
}