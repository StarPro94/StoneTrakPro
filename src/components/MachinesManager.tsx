import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { useMachines } from '../hooks/useMachines';
import AddMachineModal from './AddMachineModal';
import ConfirmationModal from './ConfirmationModal';
import { Machine } from '../types';

export default function MachinesManager() {
  const { machines, loading, error, addMachine, updateMachine, deleteMachine } = useMachines();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);

  const handleAddMachine = async (name: string) => {
    await addMachine(name);
    setShowAddModal(false);
  };

  const handleUpdateMachine = async (name: string) => {
    if (editingMachine) {
      await updateMachine(editingMachine.id, name);
      setEditingMachine(null);
    }
  };

  const handleDeleteClick = (machine: Machine) => {
    setMachineToDelete(machine);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (machineToDelete) {
      await deleteMachine(machineToDelete.id);
      setMachineToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setMachineToDelete(null);
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 font-medium">Erreur: {error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <span>Gestion des Machines</span>
            </h3>
            <p className="text-gray-600 mt-1">Configurez et gérez les machines de production</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une Machine</span>
          </button>
        </div>

        {machines.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucune machine configurée</p>
            <p className="text-gray-400 text-sm mt-2">
              Ajoutez votre première machine pour commencer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{machine.name}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingMachine(machine)}
                      className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(machine)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>ID: {machine.id.substring(0, 8)}...</p>
                  <p>Créée le {new Date(machine.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMachineModal
        isOpen={showAddModal || editingMachine !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingMachine(null);
        }}
        onAdd={editingMachine ? handleUpdateMachine : handleAddMachine}
        initialName={editingMachine?.name}
        title={editingMachine ? 'Modifier la Machine' : 'Ajouter une Machine'}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer la Machine"
        message={`Êtes-vous sûr de vouloir supprimer la machine "${machineToDelete?.name}" ?\n\nCette action est irréversible. Les utilisateurs assignés à cette machine seront désassignés.`}
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        type="danger"
      />
    </div>
  );
}
