import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../types';

const COMPANY_INFO = {
  name: 'DBPM',
  tagline: 'LA PIERRE QUE VOUS CHERCHEZ',
  address: '27 rue de VALENTON - Z.I. Les Petites Haies - 94000 CRETEIL - France',
  phone: 'Tél. : 01 48 99 82 50',
  email: 'Contact@dbpm.fr',
  bank: 'CEPAFRPP751',
  iban: 'FR76 1751 5900 0008 0217 0165 344',
  currency: 'EURO',
  legal: 'SA CAPITAL 270 000 € - RCS CRETEIL B 542 703 673 - CODE TVA FR 78 542 703 673 - CODE APE 267 Z',
  legalNotice: 'TOUTES NOS VENTES SONT CONCLUES CONFORMEMENT AUX CONDITIONS GENERALES DE VENTE ET A LA CLAUSE DE RESERVE DE PROPRIETE',
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
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
  return formatted.replace(/\s/g, '') + ' €';
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

function addHeader(doc: jsPDF, logoBase64: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logoBase64) {
    try {
      const logoWidth = 60;
      const logoHeight = 13;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, 10, logoWidth, logoHeight);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_INFO.tagline, pageWidth / 2, 26, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIRMATION DE PRIX', pageWidth / 2, 35, { align: 'center' });

  return 40;
}

function addQuoteInfoBox(doc: jsPDF, quote: Quote, userName: string) {
  const margin = 10;
  let yPos = 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  doc.text(`DEVIS \u00e0 ${formatDate(quote.quoteDate).replace(/\//g, ' ')}`, margin, yPos);
  yPos += 4;
  doc.text(`DU        ${formatDate(new Date())}`, margin, yPos);
  yPos += 4;
  doc.text(`PAGE      1/2`, margin, yPos);
  yPos += 4;
  doc.text(`Par       ${userName}`, margin, yPos);
}

function addReferencesBox(doc: jsPDF, quote: Quote, startY: number) {
  const margin = 10;
  const boxWidth = 95;
  const boxHeight = 45;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, startY, boxWidth, boxHeight, 3, 3);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let yPos = startY + 6;
  doc.text('R\u00c9F\u00c9RENCES', margin + 3, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text('Chantier :', margin + 3, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.siteName || quote.osNumber || '-', margin + 20, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(`Banque : ${COMPANY_INFO.bank}`, margin + 3, yPos);
  yPos += 4;
  doc.text(`IBAN : ${COMPANY_INFO.iban}`, margin + 3, yPos);
  yPos += 4;
  doc.text(`Devise: ${COMPANY_INFO.currency}`, margin + 3, yPos);

  yPos += 5;
  doc.text(`Validit\u00e9 : ${quote.estimatedDelay || '1 mois'}`, margin + 3, yPos);

  yPos += 5;
  doc.text(`D\u00e9lai estim\u00e9 (hors conges) : ${quote.estimatedDelay || '6 \u00e0 7 SEM'}`, margin + 3, yPos);

  yPos += 5;
  doc.setFontSize(7);
  doc.setTextColor(255, 0, 0);
  const noteLines = doc.splitTextToSize('Le d\u00e9lai d\u00e9finitif sera communiqu\u00e9 \u00e0 r\u00e9ception de tous les \u00e9l\u00e9ments n\u00e9cessaires \u00e0 la fabrication', boxWidth - 6);
  doc.text(noteLines, margin + 3, yPos);

  doc.setTextColor(0, 0, 0);

  return startY + boxHeight + 5;
}

function addClientBox(doc: jsPDF, quote: Quote, startY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const boxWidth = 95;
  const boxHeight = 45;
  const boxX = pageWidth - margin - boxWidth;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, startY, boxWidth, boxHeight, 3, 3);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let yPos = startY + 6;
  doc.text(quote.clientCompany.toUpperCase(), boxX + 3, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += 5;
  if (quote.clientContactName) {
    doc.text(quote.clientContactName, boxX + 3, yPos);
    yPos += 4;
  }

  if (quote.clientAddress) {
    const addressLines = doc.splitTextToSize(quote.clientAddress, boxWidth - 6);
    doc.text(addressLines, boxX + 3, yPos);
    yPos += addressLines.length * 4;
  }

  yPos += 2;
  if (quote.clientPhone) {
    doc.text(`Tel :  ${quote.clientPhone}`, boxX + 3, yPos);
    yPos += 4;
  }

  if (quote.clientEmail) {
    doc.text(`Mail : ${quote.clientEmail}`, boxX + 3, yPos);
  }

  return startY + boxHeight + 5;
}

function addItemsTable(doc: jsPDF, quote: Quote, startY: number) {
  const items = quote.items || [];

  const tableData = items.map((item) => [
    item.description || '-',
    item.unit || '-',
    item.quantity.toString(),
    formatPrice(item.unitSellingPrice),
    formatPrice(item.totalPrice)
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['Description', 'Unit\u00e9', 'Qt\u00e9', 'PU', 'TOTAL HT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 8,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 10, right: 10 }
  });

  return (doc as any).lastAutoTable.finalY + 5;
}

function addEcheanceAndTotals(doc: jsPDF, quote: Quote, startY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let yPos = startY;
  doc.text('\u00c9ch\u00e9ance :', margin, yPos);
  yPos += 5;

  doc.setFontSize(7);
  doc.text('Conditions habituelles', margin + 15, yPos);
  yPos += 5;

  const tvaTableData = [[
    '3',
    formatPrice(quote.totalHt),
    `${quote.tvaPercent.toFixed(2)}%`,
    formatPrice(quote.totalTva)
  ]];

  autoTable(doc, {
    startY: yPos,
    head: [['Code', 'Base', 'Taux', 'Montant']],
    body: tvaTableData,
    foot: [['Total', formatPrice(quote.totalHt), '', formatPrice(quote.totalTva)]],
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 7,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin }
  });

  const rightBoxX = pageWidth - margin - 60;
  const rightBoxY = startY;
  const rightBoxWidth = 60;
  const rightBoxHeight = 25;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(rightBoxX, rightBoxY, rightBoxWidth, rightBoxHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let rightYPos = rightBoxY + 6;

  doc.text('Prix HT', rightBoxX + 3, rightYPos);
  doc.text(formatPrice(quote.totalHt), rightBoxX + rightBoxWidth - 3, rightYPos, { align: 'right' });
  rightYPos += 5;

  doc.text('TVA', rightBoxX + 3, rightYPos);
  doc.text(formatPrice(quote.totalTva), rightBoxX + rightBoxWidth - 3, rightYPos, { align: 'right' });
  rightYPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Net \u00e0 Payer', rightBoxX + 3, rightYPos);
  doc.text(formatPrice(quote.totalTtc), rightBoxX + rightBoxWidth - 3, rightYPos, { align: 'right' });

  return Math.max((doc as any).lastAutoTable.finalY, rightBoxY + rightBoxHeight) + 10;
}

function addFirstPageFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let yPos = pageHeight - 15;

  doc.text(`${COMPANY_INFO.name}  ${COMPANY_INFO.address}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;
  doc.text(`${COMPANY_INFO.phone} - ${COMPANY_INFO.email}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 4;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.legal, pageWidth / 2, yPos, { align: 'center' });

  yPos += 4;
  doc.setLineWidth(0.1);
  doc.setLineDash([1, 1]);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  doc.setLineDash([]);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.legalNotice, pageWidth / 2, yPos, { align: 'center' });
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

  addQuoteInfoBox(doc, quote, userName);

  let yPos = addHeader(doc, logoBase64);

  addReferencesBox(doc, quote, yPos);
  yPos = addClientBox(doc, quote, yPos);

  yPos = addItemsTable(doc, quote, yPos);

  yPos = addEcheanceAndTotals(doc, quote, yPos);

  addFirstPageFooter(doc);

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
