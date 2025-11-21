import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg font-medium text-gray-700">Analyse du fichier en cours...</p>
        <p className="text-sm text-gray-500">Extraction des données de la feuille de débit avec IA</p>
      </div>
    </div>
  );
}