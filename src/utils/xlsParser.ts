import * as XLSX from 'xlsx';

export interface XLSMaterialRow {
  ref: string;
  matiere: string;
  stock?: number;
  aTerMe?: number;
  cmup: number | null;
}

export interface XLSParseResult {
  materials: XLSMaterialRow[];
  stats: {
    totalProcessed: number;
    withCMUP: number;
    rejected: number;
  };
}

function parseCMUPValue(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let numValue: number;

  if (typeof value === 'string') {
    const cleanValue = value.replace(/,/g, '.').trim();
    numValue = parseFloat(cleanValue);
  } else if (typeof value === 'number') {
    numValue = value;
  } else {
    return null;
  }

  if (isNaN(numValue) || numValue < 0) {
    return null;
  }

  if (numValue === 0) {
    return null;
  }

  return Math.round(numValue * 1000) / 1000;
}

function parseNumericValue(value: any): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '.'));

  if (isNaN(numValue)) {
    return undefined;
  }

  return numValue;
}

export async function parseXLSFile(file: File): Promise<XLSParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('Le fichier Excel ne contient aucune feuille');
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

  if (jsonData.length === 0) {
    throw new Error('Le fichier est vide');
  }

  const headers = (jsonData[0] as any[]).map((h: any) =>
    String(h || '').trim().toLowerCase()
  );

  const refIndex = headers.findIndex(h =>
    h === 'ref' || h === 'référence' || h === 'reference'
  );
  const matiereIndex = headers.findIndex(h =>
    h === 'matière' || h === 'matiere' || h === 'material'
  );
  const stockIndex = headers.findIndex(h =>
    h === 'stock'
  );
  const aTerMeIndex = headers.findIndex(h =>
    h === 'à terme' || h === 'a terme' || h === 'aterme'
  );
  const cmupIndex = headers.findIndex(h =>
    h === 'cmup'
  );

  if (refIndex === -1) {
    throw new Error('Le fichier doit contenir la colonne "Ref"');
  }
  if (matiereIndex === -1) {
    throw new Error('Le fichier doit contenir la colonne "Matière"');
  }
  if (cmupIndex === -1) {
    throw new Error('Le fichier doit contenir la colonne "CMUP"');
  }

  const materials: XLSMaterialRow[] = [];
  let rejectedCount = 0;
  let cmupCount = 0;

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];

    const ref = String(row[refIndex] || '').trim();
    const matiere = String(row[matiereIndex] || '').trim();

    if (!ref || !matiere) {
      rejectedCount++;
      console.warn(`Ligne ${i + 1} ignorée: ref ou matière manquante`);
      continue;
    }

    const stock = stockIndex !== -1 ? parseNumericValue(row[stockIndex]) : undefined;
    const aTerMe = aTerMeIndex !== -1 ? parseNumericValue(row[aTerMeIndex]) : undefined;
    const cmup = parseCMUPValue(row[cmupIndex]);

    if (cmup !== null) {
      cmupCount++;
    }

    materials.push({
      ref,
      matiere,
      stock,
      aTerMe,
      cmup
    });
  }

  if (materials.length === 0) {
    throw new Error('Aucune matière valide trouvée dans le fichier');
  }

  return {
    materials,
    stats: {
      totalProcessed: materials.length,
      withCMUP: cmupCount,
      rejected: rejectedCount
    }
  };
}

export function detectMaterialTypeFromName(name: string): 'tranche' | 'bloc' | 'both' {
  const upperName = name.toUpperCase().trim();

  const isTranchePattern = /K\d+$/.test(upperName);
  const isBlocPattern = upperName.endsWith('Q') || upperName.endsWith('PBQ');

  if (isTranchePattern && !isBlocPattern) {
    return 'tranche';
  }

  if (isBlocPattern && !isTranchePattern) {
    return 'bloc';
  }

  return 'both';
}
