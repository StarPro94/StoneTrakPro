import React from 'react';
import { X, Edit2, Trash2, ArrowRight, Box, Calendar } from 'lucide-react';
import { Block } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BlockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block | null;
  onEdit?: (block: Block) => void;
  onDelete?: (blockId: string) => void;
  onTransform?: (block: Block) => void;
}

export default function BlockDetailModal({ isOpen, onClose, block, onEdit, onDelete, onTransform }: BlockDetailModalProps) {
  if (!isOpen || !block) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Box className="h-6 w-6 text-purple-600" />
            <span>Détails du Bloc</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Ligne de Stockage</label>
              <p className="text-2xl font-bold text-purple-600 mt-1">Ligne {block.ligne}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Matière</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{block.material}</p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-800 mb-3">Dimensions</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-purple-600">Longueur</p>
                <p className="text-xl font-bold text-purple-900">{block.length} cm</p>
              </div>
              <div>
                <p className="text-xs text-purple-600">Largeur</p>
                <p className="text-xl font-bold text-purple-900">{block.width} cm</p>
              </div>
              <div>
                <p className="text-xs text-purple-600">Hauteur</p>
                <p className="text-xl font-bold text-purple-900">{block.height} cm</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="text-sm font-medium text-blue-800">Volume Total</label>
            <p className="text-3xl font-bold text-blue-600 mt-1">{block.volume.toFixed(3)} m³</p>
          </div>

          {block.notes && (
            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{block.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Créé le</span>
              </label>
              <p className="mt-1">{format(block.createdAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Modifié le</span>
              </label>
              <p className="mt-1">{format(block.updatedAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex space-x-3">
          {onTransform && (
            <button
              onClick={() => {
                onTransform(block);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowRight className="h-5 w-5" />
              <span>Transformer en Tranches</span>
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit(block);
              }}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Modifier</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                onDelete(block.id);
                onClose();
              }}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
