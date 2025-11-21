import React, { useState } from 'react';
import { X, Package, Upload, ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { ScaffoldingSite, ScaffoldingList, ScaffoldingSiteInventory } from '../types';
import { useScaffoldingLists } from '../hooks/useScaffoldingLists';
import { useScaffoldingStock } from '../hooks/useScaffoldingStock';
import { useScaffoldingCatalog } from '../hooks/useScaffoldingCatalog';
import { useToast } from '../contexts/ToastContext';
import * as XLSX from 'xlsx';
import { parseScaffoldingExcel, validateScaffoldingData } from '../utils/scaffoldingExcelParser';

interface SiteDetailsModalProps {
  site: ScaffoldingSite;
  onClose: () => void;
}

export default function SiteDetailsModal({ site, onClose }: SiteDetailsModalProps) {
  const { lists, addList, updateList } = useScaffoldingLists();
  const { getInventoryBySite, checkAvailability, addMovement } = useScaffoldingStock();
  const { catalogItems } = useScaffoldingCatalog();
  const { addToast } = useToast();
  const [view, setView] = useState<'lists' | 'detail' | 'inventory'>('lists');
  const [selectedList, setSelectedList] = useState<ScaffoldingList | null>(null);
  const [showCloseSiteModal, setShowCloseSiteModal] = useState(false);
  const [damagedQuantities, setDamagedQuantities] = useState<Record<string, number>>({});

  const siteLists = lists.filter(l => l.siteId === site.id);
  const deliveries = siteLists.filter(l => l.type === 'livraison');
  const receptions = siteLists.filter(l => l.type === 'reception');
  const siteInventory = getInventoryBySite(site.id);

  const handleImportDelivery = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const parsedData = parseScaffoldingExcel(workbook);
      const validation = validateScaffoldingData(parsedData);

      if (!validation.valid) {
        addToast({
          type: 'error',
          title: 'Fichier invalide',
          message: validation.errors.join('\n'),
          duration: 5000
        });
        event.target.value = '';
        return;
      }

      const numero = parsedData.header.numero || `LIV-${Date.now()}`;
      const preparateur = parsedData.header.preparateur || '';
      const receptionnaire = parsedData.header.receptionnaire || '';
      const transporteur = parsedData.header.transporteur || '';

      const items: Array<{ catalogItemId: string; quantite: number; reference: string }> = [];
      const unavailableItems: Array<{ reference: string; needed: number; available: number }> = [];
      const notFoundReferences: string[] = [];

      for (const item of parsedData.items) {
        if (!item.reference || !item.quantite || item.quantite <= 0) continue;

        const catalogItem = catalogItems.find(c => c.reference === item.reference);
        if (catalogItem) {
          const availability = await checkAvailability(catalogItem.id, item.quantite);

          if (!availability.disponible) {
            unavailableItems.push({
              reference: item.reference,
              needed: item.quantite,
              available: availability.quantiteDisponible
            });
          } else {
            items.push({
              catalogItemId: catalogItem.id,
              quantite: item.quantite,
              reference: item.reference
            });
          }
        } else {
          notFoundReferences.push(item.reference);
        }
      }

      if (notFoundReferences.length > 0) {
        addToast({
          type: 'warning',
          title: 'Références non trouvées',
          message: `${notFoundReferences.length} référence(s) non trouvée(s) dans le catalogue: ${notFoundReferences.slice(0, 5).join(', ')}${notFoundReferences.length > 5 ? '...' : ''}`,
          duration: 7000
        });
      }

      if (unavailableItems.length > 0) {
        const message = unavailableItems
          .map(item => `${item.reference}: besoin ${item.needed}, disponible ${item.available}`)
          .join('\n');

        addToast({
          type: 'error',
          title: 'Stock insuffisant',
          message: `Les éléments suivants ne sont pas disponibles:\n${message}\n\nVeuillez passer commande chez Layher.`,
          duration: 10000
        });
        event.target.value = '';
        return;
      }

      if (items.length === 0) {
        addToast({
          type: 'warning',
          title: 'Aucun élément',
          message: 'Aucun élément valide trouvé dans le catalogue',
          duration: 5000
        });
        event.target.value = '';
        return;
      }

      const listId = await addList({
        numero,
        type: 'livraison',
        siteId: site.id,
        date: new Date(),
        preparateur: preparateur || undefined,
        receptionnaire: receptionnaire || undefined,
        transporteur: transporteur || undefined,
        status: 'termine'
      });

      for (const item of items) {
        await addMovement({
          catalogItemId: item.catalogItemId,
          type: 'sortie',
          quantite: item.quantite,
          source: 'Stock',
          destination: site.nom,
          siteId: site.id,
          listId: listId,
          notes: `Livraison ${numero}`
        });
      }

      addToast({
        type: 'success',
        title: 'Livraison importée',
        message: `Liste ${numero}: ${items.length} éléments livrés${parsedData.totalWeight ? ` (${parsedData.totalWeight.toFixed(2)} kg)` : ''}`,
        duration: 5000
      });
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

  const handleImportReturn = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const parsedData = parseScaffoldingExcel(workbook);
      const validation = validateScaffoldingData(parsedData);

      if (!validation.valid) {
        addToast({
          type: 'error',
          title: 'Fichier invalide',
          message: validation.errors.join('\n'),
          duration: 5000
        });
        event.target.value = '';
        return;
      }

      const numero = parsedData.header.numero || `RET-${Date.now()}`;
      const items: Array<{ catalogItemId: string; quantite: number; quantiteHs: number }> = [];
      const tempDamagedQty: Record<string, number> = {};
      const notFoundReferences: string[] = [];

      for (const item of parsedData.items) {
        if (!item.reference || !item.quantite || item.quantite <= 0) continue;

        const catalogItem = catalogItems.find(c => c.reference === item.reference);
        if (catalogItem) {
          const quantiteHs = item.quantiteHs || 0;
          items.push({
            catalogItemId: catalogItem.id,
            quantite: item.quantite,
            quantiteHs
          });
          if (quantiteHs > 0) {
            tempDamagedQty[catalogItem.id] = quantiteHs;
          }
        } else {
          notFoundReferences.push(item.reference);
        }
      }

      if (notFoundReferences.length > 0) {
        addToast({
          type: 'warning',
          title: 'Références non trouvées',
          message: `${notFoundReferences.length} référence(s) non trouvée(s) dans le catalogue`,
          duration: 5000
        });
      }

      if (items.length === 0) {
        addToast({
          type: 'warning',
          title: 'Aucun élément',
          message: 'Aucun élément valide trouvé dans le catalogue',
          duration: 5000
        });
        event.target.value = '';
        return;
      }

      const listId = await addList({
        numero,
        type: 'reception',
        siteId: site.id,
        date: new Date(),
        status: 'termine'
      });

      for (const item of items) {
        const quantiteBonne = item.quantite - item.quantiteHs;

        if (quantiteBonne > 0) {
          await addMovement({
            catalogItemId: item.catalogItemId,
            type: 'retour',
            quantite: quantiteBonne,
            source: site.nom,
            destination: 'Stock',
            siteId: site.id,
            listId: listId,
            notes: `Retour ${numero || listId}`
          });
        }

        if (item.quantiteHs > 0) {
          await addMovement({
            catalogItemId: item.catalogItemId,
            type: 'hs',
            quantite: item.quantiteHs,
            source: site.nom,
            destination: 'Matériel HS',
            siteId: site.id,
            listId: listId,
            notes: `Éléments HS - Retour ${numero || listId}`
          });
        }
      }

      const hsCount = items.filter(i => i.quantiteHs > 0).length;
      addToast({
        type: 'success',
        title: 'Retour enregistré',
        message: `Liste ${numero}: ${items.length} élément(s) retourné(s)${hsCount > 0 ? ` (dont ${hsCount} HS)` : ''}${parsedData.totalWeight ? ` - ${parsedData.totalWeight.toFixed(2)} kg` : ''}`,
        duration: 5000
      });
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

  const handleCloseSite = async () => {
    try {
      for (const item of siteInventory) {
        if (item.quantiteActuelle > 0) {
          const quantiteHs = damagedQuantities[item.catalogItemId] || 0;
          const quantiteBonne = item.quantiteActuelle - quantiteHs;

          if (quantiteBonne > 0) {
            await addMovement({
              catalogItemId: item.catalogItemId,
              type: 'retour',
              quantite: quantiteBonne,
              source: site.nom,
              destination: 'Stock',
              siteId: site.id,
              notes: `Clôture chantier ${site.numero}`
            });
          }

          if (quantiteHs > 0) {
            await addMovement({
              catalogItemId: item.catalogItemId,
              type: 'hs',
              quantite: quantiteHs,
              source: site.nom,
              destination: 'Matériel HS',
              siteId: site.id,
              notes: `Éléments HS - Clôture ${site.numero}`
            });
          }
        }
      }

      addToast({
        type: 'success',
        title: 'Chantier clôturé',
        message: 'Tout le matériel a été retourné',
        duration: 5000
      });

      setShowCloseSiteModal(false);
      onClose();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  if (view === 'inventory') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setView('lists')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                Matériel sur Place - {site.numero}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Livré
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retourné
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sur Place
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {siteInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.reference}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                        {item.quantiteLivree}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                        {item.quantiteRecue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">
                        {item.quantiteActuelle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {siteInventory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun matériel sur ce chantier</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedList) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedList(null);
                  setView('lists');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedList.type === 'livraison' ? 'Livraison' : 'Réception'} - {selectedList.numero}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {selectedList.preparateur && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Préparateur</p>
                  <p className="text-sm text-blue-900">{selectedList.preparateur}</p>
                </div>
              )}
              {selectedList.receptionnaire && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium mb-1">Réceptionnaire</p>
                  <p className="text-sm text-green-900">{selectedList.receptionnaire}</p>
                </div>
              )}
              {selectedList.transporteur && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium mb-1">Transporteur</p>
                  <p className="text-sm text-purple-900">{selectedList.transporteur}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedList.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.catalogItem?.reference}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.catalogItem?.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {item.quantite}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Chantier {site.numero} - {site.nom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('inventory')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>Voir Matériel sur Place</span>
              </button>
              <button
                onClick={() => setShowCloseSiteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clôturer le Chantier
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors">
                <Upload className="h-5 w-5" />
                <span>Importer Livraison</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportDelivery}
                  className="hidden"
                />
              </label>
              <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors">
                <Upload className="h-5 w-5" />
                <span>Importer Retour</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportReturn}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Préparateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transporteur
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siteLists.map((list) => (
                  <tr
                    key={list.id}
                    onClick={() => {
                      setSelectedList(list);
                      setView('detail');
                    }}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          list.type === 'livraison'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {list.type === 'livraison' ? 'Livraison' : 'Réception'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {list.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {list.date.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {list.preparateur || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {list.transporteur || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {siteLists.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">Aucune commande pour ce chantier</p>
            </div>
          )}
        </div>
      </div>

      {showCloseSiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Clôture du Chantier</h3>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      Y a-t-il du matériel endommagé (HS) ?
                    </p>
                    <p className="text-xs text-yellow-700">
                      Indiquez la quantité d'éléments HS pour chaque référence. Les éléments bons seront retournés au stock disponible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Référence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Désignation
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Sur Place
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Quantité HS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {siteInventory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.designation}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {item.quantiteActuelle}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={item.quantiteActuelle}
                            value={damagedQuantities[item.catalogItemId] || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setDamagedQuantities({
                                ...damagedQuantities,
                                [item.catalogItemId]: Math.min(value, item.quantiteActuelle)
                              });
                            }}
                            className="w-20 px-3 py-1 border border-gray-300 rounded text-sm text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCloseSiteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCloseSite}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirmer la Clôture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
