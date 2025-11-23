import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../types';

const COMPANY_INFO = {
  name: 'DBPM',
  address: '27 rue de VALENTON - Z.I. Les Petites Haies',
  city: '94000 CRETEIL',
  phone: 'Tél: 01 XX XX XX XX',
  email: 'Email: contact@dbpm.fr',
  rib: 'FR76 XXXX XXXX XXXX XXXX XXXX XXX',
  logoPath: '/DBPM_logo_bleu-e1527158485928.png'
};

const CGV_TEXT = `INTRODUCTION
Sauf stipulations particulières figurant dans notre confirmation de prix, toute commande implique l'adhésion sans réserve du client aux présentes conditions générales de vente.

1. COMMANDE
Validité des devis : Nos devis sont valables dans le délai d'option consenti, ou à défaut dans les 30 jours de leur envoi. Les commandes reçues deviennent définitives par la confirmation écrite, dûment signée par le client et par versement d'un acompte de 30%.
Actualisation des prix : Nos prix sont actualisables et révisables à compter du 30ème jour suivant l'envoi du devis.
Décompte des surfaces : Surfaces et volumes sont décomptés à l'équarrissement y compris les joints, avec un minimum de 0,1 m² ou 0,02 m³ par pièce.

2. TRANSPORT
Responsabilité : Nos produits voyagent aux risques et périls du destinataire. En cas de retard, manquants ou dommages, il appartient au client de faire des réserves auprès du transporteur.
Le déchargement et les frais d'attente sont à la charge du client.

3. DEMI-PRODUITS
Le client a l'obligation de s'enquérir des dates d'expédition en vue de contrôler la qualité et le mesurage au départ. Si cette vérification n'est pas faite, la marchandise est considérée comme agréée. Nous ne répondons pas des défauts rencontrés à la transformation par le client.

4. PRODUITS FINIS
La pierre est un matériau naturel. Les particularités telles que trous de vers, nœuds, coquilles, géodes, veines cristallines, crapauds ou flammes ne peuvent être considérées comme motifs de refus.
Réclamations : Toute réclamation doit être faite dans les 5 jours suivant la livraison. Aucune réclamation n'est recevable après commencement d'utilisation (pose).

5. PRODUITS DÉCLASSÉS
Les opus et produits de 2ème choix ne bénéficient d'aucune garantie.

6. DÉLAIS
Les délais de livraison sont donnés à titre indicatif. Les retards ne peuvent justifier l'annulation de la commande ou des dommages-intérêts.

7. FORCE MAJEURE
Sont considérés comme cas de force majeure : intempéries, incendie, grève, difficultés d'approvisionnement, etc.

8. RÉSERVE DE PROPRIÉTÉ
Nous nous réservons la propriété des marchandises jusqu'au paiement complet du prix. En cas de non-paiement, nous avons droit à la restitution immédiate des marchandises.

9. PAIEMENT
Nos factures sont payables au siège social. En cas de retard, application d'intérêts au taux légal + 6 points. Clause pénale : 15% des sommes dues avec un minimum de 200€.

10. PRÉCONISATIONS D'EMPLOI
Sols : Suivant DTU 52.1. Coupure de capillarité obligatoire.
Murs : Suivant DTU 55.2.
Entretien : Utiliser un savon neutre (savon noir/Marseille). Proscrire acides, chlore, produits abrasifs.

11. JURIDICTION
Les tribunaux de notre siège social (Créteil) sont seuls compétents.`;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

async function loadLogoAsBase64(logoPath: string): Promise<string | null> {
  try {
    const response = await fetch(logoPath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error);
    return null;
  }
}

function addHeader(doc: jsPDF, quote: Quote, userName: string, logoBase64: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, yPos, 40, 20);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPos += 25;
  doc.text(COMPANY_INFO.name, margin, yPos);
  yPos += 5;
  doc.text(COMPANY_INFO.address, margin, yPos);
  yPos += 5;
  doc.text(COMPANY_INFO.city, margin, yPos);
  yPos += 5;
  doc.text(COMPANY_INFO.phone, margin, yPos);
  yPos += 5;
  doc.text(COMPANY_INFO.email, margin, yPos);

  yPos = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 98, 255);
  doc.text('DEVIS', pageWidth - margin, yPos, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  doc.text(`N° ${quote.quoteReference || 'En attente'}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Date : ${formatDate(quote.quoteDate)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Validité : ${quote.estimatedDelay || '1 mois'}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Commercial : ${userName}`, pageWidth - margin, yPos, { align: 'right' });

  return 70;
}

function addClientInfo(doc: jsPDF, quote: Quote, startY: number) {
  const margin = 20;
  const boxWidth = 90;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, boxWidth, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  let yPos = startY + 7;
  doc.text('CLIENT', margin + 5, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(quote.clientCompany, margin + 5, yPos);

  if (quote.clientContactName) {
    yPos += 5;
    doc.text(quote.clientContactName, margin + 5, yPos);
  }

  if (quote.clientAddress) {
    yPos += 5;
    const addressLines = doc.splitTextToSize(quote.clientAddress, boxWidth - 10);
    doc.text(addressLines, margin + 5, yPos);
    yPos += addressLines.length * 5;
  }

  doc.setFont('helvetica', 'bold');
  yPos = startY + 7;
  const rightMargin = margin + boxWidth + 10;
  doc.text('RÉFÉRENCE CHANTIER', rightMargin, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(quote.siteName || quote.osNumber || '-', rightMargin, yPos);

  return startY + 45;
}

function addItemsTable(doc: jsPDF, quote: Quote, startY: number) {
  const items = quote.items || [];

  const tableData = items.map((item, index) => [
    item.description || '-',
    item.unit || '-',
    item.quantity.toString(),
    formatPrice(item.unitSellingPrice),
    formatPrice(item.totalPrice),
    `${quote.tvaPercent}%`
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['Description', 'Unité', 'Qté', 'PU HT', 'Total HT', 'TVA']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 20, right: 20 }
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

function addTotals(doc: jsPDF, quote: Quote, startY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const labelX = pageWidth - 90;
  const valueX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = startY;

  doc.text('Sous-total HT :', labelX, yPos);
  doc.text(formatPrice(quote.subtotalHt), valueX, yPos, { align: 'right' });
  yPos += 7;

  if (quote.discountAmount > 0) {
    doc.text(`Remise (${quote.discountPercent}%) :`, labelX, yPos);
    doc.text(`-${formatPrice(quote.discountAmount)}`, valueX, yPos, { align: 'right' });
    yPos += 7;

    doc.text('Total HT après remise :', labelX, yPos);
    doc.text(formatPrice(quote.totalHt), valueX, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.text(`TVA (${quote.tvaPercent}%) :`, labelX, yPos);
  doc.text(formatPrice(quote.totalTva), valueX, yPos, { align: 'right' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NET À PAYER TTC :', labelX, yPos);
  doc.text(formatPrice(quote.totalTtc), valueX, yPos, { align: 'right' });

  return yPos + 15;
}

function addBankingInfo(doc: jsPDF, quote: Quote, startY: number) {
  const margin = 20;
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPos = Math.max(startY, pageHeight - 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS BANCAIRES', margin, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(`RIB : ${COMPANY_INFO.rib}`, margin, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('DÉLAI DE RÉALISATION', margin, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(`Délai estimé : ${quote.estimatedDelay || '1 mois'}`, margin, yPos);
  yPos += 5;

  const noteText = 'Le délai définitif sera communiqué à réception de tous les éléments nécessaires à la fabrication.';
  const noteLines = doc.splitTextToSize(noteText, 170);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(noteLines, margin, yPos);
}

function addCGVPage(doc: jsPDF) {
  doc.addPage();

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const columnWidth = (pageWidth - (margin * 4)) / 3;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 98, 255);
  doc.text('CONDITIONS GÉNÉRALES DE VENTE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const paragraphs = CGV_TEXT.split('\n\n');
  let yPos = 35;
  let column = 0;
  let xPos = margin;

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n');
    const isTitle = lines[0].match(/^[A-Z\d\.\s]+$/) || lines[0] === 'INTRODUCTION';

    if (isTitle) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    for (const line of lines) {
      const wrappedLines = doc.splitTextToSize(line, columnWidth);

      for (const wrappedLine of wrappedLines) {
        if (yPos > pageHeight - margin) {
          column++;
          if (column >= 3) {
            doc.addPage();
            column = 0;
            yPos = 35;
          } else {
            yPos = 35;
          }
          xPos = margin + (column * (columnWidth + margin));
        }

        doc.text(wrappedLine, xPos, yPos);
        yPos += 4;
      }
    }

    yPos += 3;
  }
}

export async function generateQuotePDF(quote: Quote, userName: string): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const logoBase64 = await loadLogoAsBase64(COMPANY_INFO.logoPath);

  let yPos = addHeader(doc, quote, userName, logoBase64);

  yPos = addClientInfo(doc, quote, yPos);

  yPos = addItemsTable(doc, quote, yPos);

  yPos = addTotals(doc, quote, yPos);

  addBankingInfo(doc, quote, yPos);

  addCGVPage(doc);

  return doc.output('blob');
}

export function downloadQuotePDF(quote: Quote, userName: string) {
  generateQuotePDF(quote, userName).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Devis_${quote.quoteReference || 'draft'}_${formatDate(new Date())}.pdf`;
    link.download = fileName.replace(/\//g, '-');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
