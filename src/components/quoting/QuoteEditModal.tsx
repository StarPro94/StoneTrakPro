import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, FileText, User, Package, Calendar, Edit } from 'lucide-react';
import { Quote, QuoteItem, PricingParameters, PricingResult } from '../../types';
import { formatPrice, calculateQuoteTotals } from '../../utils/pricingCalculations';
import { useQuotes } from '../../hooks/useQuotes';
import CostCalculatorModal from './CostCalculatorModal';

interface QuoteEditModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function QuoteEditModal({ quote, isOpen, onClose, onSaved }: QuoteEditModalProps) {
  const { updateQuote, addQuoteItem, updateQuoteItem, deleteQuoteItem } = useQuotes();

  // États du formulaire
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [quoteDate, setQuoteDate] = useState('');
  const [validityPeriod, setValidityPeriod] = useState('1 mois');
  const [status, setStatus] = useState<'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'>('draft');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tvaPercent, setTvaPercent] = useState(20);
  const [notes, setNotes] = useState('');
  const [paymentConditions, setPaymentConditions] = useState('Paiement à 30 jours');
  const [items, setItems] = useState<QuoteItem[]>([]);

  const [showCalculator, setShowCalculator] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<QuoteItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPalletsModal, setShowPalletsModal] = useState(false);
  const [palletsQuantity, setPalletsQuantity] = useState(1);
  const [palletPrice, setPalletPrice] = useState(15);

  // Charger les données du devis
  useEffect(() => {
    if (quote && isOpen) {
      setClientName(quote.clientName);
      setProjectName(quote.projectName || '');
      setQuoteDate(new Date(quote.quoteDate).toISOString().split('T')[0]);
      setValidityPeriod(quote.validityPeriod);
      setStatus(quote.status);
      setDiscountPercent(quote.discountPercent);
      setTvaPercent(quote.tvaPercent);
      setNotes(quote.notes || '');
      setPaymentConditions(quote.paymentConditions);
      setItems(quote.items || []);
    }
  }, [quote, isOpen]);

  // Calculer les totaux
  const totals = calculateQuoteTotals(items, discountPercent, tvaPercent);

  const handleAddItem = (params: PricingParameters, result: PricingResult) => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      quoteId: quote?.id || '',
      itemOrder: items.length,
      description: params.materialName || 'Nouvelle ligne',
      materialId: params.materialId || null,
      materialName: params.materialName || null,
      quantity: params.quantity,
      unit: params.unit,
      thickness: params.thickness || null,
      calculationMethod: params.calculationMethod,
      sourcePrice: params.blockPriceM3 || params.slabPriceM2 || null,
      sawingCost: params.sawingCostM3 || null,
      wasteFactor: params.wasteFactor,
      marginCoefficient: params.marginCoefficient,
      laborCost: params.laborCost,
      consumablesCost: params.consumablesCost,
      fabricationCost: (params.calculationMethod === 'block' ? params.cuttingCostM2 : params.fabricationCost) || 0,
      overheadCoefficient: params.overheadCoefficient,
      unitCostPrice: result.unitCostPrice,
      unitSellingPrice: result.unitSellingPrice,
      totalPrice: result.totalPrice,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (editingItemIndex !== null) {
      // Mode édition : remplacer la ligne existante
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = {
        ...updatedItems[editingItemIndex],
        ...newItem,
        id: updatedItems[editingItemIndex].id // Garder l'ID original
      };
      setItems(updatedItems);
      setEditingItemIndex(null);
      setEditingItemData(null);
    } else {
      // Mode ajout : ajouter une nouvelle ligne
      setItems([...items, newItem]);
    }

    setShowCalculator(false);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setEditingItemData(items[index]);
    setShowCalculator(true);
  };

  const handleDeleteItem = async (index: number) => {
    const item = items[index];

    if (confirm('Supprimer cette ligne ?')) {
      // Si l'item a un vrai ID (pas temp-), le supprimer en base
      if (item.id && !item.id.startsWith('temp-')) {
        await deleteQuoteItem(item.id, quote?.id || '');
      }

      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleAddPallets = () => {
    const totalPrice = palletsQuantity * palletPrice;

    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      quoteId: quote?.id || '',
      itemOrder: items.length,
      description: `Palettes (${palletsQuantity}×${palletPrice}€)`,
      materialId: null,
      materialName: null,
      quantity: palletsQuantity,
      unit: 'u',
      thickness: null,
      calculationMethod: 'manual',
      sourcePrice: null,
      sawingCost: null,
      wasteFactor: 1,
      marginCoefficient: 1,
      laborCost: 0,
      consumablesCost: 0,
      fabricationCost: 0,
      overheadCoefficient: 1,
      unitCostPrice: palletPrice,
      unitSellingPrice: palletPrice,
      totalPrice: totalPrice,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setItems([...items, newItem]);
    setShowPalletsModal(false);
    setPalletsQuantity(1);
    setPalletPrice(15);
  };

  const handleSave = async () => {
    if (!quote) return;

    setSaving(true);
    try {
      // Mettre à jour le devis principal
      const updatedQuote: Quote = {
        ...quote,
        clientName,
        projectName: projectName || null,
        quoteDate: new Date(quoteDate),
        validityPeriod,
        status,
        discountPercent,
        tvaPercent,
        notes: notes || null,
        paymentConditions,
        subtotalHt: totals.subtotalHt,
        discountAmount: totals.discountAmount,
        totalHt: totals.totalHt,
        totalTva: totals.totalTva,
        totalTtc: totals.totalTtc
      };

      const success = await updateQuote(updatedQuote);

      if (success) {
        // Sauvegarder les nouveaux items
        for (const item of items) {
          if (item.id.startsWith('temp-')) {
            await addQuoteItem({
              ...item,
              quoteId: quote.id
            });
          } else {
            await updateQuoteItem(item);
          }
        }

        onSaved();
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du devis');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* En-tête */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Modifier le Devis</h2>
                <p className="text-sm text-blue-100">N° {quote.id.slice(0, 8)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              {/* Informations principales */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du devis</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="h-4 w-4 inline mr-1" />
                      Client *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Package className="h-4 w-4 inline mr-1" />
                      Projet
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date du devis *
                    </label>
                    <input
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validité</label>
                    <input
                      type="text"
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="sent">Envoyé</option>
                      <option value="accepted">Accepté</option>
                      <option value="rejected">Refusé</option>
                      <option value="expired">Expiré</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
                    <input
                      type="text"
                      value={paymentConditions}
                      onChange={(e) => setPaymentConditions(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Lignes du devis */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Lignes du devis</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowPalletsModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Package className="h-4 w-4" />
                      <span>Palettes</span>
                    </button>
                    <button
                      onClick={() => setShowCalculator(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter une ligne</span>
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Aucune ligne dans ce devis</p>
                    <button
                      onClick={() => setShowCalculator(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter la première ligne</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                Ligne {index + 1}
                              </span>
                              {item.calculationMethod === 'block' && (
                                <span className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded">Depuis Bloc</span>
                              )}
                              {item.calculationMethod === 'slab' && (
                                <span className="text-xs text-gray-600 bg-green-50 px-2 py-0.5 rounded">Depuis Tranche</span>
                              )}
                              {item.calculationMethod === 'manual' && (
                                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">Manuel</span>
                              )}
                            </div>

                            <h4 className="font-semibold text-gray-900">{item.description}</h4>
                            {item.materialName && (
                              <p className="text-sm text-gray-600">Matière : {item.materialName}</p>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                              <div>
                                <p className="text-xs text-gray-600">Quantité</p>
                                <p className="font-semibold text-gray-900">{item.quantity} {item.unit}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Prix unitaire</p>
                                <p className="font-semibold text-gray-900">{formatPrice(item.unitSellingPrice)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-gray-600">Total ligne</p>
                                <p className="text-lg font-bold text-blue-600">{formatPrice(item.totalPrice)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col space-y-2">
                            <button
                              onClick={() => handleEditItem(index)}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(index)}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Paramètres financiers */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres financiers</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remise (%)</label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
                    <input
                      type="number"
                      value={tvaPercent}
                      onChange={(e) => setTvaPercent(Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Totaux */}
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total HT</span>
                      <span className="font-semibold">{formatPrice(totals.subtotalHt)}</span>
                    </div>

                    {discountPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remise ({discountPercent}%)</span>
                        <span className="font-semibold text-red-600">- {formatPrice(totals.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-900 font-semibold">Total HT</span>
                      <span className="font-semibold">{formatPrice(totals.totalHt)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA ({tvaPercent}%)</span>
                      <span className="font-semibold">{formatPrice(totals.totalTva)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold text-blue-600 pt-2 border-t-2 border-blue-300">
                      <span>Total TTC</span>
                      <span>{formatPrice(totals.totalTtc)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !clientName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal calculateur */}
      <CostCalculatorModal
        isOpen={showCalculator}
        onClose={() => {
          setShowCalculator(false);
          setEditingItemIndex(null);
          setEditingItemData(null);
        }}
        onAddToQuote={handleAddItem}
        editingItem={editingItemData}
      />

      {/* Modal ajout palettes */}
      {showPalletsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6" />
                <h3 className="text-lg font-bold">Ajouter des palettes</h3>
              </div>
              <button
                onClick={() => {
                  setShowPalletsModal(false);
                  setPalletsQuantity(1);
                  setPalletPrice(15);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de palettes
                </label>
                <input
                  type="number"
                  value={palletsQuantity}
                  onChange={(e) => setPalletsQuantity(Number(e.target.value))}
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix par palette (€ HT)
                </label>
                <input
                  type="number"
                  value={palletPrice}
                  onChange={(e) => setPalletPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(palletsQuantity * palletPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowPalletsModal(false);
                  setPalletsQuantity(1);
                  setPalletPrice(15);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPallets}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
