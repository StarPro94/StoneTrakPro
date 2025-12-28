import { Check, Square, Package } from 'lucide-react';
import { DebitItem } from '../types';

interface DebitSubItemsListProps {
  item: DebitItem;
  onSubItemToggle: (subIndex: number) => void;
  onSubItemPaletteChange: (subIndex: number, palette: number | null) => void;
  isAdmin: boolean;
  isBureau: boolean;
}

export function DebitSubItemsList({
  item,
  onSubItemToggle,
  onSubItemPaletteChange,
  isAdmin,
  isBureau
}: DebitSubItemsListProps) {
  const subItemsTermine = item.subItemsTermine || Array(item.quantite).fill(false);
  const subItemsPalettes = item.subItemsPalettes || Array(item.quantite).fill(null);
  const completedCount = subItemsTermine.filter(t => t).length;

  return (
    <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-xs text-gray-500 font-medium mb-3">
        {completedCount}/{item.quantite} termine(s) - Cliquez sur chaque piece pour la valider individuellement
      </div>

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
                    onSubItemPaletteChange(index, e.target.value ? Number(e.target.value) : null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Palette"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                />
              </div>
            )}

            {!(isAdmin || isBureau) && palette && (
              <span className="text-sm text-purple-600 font-medium">
                Palette {palette}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
