import { DebitSheet, DebitItem } from '../types';

export interface PackingSlipData {
  sheetNumber: string;
  date: string;
  commercial: string;
  refChantier?: string;
  numeroARC: string;
  items: DebitItem[];
}

export function generatePackingSlipPDF(sheet: DebitSheet, selectedPalettes?: string[]): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Veuillez autoriser les popups pour générer le PDF');
    return;
  }

  const items = sheet.items || [];
  const itemsByPalette = groupItemsByPalette(items, selectedPalettes);

  const formattedDate = sheet.dateCreation
    ? new Date(sheet.dateCreation).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fiche de Colisage - ${sheet.numeroOS}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      font-size: 12px;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .header h1 {
      color: #1e40af;
      font-size: 24px;
      margin-bottom: 10px;
    }

    .header-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }

    .info-block {
      padding: 8px;
      background: #f3f4f6;
      border-radius: 4px;
    }

    .info-label {
      font-weight: bold;
      color: #4b5563;
      font-size: 10px;
      margin-bottom: 4px;
    }

    .info-value {
      color: #111827;
      font-size: 13px;
      font-weight: 600;
    }

    .palette-section {
      margin-bottom: 30px;
      border: 2px solid #0284c7;
      border-radius: 8px;
      padding: 15px;
      page-break-inside: avoid;
    }

    .palette-header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: white;
      padding: 12px 15px;
      margin: -15px -15px 15px -15px;
      border-radius: 6px 6px 0 0;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .palette-header::before {
      content: '';
      display: inline-block;
      width: 20px;
      height: 20px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/%3E%3C/svg%3E");
      background-size: contain;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background: #e5e7eb;
      padding: 10px 8px;
      text-align: left;
      font-weight: bold;
      color: #374151;
      border: 1px solid #d1d5db;
      font-size: 11px;
    }

    td {
      padding: 8px;
      border: 1px solid #d1d5db;
      color: #1f2937;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 10px;
    }

    .no-palette-section {
      margin-bottom: 30px;
      border: 2px solid #6b7280;
      border-radius: 8px;
      padding: 15px;
      page-break-inside: avoid;
    }

    .no-palette-header {
      background: #6b7280;
      color: white;
      padding: 10px 15px;
      margin: -15px -15px 15px -15px;
      border-radius: 6px 6px 0 0;
      font-size: 16px;
      font-weight: bold;
    }

    @media print {
      body {
        padding: 0;
      }

      .page {
        margin: 0;
        width: 100%;
        min-height: 100vh;
      }

      @page {
        size: A4;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>FICHE DE COLISAGE</h1>
      <div class="header-info">
        <div class="info-block">
          <div class="info-label">Numéro OS</div>
          <div class="info-value">${sheet.numeroOS || '-'}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Date</div>
          <div class="info-value">${formattedDate}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Commercial</div>
          <div class="info-value">${sheet.cial || '-'}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Référence Chantier</div>
          <div class="info-value">${sheet.refChantier || '-'}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Numéro ARC</div>
          <div class="info-value">${sheet.numeroARC || '-'}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Statut</div>
          <div class="info-value">${sheet.fini ? 'Terminé' : 'En cours'}</div>
        </div>
      </div>
    </div>

    ${generatePaletteSections(itemsByPalette)}

    <div class="footer">
      <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      <p>Système de Gestion de Production</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  win.document.write(html);
  win.document.close();
}

function groupItemsByPalette(items: DebitItem[], selectedPalettes?: string[]): Map<number | 'none', DebitItem[]> {
  let filteredItems = items;

  if (selectedPalettes && selectedPalettes.length > 0) {
    filteredItems = items.filter(item => {
      const paletteKey = item.numeroPalette ? String(item.numeroPalette) : 'none';
      return selectedPalettes.includes(paletteKey);
    });
  }

  const grouped = new Map<number | 'none', DebitItem[]>();

  filteredItems.forEach(item => {
    const key = item.numeroPalette ?? 'none';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  const sortedMap = new Map<number | 'none', DebitItem[]>();
  const paletteNumbers = Array.from(grouped.keys())
    .filter(k => k !== 'none')
    .sort((a, b) => (a as number) - (b as number));

  paletteNumbers.forEach(num => {
    sortedMap.set(num, grouped.get(num)!);
  });

  if (grouped.has('none')) {
    sortedMap.set('none', grouped.get('none')!);
  }

  return sortedMap;
}

function generatePaletteSections(itemsByPalette: Map<number | 'none', DebitItem[]>): string {
  let html = '';

  itemsByPalette.forEach((items, paletteNumber) => {
    const isNoPalette = paletteNumber === 'none';
    const sectionClass = isNoPalette ? 'no-palette-section' : 'palette-section';
    const headerClass = isNoPalette ? 'no-palette-header' : 'palette-header';
    const headerText = isNoPalette ? 'Articles sans palette' : `Palette n°${paletteNumber}`;

    html += `
      <div class="${sectionClass}">
        <div class="${headerClass}">${headerText}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">Qté</th>
              <th style="width: 35%;">Description</th>
              <th style="width: 12%;">N° Appareil</th>
              <th style="width: 15%;">Matière</th>
              <th style="width: 13%;">Dimensions (L×l×É)</th>
              <th style="width: 10%;">Finition</th>
              <th style="width: 10%;">Surface/Volume</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${item.quantite}</td>
                <td>${item.description}</td>
                <td>${item.numeroAppareil || '-'}</td>
                <td>${item.matiereItem || '-'}</td>
                <td style="font-family: monospace;">${item.longueur}×${item.largeur}×${item.epaisseur} cm</td>
                <td>${item.finition || '-'}</td>
                <td style="text-align: right; font-weight: 600;">
                  ${item.m2Item && item.m2Item > 0 ? item.m2Item.toFixed(2) + ' m²' : ''}
                  ${item.m3Item && item.m3Item > 0 ? item.m3Item.toFixed(3) + ' m³' : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 10px; text-align: right; font-weight: bold; color: #4b5563;">
          Total articles: ${items.length} |
          Total quantité: ${items.reduce((sum, item) => sum + item.quantite, 0)}
        </div>
      </div>
    `;
  });

  return html;
}
