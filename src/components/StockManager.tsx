import React, { useState } from 'react';
import { Package, TrendingUp, Wrench, Upload, CheckCircle, XCircle, Search, AlertCircle } from 'lucide-react';
import { useScaffoldingStock } from '../hooks/useScaffoldingStock';
import { useScaffoldingCatalog } from '../hooks/useScaffoldingCatalog';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

type StockSubTab = 'actuel' | 'total' | 'layher' | 'hs';

export default function StockManager() {
  const {
    stockGlobal,
    layherStock,
    loading,
    initializeStock,
    addLayherRental,
    returnLayherRental,
    markAsRepaired,
    markAsDiscarded,
    getDamagedItems,
    getActiveLayherRentals
  } = useScaffoldingStock();
  const { catalogItems } = useScaffoldingCatalog();
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<StockSubTab>('actuel');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const handleImportStock = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress('Analyse du fichier en cours...');

    try {
      const formData = new FormData();
      formData.append('excel', file);
      formData.append('previewOnly', 'false');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expirée');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/parse-scaffolding-excel`;

      setImportProgress('Extraction intelligente par IA...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'analyse du fichier');
      }

      setImportProgress('Import terminé avec succès');

      const docType = result.document_type === 'stock' ? 'Stock' : 'Commande';
      const unknownRefs = result.unknown_references || [];

      let message = `${result.items_count} élément(s) importé(s) avec confiance de ${result.confidence}%`;

      if (unknownRefs.length > 0) {
        message += `\n⚠️ ${unknownRefs.length} référence(s) inconnue(s): ${unknownRefs.slice(0, 3).join(', ')}${unknownRefs.length > 3 ? '...' : ''}`;
      }

      addToast({
        type: result.confidence >= 80 ? 'success' : 'warning',
        title: `${docType} importé par IA`,
        message,
        duration: 7000
      });

      if (result.anomalies && result.anomalies.length > 0) {
        console.log('Anomalies détectées:', result.anomalies);
      }

      await getDamagedItems();

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'import',
        message: error.message,
        duration: 5000
      });
    } finally {
      setIsImporting(false);
      setImportProgress('');
      event.target.value = '';
    }
  };

  const handleImportLayherCommande = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress('Analyse de la commande en cours...');

    try {
      const formData = new FormData();
      formData.append('excel', file);
      formData.append('previewOnly', 'false');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expirée');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/parse-scaffolding-excel`;

      setImportProgress('Extraction intelligente par IA...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'analyse du fichier');
      }

      setImportProgress('Import terminé avec succès');

      const unknownRefs = result.unknown_references || [];
      let message = `Commande ${result.numero_commande || 'importée'}: ${result.items_count} élément(s)`;

      if (unknownRefs.length > 0) {
        message += `\n⚠️ ${unknownRefs.length} référence(s) inconnue(s): ${unknownRefs.slice(0, 3).join(', ')}${unknownRefs.length > 3 ? '...' : ''}`;
      }

      addToast({
        type: result.confidence >= 80 ? 'success' : 'warning',
        title: 'Commande Layher importée par IA',
        message,
        duration: 7000
      });

      if (result.anomalies && result.anomalies.length > 0) {
        console.log('Anomalies détectées:', result.anomalies);
      }

      await getActiveLayherRentals();

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'import',
        message: error.message,
        duration: 5000
      });
    } finally {
      setIsImporting(false);
      setImportProgress('');
      event.target.value = '';
    }
  };

  const handleImportLayherRetour = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const parsedData = parseScaffoldingExcel(workbook);
      const numeroCommande = parsedData.header.numero;

      if (numeroCommande) {
        const rentals = layherStock.filter(r => r.numeroCommande === numeroCommande && r.status === 'en_cours');

        if (rentals.length > 0) {
          for (const rental of rentals) {
            await returnLayherRental(rental.id, rental.quantite);
          }

          addToast({
            type: 'success',
            title: 'Retour Layher enregistré',
            message: `Commande ${numeroCommande} retournée: ${rentals.length} élément(s)`,
            duration: 5000
          });
        } else {
          addToast({
            type: 'warning',
            title: 'Commande introuvable',
            message: `Aucune location active avec le numéro ${numeroCommande}`,
            duration: 5000
          });
        }
      } else {
        addToast({
          type: 'warning',
          title: 'Numéro manquant',
          message: 'Le numéro de commande n\'a pas pu être trouvé dans le fichier',
          duration: 5000
        });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'import',
        message: error.message,
        duration: 5000
      });
    }

    event.target.value = '';
  };

  const handleRepairSelected = async () => {
    if (selectedItems.size === 0) {
      addToast({
        type: 'warning',
        title: 'Aucune sélection',
        message: 'Veuillez sélectionner au moins un élément',
        duration: 3000
      });
      return;
    }

    try {
      for (const itemId of selectedItems) {
        const item = stockGlobal.find(s => s.id === itemId);
        if (item && item.quantiteHs > 0) {
          await markAsRepaired(item.catalogItemId, item.quantiteHs);
        }
      }

      addToast({
        type: 'success',
        title: 'Éléments réparés',
        message: `${selectedItems.size} élément(s) remis en stock`,
        duration: 5000
      });

      setSelectedItems(new Set());
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  const handleDiscardSelected = async () => {
    if (selectedItems.size === 0) {
      addToast({
        type: 'warning',
        title: 'Aucune sélection',
        message: 'Veuillez sélectionner au moins un élément',
        duration: 3000
      });
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir mettre ${selectedItems.size} élément(s) au rebut ? Cette action est irréversible.`)) {
      return;
    }

    try {
      for (const itemId of selectedItems) {
        const item = stockGlobal.find(s => s.id === itemId);
        if (item && item.quantiteHs > 0) {
          await markAsDiscarded(item.catalogItemId, item.quantiteHs);
        }
      }

      addToast({
        type: 'success',
        title: 'Éléments rebutés',
        message: `${selectedItems.size} élément(s) supprimé(s) du stock`,
        duration: 5000
      });

      setSelectedItems(new Set());
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const filteredStock = stockGlobal.filter(item =>
    !searchTerm ||
    item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableStock = filteredStock.filter(s => s.quantiteDisponible > 0);
  const damagedItems = getDamagedItems();
  const activeRentals = getActiveLayherRentals();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSubTab('actuel')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
              activeSubTab === 'actuel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Stock Actuel</span>
          </button>

          <button
            onClick={() => setActiveSubTab('total')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
              activeSubTab === 'total'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Stock Total</span>
          </button>

          <button
            onClick={() => setActiveSubTab('layher')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
              activeSubTab === 'layher'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Location Layher ({activeRentals.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hs')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
              activeSubTab === 'hs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wrench className="h-5 w-5" />
            <span>Matériel HS ({damagedItems.length})</span>
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Import en cours</p>
            <p className="text-xs text-blue-700">{importProgress}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence ou désignation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center space-x-2">
          {activeSubTab === 'total' && (
            <label className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="h-5 w-5" />
              <span>Importer Stock</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportStock}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          )}

          {activeSubTab === 'layher' && (
            <>
              <label className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="h-5 w-5" />
                <span>Importer Commande</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportLayherCommande}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
              <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors">
                <Upload className="h-5 w-5" />
                <span>Importer Retour</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportLayherRetour}
                  className="hidden"
                />
              </label>
            </>
          )}

          {activeSubTab === 'hs' && selectedItems.size > 0 && (
            <>
              <button
                onClick={handleRepairSelected}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Élément Réparé ({selectedItems.size})</span>
              </button>
              <button
                onClick={handleDiscardSelected}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <XCircle className="h-5 w-5" />
                <span>Élément Rebuté ({selectedItems.size})</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeSubTab === 'hs' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === damagedItems.length && damagedItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(damagedItems.map(i => i.id)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Désignation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poids Unitaire
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poids Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeSubTab === 'actuel' && availableStock.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {item.quantiteDisponible}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {item.poidsUnitaire.toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {item.poidsDisponible.toFixed(2)} kg
                  </td>
                </tr>
              ))}

              {activeSubTab === 'total' && filteredStock.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {item.quantiteTotale}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {item.poidsUnitaire.toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {item.poidsTotal.toFixed(2)} kg
                  </td>
                </tr>
              ))}

              {activeSubTab === 'layher' && activeRentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rental.catalogItem?.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {rental.catalogItem?.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {rental.quantite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {rental.catalogItem?.poidsUnitaire.toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {((rental.catalogItem?.poidsUnitaire || 0) * rental.quantite).toFixed(2)} kg
                  </td>
                </tr>
              ))}

              {activeSubTab === 'hs' && damagedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                    {item.quantiteHs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {item.poidsUnitaire.toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {(item.poidsUnitaire * item.quantiteHs).toFixed(2)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {((activeSubTab === 'actuel' && availableStock.length === 0) ||
        (activeSubTab === 'total' && filteredStock.length === 0) ||
        (activeSubTab === 'layher' && activeRentals.length === 0) ||
        (activeSubTab === 'hs' && damagedItems.length === 0)) && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-4">
          <p className="text-gray-500">Aucun élément à afficher</p>
        </div>
      )}
    </div>
  );
}
