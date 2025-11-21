import React, { useState } from 'react';
import { Package, List, Building2, Archive, TrendingUp } from 'lucide-react';
import ScaffoldingListsManager from './ScaffoldingListsManager';
import ScaffoldingSitesManager from './ScaffoldingSitesManager';
import ScaffoldingCatalogManager from './ScaffoldingCatalogManager';
import StockManager from './StockManager';

interface ScaffoldingModuleProps {
  profileLoading: boolean;
  profile: any;
}

export default function ScaffoldingModule({ profileLoading, profile }: ScaffoldingModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'lists' | 'sites' | 'catalog' | 'stock'>('lists');

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestion d'Échafaudage</h1>
          </div>
          <p className="text-gray-600">
            Gestion complète des listes de livraison, réception, stock et locations Layher
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('lists')}
              className={`px-6 py-4 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
                activeSubTab === 'lists'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <List className="h-5 w-5" />
              <span>Listes</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sites')}
              className={`px-6 py-4 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
                activeSubTab === 'sites'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Chantiers</span>
            </button>

            <button
              onClick={() => setActiveSubTab('catalog')}
              className={`px-6 py-4 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
                activeSubTab === 'catalog'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Archive className="h-5 w-5" />
              <span>Catalogue</span>
            </button>

            <button
              onClick={() => setActiveSubTab('stock')}
              className={`px-6 py-4 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
                activeSubTab === 'stock'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Gestion du Stock</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {activeSubTab === 'lists' && <ScaffoldingListsManager />}

          {activeSubTab === 'sites' && <ScaffoldingSitesManager />}

          {activeSubTab === 'catalog' && <ScaffoldingCatalogManager />}

          {activeSubTab === 'stock' && <StockManager />}
        </div>
      </div>
    </div>
  );
}
