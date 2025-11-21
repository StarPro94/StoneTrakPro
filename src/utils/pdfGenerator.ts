import { DebitSheet, DebitItem } from '../types';

export interface PackingSlipData {
  sheetNumber: string;
  date: string;
  commercial: string;
  refChantier?: string;
  numeroARC: string;
  items: DebitItem[];
}

export function generatePackingSlipPDF(sheet: DebitSheet): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Veuillez autoriser les popups pour générer le PDF');
    return;
  }

  const itemsByPalette = groupItemsByPalette(sheet.items);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fiche de Colisage - ${sheet.numeroFiche}</title>
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
      border: 2px solid #9333ea;
      border-radius: 8px;
      padding: 15px;
      page-break-inside: avoid;
    }

    .palette-header {
      background: #9333ea;
      color: white;
      padding: 10px 15px;
      margin: -15px -15px 15px -15px;
      border-radius: 6px 6px 0 0;
      font-size: 16px;
      font-weight: bold;
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
          <div class="info-label">Numéro Fiche</div>
          <div class="info-value">${sheet.numeroFiche}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Date</div>
          <div class="info-value">${new Date(sheet.dateFiche).toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Commercial</div>
          <div class="info-value">${sheet.cial}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Référence Chantier</div>
          <div class="info-value">${sheet.refChantier || '-'}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Numéro ARC</div>
          <div class="info-value">${sheet.numeroARC}</div>
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

function groupItemsByPalette(items: DebitItem[]): Map<number | 'none', DebitItem[]> {
  const grouped = new Map<number | 'none', DebitItem[]>();

  items.forEach(item => {
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
