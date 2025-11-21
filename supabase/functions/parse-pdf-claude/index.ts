import { createClient } from 'npm:@supabase/supabase-js@2.56.1';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DebitItem {
  item: string;
  materiaux: string;
  finition: string;
  longueur: number;
  largeur: number;
  epaisseur: number;
  quantite: number;
  qte: number;
  m2Item: number | null;
  m3Item: number | null;
  chant?: string;
  croquis?: string;
  confidence?: number;
}

interface ExtractedData {
  numeroOS: string;
  numeroARC: string;
  dateArc: string;
  delai: string;
  poids: string;
  client: string;
  chantier: string;
  commercial: string;
  items: DebitItem[];
  totalM2: number;
  totalM3: number;
  cumulQte: number;
  confidence: number;
  warnings: string[];
}

interface LogEntry {
  timestamp: string;
  step: string;
  status: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  error?: string;
  duration_ms?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const logs: LogEntry[] = [];
  const startTime = Date.now();

  function log(step: string, status: 'info' | 'success' | 'warning' | 'error', data?: any, error?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      step,
      status,
      data,
      error,
      duration_ms: Date.now() - startTime
    };
    logs.push(entry);
    console.log(`[${status.toUpperCase()}] ${step}`, data || error || '');
  }

  try {
    log('initialization', 'info', { message: 'Starting Claude PDF extraction' });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    log('auth_check', 'success', { user_id: user.id });

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Clé API Anthropic manquante. Configurez ANTHROPIC_API_KEY dans les secrets Supabase.');
    }

    log('config_check', 'success', { api_configured: true });

    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      throw new Error('Aucun fichier PDF fourni');
    }

    log('file_received', 'info', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Pdf = btoa(String.fromCharCode(...uint8Array));

    log('pdf_encoded', 'success', {
      base64_length: base64Pdf.length,
      sample: base64Pdf.substring(0, 100)
    });

    const extractedData = await extractWithClaudeVision(
      anthropicApiKey,
      base64Pdf,
      file.name,
      logs,
      log
    );

    log('extraction_complete', 'success', {
      items_count: extractedData.items.length,
      confidence: extractedData.confidence
    });

    const sheetId = await saveToDatabase(supabase, user.id, extractedData, file.name);

    await saveExtractionLogs(supabase, user.id, file.name, logs, extractedData, base64Pdf);

    log('database_save', 'success', { sheet_id: sheetId });

    return new Response(
      JSON.stringify({
        success: true,
        sheet_id: sheetId,
        items_count: extractedData.items.length,
        total_m2: extractedData.totalM2,
        total_m3: extractedData.totalM3,
        confidence: extractedData.confidence,
        warnings: extractedData.warnings,
        processing_time_ms: Date.now() - startTime,
        extracted_data: {
          commercial: extractedData.commercial,
          client: extractedData.client,
          numero_os: extractedData.numeroOS,
          numero_arc: extractedData.numeroARC,
          date_arc: extractedData.dateArc,
          delai: extractedData.delai,
          chantier: extractedData.chantier,
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
    log('fatal_error', 'error', null, error.message);
    console.error('❌ Fatal Error:', error);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors du traitement du PDF avec Claude'
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

async function extractWithClaudeVision(
  apiKey: string,
  base64Pdf: string,
  filename: string,
  logs: LogEntry[],
  log: Function
): Promise<ExtractedData> {

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildExtractionPrompt();

  let lastError: Error | null = null;
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 4000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      log('claude_attempt', 'info', {
        attempt: attempt + 1,
        max_retries: maxRetries
      });

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      log('claude_response_received', 'success', {
        attempt: attempt + 1,
        stop_reason: message.stop_reason,
        usage: message.usage
      });

      const responseText = message.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      log('claude_raw_response', 'info', {
        response_length: responseText.length,
        sample: responseText.substring(0, 500)
      });

      const extractedData = parseClaudeResponse(responseText, log);

      validateExtractedData(extractedData, log);

      log('extraction_validated', 'success', {
        items_extracted: extractedData.items.length,
        confidence: extractedData.confidence
      });

      return extractedData;

    } catch (error) {
      lastError = error;
      log('claude_attempt_failed', 'error', {
        attempt: attempt + 1,
        error_type: error.constructor.name,
        error_message: error.message
      }, error.message);

      if (attempt < maxRetries - 1) {
        const delay = retryDelays[attempt];
        log('retry_backoff', 'warning', { delay_ms: delay });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Échec après ${maxRetries} tentatives: ${lastError?.message}`);
}

function buildExtractionPrompt(): string {
  return `Tu es un expert en extraction de données de feuilles de débit de marbrerie. Analyse ce PDF et extrait TOUTES les données dans un format JSON structuré.

IMPORTANT: Ce document est une feuille de débit professionnelle avec:
- Un en-tête contenant les informations du client et de la commande
- Un tableau détaillé avec les items à découper

## STRUCTURE JSON ATTENDUE:

\`\`\`json
{
  "numeroOS": "2025FO188",
  "numeroARC": "11742",
  "dateArc": "16/01/2025",
  "delai": "08/08/2025",
  "poids": "0.007",
  "cumulQte": "0.119",
  "client": "AROD ASSAINISSEMENTS ROUTES OUVRAGES TP",
  "chantier": "COMPLEMENT PLAN VASQUE BAMBOO",
  "commercial": "AMIC",
  "items": [
    {
      "item": "PLAN VASQUE",
      "materiaux": "TROPICAL FASHION K2",
      "finition": "Polie",
      "longueur": 54,
      "largeur": 9.5,
      "epaisseur": 2,
      "quantite": 1,
      "qte": 0.05130,
      "chant": "",
      "croquis": "NON",
      "m2Item": 0.05130,
      "m3Item": null
    }
  ],
  "confidence": 0.95,
  "warnings": []
}
\`\`\`

## RÈGLES D'EXTRACTION:

### En-tête:
1. **numeroOS**: Cherche "OS N°:" suivi du numéro (ex: 2025FO188)
2. **numeroARC**: Cherche "ARC N°:" suivi du numéro (ex: 11742, 11766) - TRÈS IMPORTANT
3. **dateArc**: Date après "Du :" au format JJ/MM/AAAA
4. **delai**: Date après "Délai :" au format JJ/MM/AAAA - TRÈS IMPORTANT, EXTRAIS LA DATE COMPLÈTE
5. **poids**: Nombre après "Poids :"
6. **cumulQte**: Nombre après "Cumul Qté :" (souvent en M²)
7. **client**: Nom de l'entreprise cliente (généralement en majuscules, avant "Chantier:")
8. **chantier**: Description du chantier après "Chantier:"
9. **commercial**: Initiales après "Resp:" ou "Cial:"

### Tableau des items:
Pour CHAQUE ligne du tableau, extrais:
- **item**: Description de la pièce (ex: "PLAN VASQUE", "TABLETTE", "SEUIL")
- **materiaux**: Type de matériau (ex: "TROPICAL FASHION K2", "ST MAX K", "CLM LM K3")
- **finition**: Type de finition (Brut, Adoucie, Polie)
- **longueur**: Longueur en cm (nombre décimal)
- **largeur**: Largeur en cm (nombre décimal)
- **epaisseur**: Épaisseur en cm (nombre décimal)
- **quantite**: Nombre de pièces (entier)
- **qte**: Quantité totale en M² ou M³ (nombre décimal)
- **chant**: Type de chant si spécifié (peut être vide)
- **croquis**: "OUI" ou "NON" selon la colonne croquis

### Calcul automatique:
- Si le matériau contient "K" (ex: "K2", "K3"): c'est de la surface
  → \`m2Item\` = qte, \`m3Item\` = null
- Si le matériau contient "Q" ou pas de lettre: c'est du volume
  → \`m2Item\` = null, \`m3Item\` = qte

### Niveau de confiance:
Évalue ta confiance globale sur l'extraction (0.0 à 1.0):
- 1.0 = Toutes les données sont claires et lisibles
- 0.9 = Excellente qualité, quelques détails mineurs flous
- 0.8 = Bonne qualité, quelques champs incertains
- 0.7 = Qualité acceptable, plusieurs champs à vérifier
- < 0.7 = Qualité faible, révision manuelle recommandée

### Warnings:
Liste les problèmes détectés:
- "Numéro ARC illisible ou absent"
- "Client non identifié clairement"
- "Item X: dimensions partiellement lisibles"
- "Calcul M²/M³ incohérent pour item Y"
- "Tableau incomplet, certaines lignes manquantes"
- "Date d'échéance (Délai) manquante ou illisible"

## ATTENTION PARTICULIÈRE:

1. Le **numéro ARC** est CRITIQUE - cherche-le partout (en haut à droite généralement)
2. La **date d'échéance (Délai)** est CRITIQUE - extrais la date complète au format JJ/MM/AAAA
3. Le **nom du client** peut être sur plusieurs lignes - prends le nom complet
4. Les **matériaux** peuvent avoir des noms complexes (ex: "TROPICAL FASHION K2") - ne les coupe pas
5. La **finition** peut être écrite "Poli" ou "Polie" - normalise à "Polie"
6. Les **nombres** peuvent utiliser point ou virgule - normalise au point décimal
7. Le tableau peut avoir des **colonnes supplémentaires** (Chant, Croquis) - extrais-les si présentes

## FORMAT DE RÉPONSE:

Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après.
Assure-toi que tous les nombres sont bien des nombres (pas des strings).
Les tableaux vides doivent être [] et non null.

Maintenant, analyse le PDF et fournis le JSON complet.`;
}

function parseClaudeResponse(responseText: string, log: Function): ExtractedData {
  let jsonStr = responseText.trim();

  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '');
  }

  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    const data: ExtractedData = {
      numeroOS: parsed.numeroOS || '',
      numeroARC: parsed.numeroARC || '',
      dateArc: parsed.dateArc || '',
      delai: parsed.delai || '',
      poids: parsed.poids || '',
      cumulQte: parseFloat(parsed.cumulQte) || 0,
      client: parsed.client || '',
      chantier: parsed.chantier || '',
      commercial: parsed.commercial || '',
      items: (parsed.items || []).map((item: any) => ({
        item: item.item || '',
        materiaux: item.materiaux || '',
        finition: item.finition || '',
        longueur: parseFloat(item.longueur) || 0,
        largeur: parseFloat(item.largeur) || 0,
        epaisseur: parseFloat(item.epaisseur) || 0,
        quantite: parseInt(item.quantite) || 0,
        qte: parseFloat(item.qte) || 0,
        chant: item.chant || '',
        croquis: item.croquis || '',
        m2Item: item.m2Item !== null ? parseFloat(item.m2Item) : null,
        m3Item: item.m3Item !== null ? parseFloat(item.m3Item) : null,
        confidence: item.confidence || 1.0
      })),
      totalM2: 0,
      totalM3: 0,
      confidence: parseFloat(parsed.confidence) || 0.8,
      warnings: parsed.warnings || []
    };

    data.items.forEach(item => {
      if (item.m2Item !== null) data.totalM2 += item.m2Item;
      if (item.m3Item !== null) data.totalM3 += item.m3Item;
    });

    data.totalM2 = Math.round(data.totalM2 * 1000) / 1000;
    data.totalM3 = Math.round(data.totalM3 * 1000) / 1000;

    log('parse_success', 'success', {
      items_parsed: data.items.length,
      total_m2: data.totalM2,
      total_m3: data.totalM3
    });

    return data;

  } catch (error) {
    log('parse_error', 'error', { json_sample: jsonStr.substring(0, 200) }, error.message);
    throw new Error(`Erreur parsing JSON Claude: ${error.message}`);
  }
}

function validateExtractedData(data: ExtractedData, log: Function) {
  const warnings: string[] = [...data.warnings];

  if (!data.numeroARC || data.numeroARC.length < 4) {
    warnings.push('Numéro ARC manquant ou invalide');
  }

  if (!data.client || data.client.length < 3) {
    warnings.push('Client non identifié');
  }

  if (!data.numeroOS) {
    warnings.push('Numéro OS manquant');
  }

  if (!data.delai) {
    warnings.push('Date d\'échéance (Délai) manquante');
  }

  if (data.items.length === 0) {
    warnings.push('Aucun item extrait du tableau');
  }

  if (data.cumulQte > 0) {
    const calculatedTotal = data.totalM2 + data.totalM3;
    const difference = Math.abs(calculatedTotal - data.cumulQte);
    const percentDiff = (difference / data.cumulQte) * 100;

    if (percentDiff > 5) {
      warnings.push(`Écart de ${percentDiff.toFixed(1)}% entre cumul PDF (${data.cumulQte}) et total calculé (${calculatedTotal.toFixed(3)})`);
    }
  }

  data.warnings = warnings;

  if (warnings.length > 0) {
    log('validation_warnings', 'warning', { warnings });
  }
}

async function saveToDatabase(supabase: any, userId: string, data: ExtractedData, filename: string): Promise<string> {
  if (data.numeroARC) {
    const { data: existingSheets } = await supabase
      .from('debit_sheets')
      .select('id, numero_arc')
      .eq('numero_arc', data.numeroARC)
      .limit(1);

    if (existingSheets && existingSheets.length > 0) {
      throw new Error(`Le N°ARC "${data.numeroARC}" existe déjà`);
    }
  }

  const fourniture = determineMostFrequentMaterial(data.items);
  const epaisseur = determineThickness(data.items);

  const { data: sheetData, error: sheetError } = await supabase
    .from('debit_sheets')
    .insert({
      user_id: userId,
      cial: data.commercial,
      numero_os: data.numeroOS,
      nom_client: data.client,
      fourniture: fourniture,
      epaisseur: epaisseur,
      numero_arc: data.numeroARC,
      date_arc: data.dateArc,
      delai: data.delai || '',
      m2: data.totalM2,
      m3: data.totalM3,
      fini: false,
      livre: false,
      date_creation: new Date().toISOString().split('T')[0],
      ref_chantier: data.chantier || null
    })
    .select()
    .single();

  if (sheetError) throw sheetError;

  if (data.items.length > 0) {
    const itemsToInsert = data.items.map(item => ({
      sheet_id: sheetData.id,
      description: item.item,
      longueur: item.longueur,
      largeur: item.largeur,
      epaisseur: item.epaisseur,
      quantite: item.quantite,
      termine: false,
      matiere_item: item.materiaux,
      finition: item.finition,
      m2_item: item.m2Item,
      m3_item: item.m3Item
    }));

    const { error: itemsError } = await supabase
      .from('debit_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
  }

  return sheetData.id;
}

async function saveExtractionLogs(
  supabase: any,
  userId: string,
  filename: string,
  logs: LogEntry[],
  extractedData: ExtractedData,
  base64Sample: string
) {
  try {
    await supabase.from('claude_extraction_logs').insert({
      user_id: userId,
      pdf_filename: filename,
      extraction_status: extractedData.warnings.length > 0 ? 'needs_review' : 'success',
      raw_data: {
        extraction_method: 'claude_vision',
        pdf_base64_sample: base64Sample.substring(0, 1000),
        full_logs: logs
      },
      parsed_data: extractedData,
      errors: extractedData.warnings,
      processing_time_ms: logs[logs.length - 1]?.duration_ms || 0,
      confidence_score: extractedData.confidence
    });
  } catch (error) {
    console.error('Failed to save extraction logs:', error);
  }
}

function determineMostFrequentMaterial(items: DebitItem[]): string {
  if (items.length === 0) return '';

  const materialCounts: Record<string, number> = {};
  items.forEach(item => {
    const material = item.materiaux;
    materialCounts[material] = (materialCounts[material] || 0) + 1;
  });

  let maxCount = 0;
  let mostFrequent = '';
  for (const [material, count] of Object.entries(materialCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = material;
    }
  }

  return mostFrequent;
}

function determineThickness(items: DebitItem[]): string {
  if (items.length === 0) return '';

  const uniqueThicknesses = new Set<number>();
  items.forEach(item => uniqueThicknesses.add(item.epaisseur));

  if (uniqueThicknesses.size === 1) {
    return Array.from(uniqueThicknesses)[0].toString();
  }
  return 'mixte';
}
