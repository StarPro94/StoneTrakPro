import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface MaterialSearchComboboxProps {
  materials: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function MaterialSearchCombobox({
  materials,
  value,
  onChange,
  placeholder = 'Rechercher un matériau...',
  className = '',
  label,
  required = false,
}: MaterialSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredMaterials = React.useMemo(() => {
    console.log('MaterialSearchCombobox: Filtering with search:', search, 'Total materials:', materials.length);
    if (!search || search.length < 3) {
      const defaultList = materials.slice(0, 100);
      console.log('MaterialSearchCombobox: Returning default list of', defaultList.length, 'materials');
      return defaultList;
    }

    const searchLower = search.toLowerCase();

    const fuzzyMatch = (text: string, query: string): number => {
      const textLower = text.toLowerCase();

      if (textLower === query) return 1000;
      if (textLower.startsWith(query)) return 900;
      if (textLower.includes(query)) return 800;

      const words = textLower.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(query)) return 700;
        if (word.includes(query)) return 600;
      }

      let matchCount = 0;
      let lastIndex = -1;
      for (const char of query) {
        const index = textLower.indexOf(char, lastIndex + 1);
        if (index > lastIndex) {
          matchCount++;
          lastIndex = index;
        }
      }

      if (matchCount === query.length) {
        return 500 - (lastIndex - matchCount * 2);
      }

      return 0;
    };

    const scoredMaterials = materials
      .map((material) => ({
        material,
        score: fuzzyMatch(material, searchLower),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const results = scoredMaterials.slice(0, 100).map((item) => item.material);
    console.log('MaterialSearchCombobox: Found', results.length, 'results for search:', search);
    return results;
  }, [materials, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    console.log('MaterialSearchCombobox: Input changed to:', newSearch);
    setSearch(newSearch);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onChange(newSearch);
  };

  const handleSelectMaterial = (material: string) => {
    console.log('MaterialSearchCombobox: Material selected:', material);
    onChange(material);
    setSearch('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    console.log('MaterialSearchCombobox: Cleared');
    onChange('');
    setSearch('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredMaterials.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredMaterials[highlightedIndex]) {
          handleSelectMaterial(filteredMaterials[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const displayValue = search || value;

  console.log('MaterialSearchCombobox: Render - value:', value, 'search:', search, 'displayValue:', displayValue, 'isOpen:', isOpen);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            console.log('MaterialSearchCombobox: Input focused');
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Effacer"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {console.log('MaterialSearchCombobox: Dropdown render - isOpen:', isOpen, 'filteredMaterials:', filteredMaterials.length)}

          {search && search.length > 0 && !materials.includes(search) && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <div className="text-sm text-blue-700 font-medium">💡 Utiliser "{search}"</div>
              <div className="text-xs text-blue-600 mt-1">Matériau personnalisé (pas dans le catalogue)</div>
            </div>
          )}

          {search && search.length > 0 && search.length < 3 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              Entrez au moins 3 caractères pour rechercher dans le catalogue
            </div>
          ) : filteredMaterials.length > 0 ? (
            <>
              {filteredMaterials.map((material, index) => (
                <button
                  key={material}
                  type="button"
                  onClick={() => handleSelectMaterial(material)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                    index === highlightedIndex ? 'bg-blue-100' : ''
                  } ${value === material ? 'bg-green-50 font-medium' : ''}`}
                >
                  {material}
                </button>
              ))}
              {!search && materials.length > 100 && (
                <div className="px-4 py-2 text-xs text-gray-500 text-center border-t">
                  {materials.length - 100} autre(s) matériau(x) disponible(s). Tapez 3+ caractères pour rechercher.
                </div>
              )}
              {search && search.length >= 3 && materials.filter((m) => {
                const searchLower = search.toLowerCase();
                const mLower = m.toLowerCase();
                return mLower.includes(searchLower) ||
                       mLower.split(/\s+/).some(word => word.includes(searchLower));
              }).length > 100 && (
                <div className="px-4 py-2 text-xs text-gray-500 text-center border-t">
                  100+ résultats. Affinez votre recherche pour voir plus.
                </div>
              )}
            </>
          ) : search && search.length >= 3 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              Aucun matériau trouvé dans le catalogue. Vous pouvez utiliser ce nom personnalisé.
            </div>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              Tapez pour rechercher ou saisir un nom personnalisé
            </div>
          )}
        </div>
      )}

      {value && materials.includes(value) && (
        <div className="mt-1 text-xs text-green-600 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-1"></span>
          Matériau du catalogue
        </div>
      )}

      {value && !materials.includes(value) && value.length > 0 && (
        <div className="mt-1 text-xs text-blue-600 flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
          Matériau personnalisé
        </div>
      )}
    </div>
  );
}
