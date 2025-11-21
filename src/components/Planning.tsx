import React, { useState } from 'react';
import { Plus, Calendar, Package, AlertTriangle, Settings } from 'lucide-react';
import { DebitSheet } from '../types';
import { useMachines } from '../hooks/useMachines';
import PlanningDebitSheetCard from './PlanningDebitSheetCard';
import MachineColumn from './MachineColumn';
import AddMachineModal from './AddMachineModal';
import { UserProfile } from '../hooks/useUserProfile';

interface PlanningProps {
  sheets: DebitSheet[];
  profileLoading: boolean;
  profile: UserProfile | null;
  canManageMachines: boolean;
  canEditPlanning: boolean;
  canEditOwnMachinePlanning: boolean;
  isAdmin: boolean;
  isBureau: boolean;
  isAtelier: boolean;
  onViewSheet: (sheet: DebitSheet) => void;
  onUpdateSheet: (sheet: DebitSheet) => void;
}

export default function Planning({ sheets, profileLoading, profile, canManageMachines, canEditPlanning, canEditOwnMachinePlanning, isAdmin, isBureau, isAtelier, onViewSheet, onUpdateSheet }: PlanningProps) {
  const { machines, loading: machinesLoading, error: machinesError, addMachine, updateMachine, deleteMachine } = useMachines();
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);
  const dragUnassignedCounterRef = React.useRef<number>(0);

  // Séparer les commandes assignées et non assignées
  const unassignedSheets = sheets.filter(sheet => !sheet.machineId);
  const assignedSheetsByMachine = machines.reduce((acc, machine) => {
    acc[machine.id] = sheets.filter(sheet => sheet.machineId === machine.id);
    return acc;
  }, {} as Record<string, DebitSheet[]>);

  // Vérifier les permissions
  // Admin/Bureau peuvent tout modifier
  // Atelier peut seulement modifier les chantiers de SA machine
  // Stock Matière : lecture seule (pas de drag & drop, pas d'édition)
  const canAssignSheets = canEditPlanning; // Admin et Bureau uniquement

  // Pour Atelier: peut éditer uniquement sa machine
  const canEditMachine = (machineId: string) => {
    if (canEditPlanning) return true; // Admin et Bureau
    if (canEditOwnMachinePlanning && isAtelier && profile?.machineId === machineId) return true;
    return false;
  };
  
  // Affichage du loader pendant le chargement du profil
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
  
  // Gestion du glisser-déposer
  const handleSheetDrop = async (sheetId: string, machineId: string | null) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return;

    const updatedSheet: DebitSheet = {
      ...sheet,
      machineId: machineId || undefined
    };

    await onUpdateSheet(updatedSheet);
  };

  // Gestion du dépôt dans la colonne "non assignées"
  const handleUnassignedDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Incrémenter le compteur
    dragUnassignedCounterRef.current += 1;
    
    // Si c'est la première entrée, activer l'état dragOverUnassigned
    if (dragUnassignedCounterRef.current === 1) {
      setDragOverUnassigned(true);
    }
  };

  // Gestion du dépôt dans la colonne "non assignées"
  const handleUnassignedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleUnassignedDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Décrémenter le compteur
    dragUnassignedCounterRef.current = Math.max(0, dragUnassignedCounterRef.current - 1);
    
    // Si le compteur atteint 0, désactiver l'état dragOverUnassigned
    if (dragUnassignedCounterRef.current === 0) {
      setDragOverUnassigned(false);
    }
  };

  const handleUnassignedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const sheetId = e.dataTransfer.getData('text/plain');
    if (sheetId) {
      handleSheetDrop(sheetId, null);
    }
    
    // Réinitialiser le compteur et l'état
    dragUnassignedCounterRef.current = 0;
    setDragOverUnassigned(false);
  };

  const handleAddMachine = async (name: string) => {
    await addMachine({
      userId: '', // Sera défini par le hook
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  // Calculer les statistiques
  const totalSheets = sheets.length;
  const urgentSheets = sheets.filter(sheet => {
    if (sheet.fini || sheet.livre) return false;
    
    const delaiStr = sheet.delai?.trim();
    const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;
    
    if (delaiDays === null || delaiDays <= 0) return false;
    
    const today = new Date();
    const creationDate = new Date(sheet.dateCreation);
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + delaiDays);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3;
  }).length;

  if (machinesLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {machinesError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">Erreur: {machinesError}</p>
          </div>
        )}

        {/* En-tête */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Planning de Production</span>
                </h2>
                <p className="text-gray-600 mt-1 text-xs sm:text-sm hidden sm:block">Organisez vos commandes par machine</p>
              </div>

              {canManageMachines && (
                <button
                  onClick={() => setShowAddMachineModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-white shadow-md hover:shadow-lg text-xs sm:text-sm flex-shrink-0 ml-2"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Ajouter Machine</span>
                  <span className="sm:hidden">Machine</span>
                </button>
              )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 p-2 rounded-lg">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                <span className="text-gray-600">
                  <span className="font-semibold text-blue-600">{totalSheets}</span>
                  <span className="hidden sm:inline"> commandes</span>
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 p-2 rounded-lg">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-700">{unassignedSheets.length}</span>
                  <span className="hidden sm:inline"> non assignées</span>
                </span>
              </div>
              {urgentSheets > 0 && (
                <div className="flex items-center space-x-1 sm:space-x-2 bg-orange-50 p-2 rounded-lg col-span-2 sm:col-span-1">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-600">
                    <span className="font-semibold text-orange-600">{urgentSheets}</span>
                    <span className="hidden sm:inline"> urgentes</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone de planning - Desktop et Mobile */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          {/* Version Desktop - colonnes côte à côte */}
          <div className="hidden lg:flex h-[calc(100vh-280px)]">
            {/* Colonne fixe "Commandes non assignées" */}
            <div className="flex-shrink-0 w-80 bg-gray-100 border-r border-gray-200 flex flex-col">
              <div className="p-4 bg-gray-200 border-b border-gray-300">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  <span>Commandes non assignées</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {unassignedSheets.length} commande{unassignedSheets.length > 1 ? 's' : ''}
                </p>
              </div>

              <div
                onDragEnter={canAssignSheets ? handleUnassignedDragEnter : undefined}
                onDragOver={canAssignSheets ? handleUnassignedDragOver : undefined}
                onDragLeave={canAssignSheets ? handleUnassignedDragLeave : undefined}
                onDrop={canAssignSheets ? handleUnassignedDrop : undefined}
                className={`flex-1 p-4 overflow-y-auto transition-all duration-200 ${
                  dragOverUnassigned
                    ? 'bg-blue-100 border-2 border-dashed border-blue-400'
                    : 'bg-gray-100'
                }`}
              >
                {dragOverUnassigned && (
                  <div className="flex items-center justify-center h-20 mb-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
                    <span className="text-blue-600 font-medium">Désassigner la commande</span>
                  </div>
                )}

                <div className="space-y-2">
                  {unassignedSheets.map((sheet) => (
                    <PlanningDebitSheetCard
                      key={sheet.id}
                      sheet={sheet}
                      onDoubleClick={() => onViewSheet(sheet)}
                      canDrag={canAssignSheets}
                    />
                  ))}
                </div>

                {unassignedSheets.length === 0 && !dragOverUnassigned && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    <div className="text-center">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Toutes les commandes sont assignées</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zone défilante pour les machines */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex h-full" style={{ minWidth: `${machines.length * 320}px` }}>
                {machines.map((machine) => (
                  <div key={machine.id} className="mr-4 h-full">
                    <MachineColumn
                      machine={machine}
                      assignedSheets={assignedSheetsByMachine[machine.id] || []}
                      onSheetDrop={canAssignSheets ? handleSheetDrop : () => {}}
                      onViewSheet={onViewSheet}
                      onUpdateMachine={canManageMachines ? updateMachine : () => {}}
                      onDeleteMachine={canManageMachines ? deleteMachine : () => {}}
                      canDragSheets={canAssignSheets}
                    />
                  </div>
                ))}

                {/* Message si aucune machine */}
                {machines.length === 0 && (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <div className="text-center p-4">
                      <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Aucune machine configurée</h3>
                      <p className="text-sm mb-4">Ajoutez votre première machine pour commencer</p>
                      {canManageMachines && (
                        <button
                          onClick={() => setShowAddMachineModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-white mx-auto"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Ajouter une machine</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Version Mobile/Tablette - sections empilées */}
          <div className="lg:hidden">
            {/* Commandes non assignées */}
            <div className="border-b border-gray-200">
              <div className="p-3 sm:p-4 bg-gray-100 border-b border-gray-300">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <span>Commandes non assignées</span>
                  <span className="ml-auto text-xs sm:text-sm bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full">
                    {unassignedSheets.length}
                  </span>
                </h3>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 max-h-96 overflow-y-auto">
                {unassignedSheets.length > 0 ? (
                  <div className="space-y-2">
                    {unassignedSheets.map((sheet) => (
                      <PlanningDebitSheetCard
                        key={sheet.id}
                        sheet={sheet}
                        onDoubleClick={() => onViewSheet(sheet)}
                        canDrag={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-xs sm:text-sm">
                    <div className="text-center">
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      <p>Toutes les commandes sont assignées</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Machines */}
            <div className="divide-y divide-gray-200">
              {machines.map((machine) => {
                const machineSheets = assignedSheetsByMachine[machine.id] || [];
                const totalM2 = machineSheets.reduce((sum, sheet) => sum + sheet.m2, 0);
                const totalM3 = machineSheets.reduce((sum, sheet) => sum + sheet.m3, 0);
                const completedSheets = machineSheets.filter(sheet => sheet.fini).length;

                return (
                  <div key={machine.id}>
                    <div className="p-3 sm:p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{machine.name}</h3>
                        </div>
                        <span className="ml-2 text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                          {machineSheets.length}
                        </span>
                      </div>

                      {/* Statistiques */}
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="text-center bg-purple-50 p-2 rounded">
                          <div className="font-semibold text-purple-600">{completedSheets}/{machineSheets.length}</div>
                          <div className="text-gray-500 text-[10px] sm:text-xs">Terminées</div>
                        </div>
                        <div className="text-center bg-emerald-50 p-2 rounded">
                          <div className="font-semibold text-emerald-600">{totalM2.toFixed(1)}m²</div>
                          <div className="text-gray-500 text-[10px] sm:text-xs">Surface</div>
                        </div>
                        <div className="text-center bg-blue-50 p-2 rounded">
                          <div className="font-semibold text-blue-700">{totalM3.toFixed(2)}m³</div>
                          <div className="text-gray-500 text-[10px] sm:text-xs">Volume</div>
                        </div>
                      </div>

                      {/* Liste des commandes */}
                      {machineSheets.length > 0 ? (
                        <div className="space-y-2">
                          {machineSheets.map((sheet) => (
                            <PlanningDebitSheetCard
                              key={sheet.id}
                              sheet={sheet}
                              onDoubleClick={() => onViewSheet(sheet)}
                              canDrag={false}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-20 text-gray-400 text-xs">
                          <p>Aucune commande assignée</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Message si aucune machine */}
              {machines.length === 0 && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <div className="text-center p-4">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">Aucune machine configurée</h3>
                    <p className="text-xs sm:text-sm mb-4">Ajoutez votre première machine pour commencer</p>
                    {canManageMachines && (
                      <button
                        onClick={() => setShowAddMachineModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-white mx-auto text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Ajouter une machine</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal d'ajout de machine */}
        {canManageMachines && (
          <AddMachineModal
            isOpen={showAddMachineModal}
            onClose={() => setShowAddMachineModal(false)}
            onAdd={handleAddMachine}
          />
        )}
      </div>
    </div>
  );
}