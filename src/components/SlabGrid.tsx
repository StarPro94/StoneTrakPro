import React from 'react';
import { Slab } from '../types';

interface SlabGridProps {
  slabs: Slab[];
  selectedPosition: string | null;
  onPositionSelect: (position: string) => void;
  onSlabDrop?: (slabId: string, newPosition: string) => void;
  enableDragDrop?: boolean;
}

export default function SlabGrid({ slabs, selectedPosition, onPositionSelect, onSlabDrop, enableDragDrop = false }: SlabGridProps) {
  const [dragOverPosition, setDragOverPosition] = React.useState<string | null>(null);
  const dragCountersRef = React.useRef<Map<string, number>>(new Map());

  // Générer la grille A1 à L8
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  // Compter les tranches par position
  const slabCountByPosition = slabs.reduce((acc, slab) => {
    acc[slab.position] = (acc[slab.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Vérifier si une position a des tranches réservées
  const hasReservedSlabs = (position: string) => {
    return slabs.some(slab => slab.position === position && slab.status === 'réservé');
  };

  const handleDragEnter = (e: React.DragEvent, position: string) => {
    if (!enableDragDrop || !onSlabDrop) return;
    
    e.preventDefault();
    
    // Incrémenter le compteur pour cette position
    const currentCount = dragCountersRef.current.get(position) || 0;
    const newCount = currentCount + 1;
    dragCountersRef.current.set(position, newCount);
    
    // Si c'est la première entrée dans cette position, l'activer
    if (newCount === 1) {
      setDragOverPosition(position);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!enableDragDrop || !onSlabDrop) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent, position: string) => {
    if (!enableDragDrop) return;
    
    e.preventDefault();
    
    // Décrémenter le compteur pour cette position
    const currentCount = dragCountersRef.current.get(position) || 0;
    const newCount = Math.max(0, currentCount - 1);
    dragCountersRef.current.set(position, newCount);
    
    // Si le compteur atteint 0, désactiver cette position
    if (newCount === 0) {
      setDragOverPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, position: string) => {
    if (!enableDragDrop || !onSlabDrop) return;
    
    e.preventDefault();
    const slabId = e.dataTransfer.getData('text/plain');
    
    if (slabId) {
      onSlabDrop(slabId, position);
    }
    
    // Réinitialiser le compteur et l'état pour cette position
    dragCountersRef.current.set(position, 0);
    setDragOverPosition(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <span>Plan du Parc</span>
        {enableDragDrop && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Zone de dépôt active
          </span>
        )}
      </h3>
      <div className="grid grid-cols-8 gap-3">
        {rows.map(row => 
          cols.map(col => {
            const position = `${row}${col}`;
            const count = slabCountByPosition[position] || 0;
            const hasReserved = hasReservedSlabs(position);
            const isSelected = selectedPosition === position;
            const isDragOver = dragOverPosition === position;

            return (
              <button
                key={position}
                onClick={() => onPositionSelect(position)}
                onDragEnter={enableDragDrop ? (e) => handleDragEnter(e, position) : undefined}
                onDragOver={enableDragDrop ? handleDragOver : undefined}
                onDragLeave={enableDragDrop ? (e) => handleDragLeave(e, position) : undefined}
                onDrop={enableDragDrop ? (e) => handleDrop(e, position) : undefined}
                className={`
                  relative h-16 border-2 rounded-lg font-medium text-sm transition-all duration-200 min-w-0
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-md' 
                    : isDragOver && enableDragDrop
                      ? 'border-green-500 bg-green-100 text-green-800 shadow-lg scale-105'
                    : count > 0
                      ? hasReserved
                        ? 'border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400'
                        : 'border-green-300 bg-green-50 text-green-700 hover:border-green-400'
                      : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400'
                  }
                  ${enableDragDrop ? 'hover:shadow-lg' : 'hover:shadow-md'}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="font-semibold">{position}</span>
                  {count > 0 && (
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full font-bold
                      ${hasReserved ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}
                    `}>
                      {count}
                    </span>
                  )}
                  {isDragOver && enableDragDrop && (
                    <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg bg-green-50 bg-opacity-50 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">Déposer ici</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
      
      <div className="mt-4 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-50 border-2 border-gray-300 rounded"></div>
          <span className="text-gray-600">Vide</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-50 border-2 border-orange-300 rounded"></div>
          <span className="text-gray-600">Partiellement réservé</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
          <span className="text-gray-600">Sélectionné</span>
        </div>
        {enableDragDrop && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 border-dashed rounded"></div>
            <span className="text-gray-600">Zone de dépôt</span>
          </div>
        )}
      </div>
    </div>
  );
}