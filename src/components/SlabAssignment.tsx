import React from 'react';
import { Package, Plus, Minus, Search } from 'lucide-react';
import { DebitSheet, Slab } from '../types';
import SlabTable from './SlabTable';

interface SlabAssignmentProps {
  sheet: DebitSheet;
  allSlabs: Slab[];
  updateSlab: (slab: Slab) => Promise<void>;
  refetchSlabs: () => Promise<void>;
}

export default function SlabAssignment({ sheet, allSlabs, updateSlab, refetchSlabs }: SlabAssignmentProps) {
  const [availableSearchTerm, setAvailableSearchTerm] = React.useState('');
  const [assignedSearchTerm, setAssignedSearchTerm] = React.useState('');

  // Filtrer les tranches disponibles (statut 'dispo')
  const availableSlabs = allSlabs.filter(slab => slab.status === 'dispo');
  
  // Filtrer les tranches assignées à cette feuille de débit
  const assignedSlabs = allSlabs.filter(slab => 
    slab.status === 'réservé' && slab.debitSheetId === sheet.id
  );

  // Filtrer les tranches disponibles selon le terme de recherche
  const filteredAvailableSlabs = availableSlabs.filter(slab => {
    const searchLower = availableSearchTerm.toLowerCase();
    return (
      slab.position.toLowerCase().includes(searchLower) ||
      slab.material.toLowerCase().includes(searchLower) ||
      slab.status.toLowerCase().includes(searchLower) ||
      (slab.numeroOS && slab.numeroOS.toLowerCase().includes(searchLower)) ||
      (slab.refChantier && slab.refChantier.toLowerCase().includes(searchLower))
    );
  });

  // Filtrer les tranches assignées selon le terme de recherche
  const filteredAssignedSlabs = assignedSlabs.filter(slab => {
    const searchLower = assignedSearchTerm.toLowerCase();
    return (
      slab.position.toLowerCase().includes(searchLower) ||
      slab.material.toLowerCase().includes(searchLower) ||
      slab.status.toLowerCase().includes(searchLower) ||
      (slab.numeroOS && slab.numeroOS.toLowerCase().includes(searchLower)) ||
      (slab.refChantier && slab.refChantier.toLowerCase().includes(searchLower))
    );
  });

  const handleAssignSlab = async (slab: Slab) => {
    try {
      const updatedSlab: Slab = {
        ...slab,
        status: 'réservé',
        debitSheetId: sheet.id,
        numeroOS: sheet.numeroOS,
        refChantier: sheet.refChantier
      };
      
      await updateSlab(updatedSlab);
      await refetchSlabs();
    } catch (error) {
      console.error('Erreur lors de l\'assignation de la tranche:', error);
      alert('Erreur lors de l\'assignation de la tranche');
    }
  };

  const handleUnassignSlab = async (slab: Slab) => {
    try {
      const updatedSlab: Slab = {
        ...slab,
        status: 'dispo',
        debitSheetId: undefined,
        numeroOS: undefined,
        refChantier: undefined
      };
      
      await updateSlab(updatedSlab);
      await refetchSlabs();
    } catch (error) {
      console.error('Erreur lors de la désassignation de la tranche:', error);
      alert('Erreur lors de la désassignation de la tranche');
    }
  };

  return (
    <div className="space-y-8">
      {/* Tranches assignées à cette commande */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Package className="h-6 w-6 text-orange-600" />
            <span>Tranches Assignées à cette Commande</span>
            <span className="text-sm font-normal text-gray-500">({filteredAssignedSlabs.length})</span>
          </h3>
        </div>
        
        {/* Barre de recherche pour les tranches assignées */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les tranches assignées..."
              value={assignedSearchTerm}
              onChange={(e) => setAssignedSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          {assignedSearchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              {filteredAssignedSlabs.length} résultat{filteredAssignedSlabs.length > 1 ? 's' : ''} pour "{assignedSearchTerm}"
            </p>
          )}
        </div>
        
        {filteredAssignedSlabs.length > 0 ? (
          <SlabTable
            slabs={filteredAssignedSlabs}
            title=""
            onEdit={() => {}} // Pas d'édition dans ce contexte
            onDelete={() => {}} // Pas de suppression dans ce contexte
            onUnassign={handleUnassignSlab}
            showPosition={true}
          />
        ) : assignedSearchTerm ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucun résultat pour "{assignedSearchTerm}"</p>
            <button
              onClick={() => setAssignedSearchTerm('')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucune tranche assignée à cette commande</p>
            <p className="text-gray-400 text-sm mt-2">Sélectionnez des tranches disponibles ci-dessous pour les assigner</p>
          </div>
        )}
      </div>

      {/* Tranches disponibles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Package className="h-6 w-6 text-green-600" />
            <span>Tranches Disponibles</span>
            <span className="text-sm font-normal text-gray-500">({filteredAvailableSlabs.length})</span>
          </h3>
        </div>
        
        {/* Barre de recherche pour les tranches disponibles */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les tranches disponibles..."
              value={availableSearchTerm}
              onChange={(e) => setAvailableSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          {availableSearchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              {filteredAvailableSlabs.length} résultat{filteredAvailableSlabs.length > 1 ? 's' : ''} pour "{availableSearchTerm}"
            </p>
          )}
        </div>
        
        {filteredAvailableSlabs.length > 0 ? (
          <SlabTable
            slabs={filteredAvailableSlabs}
            title=""
            onEdit={() => {}} // Pas d'édition dans ce contexte
            onDelete={() => {}} // Pas de suppression dans ce contexte
            onAssign={handleAssignSlab}
            showPosition={true}
          />
        ) : availableSearchTerm ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucun résultat pour "{availableSearchTerm}"</p>
            <button
              onClick={() => setAvailableSearchTerm('')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucune tranche disponible</p>
            <p className="text-gray-400 text-sm mt-2">Ajoutez des tranches au parc pour pouvoir les assigner</p>
          </div>
        )}
      </div>
    </div>
  );
}