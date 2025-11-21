import * as XLSX from 'xlsx';

interface ParsedRow {
  reference?: string;
  designation?: string;
  quantite?: number;
  poidsUnitaire?: number;
  poidsTotal?: number;
  quantiteHs?: number;
}

interface ParsedHeader {
  numero?: string;
  date?: string;
  chantier?: string;
  preparateur?: string;
  receptionnaire?: string;
  transporteur?: string;
}

interface ScaffoldingExcelData {
  header: ParsedHeader;
  items: ParsedRow[];
  totalWeight?: number;
}

function normalizeColumnName(name: string): string {
  if (!name) return '';

  return name
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function findColumnIndex(headers: any[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));

  for (const name of possibleNames) {
    const normalizedName = normalizeColumnName(name);
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedName) || normalizedName.includes(h));
    if (index !== -1) return index;
  }

  return -1;
}

function extractHeaderInfo(jsonData: any[]): ParsedHeader {
  const header: ParsedHeader = {};

  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i];

    for (const key in row) {
      const normalizedKey = normalizeColumnName(key);
      const value = row[key]?.toString().trim();

      if (!value || value === '0') continue;

      if ((normalizedKey.includes('numero') || normalizedKey.includes('n')) &&
          (normalizedKey.includes('chantier') || normalizedKey.includes('commande'))) {
        header.numero = value;
      }

      if (normalizedKey.includes('date')) {
        header.date = value;
      }

      if (normalizedKey.includes('chantier') && !normalizedKey.includes('numero')) {
        header.chantier = value;
      }

      if (normalizedKey.includes('preparateur')) {
        header.preparateur = value;
      }

      if (normalizedKey.includes('receptionnaire')) {
        header.receptionnaire = value;
      }

      if (normalizedKey.includes('transporteur')) {
        header.transporteur = value;
      }
    }

    for (const value of Object.values(row)) {
      const strValue = value?.toString().trim();
      if (!strValue) continue;

      if (strValue.match(/^\d{6,}$/)) {
        header.numero = strValue;
      }
    }
  }

  return header;
}

function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === '') return 0;

  const strValue = value.toString().replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(strValue);

  return isNaN(num) ? 0 : num;
}

function isHeaderRow(row: any): boolean {
  const values = Object.values(row);
  const strValues = values.map(v => v?.toString().toLowerCase() || '');

  const headerKeywords = ['reference', 'designation', 'quantite', 'poids'];
  const matchCount = strValues.filter(v =>
    headerKeywords.some(keyword => v.includes(keyword))
  ).length;

  return matchCount >= 2;
}

export function parseScaffoldingExcel(workbook: XLSX.WorkBook): ScaffoldingExcelData {
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const header = extractHeaderInfo(XLSX.utils.sheet_to_json(worksheet));

  let headerRowIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (row.some(cell => {
      const str = cell?.toString().toLowerCase() || '';
      return str.includes('référence') || str.includes('reference');
    })) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('En-tête non trouvé. Assurez-vous que le fichier contient une colonne "Référence".');
  }

  const headers = jsonData[headerRowIndex] as any[];

  const refIndex = findColumnIndex(headers, ['référence', 'reference', 'ref']);
  const designationIndex = findColumnIndex(headers, ['désignation', 'designation', 'libelle', 'libellé']);
  const quantiteIndex = findColumnIndex(headers, ['quantité', 'quantite', 'qte', 'qty']);
  const poidsUnitaireIndex = findColumnIndex(headers, ['poids unitaire', 'poidsunitaire', 'poids']);
  const poidsTotalIndex = findColumnIndex(headers, ['poids total', 'poidstotal', 'total']);
  const quantiteHsIndex = findColumnIndex(headers, ['quantite hs', 'quantitehs', 'hs']);

  if (refIndex === -1) {
    throw new Error('Colonne "Référence" non trouvée dans le fichier Excel.');
  }

  if (quantiteIndex === -1) {
    throw new Error('Colonne "Quantité" non trouvée dans le fichier Excel.');
  }

  const items: ParsedRow[] = [];
  let totalWeight = 0;

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];

    if (!row || row.length === 0) continue;

    const reference = row[refIndex]?.toString().trim();
    if (!reference || reference === '0' || reference === '') continue;

    const quantiteStr = row[quantiteIndex];
    const quantite = parseNumericValue(quantiteStr);

    if (quantite <= 0) continue;

    const designation = designationIndex !== -1 ? row[designationIndex]?.toString().trim() : '';
    const poidsUnitaire = poidsUnitaireIndex !== -1 ? parseNumericValue(row[poidsUnitaireIndex]) : 0;
    const poidsTotal = poidsTotalIndex !== -1 ? parseNumericValue(row[poidsTotalIndex]) : 0;
    const quantiteHs = quantiteHsIndex !== -1 ? parseNumericValue(row[quantiteHsIndex]) : 0;

    items.push({
      reference,
      designation,
      quantite,
      poidsUnitaire,
      poidsTotal,
      quantiteHs
    });

    if (poidsTotal > 0) {
      totalWeight += poidsTotal;
    } else if (poidsUnitaire > 0 && quantite > 0) {
      totalWeight += poidsUnitaire * quantite;
    }
  }

  const totalWeightRow = jsonData.find((row: any) => {
    const firstCell = row[0]?.toString().toLowerCase() || '';
    return firstCell.includes('poids total') || firstCell.includes('total');
  });

  if (totalWeightRow && Array.isArray(totalWeightRow)) {
    const weightValue = totalWeightRow.find((cell: any) => {
      const num = parseNumericValue(cell);
      return num > 1000;
    });
    if (weightValue) {
      totalWeight = parseNumericValue(weightValue);
    }
  }

  return {
    header,
    items,
    totalWeight
  };
}

export function validateScaffoldingData(data: ScaffoldingExcelData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.items.length === 0) {
    errors.push('Aucun élément valide trouvé dans le fichier');
  }

  const invalidReferences = data.items.filter(item => !item.reference || item.reference.length < 2);
  if (invalidReferences.length > 0) {
    errors.push(`${invalidReferences.length} ligne(s) avec des références invalides`);
  }

  const zeroQuantities = data.items.filter(item => !item.quantite || item.quantite <= 0);
  if (zeroQuantities.length === data.items.length) {
    errors.push('Toutes les quantités sont à zéro');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
