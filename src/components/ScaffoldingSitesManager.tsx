import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, CheckCircle, Clock, Eye } from 'lucide-react';
import { useScaffoldingSites } from '../hooks/useScaffoldingSites';
import { ScaffoldingSite } from '../types';
import { useToast } from '../contexts/ToastContext';
import SiteDetailsModal from './SiteDetailsModal';

export default function ScaffoldingSitesManager() {
  const { sites, siteSummaries, loading, addSite, updateSite, deleteSite, searchSites } = useScaffoldingSites();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<ScaffoldingSite | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    nom: '',
    adresse: '',
    status: 'actif' as 'actif' | 'termine',
    dateDebut: '',
    dateFin: '',
    notes: ''
  });

  const filteredSites = searchTerm ? searchSites(searchTerm) : sites;

  const handleAdd = async () => {
    try {
      await addSite({
        numero: formData.numero,
        nom: formData.nom,
        adresse: formData.adresse || undefined,
        status: formData.status,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
        dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
        notes: formData.notes || undefined
      });
      addToast({
        type: 'success',
        title: 'Chantier ajouté',
        message: `${formData.numero} - ${formData.nom}`,
        duration: 3000
      });
      setShowAddForm(false);
      setFormData({ numero: '', nom: '', adresse: '', status: 'actif', dateDebut: '', dateFin: '', notes: '' });
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
      await updateSite(editingId, {
        numero: formData.numero,
        nom: formData.nom,
        adresse: formData.adresse || undefined,
        status: formData.status,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
        dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
        notes: formData.notes || undefined
      });
      addToast({
        type: 'success',
        title: 'Chantier modifié',
        duration: 3000
      });
      setEditingId(null);
      setFormData({ numero: '', nom: '', adresse: '', status: 'actif', dateDebut: '', dateFin: '', notes: '' });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
        duration: 5000
      });
    }
  };

  const handleDelete = async (id: string, numero: string, nom: string) => {
    if (!confirm(`Supprimer le chantier ${numero} - ${nom} ?`)) return;
    try {
      await deleteSite(id);
      addToast({
        type: 'success',
        title: 'Chantier supprimé',
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

  const startEdit = (site: ScaffoldingSite) => {
    setEditingId(site.id);
    setFormData({
      numero: site.numero,
      nom: site.nom,
      adresse: site.adresse || '',
      status: site.status,
      dateDebut: site.dateDebut ? site.dateDebut.toISOString().split('T')[0] : '',
      dateFin: site.dateFin ? site.dateFin.toISOString().split('T')[0] : '',
      notes: site.notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ numero: '', nom: '', adresse: '', status: 'actif', dateDebut: '', dateFin: '', notes: '' });
  };

  const getSummary = (siteId: string) => {
    return siteSummaries.find(s => s.id === siteId);
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
              placeholder="Rechercher par numéro, nom ou adresse..."
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
          <span>Nouveau Chantier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showAddForm && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-4">Nouveau Chantier</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Numéro *"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Nom *"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'actif' | 'termine' })}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="actif">Actif</option>
                <option value="termine">Terminé</option>
              </select>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                placeholder="Date début"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer</span>
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredSites.map((site) => {
          const summary = getSummary(site.id);
          return (
            <div key={site.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{site.numero}</h3>
                    {site.status === 'actif' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Terminé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{site.nom}</p>
                  {site.adresse && <p className="text-xs text-gray-500 mt-1">{site.adresse}</p>}
                </div>
              </div>

              {summary && (
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-blue-600 font-medium">{summary.nbLivraisons} livraisons</p>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <p className="text-purple-600 font-medium">{summary.nbReceptions} réceptions</p>
                  </div>
                </div>
              )}

              {site.dateDebut && (
                <p className="text-xs text-gray-500 mb-2">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Début: {site.dateDebut.toLocaleDateString('fr-FR')}
                </p>
              )}

              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => setSelectedSite(site)}
                  className="flex-1 text-green-600 hover:text-green-800 px-3 py-1 border border-green-300 rounded text-sm flex items-center justify-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>Voir Détails</span>
                </button>
                <button
                  onClick={() => startEdit(site)}
                  className="px-3 py-1 text-blue-600 hover:text-blue-800 border border-blue-300 rounded text-sm"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(site.id, site.numero, site.nom)}
                  className="px-3 py-1 text-red-600 hover:text-red-800 border border-red-300 rounded text-sm"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSites.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Aucun chantier</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredSites.length} chantier{filteredSites.length > 1 ? 's' : ''}
      </div>

      {selectedSite && (
        <SiteDetailsModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </div>
  );
}
