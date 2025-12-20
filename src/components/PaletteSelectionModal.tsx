import React, { useState, useEffect } from 'react';
import { X, Printer, Package } from 'lucide-react';
import { PaletteInfo } from '../utils/paletteUtils';

interface PaletteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedPalettes: string[]) => void;
  palettes: PaletteInfo[];
}

export default function PaletteSelectionModal({
  isOpen,
  onClose,
  onPrint,
  palettes
}: PaletteSelectionModalProps) {
  const [selectedPalettes, setSelectedPalettes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedPalettes(new Set(palettes.map(p => p.numero)));
    }
  }, [isOpen, palettes]);

  if (!isOpen) return null;

  const handleTogglePalette = (numero: string) => {
    const newSelection = new Set(selectedPalettes);
    if (newSelection.has(numero)) {
      newSelection.delete(numero);
    } else {
      newSelection.add(numero);
    }
    setSelectedPalettes(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedPalettes(new Set(palettes.map(p => p.numero)));
  };

  const handleDeselectAll = () => {
    setSelectedPalettes(new Set());
  };

  const handlePrint = () => {
    const selected = Array.from(selectedPalettes);
    onPrint(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sélectionner les palettes à imprimer</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex space-x-3">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Tout désélectionner
            </button>
          </div>

          <div className="space-y-2">
            {palettes.map((palette) => (
              <div
                key={palette.numero}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPalettes.has(palette.numero)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTogglePalette(palette.numero)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedPalettes.has(palette.numero)}
                      onChange={() => handleTogglePalette(palette.numero)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {palette.numero === 'none' ? 'Sans palette assignée' : `Palette ${palette.numero}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {palette.itemCount} article{palette.itemCount > 1 ? 's' : ''} • Quantité totale: {palette.totalQuantity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {palettes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune palette à afficher
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedPalettes.size === 0}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selectedPalettes.size === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Printer className="h-4 w-4" />
                <span>Imprimer la sélection ({selectedPalettes.size})</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
