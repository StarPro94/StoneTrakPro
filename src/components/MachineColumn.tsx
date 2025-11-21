import React, { useState } from 'react';
import { Settings, Trash2, Edit2, Save, X } from 'lucide-react';
import { Machine, DebitSheet } from '../types';
import PlanningDebitSheetCard from './PlanningDebitSheetCard';
import { useUserProfile } from '../hooks/useUserProfile';

interface MachineColumnProps {
  machine: Machine;
  assignedSheets: DebitSheet[];
  onSheetDrop: (sheetId: string, machineId: string) => void;
  onViewSheet: (sheet: DebitSheet) => void;
  onUpdateMachine: (machine: Machine) => void;
  onDeleteMachine: (machineId: string) => void;
  canDragSheets?: boolean;
}

export default function MachineColumn({
  machine,
  assignedSheets,
  onSheetDrop,
  onViewSheet,
  onUpdateMachine,
  onDeleteMachine,
  canDragSheets = true
}: MachineColumnProps) {
  const { profile } = useUserProfile();
  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = React.useRef<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(machine.name);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Incrémenter le compteur
    dragCounterRef.current += 1;
    
    // Si c'est la première entrée, activer l'état dragOver
    if (dragCounterRef.current === 1) {
      setDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Décrémenter le compteur
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    
    // Si le compteur atteint 0, désactiver l'état dragOver
    if (dragCounterRef.current === 0) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const sheetId = e.dataTransfer.getData('text/plain');
    if (sheetId) {
      onSheetDrop(sheetId, machine.id);
    }
    
    // Réinitialiser le compteur et l'état
    dragCounterRef.current = 0;
    setDragOver(false);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== machine.name) {
      onUpdateMachine({
        ...machine,
        name: editName.trim()
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(machine.name);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    if (assignedSheets.length > 0) {
      const confirmDelete = window.confirm(
        `Cette machine a ${assignedSheets.length} commande(s) assignée(s). Si vous la supprimez, ces commandes redeviendront non assignées. Continuer ?`
      );
      if (!confirmDelete) return;
    }
    onDeleteMachine(machine.id);
  };

  // Calculer les totaux
  const totalM2 = assignedSheets.reduce((sum, sheet) => sum + sheet.m2, 0);
  const totalM3 = assignedSheets.reduce((sum, sheet) => sum + sheet.m3, 0);
  const completedSheets = assignedSheets.filter(sheet => sheet.fini).length;

  // Vérifier les permissions
  const canManageMachines = profile?.canManageMachines;
  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200 flex flex-col h-full">
      {/* En-tête de la machine */}
      <div className="p-4 bg-white rounded-t-lg border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          {isEditing ? (
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="text-green-600 hover:text-green-800 p-1"
                title="Sauvegarder"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-red-600 hover:text-red-800 p-1"
                title="Annuler"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">{machine.name}</h3>
              </div>
              {canManageMachines && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                    title="Modifier le nom"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                    title="Supprimer la machine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{assignedSheets.length}</div>
            <div className="text-gray-500">Commandes</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{completedSheets}/{assignedSheets.length}</div>
            <div className="text-gray-500">Terminées</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-emerald-600">{totalM2.toFixed(1)}m²</div>
            <div className="text-gray-500">Surface</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-700">{totalM3.toFixed(2)}m³</div>
            <div className="text-gray-500">Volume</div>
          </div>
        </div>
      </div>

      {/* Zone de dépôt */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 p-4 transition-all duration-200 ${
          dragOver 
            ? 'bg-blue-100 border-2 border-dashed border-blue-400' 
            : 'bg-gray-50'
        }`}
      >
        {dragOver && (
          <div className="flex items-center justify-center h-20 mb-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
            <span className="text-blue-600 font-medium">Déposer la commande ici</span>
          </div>
        )}

        {/* Liste des commandes assignées */}
        <div className="space-y-2">
          {assignedSheets.map((sheet) => (
            <PlanningDebitSheetCard
              key={sheet.id}
              sheet={sheet}
              onDoubleClick={() => onViewSheet(sheet)}
              canDrag={canDragSheets}
            />
          ))}
        </div>

        {/* Message si aucune commande */}
        {assignedSheets.length === 0 && !dragOver && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune commande assignée</p>
              <p className="text-xs mt-1">Glissez une commande ici</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}