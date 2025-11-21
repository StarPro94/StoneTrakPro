import React from 'react';
import { Edit2, Trash2, Box } from 'lucide-react';
import { Block } from '../types';

interface BlockTableProps {
  blocks: Block[];
  title: string;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onBlockClick?: (block: Block) => void;
  showLigne?: boolean;
}

export default function BlockTable({ blocks, title, onEdit, onDelete, onBlockClick, showLigne = true }: BlockTableProps) {
  const formatDimensions = (length: number, width: number, height: number) => {
    return `${length} × ${width} × ${height} cm`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 bg-purple-50 border-b border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Box className="h-5 w-5 text-purple-600" />
          <span>{title}</span>
          <span className="text-sm font-normal text-gray-500">({blocks.length} bloc{blocks.length > 1 ? 's' : ''})</span>
        </h3>
      </div>

      {blocks.length === 0 ? (
        <div className="p-8 text-center">
          <Box className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Aucun bloc dans cette section</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                {showLigne && (
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Ligne</th>
                )}
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Matière</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dimensions</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Volume</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Notes</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blocks.map((block, index) => (
                <tr
                  key={block.id}
                  onClick={() => onBlockClick?.(block)}
                  className={`hover:bg-purple-50 transition-colors ${onBlockClick ? 'cursor-pointer' : ''} ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {showLigne && (
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Ligne {block.ligne}
                      </span>
                    </td>
                  )}
                  <td className="px-3 sm:px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{block.material}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{formatDimensions(block.length, block.width, block.height)}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-purple-600">{block.volume.toFixed(3)} m³</div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {block.notes || '-'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(block);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-all"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(block.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
