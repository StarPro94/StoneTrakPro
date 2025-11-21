import React from 'react';
import { Package, Calendar, Layers } from 'lucide-react';
import { DebitSheet } from '../types';

interface PlanningDebitSheetCardProps {
  sheet: DebitSheet;
  onDoubleClick: () => void;
  isDragging?: boolean;
  canDrag?: boolean;
}

export default function PlanningDebitSheetCard({ sheet, onDoubleClick, isDragging = false, canDrag = true }: PlanningDebitSheetCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', sheet.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset any visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('fr-FR');
  };

  // Calculer si la commande est urgente
  const today = new Date();
  const creationDate = new Date(sheet.dateCreation);
  const delaiStr = sheet.delai?.trim();
  const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;
  
  let isUrgent = false;
  let isOverdue = false;
  
  if (delaiDays !== null && delaiDays > 0) {
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + delaiDays);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isOverdue = daysUntilDue < 0;
    isUrgent = daysUntilDue >= 0 && daysUntilDue <= 3;
  }

  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onDragEnd={canDrag ? handleDragEnd : undefined}
      onDoubleClick={onDoubleClick}
      className={`
        bg-white rounded-lg shadow-md border-l-4 p-3 mb-3 transition-all duration-200
        hover:shadow-lg hover:scale-105 active:scale-95
        ${canDrag ? 'cursor-move' : 'cursor-pointer'}
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${isOverdue ? 'border-l-red-500 bg-red-50' :
          isUrgent ? 'border-l-orange-500 bg-orange-50' :
          sheet.fini ? 'border-l-green-500 bg-green-50' :
          'border-l-blue-500'}
      `}
      title="Double-cliquez pour ouvrir la feuille de débit"
    >
      {/* En-tête avec numéro OS et statut */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-600 text-sm">{sheet.numeroOS}</span>
        </div>
        <div className="flex items-center space-x-1">
          {(isOverdue || isUrgent) && (
            <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-orange-500'}`}></div>
          )}
          {sheet.fini && (
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          )}
        </div>
      </div>

      {/* Nom du client */}
      <div className="mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">{sheet.nomClient}</h4>
      </div>

      {/* Matière */}
      <div className="flex items-center space-x-1 mb-2">
        <Layers className="h-3 w-3 text-gray-500" />
        <span className="text-xs text-gray-600 truncate">{sheet.fourniture}</span>
      </div>

      {/* Informations supplémentaires */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(sheet.dateCreation)}</span>
        </div>
        <div className="flex space-x-2">
          {sheet.m2 > 0 && <span className="text-emerald-700 font-medium">{sheet.m2.toFixed(1)}m²</span>}
          {sheet.m3 > 0 && <span className="text-blue-700 font-medium">{sheet.m3.toFixed(2)}m³</span>}
        </div>
      </div>

      {/* Délai si présent */}
      {sheet.delai && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className={`text-xs font-medium ${
            isOverdue ? 'text-red-600' : 
            isUrgent ? 'text-orange-600' : 
            'text-gray-600'
          }`}>
            Délai: {sheet.delai}
          </span>
        </div>
      )}
    </div>
  );
}