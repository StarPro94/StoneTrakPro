import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Package, CheckCircle, Plus, Minus, Move, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slab } from '../types';

interface SlabTableProps {
  slabs: Slab[];
  title: string;
  onEdit: (slab: Slab) => void;
  onDelete: (slabId: string) => void;
  showPosition?: boolean;
  onAssign?: (slab: Slab) => void;
  onUnassign?: (slab: Slab) => void;
  enableDragDrop?: boolean;
  onSlabDrop?: (slabId: string, newPosition: string) => void;
}

export default function SlabTable({ slabs, title, onEdit, onDelete, showPosition = true, onAssign, onUnassign, enableDragDrop = false }: SlabTableProps) {
  const [draggedSlab, setDraggedSlab] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [slabs.length]);

  const totalPages = Math.ceil(slabs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedSlabs = slabs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatDimensions = (length: number, width: number, thickness: number) => {
    return `${length} × ${width} × ${thickness} cm`;
  };

  const handleDragStart = (e: React.DragEvent, slab: Slab) => {
    if (!enableDragDrop) return;
    
    e.dataTransfer.setData('text/plain', slab.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSlab(slab.id);
    
    // Ajouter une classe CSS pour le feedback visuel
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!enableDragDrop) return;
    
    setDraggedSlab(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span>{title}</span>
          <span className="text-sm font-normal text-gray-500">({slabs.length} tranche{slabs.length > 1 ? 's' : ''})</span>
          {enableDragDrop && (
            <span className="text-xs text-gray-400 flex items-center space-x-1">
              <Move className="h-3 w-3" />
              <span>Glissez pour déplacer</span>
            </span>
          )}
        </h3>
      </div>
      
      {slabs.length === 0 ? (
        <div className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Aucune tranche dans cette section</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table 
            className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                {showPosition && (
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Position</th>
                )}
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Matière</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dimensions</th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qté</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">OS</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedSlabs.map((slab) => (
                <tr 
                  key={slab.id}
                  className={`transition-colors ${
                    enableDragDrop 
                      ? 'cursor-move hover:bg-blue-50' 
                      : 'hover:bg-gray-50'
                  } ${
                    draggedSlab === slab.id ? 'bg-blue-100 opacity-50' : ''
                  }`}
                  draggable={enableDragDrop}
                  onDragStart={(e) => handleDragStart(e, slab)}
                  onDragEnd={handleDragEnd}
                >
                  {showPosition && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        {enableDragDrop && <Move className="h-3 w-3 text-gray-400" />}
                        <span>{slab.position}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">{slab.material}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                    {formatDimensions(slab.length, slab.width, slab.thickness)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {slab.quantity > 1 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        ×{slab.quantity}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">1</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    {slab.status === 'dispo' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Package className="h-3 w-3 mr-1" />
                        Réservé
                      </span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {slab.status === 'réservé' && slab.numeroOS ? (
                      <div>
                        <div className="font-medium text-blue-600">{slab.numeroOS}</div>
                        {slab.refChantier && (
                          <div className="text-xs text-gray-500">{slab.refChantier}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex space-x-2">
                      {onAssign && slab.status === 'dispo' && (
                        <button
                          onClick={() => onAssign(slab)}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Assigner à cette commande"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {onUnassign && slab.status === 'réservé' && (
                        <button
                          onClick={() => onUnassign(slab)}
                          className="text-orange-600 hover:text-orange-800 p-1 hover:bg-orange-50 rounded transition-colors"
                          title="Désassigner de cette commande"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                      {!onAssign && !onUnassign && (
                        <>
                          <button
                            onClick={() => onEdit(slab)}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(slab.id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {slabs.length > itemsPerPage && (
        <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">{Math.min(endIndex, slabs.length)}</span> sur{' '}
                <span className="font-medium">{slabs.length}</span> tranche{slabs.length > 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}