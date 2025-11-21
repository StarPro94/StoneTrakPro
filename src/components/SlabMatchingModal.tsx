import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, TrendingUp, CheckCircle } from 'lucide-react';
import { useSlabMatching } from '../hooks/useSlabMatching';
import { getMaterialColor } from '../utils/materialColors';
import { formatDimensions } from '../utils/slabCalculations';
import { useSlabs } from '../hooks/useSlabs';
import { useMaterials } from '../hooks/useMaterials';

interface SlabMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlab?: (slabId: string) => void;
}

export default function SlabMatchingModal({
  isOpen,
  onClose,
  onSelectSlab,
}: SlabMatchingModalProps) {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [material, setMaterial] = useState('');
  const [tolerance, setTolerance] = useState(5);

  const { results, loading, error, findCompatibleSlabs } = useSlabMatching();
  const { slabs } = useSlabs();
  const { trancheMaterials } = useMaterials();

  useEffect(() => {
    if (length || width || thickness || material) {
      const timer = setTimeout(() => {
        findCompatibleSlabs({
          length: length ? Number(length) : undefined,
          width: width ? Number(width) : undefined,
          thickness: thickness ? Number(thickness) : undefined,
          material: material || undefined,
          tolerance,
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [length, width, thickness, material, tolerance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Recherche Intelligente</h2>
              <p className="text-blue-100">Trouvez la tranche parfaite pour votre commande</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Dimensions recherchées</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longueur (cm) <span className="text-gray-400 text-xs">(optionnel)</span>
                </label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Ex: 300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Largeur (cm) <span className="text-gray-400 text-xs">(optionnel)</span>
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Ex: 150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Épaisseur (cm) <span className="text-gray-400 text-xs">(optionnel)</span>
                </label>
                <input
                  type="number"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  placeholder="Ex: 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matériau (optionnel)
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous les matériaux</option>
                  {trancheMaterials.map((mat) => (
                    <option key={mat.id} value={mat.name}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolérance (cm)
                </label>
                <input
                  type="number"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {loading && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Recherche en cours...</span>
              </div>
            )}
            {!length && !width && !thickness && !loading && (
              <p className="text-xs text-gray-500 text-center mt-4">
                Renseignez au moins un critère de dimension pour effectuer une recherche
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>{results.length} tranche{results.length > 1 ? 's' : ''} compatible{results.length > 1 ? 's' : ''}</span>
              </h3>

              <div className="space-y-3">
                {results.map((result, index) => {
                  const materialColor = getMaterialColor(result.slab.material);
                  const scoreColor =
                    result.compatibilityScore >= 90
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : result.compatibilityScore >= 70
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : 'bg-orange-100 text-orange-800 border-orange-300';

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${materialColor.border} ${materialColor.bg} hover:shadow-lg transition-all`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-gray-900">
                              Position {result.slab.position}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${scoreColor}`}>
                              Score: {result.compatibilityScore}%
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${materialColor.text}`}>
                            {result.slab.material}
                          </p>
                        </div>

                        {onSelectSlab && (
                          <button
                            onClick={() => {
                              onSelectSlab(result.slab.id);
                              onClose();
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm font-medium"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Sélectionner</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Dimensions</p>
                          <p className="font-mono text-gray-900">
                            {formatDimensions(result.slab.length, result.slab.width, result.slab.thickness)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600 font-medium mb-1">Différences</p>
                          <p className="text-xs text-gray-700">
                            L: {result.dimensionMatch.lengthDiff > 0 ? '+' : ''}{result.dimensionMatch.lengthDiff.toFixed(1)} cm
                            {' | '}
                            l: {result.dimensionMatch.widthDiff > 0 ? '+' : ''}{result.dimensionMatch.widthDiff.toFixed(1)} cm
                            {' | '}
                            É: {result.dimensionMatch.thicknessDiff > 0 ? '+' : ''}{result.dimensionMatch.thicknessDiff.toFixed(1)} cm
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (length || width || thickness) && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Aucune tranche compatible trouvée</p>
              <p className="text-sm text-gray-500 mt-1">
                Essayez d'augmenter la tolérance ou de modifier les critères
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
