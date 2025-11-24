import React, { useState, useEffect } from 'react';
import { X, Calculator, Info } from 'lucide-react';
import { PricingParameters, PricingResult, CalculationMethod, QuoteItem } from '../../types';
import { calculatePricing, getSuggestedMargin, getSuggestedWasteFactor, formatPrice } from '../../utils/pricingCalculations';
import { useMaterials } from '../../hooks/useMaterials';
import MaterialSearchCombobox from '../MaterialSearchCombobox';

interface CostCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToQuote: (params: PricingParameters, result: PricingResult) => void;
  defaultMethod?: CalculationMethod;
  editingItem?: QuoteItem | null;
}

export default function CostCalculatorModal({ isOpen, onClose, onAddToQuote, defaultMethod = 'slab', editingItem = null }: CostCalculatorModalProps) {
  const { blocMaterialNames, trancheMaterialNames, getMaterialByName, getMaterialCMUP } = useMaterials();
  const [activeTab, setActiveTab] = useState<CalculationMethod>(defaultMethod);
  const [cmupSuggested, setCmupSuggested] = useState(false);

  // États communs
  const [materialName, setMaterialName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('m2');
  const [thickness, setThickness] = useState<number>(2);

  // États pour calcul depuis bloc
  const [blockPriceM3, setBlockPriceM3] = useState<number>(0);
  const [sawingCostM3, setSawingCostM3] = useState<number>(0); // Coût de sciage du bloc en €/m³
  const [cuttingCostM2, setCuttingCostM2] = useState<number>(0); // Coût de débit des tranches en €/m²

  // États pour calcul depuis tranche
  const [slabPriceM2, setSlabPriceM2] = useState<number>(0);
  const [fabricationCost, setFabricationCost] = useState<number>(0);

  // États communs aux deux méthodes
  const [wasteFactor, setWasteFactor] = useState<number>(1.2);
  const [marginCoefficient, setMarginCoefficient] = useState<number>(1.55);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [consumablesCost, setConsumablesCost] = useState<number>(0);
  const [overheadCoefficient, setOverheadCoefficient] = useState<number>(1.23);

  // Pour calcul manuel
  const [manualPrice, setManualPrice] = useState<number>(0);

  // Résultat du calcul
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recalculer à chaque changement
  useEffect(() => {
    calculatePrice();
  }, [
    activeTab,
    quantity,
    blockPriceM3,
    sawingCostM3,
    cuttingCostM2,
    thickness,
    slabPriceM2,
    fabricationCost,
    wasteFactor,
    marginCoefficient,
    laborCost,
    consumablesCost,
    overheadCoefficient,
    manualPrice
  ]);

  // Mettre à jour les suggestions selon le type de matière
  useEffect(() => {
    if (activeTab === 'block' || activeTab === 'slab') {
      setWasteFactor(getSuggestedWasteFactor(activeTab));
      setMarginCoefficient(getSuggestedMargin(activeTab));
    }
  }, [activeTab]);

  // Charger les données de la ligne en édition
  useEffect(() => {
    if (editingItem && isOpen) {
      setActiveTab(editingItem.calculationMethod);
      setMaterialName(editingItem.materialName || '');
      setDescription(editingItem.description || '');
      setQuantity(editingItem.quantity);
      setUnit(editingItem.unit);
      setThickness(editingItem.thickness || 2);
      setWasteFactor(editingItem.wasteFactor);
      setMarginCoefficient(editingItem.marginCoefficient);
      setLaborCost(editingItem.laborCost);
      setConsumablesCost(editingItem.consumablesCost);
      setOverheadCoefficient(editingItem.overheadCoefficient || 1.23);
      setCmupSuggested(false);

      if (editingItem.calculationMethod === 'block') {
        setBlockPriceM3(editingItem.sourcePrice || 0);
        setSawingCostM3(editingItem.sawingCost || 0);
        setCuttingCostM2(editingItem.fabricationCost || 0);
      } else if (editingItem.calculationMethod === 'slab') {
        setSlabPriceM2(editingItem.sourcePrice || 0);
        setFabricationCost(editingItem.fabricationCost);
      } else if (editingItem.calculationMethod === 'manual') {
        setManualPrice(editingItem.unitSellingPrice);
      }
    } else if (!editingItem && isOpen) {
      // Réinitialiser pour une nouvelle ligne
      setMaterialName('');
      setDescription('');
      setQuantity(1);
      setUnit('m2');
      setThickness(2);
      setBlockPriceM3(0);
      setSawingCostM3(0);
      setCuttingCostM2(0);
      setSlabPriceM2(0);
      setFabricationCost(0);
      setManualPrice(0);
      setLaborCost(0);
      setConsumablesCost(0);
      setOverheadCoefficient(1.23);
      setWasteFactor(getSuggestedWasteFactor(activeTab));
      setMarginCoefficient(getSuggestedMargin(activeTab));
      setCmupSuggested(false);
    }
  }, [editingItem, isOpen]);

  // Auto-remplir avec le CMUP quand la matière change
  useEffect(() => {
    if (!materialName || editingItem) return;

    const cmup = getMaterialCMUP(materialName);
    if (cmup && cmup > 0) {
      if (activeTab === 'block' && blockPriceM3 === 0) {
        setBlockPriceM3(cmup);
        setCmupSuggested(true);
      } else if (activeTab === 'slab' && slabPriceM2 === 0) {
        setSlabPriceM2(cmup);
        setCmupSuggested(true);
      }
    }
  }, [materialName, activeTab]);

  const calculatePrice = () => {
    try {
      setError(null);

      const params: PricingParameters = {
        calculationMethod: activeTab,
        materialName,
        quantity,
        unit,
        thickness: activeTab !== 'manual' ? thickness : undefined,
        blockPriceM3: activeTab === 'block' ? blockPriceM3 : undefined,
        sawingCostM3: activeTab === 'block' ? sawingCostM3 : undefined,
        cuttingCostM2: activeTab === 'block' ? cuttingCostM2 : undefined,
        slabPriceM2: activeTab === 'slab' ? slabPriceM2 : undefined,
        fabricationCost: activeTab === 'slab' ? fabricationCost : undefined,
        wasteFactor,
        marginCoefficient,
        laborCost,
        consumablesCost,
        overheadCoefficient,
        manualPrice: activeTab === 'manual' ? manualPrice : undefined
      };

      const calculatedResult = calculatePricing(params);
      setResult(calculatedResult);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  };

  const handleAddToQuote = () => {
    if (!result) return;

    const params: PricingParameters = {
      calculationMethod: activeTab,
      materialName: materialName || description,
      quantity,
      unit,
      thickness: activeTab !== 'manual' ? thickness : undefined,
      blockPriceM3: activeTab === 'block' ? blockPriceM3 : undefined,
      sawingCostM3: activeTab === 'block' ? sawingCostM3 : undefined,
      cuttingCostM2: activeTab === 'block' ? cuttingCostM2 : undefined,
      slabPriceM2: activeTab === 'slab' ? slabPriceM2 : undefined,
      fabricationCost: activeTab === 'slab' ? fabricationCost : undefined,
      wasteFactor,
      marginCoefficient,
      laborCost,
      consumablesCost,
      overheadCoefficient,
      manualPrice: activeTab === 'manual' ? manualPrice : undefined
    };

    onAddToQuote(params, result);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMaterialName('');
    setDescription('');
    setQuantity(1);
    setUnit('m2');
    setThickness(2);
    setBlockPriceM3(0);
    setSawingCostM2(0);
    setSlabPriceM2(0);
    setFabricationCost(0);
    setLaborCost(0);
    setConsumablesCost(0);
    setManualPrice(0);
    setResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {editingItem ? 'Modifier la ligne' : 'Calculateur de Prix'}
              </h2>
              <p className="text-sm text-blue-100">
                {editingItem ? 'Modifiez les paramètres de la ligne' : 'Ajoutez une ligne au devis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('block')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
              activeTab === 'block'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Depuis Bloc
          </button>
          <button
            onClick={() => setActiveTab('slab')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
              activeTab === 'slab'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Depuis Tranche
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors border-b-2 ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Manuel
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche - Paramètres */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Paramètres</span>
              </h3>

              {/* Sélection matière */}
              {activeTab !== 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matière
                  </label>
                  <MaterialSearchCombobox
                    materials={activeTab === 'block' ? blocMaterialNames : trancheMaterialNames}
                    value={materialName}
                    onChange={setMaterialName}
                    placeholder={`Rechercher une ${activeTab === 'block' ? 'bloc' : 'tranche'}...`}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Description de la ligne..."
                />
              </div>

              {/* Quantité et Unité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="m2">m²</option>
                    <option value="ml">ml</option>
                    <option value="u">Unité</option>
                    <option value="forfait">Forfait</option>
                  </select>
                </div>
              </div>

              {/* Paramètres spécifiques selon l'onglet */}
              {activeTab === 'block' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Épaisseur de la tranche (cm)
                    </label>
                    <input
                      type="number"
                      value={thickness}
                      onChange={(e) => setThickness(Number(e.target.value))}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>Prix d'achat du bloc (€/m³ HT)</span>
                      {cmupSuggested && blockPriceM3 > 0 && (
                        <span className="text-xs text-blue-600 font-normal flex items-center space-x-1">
                          <Info className="h-3 w-3" />
                          <span>CMUP suggéré</span>
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={blockPriceM3}
                      onChange={(e) => {
                        setBlockPriceM3(Number(e.target.value));
                        setCmupSuggested(false);
                      }}
                      min="0"
                      step="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        cmupSuggested ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
                      }`}
                      title={cmupSuggested ? `Prix suggéré d'après le CMUP (coût moyen d'achat HT). Vous pouvez le modifier selon vos marges.` : ''}
                    />
                    {cmupSuggested && (
                      <p className="text-xs text-blue-600 mt-1">
                        Prix pré-rempli avec le CMUP. Modifiable à tout moment.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coût de sciage (€/m³)
                    </label>
                    <input
                      type="number"
                      value={sawingCostM3}
                      onChange={(e) => setSawingCostM3(Number(e.target.value))}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pour transformer le bloc en tranches</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coût du débit (€/m²)
                    </label>
                    <input
                      type="number"
                      value={cuttingCostM2}
                      onChange={(e) => setCuttingCostM2(Number(e.target.value))}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pour découper les tranches en éléments finis</p>
                  </div>
                </>
              )}

              {activeTab === 'slab' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Épaisseur (cm)
                    </label>
                    <input
                      type="number"
                      value={thickness}
                      onChange={(e) => setThickness(Number(e.target.value))}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>Prix d'achat de la tranche (€/m² HT)</span>
                      {cmupSuggested && slabPriceM2 > 0 && (
                        <span className="text-xs text-blue-600 font-normal flex items-center space-x-1">
                          <Info className="h-3 w-3" />
                          <span>CMUP suggéré</span>
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={slabPriceM2}
                      onChange={(e) => {
                        setSlabPriceM2(Number(e.target.value));
                        setCmupSuggested(false);
                      }}
                      min="0"
                      step="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        cmupSuggested ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
                      }`}
                      title={cmupSuggested ? `Prix suggéré d'après le CMUP (coût moyen d'achat HT). Vous pouvez le modifier selon vos marges.` : ''}
                    />
                    {cmupSuggested && (
                      <p className="text-xs text-blue-600 mt-1">
                        Prix pré-rempli avec le CMUP. Modifiable à tout moment.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coût de façonnage (€/m²)
                    </label>
                    <input
                      type="number"
                      value={fabricationCost}
                      onChange={(e) => setFabricationCost(Number(e.target.value))}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {activeTab === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix de vente unitaire HT (€)
                  </label>
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Paramètres communs (sauf manuel) */}
              {activeTab !== 'manual' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coefficient de perte
                      </label>
                      <input
                        type="number"
                        value={wasteFactor}
                        onChange={(e) => setWasteFactor(Number(e.target.value))}
                        min="1"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 1.2 = 20% de perte</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coefficient de marge
                      </label>
                      <input
                        type="number"
                        value={marginCoefficient}
                        onChange={(e) => setMarginCoefficient(Number(e.target.value))}
                        min="1"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 1.55 = 55% de marge</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frais généraux
                    </label>
                    <input
                      type="number"
                      value={overheadCoefficient}
                      onChange={(e) => setOverheadCoefficient(Number(e.target.value))}
                      min="1"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: 1.23 = 23% de frais généraux (par défaut)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coût main d'œuvre (€)
                      </label>
                      <input
                        type="number"
                        value={laborCost}
                        onChange={(e) => setLaborCost(Number(e.target.value))}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coût consommables (€)
                      </label>
                      <input
                        type="number"
                        value={consumablesCost}
                        onChange={(e) => setConsumablesCost(Number(e.target.value))}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Colonne droite - Résultats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-green-600" />
                <span>Résultat du calcul</span>
              </h3>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {result && !error && (
                <div className="space-y-4">
                  {/* Prix calculés */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                    {result.unitCostPrice > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">Coût de revient unitaire</p>
                        <p className="text-2xl font-bold text-gray-900">{formatPrice(result.unitCostPrice)}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Prix de vente unitaire HT</p>
                      <p className="text-3xl font-bold text-blue-600">{formatPrice(result.unitSellingPrice)}</p>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Total ligne (×{quantity} {unit})</p>
                      <p className="text-2xl font-bold text-green-600">{formatPrice(result.totalPrice)}</p>
                    </div>

                    {result.marginPercent > 0 && (
                      <div className="pt-3 border-t border-blue-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Marge</span>
                          <span className="text-lg font-semibold text-green-600">
                            {result.marginPercent.toFixed(2)}% ({formatPrice(result.marginAmount)})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Détails du calcul */}
                  {result.details.calculations && result.details.calculations.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Détails du calcul :</h4>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {result.details.calculations.map((calc, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{calc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAddToQuote}
            disabled={!result || !!error}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {editingItem ? 'Modifier la ligne' : 'Ajouter au devis'}
          </button>
        </div>
      </div>
    </div>
  );
}
