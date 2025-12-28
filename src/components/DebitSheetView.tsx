import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Square, RotateCcw, Package, Grid3X3, Search, FileText, Upload, AlertCircle, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { DebitSheet, DebitItem } from '../types';
import { useSlabs } from '../hooks/useSlabs';
import { useMaterials } from '../hooks/useMaterials';
import SlabAssignment from './SlabAssignment';
import MaterialSearchCombobox from './MaterialSearchCombobox';
import { UserProfile } from '../hooks/useUserProfile';
import { calculateItemMetrics, calculateSheetTotals } from '../utils/materialUtils';
import { generatePackingSlipPDF } from '../utils/pdfGenerator';
import { parsePDFFile } from '../utils/pdfParser';
import PaletteSelectionModal from './PaletteSelectionModal';
import { extractPalettesFromItems } from '../utils/paletteUtils';
import { DebitSubItemsList } from './DebitSubItemsList';

interface DebitSheetViewProps {
  sheet: DebitSheet;
  profileLoading: boolean;
  profile: UserProfile | null;
  isAdmin: boolean;
  isBureau: boolean;
  isAtelier: boolean;
  isStockMatiere: boolean;
  onUpdateSheet: (sheet: DebitSheet) => void;
  onBack: () => void;
}

export default function DebitSheetView({ sheet, profileLoading, profile, isAdmin, isBureau, isAtelier, isStockMatiere, onUpdateSheet, onBack }: DebitSheetViewProps) {
  const [items, setItems] = useState<DebitItem[]>(sheet.items || []);
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'slabs'>('items');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{type: 'success' | 'error' | 'warning', message: string, details?: any} | null>(null);
  const [editingMaterialItemId, setEditingMaterialItemId] = useState<string | null>(null);
  const [showPaletteSelectionModal, setShowPaletteSelectionModal] = useState(false);
  const [palettes, setPalettes] = useState<any[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const { materials } = useMaterials();
  const materialNames = materials.map(m => m.name);

  console.log('DebitSheetView: Total materials loaded:', materials.length);
  console.log('DebitSheetView: Material names sample:', materialNames.slice(0, 5));

  // Calcul des quantités restantes (locales à cette vue) basé sur les items non terminés
  const [remainingM2, setRemainingM2] = useState(() => {
    const activeItems = (sheet.items || []).filter(item => !item.termine);
    const totals = calculateSheetTotals(activeItems);
    return totals.totalM2;
  });

  const [remainingM3, setRemainingM3] = useState(() => {
    const activeItems = (sheet.items || []).filter(item => !item.termine);
    const totals = calculateSheetTotals(activeItems);
    return totals.totalM3;
  });

  const { slabs, updateSlab, refetch: refetchSlabs } = useSlabs();

  // Synchroniser les items locaux quand la prop sheet change (pour gérer les updates en temps réel)
  useEffect(() => {
    if (sheet.items && sheet.items.length > 0) {
      setItems(sheet.items);

      // Recalculer les totaux
      const activeItems = sheet.items.filter(item => !item.termine);
      const totals = calculateSheetTotals(activeItems);
      setRemainingM2(totals.totalM2);
      setRemainingM3(totals.totalM3);

      // Extraire les palettes
      const extractedPalettes = extractPalettesFromItems(sheet.items);
      setPalettes(extractedPalettes);
    }
  }, [sheet.items]);

  // Vérifier les permissions
  const canToggleItems = isAdmin || isBureau || 
    (isAtelier && sheet.machineId === profile?.machineId);
  const canResetItems = isAdmin || isBureau;
  const canViewSlabs = isAdmin || isBureau || isStockMatiere;
  
  // Affichage du loader pendant le chargement du profil
  if (profileLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil utilisateur...</p>
        </div>
      </div>
    );
  }
  
  // Filtrer les éléments selon le terme de recherche
  const filteredItems = items.filter(item => {
    const searchLower = itemSearchTerm.toLowerCase();
    return (
      item.description.toLowerCase().includes(searchLower) ||
      (item.numeroAppareil && item.numeroAppareil.toLowerCase().includes(searchLower)) ||
      (item.matiereItem && item.matiereItem.toLowerCase().includes(searchLower)) ||
      (item.finition && item.finition.toLowerCase().includes(searchLower))
    );
  });

  const toggleItem = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, termine: !item.termine } : item
    );
    setItems(updatedItems);

    // Recalculer les quantités restantes (locales) basé sur les items non terminés
    const activeItems = updatedItems.filter(item => !item.termine);
    const totals = calculateSheetTotals(activeItems);
    setRemainingM2(totals.totalM2);
    setRemainingM3(totals.totalM3);

    // Vérifier si tous les éléments sont terminés pour automatiser le statut "fini"
    const allItemsCompleted = updatedItems.every(item => item.termine);

    const updatedSheet = {
      ...sheet,
      items: updatedItems
    };

    // Si tous les éléments sont terminés, marquer automatiquement comme fini
    if (allItemsCompleted && !sheet.fini) {
      updatedSheet.fini = true;
      updatedSheet.dateFinition = new Date();
    }

    onUpdateSheet(updatedSheet);
  };

  const resetAllItems = () => {
    const resetItems = items.map(item => ({
      ...item,
      termine: false,
      subItemsTermine: Array(item.quantite).fill(false),
      subItemsPalettes: Array(item.quantite).fill(null)
    }));
    setItems(resetItems);
    setExpandedItemId(null);

    const totals = calculateSheetTotals(resetItems);
    setRemainingM2(totals.totalM2);
    setRemainingM3(totals.totalM3);

    const updatedSheet = {
      ...sheet,
      items: resetItems,
      fini: false,
      dateFinition: undefined
    };

    onUpdateSheet(updatedSheet);
  };

  const updateItemPalette = (itemId: string, paletteNumber: number | undefined) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, numeroPalette: paletteNumber } : item
    );
    setItems(updatedItems);

    const updatedSheet = {
      ...sheet,
      items: updatedItems
    };

    onUpdateSheet(updatedSheet);
  };

  const updateItemMaterial = (itemId: string, material: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, matiereItem: material } : item
    );
    setItems(updatedItems);

    const activeItems = updatedItems.filter(item => !item.termine);
    const totals = calculateSheetTotals(activeItems);
    setRemainingM2(totals.totalM2);
    setRemainingM3(totals.totalM3);

    const updatedSheet = {
      ...sheet,
      items: updatedItems
    };

    onUpdateSheet(updatedSheet);
  };

  const toggleSubItem = (itemId: string, subIndex: number) => {
    const updatedItems = items.map(item => {
      if (item.id !== itemId) return item;

      const subItemsTermine = [...(item.subItemsTermine || Array(item.quantite).fill(false))];
      subItemsTermine[subIndex] = !subItemsTermine[subIndex];

      const allSubItemsTermine = subItemsTermine.every(t => t);

      if (allSubItemsTermine) {
        setExpandedItemId(null);
      }

      return {
        ...item,
        subItemsTermine,
        termine: allSubItemsTermine
      };
    });

    setItems(updatedItems);

    const activeItems = updatedItems.filter(item => !item.termine);
    const totals = calculateSheetTotals(activeItems);
    setRemainingM2(totals.totalM2);
    setRemainingM3(totals.totalM3);

    const allItemsCompleted = updatedItems.every(item => item.termine);

    const updatedSheet = {
      ...sheet,
      items: updatedItems,
      ...(allItemsCompleted && !sheet.fini ? { fini: true, dateFinition: new Date() } : {})
    };

    onUpdateSheet(updatedSheet);
  };

  const updateSubItemPalette = (itemId: string, subIndex: number, palette: number | null, cascade: boolean = false) => {
    const updatedItems = items.map(item => {
      if (item.id !== itemId) return item;

      const subItemsPalettes = [...(item.subItemsPalettes || Array(item.quantite).fill(null))];

      if (cascade) {
        for (let i = subIndex; i < item.quantite; i++) {
          subItemsPalettes[i] = palette;
        }
      } else {
        subItemsPalettes[subIndex] = palette;
      }

      return {
        ...item,
        subItemsPalettes
      };
    });

    setItems(updatedItems);

    const updatedSheet = {
      ...sheet,
      items: updatedItems
    };

    onUpdateSheet(updatedSheet);
  };

  const toggleAllSubItems = (itemId: string, termine: boolean) => {
    const updatedItems = items.map(item => {
      if (item.id !== itemId) return item;

      const subItemsTermine = Array(item.quantite).fill(termine);

      return {
        ...item,
        subItemsTermine,
        termine
      };
    });

    setItems(updatedItems);

    if (termine) {
      setExpandedItemId(null);
    }

    const activeItems = updatedItems.filter(item => !item.termine);
    const totals = calculateSheetTotals(activeItems);
    setRemainingM2(totals.totalM2);
    setRemainingM3(totals.totalM3);

    const allItemsCompleted = updatedItems.every(item => item.termine);

    const updatedSheet = {
      ...sheet,
      items: updatedItems,
      ...(allItemsCompleted && !sheet.fini ? { fini: true, dateFinition: new Date() } : {})
    };

    onUpdateSheet(updatedSheet);
  };

  const applyPaletteToAllSubItems = (itemId: string, palette: number | null) => {
    const updatedItems = items.map(item => {
      if (item.id !== itemId) return item;

      const subItemsPalettes = Array(item.quantite).fill(palette);

      return {
        ...item,
        subItemsPalettes
      };
    });

    setItems(updatedItems);

    const updatedSheet = {
      ...sheet,
      items: updatedItems
    };

    onUpdateSheet(updatedSheet);
  };

  const handleItemClick = (item: DebitItem) => {
    if (!canToggleItems) return;

    if (item.quantite > 1) {
      setExpandedItemId(expandedItemId === item.id ? null : item.id);
    } else {
      toggleItem(item.id);
    }
  };

  const getSubItemsSummary = (item: DebitItem) => {
    if (item.quantite <= 1) return null;

    const subItemsTermine = item.subItemsTermine || Array(item.quantite).fill(item.termine);
    const completedCount = subItemsTermine.filter(t => t).length;
    const subItemsPalettes = item.subItemsPalettes || [];
    const uniquePalettes = [...new Set(subItemsPalettes.filter(p => p !== null))];

    return {
      completedCount,
      total: item.quantite,
      palettes: uniquePalettes as number[]
    };
  };

  const handlePDFImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await parsePDFFile(file);

      if (result.success) {
        setImportResult({
          type: 'success',
          message: `PDF importé avec succès! ${result.items_count} éléments extraits.`,
          details: {
            confidence: result.confidence,
            warnings: result.warnings,
            items_count: result.items_count,
            total_m2: result.total_m2,
            total_m3: result.total_m3
          }
        });
      } else {
        setImportResult({
          type: 'error',
          message: result.error || 'Erreur lors de l\'importation du PDF'
        });
      }
    } catch (error: any) {
      setImportResult({
        type: 'error',
        message: error.message || 'Erreur lors de l\'importation du PDF'
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const completedItems = items.filter(item => item.termine).length;
  const totalItems = items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-blue-300 hover:text-blue-100 transition-colors self-start"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm md:text-base">Retour au tableau</span>
                </button>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Feuille de Débit - {sheet.numeroOS}</h2>
                  <p className="text-sm md:text-base text-blue-200">{sheet.nomClient}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3">
                {(isAdmin || isBureau) && (
                  <>
                    <button
                      onClick={() => generatePackingSlipPDF({ ...sheet, items })}
                      className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
                      title="Imprimer Tout"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Imprimer Tout</span>
                    </button>
                    <button
                      onClick={() => setShowPaletteSelectionModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
                      title="Sélectionner Palettes"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Sélectionner Palettes</span>
                    </button>
                  </>
                )}
                {canResetItems && (
                  <button
                    onClick={resetAllItems}
                    className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
                    title="Réinitialiser"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Réinitialiser</span>
                  </button>
                )}
              </div>
            </div>

            {/* Onglets de navigation */}
            <div className="mt-4 md:mt-6 flex space-x-1 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setActiveSubTab('items')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base ${
                  activeSubTab === 'items'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-600'
                }`}
              >
                <Square className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Éléments à Traiter</span>
              </button>
              {canViewSlabs && (
                <button
                  onClick={() => setActiveSubTab('slabs')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base ${
                    activeSubTab === 'slabs'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Tranches Assignées</span>
                </button>
              )}
            </div>

            {/* Barre de progression */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression: {completedItems}/{totalItems} items</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {activeSubTab === 'items' && (
              <>
                {/* Informations de la commande */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Commercial</label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{sheet.cial}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Chantier</label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{sheet.refChantier || '-'}</p>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">N° ARC</label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">{sheet.numeroARC}</p>
                  </div>
                </div>

                {/* Résumé des quantités */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-emerald-800 mb-2">Surface Totale</h3>
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{remainingM2.toFixed(2)} m²</p>
                      <p className="text-xs sm:text-sm text-emerald-600 mt-1">Restant à traiter</p>
                      <p className="text-xs text-gray-500">Total initial: {sheet.m2.toFixed(2)} m²</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">Volume Total</h3>
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">{remainingM3.toFixed(3)} m³</p>
                      <p className="text-xs sm:text-sm text-blue-600 mt-1">Restant à traiter</p>
                      <p className="text-xs text-gray-500">Total initial: {sheet.m3.toFixed(3)} m³</p>
                    </div>
                  </div>
                </div>

                {/* Liste des items */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Éléments à Traiter</h3>
                  
                  {/* Barre de recherche pour les éléments */}
                  {items.length > 0 && (
                    <div className="mb-6">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher par description, appareil, matière, finition..."
                          value={itemSearchTerm}
                          onChange={(e) => setItemSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      {itemSearchTerm && (
                        <p className="text-sm text-gray-600 mt-2">
                          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} pour "{itemSearchTerm}"
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {filteredItems.map((item) => {
                      const isExpanded = expandedItemId === item.id;
                      const subItemsSummary = getSubItemsSummary(item);
                      const hasMultipleQuantity = item.quantite > 1;

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-lg transition-all duration-300 ${
                            item.termine
                              ? 'bg-green-50 border-green-200 opacity-70'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => handleItemClick(item)}
                            style={{ cursor: canToggleItems ? 'pointer' : 'default' }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {hasMultipleQuantity && canToggleItems ? (
                                  <div className="flex-shrink-0">
                                    {isExpanded ? (
                                      <ChevronDown className="h-6 w-6 text-blue-500" />
                                    ) : (
                                      <ChevronRight className="h-6 w-6 text-gray-400" />
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0">
                                    {item.termine ? (
                                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <Check className="h-5 w-5 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors">
                                        <Square className="h-5 w-5 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {hasMultipleQuantity && (
                                  <div className="flex-shrink-0">
                                    {item.termine ? (
                                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <Check className="h-5 w-5 text-white" />
                                      </div>
                                    ) : subItemsSummary && subItemsSummary.completedCount > 0 ? (
                                      <div className="w-8 h-8 bg-blue-100 border-2 border-blue-400 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold text-blue-600">
                                          {subItemsSummary.completedCount}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                        <Square className="h-5 w-5 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className={`flex-1 ${item.termine ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  <h4 className="font-medium">{item.description}</h4>
                                  <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-y-1">
                                    {item.numeroAppareil && <span className="inline-block mr-4">N° App: {item.numeroAppareil}</span>}

                                    {(isAdmin || isBureau) ? (
                                      <div
                                        className="inline-block mr-4"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {editingMaterialItemId === item.id ? (
                                          <div className="inline-block" style={{ minWidth: '250px' }}>
                                            <MaterialSearchCombobox
                                              materials={materialNames}
                                              value={item.matiereItem || ''}
                                              onChange={(value) => {
                                                updateItemMaterial(item.id, value);
                                                if (value && materialNames.includes(value)) {
                                                  setEditingMaterialItemId(null);
                                                }
                                              }}
                                              placeholder="Rechercher une matiere..."
                                              className="inline-block"
                                            />
                                          </div>
                                        ) : (
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingMaterialItemId(item.id);
                                            }}
                                            className={`cursor-pointer hover:text-blue-600 hover:underline ${
                                              item.matiereItem && !materialNames.includes(item.matiereItem)
                                                ? 'text-red-600 font-medium'
                                                : ''
                                            }`}
                                            title="Cliquer pour modifier"
                                          >
                                            Matiere: {item.matiereItem || 'Non definie'}
                                            {item.matiereItem && !materialNames.includes(item.matiereItem) && ' (!)'}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      item.matiereItem && <span className="inline-block mr-4">Matiere: {item.matiereItem}</span>
                                    )}

                                    {item.finition && <span className="inline-block mr-4">Finition: {item.finition}</span>}
                                    <span className="inline-block mr-4">L: {item.longueur}cm</span>
                                    <span className="inline-block mr-4">l: {item.largeur}cm</span>
                                    <span className="inline-block mr-4">Ep: {item.epaisseur}cm</span>
                                    <span className="inline-block mr-4">Qte: {item.quantite}</span>

                                    {subItemsSummary && (
                                      <span className={`inline-block font-medium ${
                                        subItemsSummary.completedCount === subItemsSummary.total
                                          ? 'text-green-600'
                                          : subItemsSummary.completedCount > 0
                                            ? 'text-blue-600'
                                            : 'text-gray-500'
                                      }`}>
                                        {subItemsSummary.completedCount}/{subItemsSummary.total} termine(s)
                                      </span>
                                    )}

                                    {!hasMultipleQuantity && item.numeroPalette && (
                                      <span className="inline-block font-medium text-purple-600">
                                        Palette: {item.numeroPalette}
                                      </span>
                                    )}

                                    {subItemsSummary && subItemsSummary.palettes.length > 0 && (
                                      <span className="inline-block font-medium text-purple-600">
                                        Palettes: {subItemsSummary.palettes.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end space-y-2">
                                {(isAdmin || isBureau) && !hasMultipleQuantity && (
                                  <div className="flex items-center space-x-2">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    <input
                                      type="number"
                                      value={item.numeroPalette || ''}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        updateItemPalette(item.id, e.target.value ? Number(e.target.value) : undefined);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="N palette"
                                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      min="1"
                                    />
                                  </div>
                                )}
                                <div className="text-right">
                                  {(() => {
                                    const metrics = item.m2Item !== undefined && item.m3Item !== undefined
                                      ? { m2: item.m2Item, m3: item.m3Item }
                                      : calculateItemMetrics(item.longueur, item.largeur, item.epaisseur, item.quantite, item.matiereItem);
                                    return (
                                      <>
                                        {metrics.m2 > 0 && (
                                          <div className="text-sm font-medium text-emerald-700">
                                            {metrics.m2.toFixed(2)} m2
                                          </div>
                                        )}
                                        {metrics.m3 > 0 && (
                                          <div className="text-sm font-medium text-blue-700">
                                            {metrics.m3.toFixed(3)} m3
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {isExpanded && hasMultipleQuantity && (
                            <DebitSubItemsList
                              item={item}
                              onSubItemToggle={(subIndex) => toggleSubItem(item.id, subIndex)}
                              onSubItemPaletteChange={(subIndex, palette, cascade) => updateSubItemPalette(item.id, subIndex, palette, cascade)}
                              onToggleAll={(termine) => toggleAllSubItems(item.id, termine)}
                              onApplyPaletteToAll={(palette) => applyPaletteToAllSubItems(item.id, palette)}
                              isAdmin={isAdmin}
                              isBureau={isBureau}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <Square className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">Aucun élément détaillé disponible</p>
                      <p className="text-gray-400 text-sm mt-2">Les éléments seront générés lors de l'import PDF</p>

                      {(isAdmin || isBureau) && (
                        <div className="mt-8">
                          <label className="inline-block">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handlePDFImport}
                              disabled={isImporting}
                              className="hidden"
                            />
                            <div className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-6 py-3 rounded-lg font-medium text-white cursor-pointer transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg inline-flex">
                              {isImporting ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Importation en cours...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-5 w-5" />
                                  <span>Importer PDF</span>
                                </>
                              )}
                            </div>
                          </label>

                          {importResult && (
                            <div className={`mt-4 p-4 rounded-lg ${
                              importResult.type === 'success' ? 'bg-green-50 border border-green-200' :
                              importResult.type === 'error' ? 'bg-red-50 border border-red-200' :
                              'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <div className="flex items-start space-x-2">
                                <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                  importResult.type === 'success' ? 'text-green-600' :
                                  importResult.type === 'error' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`} />
                                <div className="flex-1">
                                  <p className={`font-medium ${
                                    importResult.type === 'success' ? 'text-green-800' :
                                    importResult.type === 'error' ? 'text-red-800' :
                                    'text-yellow-800'
                                  }`}>{importResult.message}</p>

                                  {importResult.details && (
                                    <div className="mt-2 text-sm space-y-1">
                                      <p className="text-gray-700">Confiance: {importResult.details.confidence}%</p>
                                      <p className="text-gray-700">M2: {importResult.details.total_m2?.toFixed(2)}</p>
                                      <p className="text-gray-700">M3: {importResult.details.total_m3?.toFixed(3)}</p>
                                      {importResult.details.warnings?.length > 0 && (
                                        <div className="mt-2">
                                          <p className="font-medium text-yellow-700">Avertissements:</p>
                                          <ul className="list-disc list-inside text-yellow-700">
                                            {importResult.details.warnings.map((warning: string, idx: number) => (
                                              <li key={idx}>{warning}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : filteredItems.length === 0 && itemSearchTerm ? (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">Aucun résultat pour "{itemSearchTerm}"</p>
                      <button
                        onClick={() => setItemSearchTerm('')}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {activeSubTab === 'slabs' && (
              <SlabAssignment
                sheet={sheet}
                allSlabs={slabs}
                updateSlab={updateSlab}
                refetchSlabs={refetchSlabs}
              />
            )}
          </div>
        </div>
      </div>

      <PaletteSelectionModal
        isOpen={showPaletteSelectionModal}
        onClose={() => setShowPaletteSelectionModal(false)}
        onPrint={(selectedPalettes) => {
          generatePackingSlipPDF({ ...sheet, items }, selectedPalettes);
        }}
        palettes={palettes}
      />
    </div>
  );
}