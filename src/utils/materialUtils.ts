export function getMaterialType(material: string | undefined): 'tranche' | 'bloc' | 'both' | 'unknown' {
  if (!material) return 'unknown';

  const upperMaterial = material.toUpperCase().trim();

  const isTranchePattern = /K\d+$/.test(upperMaterial);
  const isBlocPattern = upperMaterial.endsWith('Q') || upperMaterial.endsWith('PBQ');

  if (isTranchePattern && !isBlocPattern) {
    return 'tranche';
  }

  if (isBlocPattern && !isTranchePattern) {
    return 'bloc';
  }

  if (isTranchePattern && isBlocPattern) {
    return 'both';
  }

  return 'unknown';
}

export function calculateItemMetrics(
  longueur: number,
  largeur: number,
  epaisseur: number,
  quantite: number,
  material?: string
): { m2: number; m3: number } {
  const m2 = (longueur * largeur * quantite) / 10000;
  const m3 = (longueur * largeur * epaisseur * quantite) / 1000000;

  const materialType = getMaterialType(material);

  if (materialType === 'tranche') {
    return { m2, m3: 0 };
  } else if (materialType === 'bloc') {
    return { m2: 0, m3 };
  }

  return { m2, m3 };
}

export function calculateSheetTotals(items: Array<{
  longueur: number;
  largeur: number;
  epaisseur: number;
  quantite: number;
  matiereItem?: string;
  m2Item?: number;
  m3Item?: number;
}>): { totalM2: number; totalM3: number } {
  let totalM2 = 0;
  let totalM3 = 0;

  items.forEach(item => {
    if (item.m2Item !== undefined && item.m3Item !== undefined) {
      totalM2 += item.m2Item;
      totalM3 += item.m3Item;
    } else {
      const metrics = calculateItemMetrics(
        item.longueur,
        item.largeur,
        item.epaisseur,
        item.quantite,
        item.matiereItem
      );
      totalM2 += metrics.m2;
      totalM3 += metrics.m3;
    }
  });

  return { totalM2, totalM3 };
}
