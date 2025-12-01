import * as XLSX from 'xlsx';

export interface ParsedSlabRow {
  entryNumber: string | null;
  material: string;
  position: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  ref: string;
  value: number | null;
  cmup: number | null;
}

export interface ParseResult {
  slabs: ParsedSlabRow[];
  errors: { row: number; message: string }[];
  stats: {
    total: number;
    valid: number;
    skipped: number;
    errorsCount: number;
  };
}

export async function parseSlabExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Impossible de lire le fichier'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (rows.length < 2) {
          reject(new Error('Le fichier ne contient pas suffisamment de données'));
          return;
        }

        const slabs: ParsedSlabRow[] = [];
        const errors: { row: number; message: string }[] = [];
        let skipped = 0;

        const headers = rows[0].map((h: any) =>
          String(h || '').toLowerCase().trim()
        );

        const colIndexes = {
          entryNumber: findColumnIndex(headers, ['n°saisie', 'nsaisie', 'numero saisie', 'entry number']),
          ref: findColumnIndex(headers, ['ref', 'référence']),
          matiere: findColumnIndex(headers, ['matière', 'matiere']),
          allee: findColumnIndex(headers, ['allée', 'allee']),
          longueur: findColumnIndex(headers, ['longueur']),
          largeur: findColumnIndex(headers, ['largeur']),
          epaisseur: findColumnIndex(headers, ['épaisseur', 'epaisseur']),
          nbre: findColumnIndex(headers, ['nbre', 'nombre', 'qté', 'quantité']),
          valeur: findColumnIndex(headers, ['valeur', 'value']),
          cmup: findColumnIndex(headers, ['cmup', 'prix', 'price']),
        };

        if (colIndexes.ref === -1) {
          reject(new Error('Colonne "Ref" ou "Référence" manquante'));
          return;
        }
        if (colIndexes.matiere === -1) {
          reject(new Error('Colonne "Matière" manquante'));
          return;
        }
        if (colIndexes.allee === -1) {
          reject(new Error('Colonne "Allée" manquante'));
          return;
        }
        if (colIndexes.longueur === -1) {
          reject(new Error('Colonne "Longueur" manquante'));
          return;
        }
        if (colIndexes.largeur === -1) {
          reject(new Error('Colonne "Largeur" manquante'));
          return;
        }
        if (colIndexes.epaisseur === -1) {
          reject(new Error('Colonne "Épaisseur" manquante'));
          return;
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 1;

          const allee = getCellValue(row[colIndexes.allee]);
          const longueur = getCellValue(row[colIndexes.longueur]);
          const largeur = getCellValue(row[colIndexes.largeur]);
          const epaisseur = getCellValue(row[colIndexes.epaisseur]);

          if (!allee || !longueur || !largeur || !epaisseur) {
            skipped++;
            continue;
          }

          const entryNumber = getCellValue(row[colIndexes.entryNumber]);
          const matiere = getCellValue(row[colIndexes.matiere]);
          const ref = getCellValue(row[colIndexes.ref]);
          const nbre = getCellValue(row[colIndexes.nbre]);
          const valeur = getCellValue(row[colIndexes.valeur]);
          const cmup = getCellValue(row[colIndexes.cmup]);

          if (!matiere) {
            errors.push({
              row: rowNumber,
              message: 'Matière non renseignée',
            });
            continue;
          }

          if (!ref) {
            errors.push({
              row: rowNumber,
              message: 'Référence non renseignée',
            });
            continue;
          }

          const lengthNum = parseFloat(String(longueur));
          const widthNum = parseFloat(String(largeur));
          const thicknessNum = parseFloat(String(epaisseur));
          const quantityNum = nbre ? parseFloat(String(nbre)) : 1;

          if (isNaN(lengthNum) || lengthNum <= 0) {
            errors.push({
              row: rowNumber,
              message: `Longueur invalide: ${longueur}`,
            });
            continue;
          }

          if (isNaN(widthNum) || widthNum <= 0) {
            errors.push({
              row: rowNumber,
              message: `Largeur invalide: ${largeur}`,
            });
            continue;
          }

          if (isNaN(thicknessNum) || thicknessNum <= 0) {
            errors.push({
              row: rowNumber,
              message: `Épaisseur invalide: ${epaisseur}`,
            });
            continue;
          }

          if (isNaN(quantityNum) || quantityNum < 1) {
            errors.push({
              row: rowNumber,
              message: `Quantité invalide: ${nbre}`,
            });
            continue;
          }

          const entryNumberStr = entryNumber ? String(entryNumber).trim() : null;
          const valeurNum = valeur ? parseFloat(String(valeur)) : null;
          const cmupNum = cmup ? parseFloat(String(cmup)) : null;

          slabs.push({
            entryNumber: entryNumberStr,
            material: String(matiere).trim(),
            position: String(allee).trim(),
            length: lengthNum,
            width: widthNum,
            thickness: thicknessNum,
            quantity: Math.floor(quantityNum),
            ref: String(ref).trim(),
            value: valeurNum,
            cmup: cmupNum,
          });
        }

        resolve({
          slabs,
          errors,
          stats: {
            total: rows.length - 1,
            valid: slabs.length,
            skipped,
            errorsCount: errors.length,
          },
        });
      } catch (error: any) {
        reject(new Error(`Erreur lors du parsing: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex((h) => h === name);
    if (index !== -1) return index;
  }
  return -1;
}

function getCellValue(cell: any): string | number | null {
  if (cell === undefined || cell === null || cell === '') return null;
  return cell;
}
