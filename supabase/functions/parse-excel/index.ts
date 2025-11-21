/*
  # Parse Excel Function - Version Précise

  Cette fonction Edge analyse les fichiers Excel de feuilles de débit avec des références de cellules exactes :
  
  1. Informations principales (feuille "FICHE DEBIT DBPM")
     - Commercial : C2
     - Client : C3
     - Stock ou Commande EXT : C5
     - N°OS : G2 (incomplet, à compléter par l'utilisateur)
     - Chantier : G3
     - Date ARC, N°ARC, Délai : à compléter par l'utilisateur
  
  2. Éléments détaillés (à partir de la ligne 10)
     - N° Appareil : Colonne A (A10, A11, A12...)
     - Quantité : Colonne B (B10, B11, B12...)
     - Matière : Colonne C (C10, C11, C12...)
     - Finition : Colonne D (D10, D11, D12...)
     - Longueur : Colonne E (E10, E11, E12...)
     - Largeur : Colonne F (F10, F11, F12...)
     - Epaisseur : Colonne G (G10, G11, G12...)
     - Surface m2 : Colonne M (M10, M11, M12...)
     - Volume m3 : Colonne N (N10, N11, N12...)
  
  3. Sécurité
     - Authentification requise
     - Insertion sécurisée en base de données
*/

// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ParsedSheet {
  // Informations principales
  cial: string;
  nomClient: string;
  numeroOS: string;
  refChantier?: string;
  // Champs à compléter par l'utilisateur
  dateArc: string;
  numeroARC: string;
  delai: string;
  fourniture: string;
  epaisseur: string;
  devisNumero?: string;
  blocTranche?: string;
  // Totaux calculés
  m2: number;
  m3: number;
  // Éléments détaillés
  items: ParsedItem[];
}

interface ParsedItem {
  numeroAppareil?: string;
  description: string;
  quantite: number;
  matiereItem?: string;
  finition?: string;
  longueur: number;
  largeur: number;
  epaisseur: number;
  m2Item?: number;
  m3Item?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('=== DÉBUT PARSING EXCEL PRÉCIS ===');
    
    // Vérification de l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant');
    }

    // Initialisation du client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérification de l'utilisateur
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    console.log('Utilisateur authentifié:', user.id);

    // Récupération du fichier Excel
    const formData = await req.formData();
    const file = formData.get('excel') as File;
    
    if (!file) {
      throw new Error('Aucun fichier Excel fourni');
    }

    console.log('Fichier reçu:', file.name, file.size, 'bytes');

    // Lecture du fichier Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('Feuilles disponibles:', workbook.SheetNames);

    // Recherche de la feuille "FICHE DEBIT DBPM" UNIQUEMENT
    const targetSheetName = 'FICHE DEBIT DBPM';
    if (!workbook.SheetNames.includes(targetSheetName)) {
      throw new Error(`Feuille "${targetSheetName}" non trouvée. Feuilles disponibles: ${workbook.SheetNames.join(', ')}`);
    }

    console.log('Feuille cible trouvée:', targetSheetName);

    const worksheet = workbook.Sheets[targetSheetName];
    
    // Parsing des données avec références de cellules exactes
    const parsedData = parseExcelDataPrecise(worksheet);
    
    console.log('Données parsées:', {
      cial: parsedData.cial,
      nomClient: parsedData.nomClient,
      numeroOS: parsedData.numeroOS,
      refChantier: parsedData.refChantier,
      itemsCount: parsedData.items.length,
      totalM2: parsedData.m2,
      totalM3: parsedData.m3
    });

    // Insertion en base de données
    const result = await insertDataToSupabase(supabase, user.id, parsedData);
    
    console.log('=== FIN PARSING EXCEL PRÉCIS ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fichier Excel analysé avec succès',
        sheet_id: result.sheetId,
        items_count: parsedData.items.length,
        total_m2: parsedData.m2,
        total_m3: parsedData.m3,
        extracted_data: {
          commercial: parsedData.cial,
          client: parsedData.nomClient,
            numero_os: parsedData.numeroOS,
          chantier: parsedData.refChantier
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Erreur lors du parsing Excel:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur inconnue lors du parsing'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

function parseExcelDataPrecise(worksheet: any): ParsedSheet {
  console.log('Début du parsing avec références de cellules exactes...');
  
  // Fonction utilitaire pour lire une cellule spécifique
  function getCellValue(cellRef: string): string {
    const cell = worksheet[cellRef];
    if (!cell) {
      console.log(`Cellule ${cellRef} vide ou inexistante`);
      return '';
    }
    const value = String(cell.v || '').trim();
    console.log(`Cellule ${cellRef}: "${value}"`);
    return value;
  }

  // Fonction utilitaire pour lire une cellule avec sa valeur formatée (comme affichée dans Excel)
  function getCellFormattedValue(cellRef: string): string {
    const cell = worksheet[cellRef];
    if (!cell) {
      console.log(`Cellule ${cellRef} vide ou inexistante`);
      return '';
    }
    // Utiliser la valeur formatée (.w) si disponible, sinon la valeur brute (.v)
    const value = String(cell.w || cell.v || '').trim();
    console.log(`Cellule ${cellRef} (formatée): "${value}"`);
    return value;
  }
  
  // Fonction utilitaire pour convertir un nombre avec gestion des erreurs
  function parseNumber(value: string): number {
    if (!value) return 0;
    // Nettoyer la valeur : supprimer les espaces, remplacer virgule par point, supprimer les unités
    const cleaned = value.replace(/\s+/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Extraction des informations principales avec cellules exactes
  console.log('=== EXTRACTION INFORMATIONS PRINCIPALES ===');
  const cial = getCellValue('C2');
  const nomClient = getCellValue('C3');
  const numeroOS = getCellValue('G2');
  const refChantier = getCellValue('G3');

  console.log('Informations principales extraites:', {
    cial,
    nomClient,
    numeroOS,
    refChantier
  });

  // Extraction des éléments détaillés à partir de la ligne 10
  console.log('=== EXTRACTION ÉLÉMENTS DÉTAILLÉS ===');
  const items: ParsedItem[] = [];
  let currentRow = 10; // Commencer à la ligne 10

  // Parcourir les lignes jusqu'à trouver une ligne complètement vide
  while (currentRow <= 100) { // Limite de sécurité à 100 lignes
    const numeroAppareil = getCellValue(`A${currentRow}`);
    const quantiteStr = getCellValue(`B${currentRow}`);
    const matiereItem = getCellValue(`C${currentRow}`);
    const finition = getCellValue(`D${currentRow}`);
    const longueurStr = getCellValue(`E${currentRow}`);
    const largeurStr = getCellValue(`F${currentRow}`);
    const epaisseurStr = getCellValue(`G${currentRow}`);
    const m2ItemStr = getCellFormattedValue(`M${currentRow}`);
    const m3ItemStr = getCellFormattedValue(`N${currentRow}`);

    // Vérifier si la ligne est complètement vide
    if (!numeroAppareil && !quantiteStr && !matiereItem && !finition && 
        !longueurStr && !largeurStr && !epaisseurStr && !m2ItemStr && !m3ItemStr) {
      console.log(`Ligne ${currentRow}: complètement vide, arrêt du parsing`);
      break;
    }

    // Conversion des valeurs numériques
    const quantite = parseNumber(quantiteStr);
    const longueur = parseNumber(longueurStr);
    const largeur = parseNumber(largeurStr);
    const epaisseur = parseNumber(epaisseurStr);
    const m2Item = parseNumber(m2ItemStr);
    const m3Item = parseNumber(m3ItemStr);

    console.log(`Ligne ${currentRow}: App="${numeroAppareil}", Qté=${quantite}, Mat="${matiereItem}", Fin="${finition}", L=${longueur}, l=${largeur}, e=${epaisseur}, M²=${m2Item}, M³=${m3Item}`);

    // *** LOGIQUE DE VALIDATION ULTRA-STRICTE ***
    // Une ligne est valide UNIQUEMENT si elle remplit TOUTES ces conditions :
    
    // 1. DOIT avoir des données descriptives (au moins un champ non vide)
    const hasDescriptiveData = !!(numeroAppareil || matiereItem || finition);
    
    // 2. DOIT avoir des dimensions physiques (au moins une valeur > 0)
    const hasPhysicalDimensions = quantite > 0 || longueur > 0 || largeur > 0 || epaisseur > 0;
    
    // 3. NE DOIT PAS contenir de mots-clés de total/résumé
    const containsTotalKeywords = (
      numeroAppareil.toLowerCase().includes('total') ||
      numeroAppareil.toLowerCase().includes('somme') ||
      numeroAppareil.toLowerCase().includes('appareil total') ||
      matiereItem.toLowerCase().includes('total') ||
      matiereItem.toLowerCase().includes('somme') ||
      finition.toLowerCase().includes('total') ||
      finition.toLowerCase().includes('somme')
    );
    
    // VALIDATION COMBINÉE : TOUTES les conditions doivent être vraies
    const isValidItem = hasDescriptiveData && hasPhysicalDimensions && !containsTotalKeywords;
    
    if (!isValidItem) {
      console.log(`Ligne ${currentRow}: REJETÉE - Descriptif:${hasDescriptiveData}, Dimensions:${hasPhysicalDimensions}, PasTotal:${!containsTotalKeywords}`);
      currentRow++;
      continue;
    }

    // Création de la description pour les lignes VALIDÉES uniquement
    let description = '';
    if (matiereItem) description += matiereItem;
    if (finition) description += (description ? ' - ' : '') + finition;
    if (!description && numeroAppareil) description = `Appareil ${numeroAppareil}`;
    // Plus de "Élément ligne X" générique !

    console.log(`Ligne ${currentRow} ACCEPTÉE: "${description}" - M²:${m2Item}, M³:${m3Item}`);

    // *** CALCUL M²/M³ BASÉ SUR L'ÉPAISSEUR ***
    // Règle métier : < 8cm = M² uniquement, >= 8cm = M³ uniquement
    let calculatedM2 = 0;
    let calculatedM3 = 0;
    
    if (epaisseur < 8) {
      // Épaisseur < 8cm : calcul M² uniquement
      calculatedM2 = (longueur * largeur * quantite) / 10000; // cm² vers m²
      calculatedM3 = 0;
      console.log(`Élément "${description}": épaisseur ${epaisseur}cm < 8cm → M² = ${calculatedM2.toFixed(3)}, M³ = 0`);
    } else {
      // Épaisseur >= 8cm : calcul M³ uniquement
      calculatedM2 = 0;
      calculatedM3 = (longueur * largeur * epaisseur * quantite) / 1000000; // cm³ vers m³
      console.log(`Élément "${description}": épaisseur ${epaisseur}cm >= 8cm → M² = 0, M³ = ${calculatedM3.toFixed(3)}`);
    }

    const item: ParsedItem = {
      numeroAppareil: numeroAppareil || undefined,
      description,
      quantite: quantite || 1, // Quantité par défaut à 1 si 0
      matiereItem: matiereItem || undefined,
      finition: finition || undefined,
      longueur,
      largeur,
      epaisseur,
      m2Item: calculatedM2, // Calculé selon la règle d'épaisseur
      m3Item: calculatedM3  // Calculé selon la règle d'épaisseur
    };

    items.push(item);
    currentRow++;
  }

  console.log(`${items.length} éléments VALIDES extraits (lignes vides et totaux éliminés)`);

  // Déduction de la fourniture et épaisseur à partir des éléments
  console.log('=== DÉDUCTION FOURNITURE ET ÉPAISSEUR À PARTIR DES ÉLÉMENTS ===');
  
  // Collecte des matières uniques
  const uniqueMaterials = new Set<string>();
  items.forEach(item => {
    if (item.matiereItem && item.matiereItem.trim()) {
      uniqueMaterials.add(item.matiereItem.trim());
    }
  });
  
  // Déduction de la fourniture
  let deducedFourniture = '';
  if (uniqueMaterials.size === 0) {
    deducedFourniture = '';
    console.log('Aucune matière trouvée dans les éléments');
  } else if (uniqueMaterials.size === 1) {
    deducedFourniture = Array.from(uniqueMaterials)[0];
    console.log(`Fourniture déduite (matière unique): "${deducedFourniture}"`);
  } else {
    deducedFourniture = 'Divers';
    console.log(`Fourniture déduite (${uniqueMaterials.size} matières différentes): "Divers"`);
    console.log('Matières trouvées:', Array.from(uniqueMaterials));
  }
  
  // Collecte des épaisseurs uniques (en cm)
  const uniqueThicknesses = new Set<number>();
  items.forEach(item => {
    if (item.epaisseur && item.epaisseur > 0) {
      uniqueThicknesses.add(item.epaisseur);
    }
  });
  
  // Déduction de l'épaisseur
  let deducedEpaisseur = '';
  if (uniqueThicknesses.size === 0) {
    deducedEpaisseur = '';
    console.log('Aucune épaisseur trouvée dans les éléments');
  } else if (uniqueThicknesses.size === 1) {
    const thickness = Array.from(uniqueThicknesses)[0];
    deducedEpaisseur = `${thickness}cm`;
    console.log(`Épaisseur déduite (épaisseur unique): "${deducedEpaisseur}"`);
  } else if (uniqueThicknesses.size <= 3) {
    const sortedThicknesses = Array.from(uniqueThicknesses).sort((a, b) => a - b);
    deducedEpaisseur = sortedThicknesses.map(t => `${t}cm`).join(', ');
    console.log(`Épaisseur déduite (${uniqueThicknesses.size} épaisseurs): "${deducedEpaisseur}"`);
  } else {
    deducedEpaisseur = 'Divers';
    console.log(`Épaisseur déduite (${uniqueThicknesses.size} épaisseurs différentes): "Divers"`);
    console.log('Épaisseurs trouvées:', Array.from(uniqueThicknesses).sort((a, b) => a - b).map(t => `${t}cm`));
  }
  
  console.log('=== FIN DÉDUCTION ===');

  // Calcul des totaux basé sur la règle d'épaisseur
  console.log('=== CALCUL DES TOTAUX M²/M³ SELON RÈGLE D\'ÉPAISSEUR ===');
  const totalM2 = items.reduce((sum, item) => {
    return sum + (item.m2Item || 0); // Somme des M² calculés selon épaisseur
  }, 0);

  const totalM3 = items.reduce((sum, item) => {
    return sum + (item.m3Item || 0); // Somme des M³ calculés selon épaisseur
  }, 0);

  console.log('Totaux calculés selon règle d\'épaisseur - M²:', totalM2.toFixed(3), 'M³:', totalM3.toFixed(3));
  console.log('Détail des calculs par item:');
  items.forEach((item, index) => {
    console.log(`  Item ${index + 1}: "${item.description}" - Ép:${item.epaisseur}cm → M²:${item.m2Item?.toFixed(3) || 0}, M³:${item.m3Item?.toFixed(3) || 0}`);
  });

  return {
    cial: cial || 'Non spécifié',
    nomClient: nomClient || 'Non spécifié',
    numeroOS: numeroOS || '', // Incomplet, à compléter par l'utilisateur
    refChantier: refChantier || undefined,
    // Champs à compléter par l'utilisateur
    dateArc: '', // À compléter par l'utilisateur
    numeroARC: '', // À compléter par l'utilisateur
    delai: '', // À compléter par l'utilisateur
    fourniture: deducedFourniture, // Déduit des éléments
    epaisseur: deducedEpaisseur, // Déduit des éléments
    devisNumero: undefined,
    blocTranche: undefined,
    m2: totalM2,
    m3: totalM3,
    items
  };
}

async function insertDataToSupabase(supabase: any, userId: string, parsedData: ParsedSheet) {
  console.log('Insertion des données en base...');
  
  try {
    // Insertion de la feuille de débit
    const { data: sheetData, error: sheetError } = await supabase
      .from('debit_sheets')
      .insert({
        user_id: userId,
        cial: parsedData.cial,
        numero_os: parsedData.numeroOS, // Peut être incomplet
        nom_client: parsedData.nomClient,
        fourniture: parsedData.fourniture, // Vide, à compléter par l'utilisateur
        epaisseur: parsedData.epaisseur, // Vide, à compléter par l'utilisateur
        numero_arc: parsedData.numeroARC, // Vide, à compléter par l'utilisateur
        date_arc: parsedData.dateArc || new Date().toISOString().split('T')[0], // Date par défaut si vide
        delai: parsedData.delai, // Vide, à compléter par l'utilisateur
        m2: parsedData.m2,
        m3: parsedData.m3,
        fini: false,
        livre: false,
        date_creation: new Date().toISOString().split('T')[0],
        bloc_tranche: parsedData.blocTranche,
        ref_chantier: parsedData.refChantier,
        devis_numero: parsedData.devisNumero
      })
      .select()
      .single();

    if (sheetError) {
      console.error('Erreur insertion feuille:', sheetError);
      throw sheetError;
    }

    console.log('Feuille insérée avec ID:', sheetData.id);

    // Insertion des éléments
    if (parsedData.items.length > 0) {
      const itemsToInsert = parsedData.items.map(item => ({
        sheet_id: sheetData.id,
        description: item.description,
        longueur: item.longueur,
        largeur: item.largeur,
        epaisseur: item.epaisseur,
        quantite: item.quantite,
        termine: false,
        numero_appareil: item.numeroAppareil,
        matiere_item: item.matiereItem,
        finition: item.finition,
        m2_item: item.m2Item,
        m3_item: item.m3Item
      }));

      const { error: itemsError } = await supabase
        .from('debit_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Erreur insertion éléments:', itemsError);
        throw itemsError;
      }

      console.log(`${parsedData.items.length} éléments insérés`);
    }

    return { sheetId: sheetData.id };

  } catch (error) {
    console.error('Erreur lors de l\'insertion:', error);
    throw error;
  }
}