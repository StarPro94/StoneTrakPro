import React, { useState, useRef, useMemo } from 'react';
import { Plus, Upload, Edit2, Trash2, Save, X, Package, Search } from 'lucide-react';
import { useMaterials } from '../hooks/useMaterials';
import { Material } from '../types';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

export default function MaterialsManager() {
  const { materials, loading, loadingProgress, error, addMaterial, updateMaterial, deleteMaterial, importMaterialsFromCSV, importMaterialsFromXLS } = useMaterials();
  const { addToast } = useToast();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xlsInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'tranche' as 'tranche' | 'bloc',
    thickness: '',
    description: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tranche' | 'bloc'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleStartEdit = (material: Material) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      type: material.type,
      thickness: material.thickness?.toString() || '',
      description: material.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      type: 'tranche',
      thickness: '',
      description: '',
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const material = materials.find(m => m.id === editingId);
        if (!material) return;

        await updateMaterial({
          ...material,
          name: formData.name,
          type: formData.type,
          thickness: formData.thickness ? parseInt(formData.thickness) : null,
          description: formData.description || null,
        });

        addToast({
          type: 'success',
          title: 'Matière mise à jour',
          message: `${formData.name} a été mise à jour avec succès`,
        });
      } else {
        await addMaterial({
          name: formData.name,
          type: formData.type,
          thickness: formData.thickness ? parseInt(formData.thickness) : null,
          isActive: true,
          description: formData.description || null,
        });

        addToast({
          type: 'success',
          title: 'Matière ajoutée',
          message: `${formData.name} a été ajoutée avec succès`,
        });
      }

      handleCancelEdit();
      setCurrentPage(1);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message,
      });
    }
  };

  const handleDelete = (id: string) => {
    setMaterialToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      const material = materials.find(m => m.id === materialToDelete);
      await deleteMaterial(materialToDelete);

      addToast({
        type: 'success',
        title: 'Matière supprimée',
        message: `${material?.name || 'La matière'} a été supprimée`,
      });

      setMaterialToDelete(null);
      setCurrentPage(1);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message,
      });
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importMaterialsFromCSV(text);

      addToast({
        type: 'success',
        title: 'Import réussi',
        message: 'Les matières ont été importées depuis le fichier CSV',
      });

      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'import',
        message: err.message,
      });
    }
  };

  const handleImportXLS = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importMaterialsFromXLS(file);

      if (result) {
        addToast({
          type: 'success',
          title: 'Import réussi',
          message: `${result.addedCount} matière(s) ajoutée(s), ${result.skippedCount} déjà existante(s)`,
        });
      }

      if (xlsInputRef.current) {
        xlsInputRef.current.value = '';
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'import XLS',
        message: err.message,
      });
    }
  };

  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.ref?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    return filtered;
  }, [materials, searchQuery, filterType]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMaterials.slice(startIndex, endIndex);
  }, [filteredMaterials, currentPage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        {loadingProgress && (
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Chargement des matières...</span>
              <span>{loadingProgress.current} / {loadingProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Erreur: {error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Liste Maîtresse des Matières</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredMaterials.length} / {materials.length} matière{materials.length > 1 ? 's' : ''}
            {materials.length >= 1000 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Gestion étendue
              </span>
            )}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => xlsInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Importer XLS</span>
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Importer CSV</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter</span>
          </button>
        </div>

        <input
          ref={xlsInputRef}
          type="file"
          accept=".xls,.xlsx,.txt,.tsv"
          onChange={handleImportXLS}
          className="hidden"
        />
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          className="hidden"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, référence ou description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilterType('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => {
                setFilterType('tranche');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'tranche'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tranches
            </button>
            <button
              onClick={() => {
                setFilterType('bloc');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'bloc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Blocs
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Épaisseur</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {showAddForm && (
              <tr className="bg-blue-50">
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Ex: K3, Q, PBQ"
                  />
                </td>
                <td className="px-6 py-3">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'tranche' | 'bloc' })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="tranche">Tranche (K)</option>
                    <option value="bloc">Bloc (Q/PBQ)</option>
                  </select>
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    value={formData.thickness}
                    onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Ex: 3"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Description"
                  />
                </td>
                <td className="px-6 py-3">
                  <div className="flex space-x-2">
                    <button onClick={handleSave} className="text-green-600 hover:text-green-800 p-1">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {paginatedMaterials.map((material) => (
              <tr key={material.id} className="hover:bg-gray-50">
                {editingId === material.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'tranche' | 'bloc' })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="tranche">Tranche (K)</option>
                        <option value="bloc">Bloc (Q/PBQ)</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={formData.thickness}
                        onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex space-x-2">
                        <button onClick={handleSave} className="text-green-600 hover:text-green-800 p-1">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{material.name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        material.type === 'tranche' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {material.type === 'tranche' ? 'Tranche' : 'Bloc'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {material.thickness ? `${material.thickness} cm` : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{material.description || '-'}</td>
                    <td className="px-6 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStartEdit(material)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
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

            {filteredMaterials.length === 0 && materials.length > 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune matière ne correspond à votre recherche</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setCurrentPage(1);
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                </td>
              </tr>
            )}

            {materials.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune matière enregistrée</p>
                  <p className="text-gray-400 text-sm mt-2">Ajoutez votre première matière pour commencer</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages} ({filteredMaterials.length} matière{filteredMaterials.length > 1 ? 's' : ''})
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Première
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Dernière
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setMaterialToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer la matière"
        message="Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible."
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        type="danger"
      />
    </div>
  );
}
