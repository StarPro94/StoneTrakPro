import { createClient } from 'npm:@supabase/supabase-js@2.56.1';
import { getDocument } from 'npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs';

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
}

interface ParsedData {
  numeroOS: string;
  numeroARC: string;
  dateArc: string;
  delai: string;
  poids: string;
  cumulQte: number;
  client: string;
  chantier: string;
  commercial: string;
  items: DebitItem[];
  totalM2: number;
  totalM3: number;
  fourniture: string;
  epaisseur: string;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableRow {
  y: number;
  items: TextItem[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
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

    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      throw new Error('Aucun fichier PDF fourni');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('📄 Extraction du texte du PDF avec données positionnelles...');
    const { text, structuredData } = await extractTextFromPDF(uint8Array);

    console.log('🔍 Parsing des données de la feuille de débit...');
    const parsedData = parseDebitSheetData(text, structuredData);

    console.log(`✅ Extraction terminée: ${parsedData.items.length} items trouvés`);

    const sheetId = await saveToDatabase(supabase, user.id, parsedData);

    return new Response(
      JSON.stringify({
        success: true,
        sheet_id: sheetId,
        items_count: parsedData.items.length,
        total_m2: parsedData.totalM2,
        total_m3: parsedData.totalM3,
        extracted_data: {
          commercial: parsedData.commercial,
          client: parsedData.client,
          numero_os: parsedData.numeroOS,
          numero_arc: parsedData.numeroARC,
          date_arc: parsedData.dateArc,
          chantier: parsedData.chantier,
          fourniture: parsedData.fourniture,
          epaisseur: parsedData.epaisseur,
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
    console.error('❌ Erreur:', error);
    console.error('Stack:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors du traitement du PDF'
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

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<{ text: string; structuredData: TextItem[][] }> {
  const pdf = await getDocument({ data: pdfBytes }).promise;
  let fullText = '';
  const allPages: TextItem[][] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageItems: TextItem[] = textContent.items.map((item: any) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height
    }));

    allPages.push(pageItems);

    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return { text: fullText, structuredData: allPages };
}

function parseDebitSheetData(text: string, structuredData: TextItem[][]): ParsedData {
  const numeroOS = extractPattern(text, /OS\s*N°?\s*:?\s*([A-Z0-9]+)/i) || '';

  let numeroARC = extractPattern(text, /ARC\s*N°?\s*:?\s*(\d+)/i) || '';
  if (!numeroARC) {
    numeroARC = extractARCWithStructuredData(structuredData, text);
    console.log('📍 Extraction ARC avec données structurées:', numeroARC);
  }

  const dateArc = extractPattern(text, /Du\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i) || '';
  const delai = extractPattern(text, /Délai\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i) || '';
  const poids = extractPattern(text, /Poids\s*:?\s*([\d.,]+)/i) || '';
  const cumulQteStr = extractPattern(text, /Cumul\s+Qté\s*:?\s*([\d.,]+)/i) || '0';
  const cumulQte = parseFloat(cumulQteStr.replace(',', '.'));

  const commercial = extractPattern(text, /Resp\s*:?\s*([A-Z]+)/i) || '';

  let client = extractClient(text);
  if (!client) {
    client = extractClientWithStructuredData(structuredData);
    console.log('📍 Extraction client avec données structurées:', client);
  }

  const chantier = extractChantier(text);

  console.log('📊 Parsing des items du tableau avec données structurées...');
  const items = parseTableItemsStructured(structuredData);

  if (items.length === 0) {
    console.log('⚠️  Aucun item trouvé avec parsing structuré, fallback sur parsing texte...');
    const fallbackItems = parseTableItemsFallback(text);
    items.push(...fallbackItems);
  }

  let totalM2 = 0;
  let totalM3 = 0;
  items.forEach(item => {
    if (item.m2Item !== null) totalM2 += item.m2Item;
    if (item.m3Item !== null) totalM3 += item.m3Item;
  });

  const fourniture = determineMostFrequentMaterial(items);
  const epaisseur = determineThickness(items);

  console.log('\n📋 Données extraites récapitulatif:');
  console.log('   Commercial:', commercial || '❌ VIDE');
  console.log('   Client:', client || '❌ VIDE');
  console.log('   N° OS:', numeroOS || '❌ VIDE');
  console.log('   N° ARC:', numeroARC || '❌ VIDE');
  console.log('   Date ARC:', dateArc || '❌ VIDE');
  console.log('   Fourniture:', fourniture || '❌ VIDE');
  console.log('   Épaisseur:', epaisseur || '❌ VIDE');
  console.log('   Chantier:', chantier || '❌ VIDE');

  return {
    numeroOS,
    numeroARC,
    dateArc,
    delai,
    poids,
    cumulQte,
    client,
    chantier,
    commercial,
    items,
    totalM2: Math.round(totalM2 * 1000) / 1000,
    totalM3: Math.round(totalM3 * 1000) / 1000,
    fourniture,
    epaisseur,
  };
}

function parseTableItemsStructured(pages: TextItem[][]): DebitItem[] {
  const items: DebitItem[] = [];

  for (const pageItems of pages) {
    const rows = groupItemsIntoRows(pageItems);

    let tableStarted = false;
    let tableHeaderY = -1;

    for (const row of rows) {
      const rowText = row.items.map(i => i.str).join(' ');

      if (rowText.includes('Item') && rowText.includes('Matériaux') && rowText.includes('FINITION')) {
        tableStarted = true;
        tableHeaderY = row.y;
        console.log('📍 En-tête du tableau trouvé à y =', tableHeaderY);
        continue;
      }

      if (!tableStarted) continue;

      if (row.items.length < 5) continue;

      const sortedItems = [...row.items].sort((a, b) => a.x - b.x);

      const item = extractItemFromRow(sortedItems);
      if (item) {
        items.push(item);
        console.log(`✓ Item extrait: ${item.item} - ${item.materiaux} - ${item.longueur}x${item.largeur}x${item.epaisseur}`);
      }
    }
  }

  return items;
}

function groupItemsIntoRows(items: TextItem[], tolerance: number = 3): TableRow[] {
  const rowMap: Map<number, TextItem[]> = new Map();

  for (const item of items) {
    if (!item.str.trim()) continue;

    let foundRow = false;
    for (const [y, rowItems] of rowMap.entries()) {
      if (Math.abs(y - item.y) <= tolerance) {
        rowItems.push(item);
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rowMap.set(item.y, [item]);
    }
  }

  const rows: TableRow[] = [];
  for (const [y, rowItems] of rowMap.entries()) {
    rows.push({ y, items: rowItems });
  }

  rows.sort((a, b) => b.y - a.y);

  return rows;
}

function extractItemFromRow(sortedItems: TextItem[]): DebitItem | null {
  try {
    const values = sortedItems.map(i => i.str.trim()).filter(s => s.length > 0);

    if (values.length < 8) return null;

    let finitionIndex = -1;
    for (let i = 0; i < values.length; i++) {
      if (values[i].match(/^(Brut|Adoucie|Poli)$/i)) {
        finitionIndex = i;
        break;
      }
    }

    if (finitionIndex === -1) return null;

    const numericStartIndex = finitionIndex + 1;
    if (numericStartIndex + 4 >= values.length) return null;

    const longueur = parseFloat(values[numericStartIndex]);
    const largeur = parseFloat(values[numericStartIndex + 1]);
    const epaisseur = parseFloat(values[numericStartIndex + 2]);
    const quantite = parseInt(values[numericStartIndex + 3]);
    const qte = parseFloat(values[numericStartIndex + 4]);

    if (isNaN(longueur) || isNaN(largeur) || isNaN(epaisseur) || isNaN(quantite) || isNaN(qte)) {
      return null;
    }

    const finition = values[finitionIndex];

    let itemName = '';
    let materiaux = '';

    let itemEndIndex = -1;
    for (let i = 0; i < finitionIndex; i++) {
      const val = values[i];
      if (val.match(/ST\s+MAX|FACONNAGE|CHENE|HETRE|FRENE|PIERRE|MARBRE|GRANIT/i) ||
          (i > 0 && val.match(/^[QK]\d*$/i))) {
        itemEndIndex = i;
        break;
      }
    }

    if (itemEndIndex === -1) {
      itemEndIndex = Math.max(0, finitionIndex - 3);
    }

    for (let i = 0; i < itemEndIndex; i++) {
      itemName += (itemName ? ' ' : '') + values[i];
    }

    for (let i = itemEndIndex; i < finitionIndex; i++) {
      materiaux += (materiaux ? ' ' : '') + values[i];
    }

    if (!itemName.trim()) {
      itemName = values[0];
      materiaux = values.slice(1, finitionIndex).join(' ');
    }

    const isVolumeType = materiaux.toUpperCase().includes('Q');

    return {
      item: itemName.trim(),
      materiaux: materiaux.trim(),
      finition: finition.trim(),
      longueur,
      largeur,
      epaisseur,
      quantite,
      qte,
      m2Item: isVolumeType ? null : qte,
      m3Item: isVolumeType ? qte : null
    };
  } catch (error) {
    console.log('⚠️  Erreur lors de l\'extraction de la ligne:', error.message);
    return null;
  }
}

function parseTableItemsFallback(text: string): DebitItem[] {
  const items: DebitItem[] = [];

  const patterns = [
    /([A-Z0-9\/\s]+?)\s+((?:ST\s+MAX\s+)?[A-Z\s]*?[QK])\s+(Brut|Adoucie|Poli)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+([\d.]+)/gi,

    /([A-Z0-9\/\s]+?)\s+(FACONNAGE\s+Q|FACONNAGE\s+K)\s+(Brut|Adoucie|Poli)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+([\d.]+)/gi,

    /([A-Z0-9\/]+)\s+([A-Z\s]*?PI[A-Z\s]*?)\s+(FACONNAGE\s+Q|FACONNAGE\s+K)\s+(Brut|Adoucie|Poli)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+([\d.]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const groups = match.slice(1);

      if (groups.length === 8) {
        const [item, materiaux, finition, lg, larg, ep, nbre, qte] = groups;

        const longueur = parseFloat(lg);
        const largeur = parseFloat(larg);
        const epaisseur = parseFloat(ep);
        const quantite = parseInt(nbre);
        const qteValue = parseFloat(qte);

        if (!isNaN(longueur) && !isNaN(largeur) && !isNaN(epaisseur) && !isNaN(quantite) && !isNaN(qteValue)) {
          const isVolumeType = materiaux.toUpperCase().includes('Q');

          items.push({
            item: item.trim(),
            materiaux: materiaux.trim(),
            finition: finition.trim(),
            longueur,
            largeur,
            epaisseur,
            quantite,
            qte: qteValue,
            m2Item: isVolumeType ? null : qteValue,
            m3Item: isVolumeType ? qteValue : null
          });

          console.log(`✓ Fallback: ${item.trim()} extrait`);
        }
      }
    }
  }

  return items;
}

function extractPattern(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function extractARCWithStructuredData(pages: TextItem[][], text: string): string {
  for (const pageItems of pages) {
    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];

      if (item.str.includes('ARC') && item.str.includes('N°')) {
        for (let j = i + 1; j < Math.min(i + 10, pageItems.length); j++) {
          const candidate = pageItems[j].str.trim();
          if (/^\d{4,6}$/.test(candidate)) {
            console.log(`✓ ARC trouvé via structure: "${candidate}" près de "${item.str}"`);
            return candidate;
          }
        }
      }

      if ((item.str === 'ARC' || item.str.includes('ARC N')) && item.x > 400) {
        for (let j = i + 1; j < Math.min(i + 5, pageItems.length); j++) {
          const candidate = pageItems[j].str.trim();
          const distY = Math.abs(pageItems[j].y - item.y);

          if (/^\d{4,6}$/.test(candidate) && distY < 20) {
            console.log(`✓ ARC trouvé via proximité: "${candidate}" (distY: ${distY})`);
            return candidate;
          }
        }
      }
    }

    const upperRightItems = pageItems.filter(item => item.x > 400 && item.y > 700);
    for (const item of upperRightItems) {
      if (/^\d{4,6}$/.test(item.str.trim())) {
        const arcLabel = pageItems.find(p =>
          p.str.toLowerCase().includes('arc') &&
          Math.abs(p.y - item.y) < 30
        );
        if (arcLabel) {
          console.log(`✓ ARC trouvé dans zone sup droite: "${item.str}"`);
          return item.str.trim();
        }
      }
    }
  }

  const arcMatch = text.match(/(?:ARC|Arc)\s*[N°:]*\s*(\d{4,6})/i);
  if (arcMatch) {
    console.log(`✓ ARC trouvé via regex texte: "${arcMatch[1]}"`);
    return arcMatch[1];
  }

  console.log('⚠️  Numéro ARC non trouvé');
  return '';
}

function extractClientWithStructuredData(pages: TextItem[][]): string {
  for (const pageItems of pages) {
    let chantierIndex = -1;
    for (let i = 0; i < pageItems.length; i++) {
      if (pageItems[i].str.toLowerCase().includes('chantier')) {
        chantierIndex = i;
        break;
      }
    }

    if (chantierIndex === -1) continue;

    const chantierItem = pageItems[chantierIndex];
    const chantierY = chantierItem.y;

    const candidatesAbove = pageItems.filter(item => {
      const isAbove = item.y > chantierY - 100 && item.y < chantierY + 50;
      const isSameRegion = Math.abs(item.x - chantierItem.x) < 300;
      const hasValidLength = item.str.trim().length > 3 && item.str.trim().length < 100;
      const notKeyword = !item.str.match(/^(Resp|Cial|Commercial|OS|N°|Délai|Poids|Cumul|Du|ARC|Page|Feuille|DBPM|Item|Matériaux|Chantier)/i);
      const notOnlyNumbers = !/^[\d\s.,\/:]+$/.test(item.str);

      return isAbove && isSameRegion && hasValidLength && notKeyword && notOnlyNumbers;
    });

    candidatesAbove.sort((a, b) => Math.abs(a.y - chantierY) - Math.abs(b.y - chantierY));

    for (const candidate of candidatesAbove) {
      const clientName = candidate.str.trim();
      if (clientName && clientName.length > 3) {
        console.log(`✓ Client trouvé via proximité Chantier: "${clientName}" (y: ${candidate.y}, chantierY: ${chantierY})`);
        return clientName;
      }
    }

    const sameLineItems = pageItems.filter(item =>
      Math.abs(item.y - chantierY) < 5 &&
      item.x < chantierItem.x &&
      item.str.trim().length > 3 &&
      !item.str.match(/^(Poids|Cumul|Resp|Délai)/i)
    );

    if (sameLineItems.length > 0) {
      sameLineItems.sort((a, b) => b.x - a.x);
      const clientName = sameLineItems[0].str.trim();
      if (clientName && clientName.length > 3) {
        console.log(`✓ Client trouvé sur même ligne que Chantier: "${clientName}"`);
        return clientName;
      }
    }
  }

  console.log('⚠️  Client non trouvé avec données structurées');
  return '';
}

function extractClient(text: string): string {
  const chantierMatch = text.match(/Chantier\s*:/i);
  if (!chantierMatch) return '';

  const beforeChantier = text.substring(0, chantierMatch.index);
  const lines = beforeChantier.split(/\r?\n/).reverse();

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    if (cleanLine.match(/^(Resp|Cial|Commercial|OS|N°|Délai|Poids|Cumul|Du|ARC|Page|Feuille|DBPM)/i)) continue;
    if (cleanLine.match(/^\d+[\.,]\d+$/) || cleanLine.match(/^\d{2}\/\d{2}\/\d{4}$/)) continue;
    if (cleanLine.length > 3 && cleanLine.length < 150) {
      return cleanLine;
    }
  }

  return '';
}

function extractChantier(text: string): string {
  const match = text.match(/Chantier\s*:?\s*([^\n]+)/i);
  if (match) {
    let chantier = match[1].trim();
    chantier = chantier.split(/\s+Resp|Item|Matériaux/i)[0].trim();
    return chantier.length > 150 ? chantier.substring(0, 150) : chantier;
  }
  return '';
}

async function saveToDatabase(supabase: any, userId: string, data: ParsedData): Promise<string> {
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
      delai: calculateDelaiInDays(data.dateArc, data.delai),
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

function calculateDelaiInDays(dateArc: string, delaiDate: string): string {
  if (!dateArc || !delaiDate) return '';

  try {
    const [dayArc, monthArc, yearArc] = dateArc.split('/').map(Number);
    const [dayDelai, monthDelai, yearDelai] = delaiDate.split('/').map(Number);

    const dateArcObj = new Date(yearArc, monthArc - 1, dayArc);
    const dateDelaiObj = new Date(yearDelai, monthDelai - 1, dayDelai);

    const diffTime = dateDelaiObj.getTime() - dateArcObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays.toString();
  } catch {
    return delaiDate;
  }
}