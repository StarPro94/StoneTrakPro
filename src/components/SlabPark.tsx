import React, { useState, useMemo } from 'react';
import { Plus, Search as SearchIcon, Filter, Layers, Box } from 'lucide-react';
import { useSlabs } from '../hooks/useSlabs';
import { useDebitSheets } from '../hooks/useDebitSheets';
import { useToast } from '../contexts/ToastContext';
import { Slab, SlabFilter } from '../types';
import { UserProfile } from '../hooks/useUserProfile';
import SlabParkDashboard from './SlabParkDashboard';
import SlabFilters from './SlabFilters';
import SlabGridEnhanced from './SlabGridEnhanced';
import SlabTable from './SlabTable';
import SlabDetailModal from './SlabDetailModal';
import SlabMatchingModal from './SlabMatchingModal';
import AddSlabModal from './AddSlabModal';
import EditSlabModal from './EditSlabModal';
import ConfirmationModal from './ConfirmationModal';
import BlockPark from './BlockPark';

interface SlabParkProps {
  profileLoading: boolean;
  profile: UserProfile | null;
  canManageSlabs: boolean;
  canEditSlabs: boolean;
  canAddSlabs: boolean;
  isAtelier: boolean;
}

export default function SlabPark({ profileLoading, profile, canManageSlabs, canEditSlabs, canAddSlabs, isAtelier }: SlabParkProps) {
  const { slabs, loading, error, addSlab, updateSlab, deleteSlab } = useSlabs();
  const { sheets } = useDebitSheets();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'tranches' | 'blocs'>('tranches');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSlab, setSelectedSlab] = useState<Slab | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingSlab, setEditingSlab] = useState<Slab | null>(null);
  const [slabToDelete, setSlabToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<SlabFilter>({});

  // Extraire les matériaux uniques depuis les tranches en stock
  const availableMaterials = useMemo(() => {
    const materials = new Set<string>();
    slabs.forEach((slab) => materials.add(slab.material));
    return Array.from(materials).sort();
  }, [slabs]);

  const filteredSlabs = useMemo(() => {
    return slabs.filter((slab) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          slab.position.toLowerCase().includes(searchLower) ||
          slab.material.toLowerCase().includes(searchLower) ||
          slab.status.toLowerCase().includes(searchLower) ||
          (slab.numeroOS && slab.numeroOS.toLowerCase().includes(searchLower)) ||
          (slab.refChantier && slab.refChantier.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (filters.materials && filters.materials.length > 0) {
        const matchesMaterial = filters.materials.some((material) =>
          slab.material.toLowerCase().includes(material.toLowerCase())
        );
        if (!matchesMaterial) return false;
      }

      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(slab.status)) return false;
      }

      if (filters.minLength && slab.length < filters.minLength) return false;
      if (filters.maxLength && slab.length > filters.maxLength) return false;
      if (filters.minWidth && slab.width < filters.minWidth) return false;
      if (filters.maxWidth && slab.width > filters.maxWidth) return false;
      if (filters.minThickness && slab.thickness < filters.minThickness) return false;
      if (filters.maxThickness && slab.thickness > filters.maxThickness) return false;

      return true;
    });
  }, [slabs, filters]);

  const slabsInSelectedPosition = selectedPosition
    ? filteredSlabs.filter((slab) => slab.position === selectedPosition)
    : [];

  const handlePositionSelect = (position: string) => {
    setSelectedPosition(position === selectedPosition ? null : position);
  };

  const handleSlabClick = (slab: Slab) => {
    setSelectedSlab(slab);
    setShowDetailModal(true);
  };

  const handleAddSlab = async (newSlab: Omit<Slab, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!canAddSlabs) {
      addToast({
        type: 'error',
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'ajouter des tranches.',
        duration: 3000
      });
      return;
    }
    await addSlab(newSlab);
    addToast({
      type: 'success',
      title: 'Tranche ajoutée',
      message: `Position ${newSlab.position} - ${newSlab.material}`,
    });
  };

  const handleEditSlab = (slab: Slab) => {
    if (!canEditSlabs) {
      addToast({
        type: 'error',
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission de modifier des tranches.',
        duration: 3000
      });
      return;
    }
    setEditingSlab(slab);
    setShowEditModal(true);
  };

  const handleUpdateSlab = async (updatedSlab: Slab) => {
    await updateSlab(updatedSlab);
    addToast({
      type: 'success',
      title: 'Tranche mise à jour',
      message: `Position ${updatedSlab.position}`,
    });
  };

  const handleDeleteSlab = (slabId: string) => {
    if (!canEditSlabs) {
      addToast({
        type: 'error',
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission de supprimer des tranches.',
        duration: 3000
      });
      return;
    }
    setSlabToDelete(slabId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSlab = async () => {
    if (slabToDelete) {
      const slab = slabs.find((s) => s.id === slabToDelete);
      await deleteSlab(slabToDelete);
      addToast({
        type: 'success',
        title: 'Tranche supprimée',
        message: slab ? `Position ${slab.position}` : '',
      });
      setSlabToDelete(null);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  if (profileLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil utilisateur...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">Erreur: {error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('tranches')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'tranches'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Layers className="h-5 w-5" />
              <span>Parc à Tranches</span>
            </button>
            <button
              onClick={() => setActiveTab('blocs')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'blocs'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Box className="h-5 w-5" />
              <span>Parc à Blocs</span>
            </button>
          </div>

          {activeTab === 'blocs' ? (
            <BlockPark canManageBlocks={canManageSlabs} />
          ) : (
            <>
          <SlabParkDashboard />
          <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            {canAddSlabs && (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter</span>
                </button>
                <button
                  onClick={() => setShowMatchingModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white shadow-md"
                >
                  <SearchIcon className="h-4 w-4" />
                  <span>Recherche intelligente</span>
                </button>
              </>
            )}
            {isAtelier && (
              <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg flex items-center">
                Mode lecture seule
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border-2 border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-gray-700"
          >
            <Filter className="h-4 w-4" />
            <span>{showFilters ? 'Masquer' : 'Afficher'} filtres</span>
          </button>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {showFilters && (
            <div className="lg:col-span-1">
              <SlabFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
                availableMaterials={availableMaterials}
              />
            </div>
          )}

          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="space-y-6">
              <SlabGridEnhanced
                slabs={filteredSlabs}
                selectedPosition={selectedPosition}
                onPositionSelect={handlePositionSelect}
                onSlabClick={handleSlabClick}
              />

              {selectedPosition && slabsInSelectedPosition.length > 0 && (
                <SlabTable
                  slabs={slabsInSelectedPosition}
                  title={`Position ${selectedPosition}`}
                  onEdit={canEditSlabs ? handleEditSlab : undefined}
                  onDelete={canEditSlabs ? handleDeleteSlab : undefined}
                  showPosition={false}
                />
              )}

              <SlabTable
                slabs={filteredSlabs}
                title={`Toutes les tranches (${filteredSlabs.length})`}
                onEdit={canEditSlabs ? handleEditSlab : undefined}
                onDelete={canEditSlabs ? handleDeleteSlab : undefined}
                showPosition={true}
              />
            </div>
            </div>
          </div>
            </>
          )}
        </div>

        {canManageSlabs && activeTab === 'tranches' && (
          <>
            <AddSlabModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onAdd={handleAddSlab}
              slabs={slabs}
            />

            <EditSlabModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setEditingSlab(null);
              }}
              onUpdate={handleUpdateSlab}
              slab={editingSlab}
              debitSheets={sheets}
            />

            <ConfirmationModal
              isOpen={showDeleteConfirm}
              onClose={() => {
                setShowDeleteConfirm(false);
                setSlabToDelete(null);
              }}
              onConfirm={confirmDeleteSlab}
              title="Supprimer la tranche"
              message="Êtes-vous sûr de vouloir supprimer cette tranche ? Cette action est irréversible."
              confirmButtonText="Supprimer"
              cancelButtonText="Annuler"
              type="danger"
            />

            <SlabMatchingModal
              isOpen={showMatchingModal}
              onClose={() => setShowMatchingModal(false)}
              onSelectSlab={(slabId) => {
                const slab = slabs.find((s) => s.id === slabId);
                if (slab) {
                  handleSlabClick(slab);
                }
              }}
            />
          </>
        )}

        <SlabDetailModal
          slab={selectedSlab}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSlab(null);
          }}
          onUpdate={canManageSlabs ? handleUpdateSlab : undefined}
        />
      </div>
    </div>
  );
}
