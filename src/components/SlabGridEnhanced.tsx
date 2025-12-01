import React, { useState, useMemo } from 'react';
import { Slab } from '../types';
import { getMaterialColor } from '../utils/materialColors';
import { formatDimensions, getSlabAgeDays } from '../utils/slabCalculations';
import { PARK_POSITIONS } from '../utils/slabCalculations';
import PositionSlabsModal from './PositionSlabsModal';

interface SlabGridEnhancedProps {
  slabs: Slab[];
  selectedPosition: string | null;
  onPositionSelect: (position: string) => void;
  onSlabClick?: (slab: Slab) => void;
}

const SlabGridEnhanced = React.memo(function SlabGridEnhanced({
  slabs,
  selectedPosition,
  onPositionSelect,
  onSlabClick,
}: SlabGridEnhancedProps) {
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<string>('');
  const [modalSlabs, setModalSlabs] = useState<Slab[]>([]);

  const slabsByPosition = useMemo(() => {
    return slabs.reduce((acc, slab) => {
      if (!acc[slab.position]) {
        acc[slab.position] = [];
      }
      acc[slab.position].push(slab);
      return acc;
    }, {} as Record<string, Slab[]>);
  }, [slabs]);

  const getPositionSlabs = (position: string): Slab[] => {
    return slabsByPosition[position] || [];
  };

  const renderTooltip = (position: string, positionSlabs: Slab[]) => {
    if (!hoveredPosition || hoveredPosition !== position || positionSlabs.length === 0) {
      return null;
    }

    return (
      <div className="absolute z-50 left-full ml-2 top-0 w-72 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 pointer-events-none">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-bold text-gray-900">Position {position}</h4>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
              {positionSlabs.length} tranche{positionSlabs.length > 1 ? 's' : ''}
            </span>
          </div>

          {positionSlabs.slice(0, 2).map((slab, idx) => {
            const materialColor = getMaterialColor(slab.material);

            return (
              <div
                key={idx}
                className={`p-2 rounded-lg border ${materialColor.border} ${materialColor.bg}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-bold ${materialColor.text} truncate`}>
                    {slab.material}
                  </span>
                  {slab.quantity > 1 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-blue-200 text-blue-800 ml-1">
                      ×{slab.quantity}
                    </span>
                  )}
                </div>

                <div className="text-xs">
                  <p className="font-mono text-gray-700 text-xs">
                    {formatDimensions(slab.length, slab.width, slab.thickness)}
                  </p>
                </div>
              </div>
            );
          })}

          {positionSlabs.length > 2 && (
            <p className="text-xs text-gray-500 text-center font-medium">
              +{positionSlabs.length - 2} autre{positionSlabs.length - 2 > 1 ? 's' : ''}... (cliquer pour voir)
            </p>
          )}
        </div>

        <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-300 transform rotate-45"></div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan du Parc (A1-L8)</h3>

      <div className="grid grid-cols-8 gap-2 mb-4">
        {PARK_POSITIONS.rows.map((row) =>
          PARK_POSITIONS.cols.map((col) => {
            const position = `${row}${col}`;
            const positionSlabs = getPositionSlabs(position);
            const count = positionSlabs.length;
            const isSelected = selectedPosition === position;
            const isHovered = hoveredPosition === position;

            const hasReserved = positionSlabs.some((s) => s.status === 'réservé');
            const hasOldStock = positionSlabs.some((s) => getSlabAgeDays(s.createdAt) > 60);

            const firstSlab = positionSlabs[0];
            const materialColor = firstSlab ? getMaterialColor(firstSlab.material) : null;

            return (
              <div key={position} className="relative">
                <button
                  onClick={() => {
                    onPositionSelect(position);
                    if (count > 0) {
                      setModalPosition(position);
                      setModalSlabs(positionSlabs);
                      setShowPositionModal(true);
                    }
                  }}
                  onMouseEnter={() => setHoveredPosition(position)}
                  onMouseLeave={() => setHoveredPosition(null)}
                  className={`
                    relative w-full h-16 rounded-lg font-medium text-xs transition-all duration-200
                    border-2 flex flex-col items-center justify-center
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-100 shadow-lg scale-105 z-10'
                        : isHovered
                        ? 'border-gray-400 bg-gray-100 shadow-md scale-105 z-10'
                        : count > 0
                        ? materialColor
                          ? `${materialColor.border} ${materialColor.bg} ${materialColor.hover}`
                          : hasReserved
                          ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                          : 'border-green-300 bg-green-50 hover:border-green-400'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }
                  `}
                >
                  <span
                    className={`font-bold ${
                      isSelected
                        ? 'text-blue-800'
                        : count > 0
                        ? materialColor?.text || 'text-gray-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {position}
                  </span>

                  {count > 0 && (
                    <span
                      className={`
                        text-xs px-1.5 py-0.5 rounded-full font-bold mt-1
                        ${
                          hasReserved
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-green-200 text-green-800'
                        }
                      `}
                    >
                      {count}
                    </span>
                  )}

                  {hasOldStock && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>

                {renderTooltip(position, positionSlabs)}
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-gray-50 border-2 border-gray-300 rounded"></div>
            <span className="text-gray-600">Vide</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-green-50 border-2 border-green-300 rounded"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-orange-50 border-2 border-orange-300 rounded"></div>
            <span className="text-gray-600">Réservé</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-600">Sélectionné</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Stock ancien (&gt;60j)</span>
        </div>
      </div>

      <PositionSlabsModal
        position={modalPosition}
        slabs={modalSlabs}
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onSlabClick={(slab) => {
          if (onSlabClick) {
            onSlabClick(slab);
          }
        }}
      />
    </div>
  );
});

export default SlabGridEnhanced;
