import { DebitItem } from '../types';

export interface PaletteInfo {
  numero: string;
  itemCount: number;
  totalQuantity: number;
  items: DebitItem[];
}

export function extractPalettesFromItems(items: DebitItem[]): PaletteInfo[] {
  const paletteMap = new Map<string, DebitItem[]>();

  items.forEach(item => {
    const paletteNum = item.numeroPalette ? String(item.numeroPalette) : 'none';
    if (!paletteMap.has(paletteNum)) {
      paletteMap.set(paletteNum, []);
    }
    paletteMap.get(paletteNum)!.push(item);
  });

  const palettes: PaletteInfo[] = [];

  paletteMap.forEach((paletteItems, numero) => {
    const totalQuantity = paletteItems.reduce((sum, item) => sum + item.quantite, 0);

    palettes.push({
      numero,
      itemCount: paletteItems.length,
      totalQuantity,
      items: paletteItems
    });
  });

  palettes.sort((a, b) => {
    if (a.numero === 'none') return 1;
    if (b.numero === 'none') return -1;
    return parseInt(a.numero) - parseInt(b.numero);
  });

  return palettes;
}
