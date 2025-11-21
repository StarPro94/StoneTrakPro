import { Slab } from '../types';

export function generateQRCodeData(slab: Slab): string {
  const data = {
    id: slab.id,
    position: slab.position,
    material: slab.material,
    dimensions: `${slab.length}x${slab.width}x${slab.thickness}`,
    status: slab.status,
  };
  return JSON.stringify(data);
}

export function generateQRCodeURL(slab: Slab): string {
  const data = generateQRCodeData(slab);
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
}

export function downloadQRCode(slab: Slab): void {
  const url = generateQRCodeURL(slab);
  const link = document.createElement('a');
  link.href = url;
  link.download = `qr-${slab.position}-${slab.id.substring(0, 8)}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
