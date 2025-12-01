import React, { useState } from 'react';
import { Search, Filter, X, Sliders } from 'lucide-react';
import { SlabFilter } from '../types';
import { THICKNESS_OPTIONS } from '../utils/slabCalculations';
import MaterialSearchCombobox from './MaterialSearchCombobox';

interface SlabFiltersProps {
  filters: SlabFilter;
  onFiltersChange: (filters: SlabFilter) => void;
  onReset: () => void;
  availableMaterials?: string[];
}

const SlabFilters = React.memo(function SlabFilters({ filters, onFiltersChange, onReset, availableMaterials = [] }: SlabFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Utiliser les matériaux disponibles s'ils sont fournis, sinon afficher un message
  const materialsToDisplay = availableMaterials.length > 0 ? availableMaterials : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleMaterialToggle = (material: string) => {
    const currentMaterials = filters.materials || [];
    const newMaterials = currentMaterials.includes(material)
      ? currentMaterials.filter((m) => m !== material)
      : [...currentMaterials, material];
    onFiltersChange({ ...filters, materials: newMaterials });
  };

  const handleStatusToggle = (status: 'dispo' | 'réservé') => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.materials && filters.materials.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    filters.minLength ||
    filters.maxLength ||
    filters.minWidth ||
    filters.maxWidth ||
    filters.minThickness ||
    filters.maxThickness;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <span>Filtres</span>
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Rechercher par matériau, position..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Matériaux</label>
        <MaterialSearchCombobox
          materials={materialsToDisplay}
          value=""
          onChange={(material) => {
            if (material && !filters.materials?.includes(material)) {
              handleMaterialToggle(material);
            }
          }}
          placeholder="Rechercher et ajouter un matériau..."
        />
        {filters.materials && filters.materials.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.materials.map((material) => (
              <button
                key={material}
                onClick={() => handleMaterialToggle(material)}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 border-2 border-blue-500 text-blue-800 transition-all hover:bg-blue-200 flex items-center space-x-1"
              >
                <span>{material}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusToggle('dispo')}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
              ${
                filters.status?.includes('dispo')
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
              }
            `}
          >
            Disponible
          </button>
          <button
            onClick={() => handleStatusToggle('réservé')}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
              ${
                filters.status?.includes('réservé')
                  ? 'bg-orange-100 border-orange-500 text-orange-800'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
              }
            `}
          >
            Réservé
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-900 py-2 border-t border-gray-200 transition-colors"
      >
        <Sliders className="h-4 w-4" />
        <span>{showAdvanced ? 'Masquer' : 'Afficher'} les filtres avancés</span>
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Longueur min (cm)
              </label>
              <input
                type="number"
                value={filters.minLength || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minLength: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Longueur max (cm)
              </label>
              <input
                type="number"
                value={filters.maxLength || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxLength: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Largeur min (cm)
              </label>
              <input
                type="number"
                value={filters.minWidth || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minWidth: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Largeur max (cm)
              </label>
              <input
                type="number"
                value={filters.maxWidth || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxWidth: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Épaisseur
            </label>
            <div className="flex flex-wrap gap-2">
              {THICKNESS_OPTIONS.map((option) => {
                const isSelected =
                  filters.minThickness === option.value && filters.maxThickness === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        minThickness: option.value,
                        maxThickness: option.value,
                      })
                    }
                    className={`
                      px-3 py-1 rounded text-xs font-medium border transition-all
                      ${
                        isSelected
                          ? 'bg-blue-100 border-blue-500 text-blue-800'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SlabFilters;
