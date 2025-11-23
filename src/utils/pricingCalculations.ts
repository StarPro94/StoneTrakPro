import { PricingParameters, PricingResult } from '../types';

const SAW_BLADE_THICKNESS_CM = 0.5; // Épaisseur de la lame de scie en cm (5mm)

export function calculateFromBlock(
  blockPriceM3: number,
  sawingCostM3: number,
  cuttingCostM2: number,
  thicknessCm: number,
  wasteFactor: number,
  marginCoefficient: number,
  laborCost: number = 0,
  consumablesCost: number = 0,
  overheadCoefficient: number = 1.0
): PricingResult {
  const calculations: string[] = [];

  // 1. Convertir l'épaisseur en mètres
  const thicknessM = thicknessCm / 100;
  calculations.push(`Épaisseur: ${thicknessCm} cm = ${thicknessM} m`);

  // 2. Calculer combien de tranches on obtient depuis 1m³
  // En tenant compte de l'épaisseur de la lame de scie
  const effectiveThicknessCm = thicknessCm + SAW_BLADE_THICKNESS_CM;
  const effectiveThicknessM = effectiveThicknessCm / 100;
  const numberOfSlabs = Math.floor(1 / effectiveThicknessM);
  calculations.push(`Nombre de tranches depuis 1m³: ${numberOfSlabs} tranches (épaisseur + lame = ${effectiveThicknessCm} cm)`);

  // 3. Calculer la surface obtenue depuis 1m³
  // Si on a 1m³ et qu'on coupe des tranches de X cm d'épaisseur,
  // la surface totale obtenue = 1m / épaisseur (en m)
  const surfaceObtainedFromM3 = 1 / thicknessM;
  calculations.push(`Surface obtenue depuis 1m³: ${surfaceObtainedFromM3.toFixed(2)} m²`);

  // 3. Calculer le prix des tranches au m² : (prix bloc + coût sciage) / nombre de tranches
  const blockWithSawingM3 = blockPriceM3 + sawingCostM3;
  calculations.push(`Prix bloc avec sciage: ${blockPriceM3.toFixed(2)}€/m³ + ${sawingCostM3.toFixed(2)}€/m³ (sciage) = ${blockWithSawingM3.toFixed(2)}€/m³`);

  const slabPriceM2 = blockWithSawingM3 / numberOfSlabs;
  calculations.push(`Prix des tranches au m²: ${blockWithSawingM3.toFixed(2)}€/m³ ÷ ${numberOfSlabs} tranches = ${slabPriceM2.toFixed(2)}€/m²`);

  // 4. Ajouter le coût du débit
  const baseCostM2 = slabPriceM2 + cuttingCostM2;
  calculations.push(`Avec coût débit: ${slabPriceM2.toFixed(2)}€ + ${cuttingCostM2.toFixed(2)}€ (débit) = ${baseCostM2.toFixed(2)}€/m²`);

  // 5. Appliquer le coefficient de perte
  const costWithWaste = baseCostM2 * wasteFactor;
  calculations.push(`Avec perte (×${wasteFactor}): ${costWithWaste.toFixed(2)}€/m²`);

  // 6. Ajouter les coûts additionnels (MO + consommables)
  const costWithLabor = costWithWaste + laborCost + consumablesCost;
  if (laborCost > 0 || consumablesCost > 0) {
    calculations.push(`Avec MO/conso: ${costWithWaste.toFixed(2)}€ + ${laborCost.toFixed(2)}€ (MO) + ${consumablesCost.toFixed(2)}€ (conso) = ${costWithLabor.toFixed(2)}€/m²`);
  }

  // 7. Appliquer les frais généraux
  const costWithOverhead = costWithLabor * overheadCoefficient;
  if (overheadCoefficient !== 1.0) {
    const overheadPercent = ((overheadCoefficient - 1) * 100).toFixed(0);
    calculations.push(`Avec frais généraux (+${overheadPercent}%): ${costWithOverhead.toFixed(2)}€/m²`);
  }

  const unitCostPrice = costWithOverhead;
  calculations.push(`Coût de revient total: ${unitCostPrice.toFixed(2)}€/m²`);

  // 8. Appliquer le coefficient de marge
  const unitSellingPrice = unitCostPrice * marginCoefficient;
  calculations.push(`Prix de vente (×${marginCoefficient}): ${unitSellingPrice.toFixed(2)}€/m²`);

  const marginAmount = unitSellingPrice - unitCostPrice;
  const marginPercent = ((marginAmount / unitCostPrice) * 100);

  return {
    unitCostPrice: Math.round(unitCostPrice * 100) / 100,
    unitSellingPrice: Math.round(unitSellingPrice * 100) / 100,
    totalPrice: Math.round(unitSellingPrice * 100) / 100, // Pour 1 unité
    marginPercent: Math.round(marginPercent * 100) / 100,
    marginAmount: Math.round(marginAmount * 100) / 100,
    details: {
      surfaceObtainedFromM3: Math.round(surfaceObtainedFromM3 * 100) / 100,
      numberOfSlabs,
      sawBladeThickness: SAW_BLADE_THICKNESS_CM,
      calculations
    }
  };
}

export function calculateFromSlab(
  slabPriceM2: number,
  wasteFactor: number,
  fabricationCost: number,
  marginCoefficient: number,
  laborCost: number = 0,
  consumablesCost: number = 0,
  overheadCoefficient: number = 1.0
): PricingResult {
  const calculations: string[] = [];

  // 1. Prix d'achat de base
  calculations.push(`Prix d'achat tranche: ${slabPriceM2.toFixed(2)}€/m²`);

  // 2. Appliquer le coefficient de perte
  const priceWithWaste = slabPriceM2 * wasteFactor;
  calculations.push(`Avec perte (×${wasteFactor}): ${priceWithWaste.toFixed(2)}€/m²`);

  // 3. Ajouter les coûts de transformation
  const costWithTransformation = priceWithWaste + fabricationCost + laborCost + consumablesCost;
  const costsDetails = [];
  if (fabricationCost > 0) costsDetails.push(`${fabricationCost.toFixed(2)}€ (façonnage)`);
  if (laborCost > 0) costsDetails.push(`${laborCost.toFixed(2)}€ (MO)`);
  if (consumablesCost > 0) costsDetails.push(`${consumablesCost.toFixed(2)}€ (conso)`);

  if (costsDetails.length > 0) {
    calculations.push(`Avec transformation: ${priceWithWaste.toFixed(2)}€ + ${costsDetails.join(' + ')} = ${costWithTransformation.toFixed(2)}€/m²`);
  }

  // 4. Appliquer les frais généraux
  const costWithOverhead = costWithTransformation * overheadCoefficient;
  if (overheadCoefficient !== 1.0) {
    const overheadPercent = ((overheadCoefficient - 1) * 100).toFixed(0);
    calculations.push(`Avec frais généraux (+${overheadPercent}%): ${costWithOverhead.toFixed(2)}€/m²`);
  }

  const unitCostPrice = costWithOverhead;
  calculations.push(`Coût de revient total: ${unitCostPrice.toFixed(2)}€/m²`);

  // 5. Appliquer le coefficient de marge
  const unitSellingPrice = unitCostPrice * marginCoefficient;
  calculations.push(`Prix de vente (×${marginCoefficient}): ${unitSellingPrice.toFixed(2)}€/m²`);

  const marginAmount = unitSellingPrice - unitCostPrice;
  const marginPercent = ((marginAmount / unitCostPrice) * 100);

  return {
    unitCostPrice: Math.round(unitCostPrice * 100) / 100,
    unitSellingPrice: Math.round(unitSellingPrice * 100) / 100,
    totalPrice: Math.round(unitSellingPrice * 100) / 100,
    marginPercent: Math.round(marginPercent * 100) / 100,
    marginAmount: Math.round(marginAmount * 100) / 100,
    details: {
      calculations
    }
  };
}

export function calculatePricing(params: PricingParameters): PricingResult {
  if (params.calculationMethod === 'block') {
    if (!params.blockPriceM3 || params.sawingCostM3 === undefined || params.cuttingCostM2 === undefined || !params.thickness) {
      throw new Error('Paramètres manquants pour le calcul depuis bloc');
    }

    const result = calculateFromBlock(
      params.blockPriceM3,
      params.sawingCostM3,
      params.cuttingCostM2,
      params.thickness,
      params.wasteFactor,
      params.marginCoefficient,
      params.laborCost,
      params.consumablesCost,
      params.overheadCoefficient
    );

    // Calculer le total basé sur la quantité
    return {
      ...result,
      totalPrice: Math.round(result.unitSellingPrice * params.quantity * 100) / 100
    };
  }

  if (params.calculationMethod === 'slab') {
    if (!params.slabPriceM2) {
      throw new Error('Paramètres manquants pour le calcul depuis tranche');
    }

    const result = calculateFromSlab(
      params.slabPriceM2,
      params.wasteFactor,
      params.fabricationCost || 0,
      params.marginCoefficient,
      params.laborCost,
      params.consumablesCost,
      params.overheadCoefficient
    );

    // Calculer le total basé sur la quantité
    return {
      ...result,
      totalPrice: Math.round(result.unitSellingPrice * params.quantity * 100) / 100
    };
  }

  if (params.calculationMethod === 'manual') {
    if (!params.manualPrice) {
      throw new Error('Prix manuel requis');
    }

    const totalPrice = Math.round(params.manualPrice * params.quantity * 100) / 100;

    return {
      unitCostPrice: 0,
      unitSellingPrice: params.manualPrice,
      totalPrice,
      marginPercent: 0,
      marginAmount: 0,
      details: {
        calculations: ['Prix manuel - Aucun calcul automatique']
      }
    };
  }

  throw new Error('Méthode de calcul invalide');
}

export function calculateQuoteTotals(
  items: { totalPrice: number }[],
  discountPercent: number = 0,
  tvaPercent: number = 20
): {
  subtotalHt: number;
  discountAmount: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
} {
  const subtotalHt = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotalHt * discountPercent) / 100;
  const totalHt = subtotalHt - discountAmount;
  const totalTva = (totalHt * tvaPercent) / 100;
  const totalTtc = totalHt + totalTva;

  return {
    subtotalHt: Math.round(subtotalHt * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalHt: Math.round(totalHt * 100) / 100,
    totalTva: Math.round(totalTva * 100) / 100,
    totalTtc: Math.round(totalTtc * 100) / 100
  };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

export function calculateMarginPercent(sellingPrice: number, costPrice: number): number {
  if (costPrice === 0) return 0;
  return Math.round(((sellingPrice - costPrice) / costPrice) * 100 * 100) / 100;
}

export function getSuggestedMargin(materialType: 'block' | 'slab' | 'manual'): number {
  // Valeurs par défaut suggérées
  switch (materialType) {
    case 'block':
      return 1.55; // 55% de marge
    case 'slab':
      return 1.50; // 50% de marge
    case 'manual':
      return 1.40; // 40% de marge
    default:
      return 1.50;
  }
}

export function getSuggestedWasteFactor(materialType: 'block' | 'slab'): number {
  // Coefficient de perte suggéré
  switch (materialType) {
    case 'block':
      return 1.25; // 25% de perte pour bloc
    case 'slab':
      return 1.20; // 20% de perte pour tranche
    default:
      return 1.20;
  }
}
