import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../types';

const COMPANY_INFO = {
  name: 'DBPM',
  address: '27 rue de VALENTON - Z.I. Les Petites Haies - 94000 CRETEIL - France',
  phone: 'Tél. : 01 48 99 82 50',
  email: 'Contact@dbpm.fr',
  rib: 'FR76 XXXX XXXX XXXX XXXX XXXX XXX',
  legal: 'SA CAPITAL 270 000 € - RCS CRETEIL B 542 703 673 - CODE TVA FR 78 542 703 673 - CODE APE 267 Z',
  logoPath: '/Image1 copy.png'
};

const CGV_TEXT = `INTRODUCTION
Sauf stipulations particulières figurant dans notre confirmation de prix, toute commande implique l'adhésion sans réserve du client aux présentes conditions générales de vente (qui prévalent notamment vis-à-vis des écrits du client), du seul fait de leur communication au client par notre devis ou confirmation de prix, par toute facture ou autre document émis par nous antérieurement, ou en cas de vente-comptoir, du fait de la signature du bon de livraison ou de l'acceptation de la marchandise par le client.
Réception de marchandise partielle : En cas de réception partielle de la marchandise, l'intégralité de la commande devra être payée. Délai de retrait des marchandises : À réception de la facture, un délai de retrait des marchandises de 4 semaines est accordé pour leur stockage dans nos locaux. En cas de dépassement de délai : Si le délai de retrait est dépassé, nous nous réservons le droit d'appliquer une majoration pour l'occupation de surface en fonction du nombre de palettes ou assimilés, soit 40 € HT par palette et par jour ouvré.

1. COMMANDE
Validité des devis : Nos devis sont valables dans le délai d'option consenti, ou à défaut dans les 30 jours de leur envoi. Les commandes reçues deviennent définitives par la confirmation écrite, dûment signée par le client et par versement d'un acompte de 30% sauf en cas de demande particulière du client.
Actualisation des prix : Nos prix sont actualisables et révisables à compter du 30ème jour suivant l'envoi du devis. Les ajustements seront communiqués par écrit au client.
Taxes et impôts : Tous impôts et taxes sont à la charge du client, même si le prix est établi pour la marchandise rendue.
Décompte des surfaces et volumes : Surfaces et volumes sont décomptés à l'équarrissement y compris les joints, avec un minimum de 0,1 m² ou 0,02 m³ par pièce. Dans les calculs de longueur ou de surface, toutes dimensions sont arrondies au centimètre supérieur si elles comportent des millimètres et décomptées pour 20 cm au minimum.

2. TRANSPORT
Responsabilité : Nos produits voyagent aux risques et périls du destinataire. En cas de retard, de manquants, d'épaufrures ou autres dommages au cours du transport, il appartient au client de faire des réserves auprès du transporteur, conformément aux conditions générales d'intervention du transporteur, dont il aura à prendre connaissance. À défaut, le client ne pourra pas nous opposer les exceptions que pourrait faire valoir à son égard le transporteur.
Clauses de non-responsabilité : Les clauses de non-responsabilité stipulées par certains transporteurs ne nous rendent pas responsables. Même en cas de vente franco, le déchargement et, s'il y en a, les frais d'attente sont à la charge du client.

3. DEMI-PRODUITS
Contrôle qualité : Les demi-produits, même au cas d'un prix franco, sont livrés pour marchandises et emballages reconnus et agréés au départ de l'expédition. Le client a l'obligation de s'enquérir des dates d'expédition, en vue de contrôler la qualité, le mesurage, etc., comme il le jugera nécessaire. Si cette vérification n'est pas faite, la marchandise et l'emballage sont considérés comme définitivement agréés.
Responsabilité : Nous ne répondons en aucun cas des défauts pouvant être rencontrés à la transformation. Le fabricant transformateur est seul responsable de la qualité des produits usinés par ses soins et de l'usage auquel il les destine.

4. PRODUITS FINIS
Non-conformité : L'échantillon définit la provenance, le type, la tonalité générale, il n'implique pas l'identité de nuance, dessin et veinage de l'échantillon de la fourniture. Le marbre ordinairement qualifié blanc est moucheté, nuagé ou veiné gris. Les particularités naturelles telles que trous de vers, nœuds, coquilles, géodes, strates, veines cristallines, points de rouille, crapauds, flammes, etc., ne peuvent être considérées comme motifs de refus, ni donner lieu à une réduction de prix.
Réclamations : Toute réclamation, pour être prise en compte, doit être accompagnée du bon de livraison ou de sa copie, dans les CINQ JOURS de la livraison, et préciser les fournitures incriminées et les motifs de la réclamation. Aucune réclamation pour non-conformité aux stipulations de la commande n'est recevable après commencement d'utilisation. Notre garantie ne saurait aller au-delà du remplacement pur et simple de notre fourniture, à l'exclusion de toute indemnisation ou dommages-intérêts.

5. PRODUITS DÉCLASSÉS
Garantie : Les opus, ainsi que tous produits qualifiés de 2ème choix, constituent des produits déclassés ne bénéficiant pas de garantie et ne pouvant faire l'objet d'aucune réclamation.

6. POSE PAR NOS SOINS
Sous-traitance : Si nous assurons la pose, nous nous réservons le droit de sous-traiter en tout ou partie à une firme spécialisée. La réception des ouvrages sera considérée comme acquise sans réserve, sauf refus motivé opposé par le client.
Réclamations : Toutes réclamations concernant la marchandise livrée (conformité à la commande, vice apparent) doivent être faites dans un délai de 5 jours suivant la date de réception de la marchandise. La défectuosité de l'une de nos marchandises, reconnue par nous-mêmes, ne nous oblige qu'à son remplacement pur et simple à l'exclusion des préjudices directs ou indirects de cette défectuosité, qui ne pourront jamais être mis à notre charge.

7. DÉLAIS
Indications : Les délais de livraison sont donnés à titre indicatif et sans engagement. Ils sont maintenus dans la limite du possible. Les retards apportés dans ces livraisons ne peuvent en aucun cas, y compris en cas de grève, justifier l'annulation de la commande ou le droit à dommages-intérêts. Le délai ne court qu'à partir de la réception de la totalité des documents d'exécution définitifs (spécifications, plans, listes de débit, gabarits, etc.) approuvés par le client et du paiement de l'acompte éventuellement prévu.

8. FORCE MAJEURE
Exonération : Tous les cas fortuits et de force majeure sont réservés à notre profit et dégagent pleinement notre responsabilité. Sont considérés comme tels : les intempéries, l'incendie, l'inondation, les épidémies, la guerre, les émeutes, la grève ou le lock-out, les difficultés d'approvisionnement en matière première ou en énergie, les perturbations dans la fabrication ou les transports et, plus généralement, tout événement rendant déficitaire la fabrication ou la livraison.

9. RÉSERVE DE PROPRIÉTÉ
Propriété jusqu'au paiement : Nous nous réservons la propriété des marchandises vendues par nous, jusqu'au paiement effectif et total de leur prix, en principal et intérêts. Dès l'enlèvement, le client assume la garde et les risques desdites marchandises, mais nous en permet l'accès. Il a l'obligation de s'assurer pour garantir notre indemnisation contre toutes pertes et dégâts.
Non-paiement : Nous avons droit à la restitution immédiate de toutes marchandises non complètement payées, sur simple lettre recommandée, inventaire contradictoire ou sommation d'huissier, en cas de non-paiement d'un seul terme à son échéance. Il en est de même en cas de faillite personnelle, état de cessation des paiements, liquidation amiable ou judiciaire du client, dont celui-ci devra nous aviser sous trois jours, afin que nous puissions revendiquer nos marchandises.
Évaluation en cas de reprise : En cas de reprise du matériel par l'exercice de la présente clause de réserve de propriété, l'évaluation du matériel objet de la reprise sera fixée à 50 % de son prix d'achat hors taxes, l'acheteur restant tenu au paiement d'une indemnité égale à la différence, soit 50 % du prix d'achat hors taxes. Cette indemnité se compensera avec les acomptes éventuellement versés.

10. PAIEMENT
Modalités : Nos factures sont payables au siège social. Tout autre mode de paiement ne peut être authentifié que par un reçu dûment signé par nous. Sauf pour les ventes à des clients non en compte qui sont payables avant l'enlèvement, nos factures, quelle qu'en soit la date, sont payables à 30 jours de la date de mise à disposition.
Retards de paiement : Les paiements ne peuvent être retardés au-delà du terme pour quelque cause que ce soit. En cas de détérioration manifeste du crédit du client, nous sommes en droit d'exiger les garanties que nous jugeons convenables et, en cas de non-satisfaction, de suspendre l'exécution des contrats en cours ou d'en prononcer la résolution. Toute somme due porte de plein droit intérêt à partir de sa date d'exigibilité au taux d'intérêt légal + 6 points. Un règlement partiel est imputé en priorité sur ces intérêts de retard, puis sur les dettes les plus anciennes du client.

11. CLAUSE PÉNALE
Recouvrement : Après mise en demeure, les frais de recouvrement occasionnés donnent lieu au paiement de 15 % des sommes dues, avec un minimum de 200 euros sans préjudice des intérêts de retard sus-stipulés.

12. JURIDICTION
Compétence : Toutes relations entre nos clients et nous, de même que l'interprétation ou l'application des présentes conditions générales de vente, sont soumises à la loi française. Les tribunaux de notre siège social sont seuls compétents pour tout litige, même en cas d'appel en garantie, référé ou pluralité de défendeurs.

13. PRÉCONISATIONS D'EMPLOI POUR LES SOLS ET LES MURS
Matériaux naturels : Le matériau naturel peut être endommagé ou taché par des produits mis à son contact (colles, mastics, ciments, chaux, sables, isolants, détergents...). Une vérification préalable et systématique doit être faite sur échantillon.

14. SOLS
Normes et préconisations : Suivant DTU 52.1, CPT 2478 du CSTB, NFB 10601, NFB 10401.
Coupure de capillarité par interposition systématique d'un film imperméable (polyane ou équivalent) entre support et mortier de pose y compris relevés.
Joints périphériques libres, fractionnement des surfaces supérieures à 36 m² et des longueurs supérieures à 6 m.
Entre carreaux largeur nominale de 1 mm au minimum.
Fractionnement des surfaces supérieures à 25 m².
Joints périphériques garnis par mastic élastomère.
Pentes supérieures à 1 cm/m pour le dallage pierre comme pour son support.
Sur étanchéité : pose directe interdite, fractionnement tous les 10 m² ou 4 m.

15. MURS
Normes et préconisations : Suivant DTU 55.2, CPT 2234, 2235 et 2548 du CSTB, NFB 10601, NFB 10401.
Assurer à la base du revêtement une coupure de capillarité.
Placer en partie supérieure une protection par bavette, tablette, couverture.

16. ENTRETIEN
Recommandations : Éliminer les poussières et laver à la serpillière humide ou par brossage mécanique, en utilisant un minimum d'eau additionnée, si nécessaire, d'un savon neutre (savon noir ou de Marseille, en paillettes). Proscrire les détergents contenant des alcalis libres, les produits contenant des acides même dilués, du chlore (eau de Javel), les produits abrasifs récurants, gras, silicones, les vernis, les solvants, les hydrofuges. Leur utilisation, sauf accord préalable et formel de notre part, dégage pleinement notre responsabilité.
Traitements de surface : Les traitements de surface exécutés après pose tels que ponçage, masticage, cristallisation, encausticage, constituent des travaux supplémentaires. Ils doivent être confiés à des marbriers spécialisés.`;

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
      doc.addImage(logoBase64, 'PNG', margin, yPos, 70, 15);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  yPos += 25;
  doc.text(COMPANY_INFO.address, margin, yPos);
  yPos += 4;
  doc.text(`${COMPANY_INFO.phone} - ${COMPANY_INFO.email}`, margin, yPos);

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

  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const columnWidth = (pageWidth - (margin * 4)) / 3;
  const footerHeight = 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 98, 255);
  doc.text('CONDITIONS GÉNÉRALES DE VENTE', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);

  const paragraphs = CGV_TEXT.split('\n\n');
  let yPos = 22;
  let column = 0;
  let xPos = margin;

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n');
    const isTitle = lines[0].match(/^[\d]+\./) || lines[0] === 'INTRODUCTION';

    if (isTitle) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    for (const line of lines) {
      const wrappedLines = doc.splitTextToSize(line, columnWidth);

      for (const wrappedLine of wrappedLines) {
        if (yPos > pageHeight - margin - footerHeight) {
          column++;
          if (column >= 3) {
            break;
          } else {
            yPos = 22;
          }
          xPos = margin + (column * (columnWidth + margin));
        }

        doc.text(wrappedLine, xPos, yPos);
        yPos += 2.8;
      }
    }

    yPos += 1.5;
  }

  addCGVFooter(doc);
}

function addCGVFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  const yPos = pageHeight - 10;

  doc.text(COMPANY_INFO.address, pageWidth / 2, yPos, { align: 'center' });
  doc.text(`${COMPANY_INFO.phone} - ${COMPANY_INFO.email}`, pageWidth / 2, yPos + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.legal, pageWidth / 2, yPos + 7, { align: 'center' });
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
