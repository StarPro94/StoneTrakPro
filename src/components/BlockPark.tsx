import React, { useState, useMemo } from 'react';
import { Plus, Box, Filter } from 'lucide-react';
import { useBlocks } from '../hooks/useBlocks';
import { useMaterials } from '../hooks/useMaterials';
import { Block } from '../types';
import { useToast } from '../contexts/ToastContext';
import AddBlockModal from './AddBlockModal';
import EditBlockModal from './EditBlockModal';
import BlockDetailModal from './BlockDetailModal';
import BlockToSlabTransformModal from './BlockToSlabTransformModal';
import ConfirmationModal from './ConfirmationModal';
import MaterialSearchCombobox from './MaterialSearchCombobox';
import BlockParkDashboard from './BlockParkDashboard';
import BlockTable from './BlockTable';

interface BlockParkProps {
  canManageBlocks: boolean;
}

export default function BlockPark({ canManageBlocks }: BlockParkProps) {
  const { blocks, loading, error, addBlock, updateBlock, deleteBlock } = useBlocks();
  const { blocMaterials, blocMaterialNames } = useMaterials();
  const { addToast } = useToast();

  const [selectedLigne, setSelectedLigne] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransformModal, setShowTransformModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [filterMaterial, setFilterMaterial] = useState<string>('');

  const lignes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const filteredBlocks = useMemo(() => {
    return blocks.filter(block => {
      if (filterMaterial && block.material !== filterMaterial) return false;
      return true;
    });
  }, [blocks, filterMaterial]);

  const blocksInSelectedLigne = useMemo(() => {
    if (!selectedLigne) return [];
    return filteredBlocks.filter(block => block.ligne === selectedLigne);
  }, [filteredBlocks, selectedLigne]);

  const blocksByLigne = useMemo(() => {
    const grouped: Record<string, Block[]> = {};
    lignes.forEach(ligne => {
      grouped[ligne] = filteredBlocks.filter(b => b.ligne === ligne);
    });
    return grouped;
  }, [filteredBlocks, lignes]);

  const totalVolume = useMemo(() => {
    return filteredBlocks.reduce((sum, block) => sum + block.volume, 0);
  }, [filteredBlocks]);

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    setShowDetailModal(true);
  };

  const handleAddBlock = async (blockData: Omit<Block, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addBlock(blockData);
      addToast({
        type: 'success',
        title: 'Bloc ajouté',
        message: `Ligne ${blockData.ligne} - ${blockData.material}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message,
      });
    }
  };

  const handleEditBlock = (block: Block) => {
    setSelectedBlock(block);
    setShowEditModal(true);
  };

  const handleUpdateBlock = async (updatedBlock: Block) => {
    try {
      await updateBlock(updatedBlock);
      addToast({
        type: 'success',
        title: 'Bloc mis à jour',
        message: `Ligne ${updatedBlock.ligne}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message,
      });
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlockToDelete(blockId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!blockToDelete) return;

    try {
      const block = blocks.find(b => b.id === blockToDelete);
      await deleteBlock(blockToDelete);
      addToast({
        type: 'success',
        title: 'Bloc supprimé',
        message: block ? `Ligne ${block.ligne}` : '',
      });
      setBlockToDelete(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message,
      });
    }
  };

  const handleTransformBlock = (block: Block) => {
    setSelectedBlock(block);
    setShowTransformModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Erreur: {error}</p>
        </div>
      )}

      <BlockParkDashboard />

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Box className="h-5 w-5 text-purple-600" />
            <span>Parc à Blocs</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredBlocks.length} bloc{filteredBlocks.length > 1 ? 's' : ''} • Volume total: {totalVolume.toFixed(3)} m³
          </p>
        </div>

        <div className="flex space-x-3 items-center">
          <div className="w-64">
            <MaterialSearchCombobox
              materials={blocMaterialNames}
              value={filterMaterial}
              onChange={setFilterMaterial}
              placeholder="Filtrer par matériau..."
            />
          </div>

          {canManageBlocks && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter Bloc</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {lignes.map(ligne => {
          const ligneBlocks = blocksByLigne[ligne];
          const ligneVolume = ligneBlocks.reduce((sum, b) => sum + b.volume, 0);

          return (
            <div
              key={ligne}
              onClick={() => setSelectedLigne(selectedLigne === ligne ? null : ligne)}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 ${
                selectedLigne === ligne ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-lg'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-2xl font-bold text-purple-600">Ligne {ligne}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {ligneBlocks.length} bloc{ligneBlocks.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{ligneVolume.toFixed(2)} m³</p>
                </div>
              </div>

              {ligneBlocks.length > 0 ? (
                <div className="space-y-2">
                  {ligneBlocks.slice(0, 3).map(block => (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockClick(block);
                      }}
                      className="bg-purple-50 rounded p-2 hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-purple-800">{block.material}</span>
                        <span className="text-xs text-gray-600">{block.volume.toFixed(2)} m³</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {block.length} × {block.width} × {block.height} cm
                      </p>
                    </div>
                  ))}
                  {ligneBlocks.length > 3 && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      +{ligneBlocks.length - 3} autre{ligneBlocks.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Box className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Ligne vide</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {selectedLigne && blocksInSelectedLigne.length > 0 && (
          <BlockTable
            blocks={blocksInSelectedLigne}
            title={`Ligne ${selectedLigne}`}
            onEdit={canManageBlocks ? handleEditBlock : () => {}}
            onDelete={canManageBlocks ? handleDeleteBlock : () => {}}
            onBlockClick={handleBlockClick}
            showLigne={false}
          />
        )}

        <BlockTable
          blocks={filteredBlocks}
          title={`Tous les blocs (${filteredBlocks.length})`}
          onEdit={canManageBlocks ? handleEditBlock : () => {}}
          onDelete={canManageBlocks ? handleDeleteBlock : () => {}}
          onBlockClick={handleBlockClick}
          showLigne={true}
        />
      </div>

      {canManageBlocks && (
        <>
          <AddBlockModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddBlock}
            materials={blocMaterials}
          />

          <EditBlockModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedBlock(null);
            }}
            onUpdate={handleUpdateBlock}
            block={selectedBlock}
            materials={blocMaterials}
          />

          <BlockToSlabTransformModal
            isOpen={showTransformModal}
            onClose={() => {
              setShowTransformModal(false);
              setSelectedBlock(null);
            }}
            block={selectedBlock}
            onTransformComplete={() => {
              setShowTransformModal(false);
              setSelectedBlock(null);
            }}
          />

          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setBlockToDelete(null);
            }}
            onConfirm={confirmDelete}
            title="Supprimer le bloc"
            message="Êtes-vous sûr de vouloir supprimer ce bloc ? Cette action est irréversible."
            confirmButtonText="Supprimer"
            cancelButtonText="Annuler"
            type="danger"
          />
        </>
      )}

      <BlockDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBlock(null);
        }}
        block={selectedBlock}
        onEdit={canManageBlocks ? handleEditBlock : undefined}
        onDelete={canManageBlocks ? handleDeleteBlock : undefined}
        onTransform={canManageBlocks ? handleTransformBlock : undefined}
      />
    </div>
  );
}
