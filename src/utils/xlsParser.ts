import * as XLSX from 'xlsx';

export interface XLSMaterialRow {
  ref: string;
  matiere: string;
}

export async function parseXLSFile(file: File): Promise<XLSMaterialRow[]> {
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

  if (refIndex === -1 || matiereIndex === -1) {
    throw new Error('Le fichier doit contenir les colonnes "Ref" et "Matière"');
  }

  const materials: XLSMaterialRow[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];

    const ref = String(row[refIndex] || '').trim();
    const matiere = String(row[matiereIndex] || '').trim();

    if (ref && matiere) {
      materials.push({ ref, matiere });
    }
  }

  if (materials.length === 0) {
    throw new Error('Aucune matière valide trouvée dans le fichier');
  }

  return materials;
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
