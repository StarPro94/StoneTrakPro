import React from 'react';
import { X, FileText, Calendar, User, DollarSign, Package, Edit2 } from 'lucide-react';
import { Quote, QuoteStatus } from '../../types';
import { formatPrice } from '../../utils/pricingCalculations';

interface QuoteViewModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
  onEdit: () => void;
}

export default function QuoteViewModal({ quote, isOpen, onClose, canEdit, onEdit }: QuoteViewModalProps) {
  if (!isOpen || !quote) return null;

  const getStatusBadge = (status: QuoteStatus) => {
    const badges = {
      draft: { text: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
      sent: { text: 'Envoyé', className: 'bg-blue-100 text-blue-700' },
      accepted: { text: 'Accepté', className: 'bg-green-100 text-green-700' },
      rejected: { text: 'Refusé', className: 'bg-red-100 text-red-700' },
      expired: { text: 'Expiré', className: 'bg-orange-100 text-orange-700' }
    };

    const badge = badges[status];

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Détails du Devis</h2>
              <p className="text-sm text-purple-100">N° {quote.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Informations principales */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 border border-purple-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Client</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{quote.clientName}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">Projet</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{quote.projectName || 'Sans projet'}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Date</span>
                  </div>
                  <p className="text-gray-900">{new Date(quote.quoteDate).toLocaleDateString('fr-FR')}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Statut</span>
                  </div>
                  <div>{getStatusBadge(quote.status)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Validité</div>
                  <p className="text-gray-900">{quote.validityPeriod}</p>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Conditions de paiement</div>
                  <p className="text-gray-900">{quote.paymentConditions}</p>
                </div>
              </div>
            </div>

            {/* Lignes du devis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span>Lignes du devis</span>
              </h3>

              {quote.items && quote.items.length > 0 ? (
                <div className="space-y-3">
                  {quote.items.map((item, index) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                              Ligne {index + 1}
                            </span>
                            {item.calculationMethod === 'block' && (
                              <span className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded">Depuis Bloc</span>
                            )}
                            {item.calculationMethod === 'slab' && (
                              <span className="text-xs text-gray-600 bg-green-50 px-2 py-0.5 rounded">Depuis Tranche</span>
                            )}
                            {item.calculationMethod === 'manual' && (
                              <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">Manuel</span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900">{item.description}</h4>
                          {item.materialName && (
                            <p className="text-sm text-gray-600 mt-1">Matière : {item.materialName}</p>
                          )}
                          {item.thickness && (
                            <p className="text-sm text-gray-600">Épaisseur : {item.thickness} cm</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-600">Quantité</p>
                          <p className="font-semibold text-gray-900">{item.quantity} {item.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Prix unitaire</p>
                          <p className="font-semibold text-gray-900">{formatPrice(item.unitSellingPrice)}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-2 text-right">
                          <p className="text-xs text-gray-600">Total ligne</p>
                          <p className="text-lg font-bold text-purple-600">{formatPrice(item.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucune ligne dans ce devis</p>
                </div>
              )}
            </div>

            {/* Totaux */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Totaux</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Sous-total HT</span>
                  <span className="font-semibold">{formatPrice(quote.subtotalHt)}</span>
                </div>

                {quote.discountPercent > 0 && (
                  <div className="flex items-center justify-between text-gray-700">
                    <span>Remise ({quote.discountPercent}%)</span>
                    <span className="font-semibold text-red-600">- {formatPrice(quote.discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-900 font-semibold pt-2 border-t border-gray-300">
                  <span>Total HT</span>
                  <span>{formatPrice(quote.totalHt)}</span>
                </div>

                <div className="flex items-center justify-between text-gray-700">
                  <span>TVA ({quote.tvaPercent}%)</span>
                  <span className="font-semibold">{formatPrice(quote.totalTva)}</span>
                </div>

                <div className="flex items-center justify-between text-lg font-bold text-purple-600 pt-3 border-t-2 border-purple-300">
                  <span>Total TTC</span>
                  <span>{formatPrice(quote.totalTtc)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')} •
            Modifié le {new Date(quote.updatedAt).toLocaleDateString('fr-FR')}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            {canEdit && quote.status === 'draft' && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
