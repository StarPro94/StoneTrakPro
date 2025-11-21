import React, { useState } from 'react';
import { Plus, Package, Truck, FileText, Calendar } from 'lucide-react';
import { useScaffoldingLists } from '../hooks/useScaffoldingLists';
import { useScaffoldingSites } from '../hooks/useScaffoldingSites';
import { useToast } from '../contexts/ToastContext';

export default function ScaffoldingListsManager() {
  const { lists, loading, addList } = useScaffoldingLists();
  const { sites } = useScaffoldingSites();
  const { addToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'livraison' as 'livraison' | 'reception',
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    preparateur: '',
    receptionnaire: '',
    transporteur: '',
    notes: ''
  });

  const handleAdd = async () => {
    if (!formData.siteId) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez sélectionner un chantier',
        duration: 3000
      });
      return;
    }

    try {
      await addList({
        type: formData.type,
        siteId: formData.siteId,
        date: new Date(formData.date),
        preparateur: formData.preparateur || undefined,
        receptionnaire: formData.receptionnaire || undefined,
        transporteur: formData.transporteur || undefined,
        status: 'brouillon',
        notes: formData.notes || undefined
      });
      addToast({
        type: 'success',
        title: 'Liste créée',
        message: 'Vous pouvez maintenant ajouter des éléments',
        duration: 3000
      });
      setShowAddForm(false);
      setFormData({
        type: 'livraison',
        siteId: '',
        date: new Date().toISOString().split('T')[0],
        preparateur: '',
        receptionnaire: '',
        transporteur: '',
        notes: ''
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const deliveryLists = lists.filter(l => l.type === 'livraison');
  const receptionLists = lists.filter(l => l.type === 'reception');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listes de Livraison et Réception</h2>
          <p className="text-gray-600 mt-1">Gérez toutes vos listes de matériel d'échafaudage</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Liste</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-green-900 mb-4 text-lg">Créer une Nouvelle Liste</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'livraison' | 'reception' })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="livraison">Livraison</option>
                <option value="reception">Réception</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier *</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sélectionner un chantier</option>
                {sites.filter(s => s.status === 'actif').map(site => (
                  <option key={site.id} value={site.id}>
                    {site.numero} - {site.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'livraison' ? 'Préparateur' : 'Réceptionnaire'}
              </label>
              <input
                type="text"
                value={formData.type === 'livraison' ? formData.preparateur : formData.receptionnaire}
                onChange={(e) => setFormData({
                  ...formData,
                  [formData.type === 'livraison' ? 'preparateur' : 'receptionnaire']: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporteur</label>
              <input
                type="text"
                value={formData.transporteur}
                onChange={(e) => setFormData({ ...formData, transporteur: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Créer
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span>Livraisons ({deliveryLists.length})</span>
          </h3>
          <div className="space-y-3">
            {deliveryLists.slice(0, 10).map(list => (
              <div key={list.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{list.numero}</p>
                    <p className="text-sm text-gray-600">{list.site?.nom}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {list.date.toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center">
                        <Package className="h-3 w-3 mr-1" />
                        {list.items?.length || 0} éléments
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    list.status === 'termine' ? 'bg-green-100 text-green-800' :
                    list.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                    list.status === 'pret' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {list.status === 'termine' ? 'Terminé' :
                     list.status === 'en_cours' ? 'En cours' :
                     list.status === 'pret' ? 'Prêt' : 'Brouillon'}
                  </span>
                </div>
              </div>
            ))}
            {deliveryLists.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune livraison</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
            <Package className="h-5 w-5 text-purple-600" />
            <span>Réceptions ({receptionLists.length})</span>
          </h3>
          <div className="space-y-3">
            {receptionLists.slice(0, 10).map(list => (
              <div key={list.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{list.numero}</p>
                    <p className="text-sm text-gray-600">{list.site?.nom}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {list.date.toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center">
                        <Package className="h-3 w-3 mr-1" />
                        {list.items?.length || 0} éléments
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    list.status === 'termine' ? 'bg-green-100 text-green-800' :
                    list.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                    list.status === 'pret' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {list.status === 'termine' ? 'Terminé' :
                     list.status === 'en_cours' ? 'En cours' :
                     list.status === 'pret' ? 'Prêt' : 'Brouillon'}
                  </span>
                </div>
              </div>
            ))}
            {receptionLists.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune réception</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
