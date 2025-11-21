import React from 'react';
import { Eye, Edit2, Trash2, CheckCircle2, Truck, Clock, AlertTriangle } from 'lucide-react';
import { DebitSheet } from '../types';

interface DebitSheetCardProps {
  sheet: DebitSheet;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DebitSheetCard({ sheet, onView, onEdit, onDelete }: DebitSheetCardProps) {
  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('fr-FR');
  };

  // Calculer si la commande est en retard ou urgente
  const today = new Date();
  const creationDate = new Date(sheet.dateCreation);
  
  // Vérifier si le délai est valide (non vide et numérique)
  const delaiStr = sheet.delai?.trim();
  const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;
  
  let isOverdue = false;
  let isUrgent = false;
  
  // Calculer l'urgence seulement si un délai valide est spécifié
  if (delaiDays !== null && delaiDays > 0) {
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + delaiDays);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isOverdue = daysUntilDue < 0;
    isUrgent = daysUntilDue >= 0 && daysUntilDue <= 3;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* En-tête avec numéro OS et statut */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-base sm:text-lg font-semibold text-blue-600">{sheet.numeroOS}</h3>
          {(isOverdue || isUrgent) && (
            <div className="flex items-center">
              {isOverdue ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <Clock className="h-4 w-4 text-orange-500" />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {sheet.fini ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Terminé
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              En cours
            </span>
          )}
          {sheet.livre && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Truck className="h-3 w-3 mr-1" />
              Livré
            </span>
          )}
        </div>
      </div>

      {/* Informations client */}
      <div>
        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{sheet.nomClient}</h4>
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{sheet.fourniture}</p>
      </div>

      {/* Détails techniques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Commercial:</span>
          <p className="font-medium truncate">{sheet.cial}</p>
        </div>
        <div>
          <span className="text-gray-500">Chantier:</span>
          <p className="font-medium truncate">{sheet.refChantier || '-'}</p>
        </div>
        <div>
          <span className="text-gray-500">Épaisseur:</span>
          <p className="font-medium">{sheet.epaisseur}</p>
        </div>
      </div>

      {/* Quantités */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3">
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600">Surface</p>
          <p className="text-sm sm:text-base md:text-lg font-semibold text-emerald-600">{sheet.m2.toFixed(2)} m²</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600">Volume</p>
          <p className="text-sm sm:text-base md:text-lg font-semibold text-blue-600">{sheet.m3.toFixed(2)} m³</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-600">Délai</p>
          <p className={`text-sm sm:text-base md:text-lg font-semibold ${
            isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-700'
          }`}>
            {sheet.delai}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onView}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium">Voir</span>
          </button>
          <button
            onClick={onEdit}
            className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
          >
            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium">Modifier</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center space-x-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium">Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
}