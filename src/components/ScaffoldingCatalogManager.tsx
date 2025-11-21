import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { useScaffoldingCatalog } from '../hooks/useScaffoldingCatalog';
import { ScaffoldingCatalogItem } from '../types';
import { useToast } from '../contexts/ToastContext';

export default function ScaffoldingCatalogManager() {
  const { catalog, loading, addCatalogItem, updateCatalogItem, deleteCatalogItem, searchCatalog } = useScaffoldingCatalog();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    poidsUnitaire: 0,
    category: '',
    layherReference: ''
  });

  const filteredCatalog = searchTerm ? searchCatalog(searchTerm) : catalog;

  const handleAdd = async () => {
    try {
      await addCatalogItem({
        ...formData,
        isActive: true
      });
      addToast({
        type: 'success',
        title: 'Élément ajouté',
        message: `${formData.reference} - ${formData.designation}`,
        duration: 3000
      });
      setShowAddForm(false);
      setFormData({ reference: '', designation: '', poidsUnitaire: 0, category: '', layherReference: '' });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateCatalogItem(editingId, formData);
      addToast({
        type: 'success',
        title: 'Élément modifié',
        duration: 3000
      });
      setEditingId(null);
      setFormData({ reference: '', designation: '', poidsUnitaire: 0, category: '', layherReference: '' });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  const handleDelete = async (id: string, reference: string) => {
    if (!confirm(`Supprimer ${reference} du catalogue ?`)) return;
    try {
      await deleteCatalogItem(id);
      addToast({
        type: 'success',
        title: 'Élément supprimé',
        duration: 3000
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

  const startEdit = (item: ScaffoldingCatalogItem) => {
    setEditingId(item.id);
    setFormData({
      reference: item.reference,
      designation: item.designation,
      poidsUnitaire: item.poidsUnitaire,
      category: item.category || '',
      layherReference: item.layherReference || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ reference: '', designation: '', poidsUnitaire: 0, category: '', layherReference: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence ou désignation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Désignation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Poids (kg)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ref. Layher</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {showAddForm && (
                <tr className="bg-green-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Ex: 2603/200"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Désignation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.poidsUnitaire}
                      onChange={(e) => setFormData({ ...formData, poidsUnitaire: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Catégorie"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Ref. Layher"
                      value={formData.layherReference}
                      onChange={(e) => setFormData({ ...formData, layherReference: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={handleAdd}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Enregistrer"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredCatalog.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formData.reference}
                          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.poidsUnitaire}
                          onChange={(e) => setFormData({ ...formData, poidsUnitaire: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formData.layherReference}
                          onChange={(e) => setFormData({ ...formData, layherReference: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={handleUpdate}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Enregistrer"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Annuler"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.reference}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.designation}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.poidsUnitaire.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.category || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.layherReference || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.reference)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCatalog.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun élément dans le catalogue</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredCatalog.length} élément{filteredCatalog.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
