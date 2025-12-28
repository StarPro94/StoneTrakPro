import { useState } from 'react';
import { Check, Square, Package, CheckCheck, XSquare, ArrowDown } from 'lucide-react';
import { DebitItem } from '../types';

interface DebitSubItemsListProps {
  item: DebitItem;
  onSubItemToggle: (subIndex: number) => void;
  onSubItemPaletteChange: (subIndex: number, palette: number | null, cascade?: boolean) => void;
  onToggleAll: (termine: boolean) => void;
  onApplyPaletteToAll: (palette: number | null) => void;
  isAdmin: boolean;
  isBureau: boolean;
}

export function DebitSubItemsList({
  item,
  onSubItemToggle,
  onSubItemPaletteChange,
  onToggleAll,
  onApplyPaletteToAll,
  isAdmin,
  isBureau
}: DebitSubItemsListProps) {
  const [cascadeFill, setCascadeFill] = useState(true);
  const [globalPalette, setGlobalPalette] = useState<string>('');

  const subItemsTermine = item.subItemsTermine || Array(item.quantite).fill(false);
  const subItemsPalettes = item.subItemsPalettes || Array(item.quantite).fill(null);
  const completedCount = subItemsTermine.filter(t => t).length;
  const allCompleted = completedCount === item.quantite;
  const noneCompleted = completedCount === 0;

  const handlePaletteChange = (index: number, value: string) => {
    const palette = value ? Number(value) : null;
    onSubItemPaletteChange(index, palette, cascadeFill);
  };

  const handleApplyPaletteToAll = () => {
    const palette = globalPalette ? Number(globalPalette) : null;
    onApplyPaletteToAll(palette);
    setGlobalPalette('');
  };

  return (
    <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {(isAdmin || isBureau) && (
        <div className="mb-4 pb-4 border-b border-gray-300 space-y-3">
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={cascadeFill}
                onChange={(e) => setCascadeFill(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <ArrowDown className="h-4 w-4 mr-1 text-gray-500" />
              Remplir automatiquement les lignes suivantes
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggleAll(true)}
              disabled={allCompleted}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Tout cocher</span>
            </button>
            <button
              onClick={() => onToggleAll(false)}
              disabled={noneCompleted}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <XSquare className="h-4 w-4" />
              <span>Tout decocher</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Palette:</span>
            <input
              type="number"
              value={globalPalette}
              onChange={(e) => setGlobalPalette(e.target.value)}
              placeholder="N"
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
            <button
              onClick={handleApplyPaletteToAll}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>Appliquer a tous</span>
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 font-medium mb-3">
        {completedCount}/{item.quantite} termine(s) - Cliquez sur chaque piece pour la valider individuellement
      </div>

      <div className="space-y-2">
        {Array.from({ length: item.quantite }, (_, index) => {
          const isTermine = subItemsTermine[index] ?? false;
          const palette = subItemsPalettes[index] ?? null;

          return (
            <div
              key={index}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 ${
                isTermine
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubItemToggle(index);
                  }}
                  className="flex-shrink-0 focus:outline-none"
                >
                  {isTermine ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors">
                      <Square className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                </button>

                <span className={`text-sm font-medium ${isTermine ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                  Piece {index + 1}/{item.quantite}
                </span>
              </div>

              {(isAdmin || isBureau) && (
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={palette || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      handlePaletteChange(index, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Palette"
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                  {cascadeFill && (
                    <ArrowDown className="h-3 w-3 text-blue-400" title="Remplissage automatique actif" />
                  )}
                </div>
              )}

              {!(isAdmin || isBureau) && palette && (
                <span className="text-sm text-blue-600 font-medium">
                  Palette {palette}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
