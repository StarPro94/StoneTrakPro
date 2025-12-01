import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Slab } from '../types';
import { useMaterials } from '../hooks/useMaterials';
import SlabGrid from './SlabGrid';
import MaterialSearchCombobox from './MaterialSearchCombobox';

interface AddSlabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (slab: Omit<Slab, 'id' | 'createdAt' | 'updatedAt'>) => void;
  slabs: Slab[];
}

export default function AddSlabModal({ isOpen, onClose, onAdd, slabs }: AddSlabModalProps) {
  const { materials } = useMaterials();

  // Filtrer uniquement les matières en K (tranches)
  const slabMaterials = materials
    .filter(m => /\bK\d+/i.test(m.name))
    .map(m => m.name);

  const [formData, setFormData] = useState({
    position: '',
    material: '',
    length: '',
    width: '',
    thickness: '',
    status: 'dispo' as 'dispo' | 'réservé',
    quantity: '1'
  });

  const handlePositionSelect = (position: string) => {
    setFormData({ ...formData, position });
  };

  // Fonction pour extraire l'épaisseur du nom de matière (ex: "YELLOW ROCK K3" -> "3")
  const extractThicknessFromMaterial = (materialName: string): string => {
    const match = materialName.match(/K(\d+(?:[.,]\d+)?)/i);
    if (match) {
      return match[1].replace(',', '.');
    }
    return '';
  };

  const handleMaterialChange = (value: string) => {
    const thickness = extractThicknessFromMaterial(value);
    setFormData({
      ...formData,
      material: value,
      thickness: thickness || formData.thickness // Préremplir l'épaisseur si trouvée, sinon garder la valeur existante
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.position || !formData.material || !formData.length || !formData.width || !formData.thickness || !formData.quantity) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity < 1) {
      alert('La quantité doit être supérieure à 0');
      return;
    }

    onAdd({
      userId: '', // Sera défini par le hook
      position: formData.position,
      material: formData.material,
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      thickness: parseFloat(formData.thickness),
      quantity: quantity,
      status: formData.status
    });

    // Reset form
    setFormData({
      position: '',
      material: '',
      length: '',
      width: '',
      thickness: '',
      status: 'dispo',
      quantity: '1'
    });
    
    onClose();
  };

  const handleClose = () => {
    setFormData({
      position: '',
      material: '',
      length: '',
      width: '',
      thickness: '',
      status: 'dispo',
      quantity: '1'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Ajouter une Tranche</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sélection de position via grille */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner la position</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <SlabGrid
                  slabs={slabs}
                  selectedPosition={formData.position}
                  onPositionSelect={handlePositionSelect}
                />
                {formData.position && (
                  <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Position sélectionnée : <span className="font-bold">{formData.position}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Formulaire des détails */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de la tranche</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <MaterialSearchCombobox
                    materials={slabMaterials}
                    value={formData.material}
                    onChange={handleMaterialChange}
                    placeholder="Rechercher une matière en K..."
                    label="Matière"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longueur (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Largeur (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épaisseur (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.thickness}
                      onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'dispo' | 'réservé' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="dispo">Disponible</option>
                    <option value="réservé">Réservé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de tranches identiques à cet emplacement
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.position || parseInt(formData.quantity) < 1}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}