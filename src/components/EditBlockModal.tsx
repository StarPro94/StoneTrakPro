import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Block, Material } from '../types';
import MaterialSearchCombobox from './MaterialSearchCombobox';

interface EditBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (block: Block) => Promise<void>;
  block: Block | null;
  materials: Material[];
}

export default function EditBlockModal({ isOpen, onClose, onUpdate, block, materials }: EditBlockModalProps) {
  // Filtrer uniquement les matières en Q et PBQ (blocs)
  const blockMaterials = materials
    .filter(m => /\s(Q|PBQ)$/i.test(m.name))
    .map(m => m.name);

  const [formData, setFormData] = useState({
    ligne: '',
    material: '',
    length: '',
    width: '',
    height: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const lignes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  useEffect(() => {
    if (block) {
      setFormData({
        ligne: block.ligne,
        material: block.material,
        length: block.length.toString(),
        width: block.width.toString(),
        height: block.height.toString(),
        notes: block.notes || '',
      });
    }
  }, [block]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!block || !formData.material || !formData.length || !formData.width || !formData.height) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const volume = (parseInt(formData.length) * parseInt(formData.width) * parseInt(formData.height)) / 1000000;

      await onUpdate({
        ...block,
        ligne: formData.ligne,
        material: formData.material,
        length: parseInt(formData.length),
        width: parseInt(formData.width),
        height: parseInt(formData.height),
        volume,
        notes: formData.notes || null,
      });

      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bloc:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !block) return null;

  const calculatedVolume = formData.length && formData.width && formData.height
    ? ((parseInt(formData.length) * parseInt(formData.width) * parseInt(formData.height)) / 1000000).toFixed(3)
    : '0.000';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Save className="h-6 w-6 text-purple-600" />
            <span>Modifier le Bloc</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ligne de Stockage <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.ligne}
                onChange={(e) => setFormData({ ...formData, ligne: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {lignes.map(ligne => (
                  <option key={ligne} value={ligne}>Ligne {ligne}</option>
                ))}
              </select>
            </div>

            <div>
              <MaterialSearchCombobox
                materials={blockMaterials}
                value={formData.material}
                onChange={(value) => setFormData({ ...formData, material: value })}
                placeholder="Rechercher une matière en Q ou PBQ..."
                label="Matière"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Largeur (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hauteur (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-800">
              Volume calculé: <span className="text-xl font-bold">{calculatedVolume} m³</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Informations supplémentaires..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
