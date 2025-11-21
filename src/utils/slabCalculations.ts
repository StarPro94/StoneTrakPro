import { Slab } from '../types';

export function calculateSlabArea(slab: Slab): number {
  return (slab.length * slab.width) / 10000;
}

export function calculateSlabVolume(slab: Slab): number {
  return (slab.length * slab.width * slab.thickness) / 1000000;
}

export function formatDimensions(
  length: number,
  width: number,
  thickness: number
): string {
  return `${length} × ${width} × ${thickness} cm`;
}

export function formatArea(areaM2: number): string {
  return `${areaM2.toFixed(2)} m²`;
}

export function formatVolume(volumeM3: number): string {
  return `${volumeM3.toFixed(3)} m³`;
}

export function calculateCompatibilityScore(
  required: { length: number; width: number; thickness: number },
  slab: Slab,
  tolerance: number = 5
): number {
  const lengthDiff = Math.abs(slab.length - required.length);
  const widthDiff = Math.abs(slab.width - required.width);
  const thicknessDiff = Math.abs(slab.thickness - required.thickness);

  if (
    lengthDiff > tolerance ||
    widthDiff > tolerance ||
    thicknessDiff > tolerance
  ) {
    return 0;
  }

  const lengthScore = Math.max(0, 100 - (lengthDiff / required.length) * 100);
  const widthScore = Math.max(0, 100 - (widthDiff / required.width) * 100);
  const thicknessScore = Math.max(
    0,
    100 - (thicknessDiff / required.thickness) * 100
  );

  return Math.round((lengthScore * 0.3 + widthScore * 0.3 + thicknessScore * 0.4));
}

export function getSlabAgeDays(createdAt: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export const THICKNESS_OPTIONS = [
  { value: 2, label: '2 cm' },
  { value: 3, label: '3 cm' },
  { value: 4, label: '4 cm' },
  { value: 5, label: '5 cm' },
  { value: 6, label: '6 cm' },
];

export const PARK_POSITIONS = {
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  cols: [1, 2, 3, 4, 5, 6, 7, 8],
};

export function generateAllPositions(): string[] {
  const positions: string[] = [];
  for (const row of PARK_POSITIONS.rows) {
    for (const col of PARK_POSITIONS.cols) {
      positions.push(`${row}${col}`);
    }
  }
  return positions;
}
