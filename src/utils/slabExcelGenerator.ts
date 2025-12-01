import * as XLSX from 'xlsx';
import { Slab, Material } from '../types';

interface SlabWithMaterial extends Slab {
  materialRef?: string;
  materialCmup?: number;
}

interface GroupedSlab {
  material: string;
  slabs: SlabWithMaterial[];
  totalM2: number;
  totalValue: number;
}

export function generateSlabExcelFile(
  slabs: SlabWithMaterial[],
  materials: Material[]
): ArrayBuffer {
  const enrichedSlabs = enrichSlabsWithMaterials(slabs, materials);
  const grouped = groupAndSortByMaterial(enrichedSlabs);
  const excelData = buildExcelData(grouped);
  const workbook = createWorkbook(excelData);

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

function enrichSlabsWithMaterials(
  slabs: SlabWithMaterial[],
  materials: Material[]
): SlabWithMaterial[] {
  return slabs.map((slab) => {
    const material = materials.find(
      (m) => m.name.toLowerCase() === slab.material.toLowerCase()
    );

    return {
      ...slab,
      materialRef: material?.ref || '?',
      materialCmup: material?.cmup || 0,
    };
  });
}

function groupAndSortByMaterial(slabs: SlabWithMaterial[]): GroupedSlab[] {
  const groups = new Map<string, SlabWithMaterial[]>();

  slabs.forEach((slab) => {
    const material = slab.material;
    if (!groups.has(material)) {
      groups.set(material, []);
    }
    groups.get(material)!.push(slab);
  });

  const sortedGroups: GroupedSlab[] = [];
  const sortedMaterials = Array.from(groups.keys()).sort();

  sortedMaterials.forEach((material) => {
    const groupSlabs = groups.get(material)!;
    groupSlabs.sort((a, b) => a.position.localeCompare(b.position));

    const totalM2 = groupSlabs.reduce((sum, slab) => {
      return sum + (slab.length * slab.width * slab.quantity) / 10000;
    }, 0);

    const totalValue = groupSlabs.reduce((sum, slab) => {
      const m2 = (slab.length * slab.width * slab.quantity) / 10000;
      return sum + m2 * (slab.materialCmup || 0);
    }, 0);

    sortedGroups.push({
      material,
      slabs: groupSlabs,
      totalM2,
      totalValue,
    });
  });

  return sortedGroups;
}

function buildExcelData(groups: GroupedSlab[]): any[][] {
  const data: any[][] = [];

  data.push([
    'n°saisie',
    'Ref',
    'Matière',
    'Allée',
    'Longueur',
    'Largeur',
    'Épaisseur',
    'NBRE',
    'TOTAL',
    'Stock',
    'CMUP',
    'Valeur',
  ]);

  let numeroSaisie = 1;

  groups.forEach((group) => {
    data.push([
      '',
      '',
      group.material,
      '',
      '',
      '',
      '',
      '',
      group.totalM2.toFixed(2),
      '',
      '',
      group.totalValue.toFixed(2),
    ]);

    group.slabs.forEach((slab) => {
      const totalM2 = (slab.length * slab.width * slab.quantity) / 10000;
      const valeur = totalM2 * (slab.materialCmup || 0);

      data.push([
        numeroSaisie,
        slab.materialRef || '?',
        slab.material,
        slab.position,
        slab.length,
        slab.width,
        slab.thickness,
        slab.quantity,
        totalM2.toFixed(2),
        '',
        slab.materialCmup?.toFixed(2) || '0.00',
        valeur.toFixed(2),
      ]);

      numeroSaisie++;
    });
  });

  return data;
}

function createWorkbook(data: any[][]): XLSX.WorkBook {
  const ws = XLSX.utils.aoa_to_sheet(data);

  const columnWidths = [
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
  ];
  ws['!cols'] = columnWidths;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[headerCell]) continue;

    ws[headerCell].s = {
      fill: { fgColor: { rgb: '70AD47' } },
      font: { color: { rgb: 'FFFFFF' }, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  let lastMaterialRow = -1;
  for (let R = 1; R <= range.e.r; R++) {
    const cellA = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];

    if (!cellA || cellA.v === '') {
      lastMaterialRow = R;
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) ws[cell] = { v: '' };

        ws[cell].s = {
          fill: { fgColor: { rgb: 'D9D9D9' } },
          font: { bold: true },
          alignment: { horizontal: 'left', vertical: 'center' },
        };
      }
    }
  }

  for (let R = 1; R <= range.e.r; R++) {
    if (R === lastMaterialRow) continue;

    const cellA = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
    if (cellA && cellA.v !== '') {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;

        if (C === 8 || C === 10 || C === 11) {
          ws[cell].z = '0.00';
        } else if (C >= 4 && C <= 7) {
          ws[cell].z = '0';
        }

        if (!ws[cell].s) ws[cell].s = {};
        ws[cell].s.border = {
          top: { style: 'thin', color: { rgb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
          left: { style: 'thin', color: { rgb: 'CCCCCC' } },
          right: { style: 'thin', color: { rgb: 'CCCCCC' } },
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Tranches');

  return wb;
}

export function downloadExcelFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
