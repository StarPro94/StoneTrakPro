import React from 'react';
import { X, Package } from 'lucide-react';
import { Slab } from '../types';
import { getMaterialColor, getMaterialBadgeColor } from '../utils/materialColors';
import { formatDimensions, calculateSlabArea, calculateSlabVolume, formatArea, formatVolume, getSlabAgeDays } from '../utils/slabCalculations';

interface PositionSlabsModalProps {
  position: string;
  slabs: Slab[];
  isOpen: boolean;
  onClose: () => void;
  onSlabClick: (slab: Slab) => void;
}

export default function PositionSlabsModal({ position, slabs, isOpen, onClose, onSlabClick }: PositionSlabsModalProps) {
  if (!isOpen || slabs.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Position {position}</h2>
              <p className="text-blue-100">{slabs.length} tranche{slabs.length > 1 ? 's' : ''} en stock</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {slabs.map((slab, index) => {
            const materialColor = getMaterialColor(slab.material);
            const area = calculateSlabArea(slab);
            const volume = calculateSlabVolume(slab);
            const ageDays = getSlabAgeDays(slab.createdAt);

            return (
              <div
                key={slab.id}
                onClick={() => {
                  onSlabClick(slab);
                  onClose();
                }}
                className={`p-4 rounded-lg border-2 ${materialColor.border} ${materialColor.bg} hover:shadow-lg transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
                      <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMaterialBadgeColor(slab.material)}`}>
                          {slab.material}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          slab.status === 'dispo'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-orange-200 text-orange-800'
                        }`}>
                          {slab.status === 'dispo' ? 'Disponible' : 'Réservé'}
                        </span>
                        {ageDays > 60 && (
                          <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-200 text-red-800">
                            Stock ancien ({ageDays}j)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">ID: {slab.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Dimensions</p>
                    <p className="font-mono text-gray-900 font-bold">
                      {formatDimensions(slab.length, slab.width, slab.thickness)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600 font-medium mb-1">Surface</p>
                    <p className="font-bold text-blue-600">{formatArea(area)}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 font-medium mb-1">Volume</p>
                    <p className="font-bold text-blue-600">{formatVolume(volume)}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 font-medium mb-1">Âge du stock</p>
                    <p className={`font-medium ${ageDays > 60 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {ageDays} jour{ageDays > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {slab.numeroOS && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-sm">
                      <span className="text-gray-600">N° OS:</span>{' '}
                      <span className="font-bold text-blue-600">{slab.numeroOS}</span>
                      {slab.refChantier && (
                        <>
                          {' | '}
                          <span className="text-gray-600">Réf:</span>{' '}
                          <span className="font-medium">{slab.refChantier}</span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {slab.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-600">Notes:</span> {slab.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Package className="h-5 w-5" />
            <span>Cliquez sur une tranche pour voir tous les détails</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
