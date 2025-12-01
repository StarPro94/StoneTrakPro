import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface SlabImportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  added: number;
  errors: string[];
}

export default function SlabImportResultModal({
  isOpen,
  onClose,
  added,
  errors,
}: SlabImportResultModalProps) {
  if (!isOpen) return null;

  const hasErrors = errors.length > 0;
  const hasSuccess = added > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            {hasSuccess && !hasErrors && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {hasErrors && (
              <AlertCircle className="h-6 w-6 text-orange-600" />
            )}
            <span>Résultat de l'import</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {hasSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-900">
                      Import réussi
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      {added} tranche{added > 1 ? 's ont été ajoutées' : ' a été ajoutée'} avec succès au stock.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasErrors && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-orange-900">
                      {errors.length} erreur{errors.length > 1 ? 's' : ''} détectée{errors.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Les lignes suivantes n'ont pas pu être importées :
                    </p>
                    <div className="mt-3 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {errors.map((error, index) => (
                          <div
                            key={index}
                            className="text-xs bg-white p-2 rounded border border-orange-200 text-gray-700"
                          >
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!hasSuccess && !hasErrors && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Aucune tranche importée
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Aucune donnée valide n'a été trouvée dans le fichier.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
