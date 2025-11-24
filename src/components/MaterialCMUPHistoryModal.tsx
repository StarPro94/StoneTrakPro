import React, { useEffect } from 'react';
import { X, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useMaterialCMUPHistory } from '../hooks/useMaterialCMUPHistory';

interface MaterialCMUPHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  materialName: string;
}

export default function MaterialCMUPHistoryModal({
  isOpen,
  onClose,
  materialId,
  materialName,
}: MaterialCMUPHistoryModalProps) {
  const { history, loading, fetchCMUPHistory } = useMaterialCMUPHistory();

  useEffect(() => {
    if (isOpen && materialId) {
      fetchCMUPHistory(materialId);
    }
  }, [isOpen, materialId]);

  if (!isOpen) return null;

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const calculateVariation = (oldPrice: number | null, newPrice: number | null) => {
    if (oldPrice === null || newPrice === null || oldPrice === 0) return null;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'import':
        return 'Import XLS';
      case 'manual':
        return 'Modification manuelle';
      case 'system':
        return 'Système';
      default:
        return source;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Historique CMUP</h2>
              <p className="text-sm text-blue-100">{materialName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucun historique disponible</p>
              <p className="text-gray-400 text-sm mt-2">
                Les modifications de CMUP seront enregistrées ici
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Ancien CMUP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Nouveau CMUP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Variation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((entry) => {
                    const variation = calculateVariation(entry.oldCmup, entry.newCmup);
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatPrice(entry.oldCmup)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatPrice(entry.newCmup)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {variation !== null ? (
                            <span
                              className={`inline-flex items-center space-x-1 ${
                                variation > 0
                                  ? 'text-red-600'
                                  : variation < 0
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {variation > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : variation < 0 ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : null}
                              <span>{variation > 0 ? '+' : ''}{variation.toFixed(2)}%</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.source === 'import'
                                ? 'bg-blue-100 text-blue-800'
                                : entry.source === 'manual'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getSourceLabel(entry.source)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
