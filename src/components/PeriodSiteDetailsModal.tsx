import React, { useMemo, useState } from 'react';
import { X, TrendingUp, Package, CheckCircle, Truck, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { DebitSheet } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { calculateSheetTotals } from '../utils/materialUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PeriodSiteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  sheets: DebitSheet[];
}

interface OrderData {
  numeroOS: string;
  numeroARC: string;
  nomClient: string;
  refChantier: string;
  sheet: DebitSheet;
  totalM2: number;
  totalM3: number;
  isCompleted: boolean;
  isDelivered: boolean;
}

type SortField = 'numeroOS' | 'numeroARC' | 'nomClient' | 'refChantier' | 'totalM2' | 'totalM3' | 'completionRate';
type SortDirection = 'asc' | 'desc';

export default function PeriodSiteDetailsModal({ isOpen, onClose, periodLabel, sheets }: PeriodSiteDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalM2');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'delivered' | 'inProgress'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const orderData = useMemo(() => {
    return sheets.map(sheet => {
      const items = sheet.items || [];
      const completedItems = items.filter(item => item.termine);
      const totals = completedItems.length > 0 ? calculateSheetTotals(completedItems) : { totalM2: 0, totalM3: 0 };

      return {
        numeroOS: sheet.numeroOS,
        numeroARC: sheet.numeroARC,
        nomClient: sheet.nomClient,
        refChantier: sheet.refChantier || 'Non spécifié',
        sheet,
        totalM2: Math.round(totals.totalM2 * 100) / 100,
        totalM3: Math.round(totals.totalM3 * 1000) / 1000,
        isCompleted: sheet.fini,
        isDelivered: sheet.livre
      };
    });
  }, [sheets]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = orderData;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.numeroOS.toLowerCase().includes(search) ||
        order.numeroARC.toLowerCase().includes(search) ||
        order.nomClient.toLowerCase().includes(search) ||
        order.refChantier.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        switch (statusFilter) {
          case 'completed':
            return order.isCompleted;
          case 'delivered':
            return order.isDelivered;
          case 'inProgress':
            return !order.isCompleted && !order.isDelivered;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortField) {
        case 'numeroOS':
          aValue = a.numeroOS;
          bValue = b.numeroOS;
          break;
        case 'numeroARC':
          aValue = a.numeroARC;
          bValue = b.numeroARC;
          break;
        case 'nomClient':
          aValue = a.nomClient;
          bValue = b.nomClient;
          break;
        case 'refChantier':
          aValue = a.refChantier;
          bValue = b.refChantier;
          break;
        case 'totalM2':
          aValue = a.totalM2;
          bValue = b.totalM2;
          break;
        case 'totalM3':
          aValue = a.totalM3;
          bValue = b.totalM3;
          break;
        case 'completionRate':
          aValue = a.isCompleted ? 100 : 0;
          bValue = b.isCompleted ? 100 : 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [orderData, searchTerm, statusFilter, sortField, sortDirection]);

  const totals = useMemo(() => {
    return orderData.reduce((acc, order) => ({
      totalM2: acc.totalM2 + order.totalM2,
      totalM3: acc.totalM3 + order.totalM3,
      totalOrders: acc.totalOrders + 1,
      completedOrders: acc.completedOrders + (order.isCompleted ? 1 : 0),
      deliveredOrders: acc.deliveredOrders + (order.isDelivered ? 1 : 0)
    }), { totalM2: 0, totalM3: 0, totalOrders: 0, completedOrders: 0, deliveredOrders: 0 });
  }, [orderData]);

  const chartDataM2 = useMemo(() => {
    return filteredAndSortedData
      .filter(order => order.totalM2 > 0)
      .sort((a, b) => b.totalM2 - a.totalM2)
      .slice(0, 8)
      .map(order => ({
        name: order.numeroOS,
        value: order.totalM2
      }));
  }, [filteredAndSortedData]);

  const chartDataM3 = useMemo(() => {
    return filteredAndSortedData
      .filter(order => order.totalM3 > 0)
      .sort((a, b) => b.totalM3 - a.totalM3)
      .slice(0, 8)
      .map(order => ({
        name: order.numeroOS,
        value: order.totalM3
      }));
  }, [filteredAndSortedData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <Package className="h-7 w-7" />
              <span>Détails par Chantier</span>
            </h2>
            <p className="text-blue-100 mt-1">{periodLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Commandes</p>
                  <p className="text-2xl font-bold text-blue-900">{totals.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Surface Total</p>
                  <p className="text-2xl font-bold text-emerald-900">{totals.totalM2.toFixed(1)} m²</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Volume Total</p>
                  <p className="text-2xl font-bold text-blue-900">{totals.totalM3.toFixed(2)} m³</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Terminées</p>
                  <p className="text-2xl font-bold text-green-900">{totals.completedOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Livrées</p>
                  <p className="text-2xl font-bold text-purple-900">{totals.deliveredOrders}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartDataM2.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 8 Commandes par Surface (M²)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartDataM2}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)} m²`} />
                    <Bar dataKey="value" fill="#10b981" name="M²" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartDataM3.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 8 Commandes par Volume (M³)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartDataM3}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(3)} m³`} />
                    <Bar dataKey="value" fill="#3b82f6" name="M³" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Rechercher un numéro OS, ARC, client ou référence chantier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    showFilters || statusFilter !== 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                  {statusFilter !== 'all' && (
                    <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Tous
                      </button>
                      <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Terminés
                      </button>
                      <button
                        onClick={() => setStatusFilter('delivered')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'delivered'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Livrés
                      </button>
                      <button
                        onClick={() => setStatusFilter('inProgress')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'inProgress'
                            ? 'bg-gray-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        En cours
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('numeroOS')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Numéro OS</span>
                        <SortIcon field="numeroOS" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('numeroARC')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Numéro ARC</span>
                        <SortIcon field="numeroARC" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('nomClient')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Client</span>
                        <SortIcon field="nomClient" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('refChantier')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Réf. Chantier</span>
                        <SortIcon field="refChantier" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalM2')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>M² Total</span>
                        <SortIcon field="totalM2" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalM3')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>M³ Total</span>
                        <SortIcon field="totalM3" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('completionRate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Statut</span>
                        <SortIcon field="completionRate" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedData.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-sm font-medium text-gray-900">{order.numeroOS}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{order.numeroARC}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.nomClient}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.refChantier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {order.totalM2} m²
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {order.totalM3} m³
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {order.isCompleted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Terminé
                            </span>
                          )}
                          {order.isDelivered && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Truck className="h-3 w-3 mr-1" />
                              Livré
                            </span>
                          )}
                          {!order.isCompleted && !order.isDelivered && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              En cours
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSortedData.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Aucune commande trouvée</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredAndSortedData.length} commande{filteredAndSortedData.length > 1 ? 's' : ''} au total
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
