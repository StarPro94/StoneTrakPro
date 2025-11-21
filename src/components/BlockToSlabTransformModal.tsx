import React, { useState } from 'react';
import { X, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Block } from '../types';
import { useBlocks } from '../hooks/useBlocks';
import { useSlabs } from '../hooks/useSlabs';
import { useMaterials } from '../hooks/useMaterials';
import { useToast } from '../contexts/ToastContext';

interface BlockToSlabTransformModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block | null;
  onTransformComplete: () => void;
}

interface SlabToCreate {
  id: string;
  position: string;
  material: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
}

export default function BlockToSlabTransformModal({ isOpen, onClose, block, onTransformComplete }: BlockToSlabTransformModalProps) {
  const { deleteBlock } = useBlocks();
  const { addSlab } = useSlabs();
  const { trancheMaterials } = useMaterials();
  const { addToast } = useToast();

  const [slabs, setSlabs] = useState<SlabToCreate[]>([{
    id: '1',
    position: '',
    material: '',
    length: 0,
    width: 0,
    thickness: 0,
    quantity: 1,
  }]);
  const [loading, setLoading] = useState(false);

  const handleAddSlab = () => {
    setSlabs([...slabs, {
      id: Date.now().toString(),
      position: '',
      material: '',
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 1,
    }]);
  };

  const handleRemoveSlab = (id: string) => {
    if (slabs.length === 1) {
      addToast({
        type: 'warning',
        title: 'Attention',
        message: 'Vous devez créer au moins une tranche',
      });
      return;
    }
    setSlabs(slabs.filter(s => s.id !== id));
  };

  const handleUpdateSlab = (id: string, field: keyof SlabToCreate, value: any) => {
    setSlabs(slabs.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleTransform = async () => {
    if (!block) return;

    const isValid = slabs.every(s => s.position && s.material && s.length > 0 && s.width > 0 && s.thickness > 0 && s.quantity > 0);

    if (!isValid) {
      addToast({
        type: 'error',
        title: 'Erreur de validation',
        message: 'Veuillez remplir tous les champs pour chaque tranche',
      });
      return;
    }

    setLoading(true);
    try {
      for (const slab of slabs) {
        for (let i = 0; i < slab.quantity; i++) {
          await addSlab({
            userId: block.userId,
            position: slab.position,
            material: slab.material,
            length: slab.length,
            width: slab.width,
            thickness: slab.thickness,
            status: 'dispo',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      await deleteBlock(block.id);

      const totalSlabs = slabs.reduce((sum, s) => sum + s.quantity, 0);
      addToast({
        type: 'success',
        title: 'Transformation réussie',
        message: `Le bloc de la ligne ${block.ligne} a été transformé en ${totalSlabs} tranche${totalSlabs > 1 ? 's' : ''}`,
      });

      onTransformComplete();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur de transformation',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !block) return null;

  const totalVolume = slabs.reduce((sum, s) => {
    const volume = (s.length * s.width * s.thickness * s.quantity) / 1000000;
    return sum + volume;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <ArrowRight className="h-6 w-6 text-green-600" />
            <span>Transformer Bloc en Tranches</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Bloc Original</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-purple-600">Ligne</p>
                <p className="font-bold text-purple-900">{block.ligne}</p>
              </div>
              <div>
                <p className="text-purple-600">Matière</p>
                <p className="font-bold text-purple-900">{block.material}</p>
              </div>
              <div>
                <p className="text-purple-600">Dimensions</p>
                <p className="font-bold text-purple-900">{block.length} × {block.width} × {block.height} cm</p>
              </div>
              <div>
                <p className="text-purple-600">Volume</p>
                <p className="font-bold text-purple-900">{block.volume.toFixed(3)} m³</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">Tranches à Créer</h4>
            <button
              onClick={handleAddSlab}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une tranche</span>
            </button>
          </div>

          <div className="space-y-4">
            {slabs.map((slab, index) => (
              <div key={slab.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium text-gray-900">Tranche {index + 1}</h5>
                  {slabs.length > 1 && (
                    <button
                      onClick={() => handleRemoveSlab(slab.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={slab.position}
                      onChange={(e) => handleUpdateSlab(slab.id, 'position', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: A1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Matière</label>
                    <select
                      value={slab.material}
                      onChange={(e) => handleUpdateSlab(slab.id, 'material', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-</option>
                      {trancheMaterials.map(mat => (
                        <option key={mat.id} value={mat.name}>{mat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Long. (cm)</label>
                    <input
                      type="number"
                      min="0"
                      value={slab.length || ''}
                      onChange={(e) => handleUpdateSlab(slab.id, 'length', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Larg. (cm)</label>
                    <input
                      type="number"
                      min="0"
                      value={slab.width || ''}
                      onChange={(e) => handleUpdateSlab(slab.id, 'width', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Épais. (cm)</label>
                    <input
                      type="number"
                      min="0"
                      value={slab.thickness || ''}
                      onChange={(e) => handleUpdateSlab(slab.id, 'thickness', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={slab.quantity}
                      onChange={(e) => handleUpdateSlab(slab.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-800">Volume total des tranches créées</p>
                <p className="text-2xl font-bold text-blue-600">{totalVolume.toFixed(3)} m³</p>
              </div>
              {totalVolume > block.volume && (
                <div className="bg-orange-100 border border-orange-300 rounded px-3 py-2">
                  <p className="text-xs text-orange-800 font-medium">
                    ⚠️ Volume supérieur au bloc original
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Attention :</strong> Cette action est irréversible. Le bloc sera supprimé et les tranches seront ajoutées au Parc à Tranches.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={handleTransform}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <ArrowRight className="h-5 w-5" />
            <span>{loading ? 'Transformation en cours...' : 'Transformer le Bloc'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
