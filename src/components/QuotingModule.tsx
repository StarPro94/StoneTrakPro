import React, { useState } from 'react';
import { FileText, Plus, Calculator, TrendingUp, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useQuotes } from '../hooks/useQuotes';
import { Quote, QuoteStatus, PricingParameters, PricingResult, QuoteItem } from '../types';
import { UserProfile } from '../hooks/useUserProfile';
import CostCalculatorModal from './quoting/CostCalculatorModal';
import QuoteViewModal from './quoting/QuoteViewModal';
import QuoteEditModal from './quoting/QuoteEditModal';
import { formatPrice } from '../utils/pricingCalculations';
import LoadingSpinner from './LoadingSpinner';

interface QuotingModuleProps {
  profileLoading: boolean;
  profile: UserProfile | null;
  isAdmin: boolean;
  isBureau: boolean;
}

export default function QuotingModule({ profileLoading, profile, isAdmin, isBureau }: QuotingModuleProps) {
  const { quotes, loading, error, createQuote, updateQuoteStatus, deleteQuote } = useQuotes();
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const canCreateQuotes = isAdmin || isBureau;
  const canViewPricing = isAdmin || isBureau;

  // Statistiques
  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    totalAmount: quotes.reduce((sum, q) => sum + q.totalTtc, 0)
  };

  const handleCreateQuote = async () => {
    if (!canCreateQuotes) return;

    const newQuote = await createQuote({
      clientName: 'Nouveau Client',
      projectName: 'Nouveau Projet',
      quoteDate: new Date(),
      validityPeriod: '1 mois',
      status: 'draft',
      subtotalHt: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalHt: 0,
      tvaPercent: 20,
      totalTva: 0,
      totalTtc: 0,
      notes: null,
      paymentConditions: 'Paiement à 30 jours'
    });

    if (newQuote) {
      setSelectedQuote(newQuote);
      setShowEditModal(true);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const badges = {
      draft: { icon: Clock, text: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
      sent: { icon: FileText, text: 'Envoyé', className: 'bg-blue-100 text-blue-700' },
      accepted: { icon: CheckCircle, text: 'Accepté', className: 'bg-green-100 text-green-700' },
      rejected: { icon: XCircle, text: 'Refusé', className: 'bg-red-100 text-red-700' },
      expired: { icon: Clock, text: 'Expiré', className: 'bg-orange-100 text-orange-700' }
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (profileLoading || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Calculator className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                <span>Chiffrage & Devis</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Créez et gérez vos devis clients</p>
            </div>

            {canCreateQuotes && (
              <button
                onClick={handleCreateQuote}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau Devis</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Brouillon</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-700">{stats.draft}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Envoyé</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.sent}</p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Accepté</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Refusé</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-3 sm:p-4 shadow-md text-white col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Montant Total</p>
                <p className="text-base sm:text-xl font-bold">{formatPrice(stats.totalAmount)}</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 opacity-90" />
            </div>
          </div>
        </div>

        {/* Liste des devis */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Liste des devis</h2>
          </div>

          {quotes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Calculator className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Aucun devis</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Commencez par créer votre premier devis</p>
              {canCreateQuotes && (
                <button
                  onClick={handleCreateQuote}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Créer un devis</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Version Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{quote.clientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{quote.projectName || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{new Date(quote.quoteDate).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(quote.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatPrice(quote.totalTtc)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedQuote(quote);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Voir
                          </button>
                          {(isAdmin || quote.status === 'draft') && (
                            <button
                              onClick={() => {
                                if (confirm('Supprimer ce devis ?')) {
                                  deleteQuote(quote.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Version Mobile */}
              <div className="md:hidden divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <div key={quote.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{quote.clientName}</h3>
                        <p className="text-sm text-gray-600">{quote.projectName || 'Sans projet'}</p>
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{new Date(quote.quoteDate).toLocaleDateString('fr-FR')}</span>
                      <span className="font-semibold text-gray-900">{formatPrice(quote.totalTtc)}</span>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedQuote(quote);
                          setShowViewModal(true);
                        }}
                        className="flex-1 text-center bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100"
                      >
                        Voir
                      </button>
                      {(isAdmin || quote.status === 'draft') && (
                        <button
                          onClick={() => {
                            if (confirm('Supprimer ce devis ?')) {
                              deleteQuote(quote.id);
                            }
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal calculateur */}
      <CostCalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onAddToQuote={(params: PricingParameters, result: PricingResult) => {
          console.log('Ligne ajoutée:', params, result);
          setShowCalculator(false);
        }}
      />

      {/* Modal visualisation devis */}
      <QuoteViewModal
        quote={selectedQuote}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedQuote(null);
        }}
        canEdit={canCreateQuotes}
        onEdit={() => {
          setShowViewModal(false);
          setShowEditModal(true);
        }}
      />

      {/* Modal édition devis */}
      <QuoteEditModal
        quote={selectedQuote}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedQuote(null);
        }}
        onSaved={() => {
          setShowEditModal(false);
          setSelectedQuote(null);
        }}
      />
    </div>
  );
}
