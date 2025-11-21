export interface MaterialColorScheme {
  bg: string;
  border: string;
  text: string;
  icon: string;
  hover: string;
}

const materialColors: Record<string, MaterialColorScheme> = {
  granit: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    icon: 'text-gray-600',
    hover: 'hover:bg-gray-200',
  },
  marbre: {
    bg: 'bg-stone-50',
    border: 'border-stone-300',
    text: 'text-stone-800',
    icon: 'text-stone-600',
    hover: 'hover:bg-stone-100',
  },
  quartz: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    icon: 'text-amber-600',
    hover: 'hover:bg-amber-100',
  },
  'pierre naturelle': {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-900',
    icon: 'text-yellow-600',
    hover: 'hover:bg-yellow-100',
  },
  céramique: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-900',
    icon: 'text-sky-600',
    hover: 'hover:bg-sky-100',
  },
  default: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-800',
    icon: 'text-slate-600',
    hover: 'hover:bg-slate-100',
  },
};

export function getMaterialColor(material: string): MaterialColorScheme {
  const normalizedMaterial = material.toLowerCase().trim();

  for (const [key, colors] of Object.entries(materialColors)) {
    if (normalizedMaterial.includes(key)) {
      return colors;
    }
  }

  return materialColors.default;
}

export function getMaterialBadgeColor(material: string): string {
  const normalizedMaterial = material.toLowerCase().trim();

  if (normalizedMaterial.includes('granit')) return 'bg-gray-200 text-gray-800';
  if (normalizedMaterial.includes('marbre')) return 'bg-stone-200 text-stone-800';
  if (normalizedMaterial.includes('quartz')) return 'bg-amber-200 text-amber-900';
  if (normalizedMaterial.includes('pierre')) return 'bg-yellow-200 text-yellow-900';
  if (normalizedMaterial.includes('céramique')) return 'bg-sky-200 text-sky-900';

  return 'bg-slate-200 text-slate-800';
}

export const MATERIAL_TYPES = [
  'Granit',
  'Marbre',
  'Quartz',
  'Pierre naturelle',
  'Céramique',
  'Autre',
];
