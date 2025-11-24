import React, { useState, useMemo } from 'react';
import { FileText, Plus, Calculator, TrendingUp, DollarSign, CheckCircle, XCircle, Clock, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Calendar } from 'lucide-react';
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

type SortField = 'quoteReference' | 'clientCompany' | 'siteName' | 'quoteDate' | 'status' | 'totalTtc' | 'commercial';
type SortDirection = 'asc' | 'desc';
type PeriodFilter = 'all' | 'week' | 'month' | 'year';

export default function QuotingModule({ profileLoading, profile, isAdmin, isBureau }: QuotingModuleProps) {
  const { quotes, loading, isInitialLoad, error, createQuote, updateQuoteStatus, deleteQuote, fetchQuotes } = useQuotes();
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filtres et tri
  const [sortField, setSortField] = useState<SortField>('quoteDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [commercialFilter, setCommercialFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const canCreateQuotes = isAdmin || isBureau;
  const canViewPricing = isAdmin || isBureau;

  // Fonction de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrer et trier les devis
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = [...quotes];

    // Filtre de période
    if (periodFilter !== 'all') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      filtered = filtered.filter(quote => {
        const quoteDate = new Date(quote.quoteDate);
        switch (periodFilter) {
          case 'week':
            return quoteDate >= startOfWeek;
          case 'month':
            return quoteDate >= startOfMonth;
          case 'year':
            return quoteDate >= startOfYear;
          default:
            return true;
        }
      });
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Filtre par client
    if (clientFilter) {
      filtered = filtered.filter(quote =>
        quote.clientCompany.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Filtre par projet
    if (projectFilter) {
      filtered = filtered.filter(quote =>
        quote.siteName?.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }

    // Filtre par commercial
    if (commercialFilter) {
      filtered = filtered.filter(quote =>
        quote.commercial?.toLowerCase().includes(commercialFilter.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'quoteReference':
          aValue = a.quoteReference || '';
          bValue = b.quoteReference || '';
          break;
        case 'clientCompany':
          aValue = a.clientCompany;
          bValue = b.clientCompany;
          break;
        case 'siteName':
          aValue = a.siteName || '';
          bValue = b.siteName || '';
          break;
        case 'quoteDate':
          aValue = new Date(a.quoteDate).getTime();
          bValue = new Date(b.quoteDate).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'totalTtc':
          aValue = a.totalTtc;
          bValue = b.totalTtc;
          break;
        case 'commercial':
          aValue = a.commercial || '';
          bValue = b.commercial || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [quotes, periodFilter, statusFilter, clientFilter, projectFilter, commercialFilter, sortField, sortDirection]);

  // Listes uniques pour les filtres
  const uniqueClients = useMemo(() => {
    const clients = new Set(quotes.map(q => q.clientCompany));
    return Array.from(clients).sort();
  }, [quotes]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set(quotes.map(q => q.siteName).filter(Boolean));
    return Array.from(projects).sort();
  }, [quotes]);

  const uniqueCommercials = useMemo(() => {
    const commercials = new Set(quotes.map(q => q.commercial).filter(Boolean));
    return Array.from(commercials).sort();
  }, [quotes]);

  // Statistiques basées sur les devis filtrés
  const stats = {
    total: filteredAndSortedQuotes.length,
    draft: filteredAndSortedQuotes.filter(q => q.status === 'draft').length,
    sent: filteredAndSortedQuotes.filter(q => q.status === 'sent').length,
    accepted: filteredAndSortedQuotes.filter(q => q.status === 'accepted').length,
    rejected: filteredAndSortedQuotes.filter(q => q.status === 'rejected').length,
    totalAmount: filteredAndSortedQuotes.reduce((sum, q) => sum + q.totalTtc, 0)
  };

  // Réinitialiser tous les filtres
  const clearFilters = () => {
    setPeriodFilter('all');
    setStatusFilter('all');
    setClientFilter('');
    setProjectFilter('');
    setCommercialFilter('');
  };

  // Nombre de filtres actifs
  const activeFiltersCount = [
    periodFilter !== 'all',
    statusFilter !== 'all',
    clientFilter !== '',
    projectFilter !== '',
    commercialFilter !== ''
  ].filter(Boolean).length;

  // Icône de tri
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const handleCreateQuote = async () => {
    if (!canCreateQuotes) return;

    const newQuote = await createQuote({
      quoteReference: '',
      clientCompany: 'Nouveau Client',
      clientContactName: null,
      clientAddress: null,
      clientPhone: null,
      clientEmail: null,
      siteName: 'Nouveau Chantier',
      quoteDate: new Date(),
      estimatedDelay: '1 mois',
      status: 'draft',
      osNumber: null,
      commercial: null,
      subtotalHt: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalHt: 0,
      tvaPercent: 20,
      totalTva: 0,
      totalTtc: 0,
      notes: null
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

  if (profileLoading || (loading && isInitialLoad)) {
    return (
      <LoadingSpinner
        message="Chargement des devis..."
        subtitle="Veuillez patienter"
      />
    );
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

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filtres</h3>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Effacer</span>
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showFilters ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {/* Filtre de période */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Période
                </label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>

              {/* Filtre de statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyé</option>
                  <option value="accepted">Accepté</option>
                  <option value="rejected">Refusé</option>
                  <option value="expired">Expiré</option>
                </select>
              </div>

              {/* Filtre de client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <input
                  type="text"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  placeholder="Rechercher un client..."
                  list="clients-list"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="clients-list">
                  {uniqueClients.map(client => (
                    <option key={client} value={client} />
                  ))}
                </datalist>
              </div>

              {/* Filtre de projet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
                <input
                  type="text"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  placeholder="Rechercher un projet..."
                  list="projects-list"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="projects-list">
                  {uniqueProjects.map(project => (
                    <option key={project} value={project} />
                  ))}
                </datalist>
              </div>

              {/* Filtre de commercial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commercial</label>
                <input
                  type="text"
                  value={commercialFilter}
                  onChange={(e) => setCommercialFilter(e.target.value)}
                  placeholder="Rechercher un commercial..."
                  list="commercials-list"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="commercials-list">
                  {uniqueCommercials.map(commercial => (
                    <option key={commercial} value={commercial} />
                  ))}
                </datalist>
              </div>
            </div>
          )}
        </div>

        {/* Liste des devis */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Liste des devis
              {activeFiltersCount > 0 && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({filteredAndSortedQuotes.length} sur {quotes.length})
                </span>
              )}
            </h2>
          </div>

          {filteredAndSortedQuotes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Calculator className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                {activeFiltersCount > 0 ? 'Aucun devis trouvé' : 'Aucun devis'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {activeFiltersCount > 0
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par créer votre premier devis'}
              </p>
              {activeFiltersCount > 0 ? (
                <button
                  onClick={clearFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>Effacer les filtres</span>
                </button>
              ) : canCreateQuotes ? (
                <button
                  onClick={handleCreateQuote}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Créer un devis</span>
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* Version Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        onClick={() => handleSort('quoteReference')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Référence</span>
                          <SortIcon field="quoteReference" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('clientCompany')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Client</span>
                          <SortIcon field="clientCompany" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('siteName')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Projet</span>
                          <SortIcon field="siteName" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('quoteDate')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          <SortIcon field="quoteDate" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Statut</span>
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('totalTtc')}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Montant TTC</span>
                          <SortIcon field="totalTtc" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedQuotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">{quote.quoteReference}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{quote.clientCompany}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{quote.siteName || '-'}</div>
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
                {filteredAndSortedQuotes.map((quote) => (
                  <div key={quote.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-blue-600 mb-1">{quote.quoteReference}</div>
                        <h3 className="font-semibold text-gray-900">{quote.clientCompany}</h3>
                        <p className="text-sm text-gray-600">{quote.siteName || 'Sans chantier'}</p>
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
        onSaved={async () => {
          // Attendre un instant pour laisser Realtime se synchroniser
          await new Promise(resolve => setTimeout(resolve, 300));
          // Forcer un refresh pour être sûr d'avoir les bonnes valeurs
          await fetchQuotes(true);
          setShowEditModal(false);
          setSelectedQuote(null);
        }}
      />
    </div>
  );
}
