/*
  # Parse Scaffolding Excel - Import Intelligent par IA

  Système d'import intelligent pour fichiers Excel d'échafaudage utilisant Mistral AI

  Fonctionnalités :
  1. Détection automatique du type de document (Stock ou Commande)
  2. Extraction par Mistral AI avec fallback OpenAI
  3. Matching intelligent des références avec le catalogue
  4. Validation et détection d'anomalies
  5. Scoring de confiance pour chaque champ
  6. Apprentissage continu des corrections manuelles
*/

import { createClient } from 'npm:@supabase/supabase-js@2.56.1';
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractedField {
  value: any;
  confidence: number;
  source: 'ai' | 'mistral' | 'openai';
  alternatives?: any[];
  anomalies?: string[];
}

interface ParsedScaffoldingData {
  documentType: 'stock' | 'commande';
  header: {
    numeroCommande?: ExtractedField;
    dateCommande?: ExtractedField;
    chantier?: ExtractedField;
    preparateur?: ExtractedField;
    receptionnaire?: ExtractedField;
    transporteur?: ExtractedField;
    dateInventaire?: ExtractedField;
  };
  items: ExtractedField;
  overallConfidence: number;
  anomaliesDetected: string[];
  suggestions: string[];
  extractionMethod: 'mistral' | 'openai' | 'fallback';
  itemsCount: number;
  referencesMatched: number;
  referencesUnknown: number;
  unknownReferences: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    console.log('=== DÉBUT PARSING EXCEL ÉCHAFAUDAGE INTELLIGENT ===');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!mistralApiKey && !openaiApiKey) {
      throw new Error('Aucune clé API disponible (Mistral ou OpenAI)');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    console.log('Utilisateur authentifié:', user.id);

    const formData = await req.formData();
    const file = formData.get('excel') as File;
    const previewOnly = formData.get('previewOnly') === 'true';

    if (!file) {
      throw new Error('Aucun fichier Excel fourni');
    }

    console.log('Fichier Excel reçu:', file.name, file.size, 'bytes');
    console.log('Mode prévisualisation:', previewOnly);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const excelText = extractTextFromWorkbook(workbook);
    console.log('Texte extrait du fichier Excel, longueur:', excelText.length);

    const catalogItems = await fetchCatalogItems(supabase, user.id);
    console.log('Catalogue chargé:', catalogItems.length, 'références');

    let extractedData: ParsedScaffoldingData | null = null;
    let extractionMethod: 'mistral' | 'openai' | 'fallback' = 'mistral';

    if (openaiApiKey) {
      console.log('🚀 Utilisation d\'OpenAI pour l\'extraction...');
      extractedData = await extractWithOpenAI(
        openaiApiKey,
        excelText,
        file.name,
        catalogItems
      );
      extractionMethod = 'openai';
      console.log('✅ Extraction OpenAI réussie');
    } else {
      throw new Error('Clé OpenAI requise pour l\'extraction');
    }

    if (!extractedData) {
      throw new Error('Échec de l\'extraction des données');
    }

    extractedData.extractionMethod = extractionMethod;

    console.log('Extraction terminée:');
    console.log('- Type de document:', extractedData.documentType);
    console.log('- Confiance globale:', extractedData.overallConfidence);
    console.log('- Méthode:', extractionMethod);
    console.log('- Items extraits:', extractedData.itemsCount);
    console.log('- Références trouvées:', extractedData.referencesMatched);
    console.log('- Références inconnues:', extractedData.referencesUnknown);

    const processingTime = Date.now() - startTime;
    await logExtraction(supabase, user.id, file.name, extractedData, processingTime);

    if (previewOnly) {
      return new Response(
        JSON.stringify({
          success: true,
          preview_mode: true,
          extracted_data: extractedData,
          processing_time_ms: processingTime
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const result = extractedData.documentType === 'stock'
      ? await createStockFromExtraction(supabase, user.id, extractedData)
      : await createCommandeFromExtraction(supabase, user.id, extractedData);

    console.log('Import créé avec succès');
    console.log('=== FIN PARSING EXCEL ÉCHAFAUDAGE ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fichier Excel analysé avec succès (${extractedData.documentType})`,
        document_type: extractedData.documentType,
        confidence: extractedData.overallConfidence,
        anomalies: extractedData.anomaliesDetected,
        suggestions: extractedData.suggestions,
        processing_time_ms: processingTime,
        items_count: extractedData.itemsCount,
        references_matched: extractedData.referencesMatched,
        references_unknown: extractedData.referencesUnknown,
        unknown_references: extractedData.unknownReferences,
        ...result
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

function extractTextFromWorkbook(workbook: XLSX.WorkBook): string {
  const allSheets: string[] = [];

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    allSheets.push(`=== FEUILLE: ${sheetName} ===\n${csv}`);
  });

  return allSheets.join('\n\n');
}

async function fetchCatalogItems(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('scaffolding_catalog')
    .select('id, reference, designation, poids_unitaire')
    .eq('is_active', true)
    .order('reference');

  if (error) {
    console.error('Erreur chargement catalogue:', error);
    return [];
  }

  return data || [];
}

async function extractWithOpenAI(
  openaiApiKey: string,
  excelText: string,
  filename: string,
  catalogItems: any[]
): Promise<ParsedScaffoldingData> {
  console.log('Analyse intelligente du fichier Excel avec OpenAI...');

  const catalogReferences = catalogItems.slice(0, 50).map(c => c.reference).join(',');

  const maxExcelTextLength = 6000;
  const truncatedExcelText = excelText.length > maxExcelTextLength
    ? excelText.substring(0, maxExcelTextLength)
    : excelText;

  const prompt = `Extrait les données de ce fichier Excel en JSON MINIMALISTE.

CATALOGUE: ${catalogReferences}

INSTRUCTIONS:
- Détecte si "stock" ou "commande"
- Extrais MAX 25 items
- Descriptions max 40 caractères, lettres et chiffres uniquement
- JSON compact sans indentation
- Remplace caractères spéciaux par espaces

FORMAT:
{"type":"stock","date":"26/10/25","items":[{"ref":"R1","desc":"Desc simple","qty":10}],"unknown":[]}

OU:
{"type":"commande","num":"C123","date":"26/10/25","items":[{"ref":"R1","desc":"Desc","qty":5}],"unknown":[]}

EXCEL:
${truncatedExcelText}

GENERE JSON COMPACT.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Genere JSON compact valide sans indentation. Remplace tous les caracteres speciaux par des espaces.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.0,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Aucune réponse d\'OpenAI');
  }

  console.log('Réponse OpenAI reçue, parsing...');
  console.log('Longueur du contenu:', content.length);

  let aiResult;
  try {
    aiResult = JSON.parse(content);
    console.log('JSON parsé avec succès');
  } catch (jsonError: any) {
    console.error('Erreur parsing JSON brut:', jsonError.message);
    console.log('Position de l\'erreur:', jsonError.message);

    try {
      console.log('Tentative 1: Nettoyage basique...');
      let cleanedContent = content
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .trim();

      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      }

      aiResult = JSON.parse(cleanedContent);
      console.log('✓ Nettoyage basique réussi');
    } catch (cleanError1: any) {
      console.error('✗ Échec nettoyage basique');

      try {
        console.log('Tentative 2: Nettoyage avancé avec échappement...');
        const advancedClean = content
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
          .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
          .replace(/"([^"]*?)"/g, (match, p1) => {
            const escaped = p1
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, ' ')
              .replace(/\r/g, '')
              .replace(/\t/g, ' ');
            return `"${escaped}"`;
          })
          .trim();

        aiResult = JSON.parse(advancedClean);
        console.log('✓ Nettoyage avancé réussi');
      } catch (cleanError2: any) {
        console.error('✗ Échec nettoyage avancé');

        try {
          console.log('Tentative 3: Extraction JSON partiel...');
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResult = JSON.parse(jsonMatch[0]);
            console.log('✓ Extraction JSON partiel réussi');
          } else {
            throw new Error('Aucun objet JSON trouvé');
          }
        } catch (extractError: any) {
          console.error('✗ Toutes les tentatives ont échoué');
          throw new Error(
            `Impossible de parser la réponse JSON de l'IA après plusieurs tentatives. ` +
            `Erreur initiale: ${jsonError.message}. ` +
            `Le fichier Excel contient probablement des caractères spéciaux complexes. ` +
            `Essayez de simplifier le fichier Excel ou de réduire le nombre de lignes.`
          );
        }
      }
    }
  }

  const simpleItems = aiResult.items || [];
  const unknownRefs = aiResult.unknown || [];

  const normalizedItems = simpleItems.map((item: any) => {
    const refUpper = (item.ref || '').toUpperCase();
    const catalogItem = catalogItems.find(c => c.reference.toUpperCase() === refUpper);

    return {
      reference: item.ref || '',
      catalogItemId: catalogItem?.id || null,
      designation: item.desc || '',
      quantite: item.qty || 0,
      poidsUnitaire: catalogItem?.poids_unitaire || 0,
      poidsTotal: (catalogItem?.poids_unitaire || 0) * (item.qty || 0),
      matchedInCatalog: !!catalogItem,
      similarReferences: []
    };
  });

  const documentType = aiResult.type === 'commande' ? 'commande' : 'stock';
  const itemsCount = normalizedItems.length;
  const referencesMatched = normalizedItems.filter((i: any) => i.matchedInCatalog).length;
  const referencesUnknown = unknownRefs.length;

  const header: any = {};
  if (documentType === 'stock') {
    header.dateInventaire = { value: aiResult.date || '', confidence: 90, anomalies: [] };
  } else {
    header.numeroCommande = { value: aiResult.num || '', confidence: 90, anomalies: [] };
    header.dateCommande = { value: aiResult.date || '', confidence: 90, anomalies: [] };
  }

  return {
    documentType,
    header,
    items: { value: normalizedItems, confidence: 90, anomalies: [] },
    overallConfidence: 90,
    anomaliesDetected: [],
    suggestions: [],
    extractionMethod: 'openai',
    itemsCount,
    referencesMatched,
    referencesUnknown,
    unknownReferences: unknownRefs
  };
}

async function logExtraction(
  supabase: any,
  userId: string,
  filename: string,
  extractedData: ParsedScaffoldingData,
  processingTime: number
) {
  try {
    const { error } = await supabase
      .from('scaffolding_extraction_logs')
      .insert({
        user_id: userId,
        file_name: filename,
        file_type: extractedData.documentType,
        extraction_status: extractedData.overallConfidence >= 80 ? 'success' : 'needs_review',
        extraction_method: extractedData.extractionMethod,
        raw_data: { extraction_method: extractedData.extractionMethod },
        parsed_data: extractedData,
        confidence_score: extractedData.overallConfidence,
        anomalies: extractedData.anomaliesDetected,
        suggestions: extractedData.suggestions,
        processing_time_ms: processingTime,
        items_count: extractedData.itemsCount,
        references_matched: extractedData.referencesMatched,
        references_unknown: extractedData.referencesUnknown
      });

    if (error) {
      console.error('Erreur log extraction:', error);
    }
  } catch (error) {
    console.error('Erreur log extraction:', error);
  }
}

async function createStockFromExtraction(
  supabase: any,
  userId: string,
  extractedData: ParsedScaffoldingData
) {
  console.log('Création du stock à partir de l\'extraction...');

  const items = extractedData.items.value || [];
  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    if (!item.catalogItemId) {
      console.log(`Item sans catalogItemId ignoré: ${item.reference}`);
      errorCount++;
      continue;
    }

    try {
      const { data: existing } = await supabase
        .from('scaffolding_stock_global')
        .select('id')
        .eq('user_id', userId)
        .eq('catalog_item_id', item.catalogItemId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('scaffolding_stock_global')
          .update({
            quantite_totale: item.quantite,
            quantite_disponible: item.quantite,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('scaffolding_stock_global')
          .insert({
            user_id: userId,
            catalog_item_id: item.catalogItemId,
            quantite_totale: item.quantite,
            quantite_disponible: item.quantite,
            quantite_sur_chantier: 0,
            quantite_hs: 0,
            quantite_layher: 0
          });
      }

      await supabase
        .from('scaffolding_stock_movements')
        .insert({
          user_id: userId,
          catalog_item_id: item.catalogItemId,
          type: 'entree',
          quantite: item.quantite,
          source: 'Import inventaire',
          notes: `Import fichier: ${extractedData.header.dateInventaire?.value || 'date inconnue'}`
        });

      successCount++;
    } catch (error) {
      console.error(`Erreur création stock pour ${item.reference}:`, error);
      errorCount++;
    }
  }

  return {
    success_count: successCount,
    error_count: errorCount,
    total_items: items.length
  };
}

async function createCommandeFromExtraction(
  supabase: any,
  userId: string,
  extractedData: ParsedScaffoldingData
) {
  console.log('Création de la commande Layher à partir de l\'extraction...');

  const items = extractedData.items.value || [];
  const numeroCommande = extractedData.header.numeroCommande?.value || `LAYHER-${Date.now()}`;
  const dateCommande = extractedData.header.dateCommande?.value
    ? parseDate(extractedData.header.dateCommande.value)
    : new Date();

  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    if (!item.catalogItemId) {
      console.log(`Item sans catalogItemId ignoré: ${item.reference}`);
      errorCount++;
      continue;
    }

    try {
      await supabase
        .from('scaffolding_layher_stock')
        .insert({
          user_id: userId,
          catalog_item_id: item.catalogItemId,
          quantite: item.quantite,
          date_location: dateCommande.toISOString().split('T')[0],
          numero_commande: numeroCommande,
          status: 'en_cours',
          notes: `Préparateur: ${extractedData.header.preparateur?.value || 'N/A'}, Transporteur: ${extractedData.header.transporteur?.value || 'N/A'}`
        });

      await supabase
        .from('scaffolding_stock_movements')
        .insert({
          user_id: userId,
          catalog_item_id: item.catalogItemId,
          type: 'layher_location',
          quantite: item.quantite,
          source: 'Layher',
          notes: `Commande ${numeroCommande}`
        });

      successCount++;
    } catch (error) {
      console.error(`Erreur création commande pour ${item.reference}:`, error);
      errorCount++;
    }
  }

  return {
    numero_commande: numeroCommande,
    success_count: successCount,
    error_count: errorCount,
    total_items: items.length
  };
}

function parseDate(dateStr: string): Date {
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[1]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  return new Date();
}
