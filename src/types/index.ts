export interface DebitSheet {
  id: string;
  cial: string;
  numeroOS: string;
  nomClient: string;
  fourniture: string;
  epaisseur: string;
  numeroARC: string;
  dateArc: Date;
  delai: string;
  m2: number;
  m3: number;
  fini: boolean;
  livre: boolean;
  dateCreation: Date;
  dateFinition?: Date;
  dateLivraison?: Date;
  blocTranche?: string;
  refChantier?: string;
  devisNumero?: string;
  machineId?: string;
  items?: DebitItem[];
}

export interface DebitItem {
  id: string;
  description: string;
  longueur: number; // en cm
  largeur: number; // en cm
  epaisseur: number; // en cm
  quantite: number;
  termine: boolean;
  numeroAppareil?: string;
  matiereItem?: string;
  finition?: string;
  m2Item?: number;
  m3Item?: number;
  numeroPalette?: number;
}

export interface WeeklyReport {
  week: string;
  startDate: Date;
  endDate: Date;
  totalM2: number;
  totalM3: number;
  completedOrders: number;
  deliveredOrders: number;
}

export interface Slab {
  id: string;
  userId: string;
  position: string;
  material: string;
  length: number;
  width: number;
  thickness: number;
  status: 'dispo' | 'réservé';
  debitSheetId?: string;
  createdAt: Date;
  updatedAt: Date;
  numeroOS?: string;
  refChantier?: string;
  notes?: string;
  photos?: SlabPhoto[];
  priceEstimate?: number;
  supplier?: string;
  lastMovedAt?: Date;
  qrCode?: string;
}

export interface SlabPhoto {
  id: string;
  slabId: string;
  userId: string;
  url: string;
  caption?: string;
  fileSize?: number;
  uploadedAt: Date;
}

export interface SlabHistory {
  id: string;
  slabId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'move';
  oldValues?: any;
  newValues?: any;
  createdAt: Date;
}

export interface SlabStatistics {
  totalSlabs: number;
  availableSlabs: number;
  reservedSlabs: number;
  totalPositionsOccupied: number;
  totalSurfaceM2: number;
  totalVolumeM3: number;
  totalEstimatedValue: number;
  oldSlabsCount: number;
  materials: string[];
}

export interface SlabFilter {
  search?: string;
  materials?: string[];
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
  minThickness?: number;
  maxThickness?: number;
  status?: ('dispo' | 'réservé')[];
  positions?: string[];
}

export interface SlabMatchResult {
  slab: Slab;
  compatibilityScore: number;
  dimensionMatch: {
    lengthDiff: number;
    widthDiff: number;
    thicknessDiff: number;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Machine {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingCatalogItem {
  id: string;
  reference: string;
  designation: string;
  poidsUnitaire: number;
  category?: string;
  layherReference?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingSite {
  id: string;
  userId: string;
  numero: string;
  nom: string;
  adresse?: string;
  status: 'actif' | 'termine';
  dateDebut?: Date;
  dateFin?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingList {
  id: string;
  userId: string;
  numero: string;
  type: 'livraison' | 'reception';
  siteId?: string;
  site?: ScaffoldingSite;
  date: Date;
  preparateur?: string;
  receptionnaire?: string;
  transporteur?: string;
  status: 'brouillon' | 'pret' | 'en_cours' | 'termine';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ScaffoldingListItem[];
}

export interface ScaffoldingListItem {
  id: string;
  listId: string;
  catalogItemId: string;
  catalogItem?: ScaffoldingCatalogItem;
  quantite: number;
  poidsTotal: number;
  locationAbbeville?: number;
  locationBeauvais?: number;
  locationSemi?: number;
  isLayherRental: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingLayherRental {
  id: string;
  userId: string;
  catalogItemId: string;
  catalogItem?: ScaffoldingCatalogItem;
  siteId?: string;
  site?: ScaffoldingSite;
  quantite: number;
  dateLocation: Date;
  dateRetourPrevue?: Date;
  dateRetourEffective?: Date;
  status: 'en_cours' | 'retourne';
  coutEstime: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingDamagedItem {
  id: string;
  userId: string;
  catalogItemId: string;
  catalogItem?: ScaffoldingCatalogItem;
  quantite: number;
  description?: string;
  dateConstat: Date;
  coutReparation: number;
  status: 'en_attente' | 'en_reparation' | 'repare' | 'rebut';
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingStockGlobal {
  id: string;
  userId: string;
  catalogItemId: string;
  reference: string;
  designation: string;
  poidsUnitaire: number;
  category?: string;
  quantiteTotale: number;
  quantiteDisponible: number;
  quantiteSurChantier: number;
  quantiteHs: number;
  quantiteLayher: number;
  poidsTotal: number;
  poidsDisponible: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingStockMovement {
  id: string;
  userId: string;
  catalogItemId: string;
  type: 'entree' | 'sortie' | 'retour' | 'hs' | 'reparation' | 'rebut' | 'layher_location' | 'layher_retour';
  quantite: number;
  source?: string;
  destination?: string;
  siteId?: string;
  listId?: string;
  notes?: string;
  createdAt: Date;
}

export interface ScaffoldingSiteInventory {
  id: string;
  siteId: string;
  catalogItemId: string;
  reference: string;
  designation: string;
  poidsUnitaire: number;
  quantiteLivree: number;
  quantiteRecue: number;
  quantiteActuelle: number;
  poidsActuel: number;
  lastMovementAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScaffoldingLayherStock {
  id: string;
  userId: string;
  catalogItemId: string;
  catalogItem?: ScaffoldingCatalogItem;
  quantite: number;
  dateLocation: Date;
  dateRetourPrevue?: Date;
  dateRetourEffective?: Date;
  numeroCommande: string;
  coutLocation?: number;
  status: 'en_cours' | 'retourne';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAvailability {
  disponible: boolean;
  quantiteDisponible: number;
  quantiteManquante: number;
}

export interface ScaffoldingMaterialOnSite {
  catalogItemId: string;
  reference: string;
  designation: string;
  quantiteLivree: number;
  quantiteRecue: number;
  quantiteActuelle: number;
}

export interface ScaffoldingSiteSummary {
  id: string;
  numero: string;
  nom: string;
  adresse?: string;
  status: 'actif' | 'termine';
  dateDebut?: Date;
  dateFin?: Date;
  nbLivraisons: number;
  nbReceptions: number;
  derniereLivraison?: Date;
  derniereReception?: Date;
  joursDepuisDerniereLivraison?: number;
}

export interface ScaffoldingFilter {
  search?: string;
  siteId?: string;
  type?: 'livraison' | 'reception';
  status?: ('brouillon' | 'pret' | 'en_cours' | 'termine')[];
  dateDebut?: Date;
  dateFin?: Date;
  preparateur?: string;
  transporteur?: string;
}

export interface Material {
  id: string;
  name: string;
  type: 'tranche' | 'bloc' | 'both';
  thickness: number | null;
  isActive: boolean;
  description: string | null;
  ref?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Block {
  id: string;
  userId: string;
  ligne: string;
  material: string;
  length: number;
  width: number;
  height: number;
  volume: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour le module de Chiffrage et Devis
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type CalculationMethod = 'block' | 'slab' | 'manual';

export interface Quote {
  id: string;
  clientName: string;
  projectName: string | null;
  quoteDate: Date;
  validityPeriod: string;
  status: QuoteStatus;
  subtotalHt: number;
  discountPercent: number;
  discountAmount: number;
  totalHt: number;
  tvaPercent: number;
  totalTva: number;
  totalTtc: number;
  notes: string | null;
  paymentConditions: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  itemOrder: number;
  description: string;
  materialId: string | null;
  materialName: string | null;
  quantity: number;
  unit: string;
  thickness: number | null;
  calculationMethod: CalculationMethod;
  sourcePrice: number | null;
  sawingCost: number | null;
  wasteFactor: number;
  marginCoefficient: number;
  laborCost: number;
  consumablesCost: number;
  fabricationCost: number;
  unitCostPrice: number | null;
  unitSellingPrice: number;
  totalPrice: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingParameters {
  calculationMethod: CalculationMethod;
  materialId?: string;
  materialName?: string;
  quantity: number;
  unit: string;
  thickness?: number;

  // Pour calcul depuis bloc
  blockPriceM3?: number;
  sawingCostM2?: number;

  // Pour calcul depuis tranche
  slabPriceM2?: number;
  fabricationCost?: number;

  // Commun aux deux
  wasteFactor: number;
  marginCoefficient: number;
  laborCost: number;
  consumablesCost: number;

  // Pour manuel
  manualPrice?: number;
}

export interface PricingResult {
  unitCostPrice: number;
  unitSellingPrice: number;
  totalPrice: number;
  marginPercent: number;
  marginAmount: number;
  details: {
    surfaceObtainedFromM3?: number;
    numberOfSlabs?: number;
    sawBladeThickness?: number;
    calculations?: string[];
  };
}

export interface QuoteStatistics {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  totalAmountHt: number;
  totalAmountTtc: number;
  averageAmount: number;
  conversionRate: number;
}