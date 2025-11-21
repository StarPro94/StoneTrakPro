import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Package, CheckCircle, Truck, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { DebitSheet } from '../types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval, isSameWeek, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserProfile } from '../hooks/useUserProfile';
import { calculateSheetTotals } from '../utils/materialUtils';
import PeriodSiteDetailsModal from './PeriodSiteDetailsModal';

interface ReportsProps {
  sheets: DebitSheet[];
  profileLoading: boolean;
  profile: UserProfile | null;
  isAdmin: boolean;
  isBureau: boolean;
  isAtelier: boolean;
  isStockMatiere: boolean;
}

export default function Reports({ sheets, profileLoading, profile, isAdmin, isBureau, isAtelier, isStockMatiere }: ReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPeriodData, setSelectedPeriodData] = useState<{ label: string; sheets: DebitSheet[] } | null>(null);

  const navigatePrevious = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setSelectedDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (selectedPeriod === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
  };

  const navigateToday = () => {
    setSelectedDate(new Date());
  };

  const getCurrentPeriodLabel = () => {
    if (selectedPeriod === 'week') {
      return `Semaine du ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: fr })}`;
    } else if (selectedPeriod === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: fr });
    } else {
      return format(selectedDate, 'yyyy');
    }
  };

  const periodData = useMemo(() => {
    const now = selectedDate;
    let periods: Date[] = [];
    let periodFormat = '';

    switch (selectedPeriod) {
      case 'week':
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        periods = eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn: 1 });
        periodFormat = "'Semaine du 'd MMM";
        break;
      case 'month':
        periods = eachMonthOfInterval({ 
          start: startOfYear(now), 
          end: endOfYear(now) 
        });
        periodFormat = 'MMMM yyyy';
        break;
      case 'year':
        const currentYear = now.getFullYear();
        periods = Array.from({ length: 5 }, (_, i) => new Date(currentYear - 2 + i, 0, 1));
        periodFormat = 'yyyy';
        break;
    }

    return periods.map(period => {
      let filteredSheets: DebitSheet[] = [];

      switch (selectedPeriod) {
        case 'week':
          filteredSheets = sheets.filter(sheet => 
            isSameWeek(new Date(sheet.dateCreation), period, { weekStartsOn: 1 })
          );
          break;
        case 'month':
          filteredSheets = sheets.filter(sheet => 
            isSameMonth(new Date(sheet.dateCreation), period)
          );
          break;
        case 'year':
          filteredSheets = sheets.filter(sheet => 
            new Date(sheet.dateCreation).getFullYear() === period.getFullYear()
          );
          break;
      }

      // Compter les M²/M³ pour chaque élément terminé individuellement
      let totalM2 = 0;
      let totalM3 = 0;

      filteredSheets.forEach(sheet => {
        const items = sheet.items || [];
        const completedItems = items.filter(item => item.termine);
        if (completedItems.length > 0) {
          const totals = calculateSheetTotals(completedItems);
          totalM2 += totals.totalM2;
          totalM3 += totals.totalM3;
        }
      });
      
      const completedOrders = filteredSheets.filter(sheet => sheet.fini).length;
      const deliveredOrders = filteredSheets.filter(sheet => sheet.livre).length;

      return {
        period: format(period, periodFormat, { locale: fr }),
        date: period,
        totalM2: Math.round(totalM2 * 100) / 100,
        totalM3: Math.round(totalM3 * 1000) / 1000,
        orders: filteredSheets.length,
        completedOrders,
        deliveredOrders,
        completionRate: filteredSheets.length > 0 ? Math.round((completedOrders / filteredSheets.length) * 100) : 0,
        filteredSheets
      };
    }).filter(data => data.orders > 0);
  }, [sheets, selectedPeriod, selectedDate]);

  const handlePeriodClick = (periodLabel: string, periodSheets: DebitSheet[]) => {
    setSelectedPeriodData({ label: periodLabel, sheets: periodSheets });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPeriodData(null);
  };

  const currentPeriodStats = useMemo(() => {
    const now = new Date();
    let currentSheets: DebitSheet[] = [];

    switch (selectedPeriod) {
      case 'week':
        currentSheets = sheets.filter(sheet => 
          isSameWeek(new Date(sheet.dateCreation), now, { weekStartsOn: 1 })
        );
        break;
      case 'month':
        currentSheets = sheets.filter(sheet => 
          isSameMonth(new Date(sheet.dateCreation), now)
        );
        break;
      case 'year':
        currentSheets = sheets.filter(sheet => 
          new Date(sheet.dateCreation).getFullYear() === now.getFullYear()
        );
        break;
    }

    // Compter les M²/M³ pour chaque élément terminé individuellement
    let totalM2 = 0;
    let totalM3 = 0;

    currentSheets.forEach(sheet => {
      const items = sheet.items || [];
      const completedItems = items.filter(item => item.termine);
      if (completedItems.length > 0) {
        const totals = calculateSheetTotals(completedItems);
        totalM2 += totals.totalM2;
        totalM3 += totals.totalM3;
      }
    });

    return {
      totalOrders: currentSheets.length,
      totalM2,
      totalM3,
      completedOrders: currentSheets.filter(sheet => sheet.fini).length,
      deliveredOrders: currentSheets.filter(sheet => sheet.livre).length
    };
  }, [sheets, selectedPeriod]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Affichage du loader pendant le chargement du profil (optionnel pour Reports)
  if (profileLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil utilisateur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec contrôles */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <BarChart className="h-7 w-7 text-blue-600" />
                <span>Rapports de Production</span>
              </h2>
              <p className="text-gray-600 mt-1">Analyse des performances et tendances</p>
              <p className="text-sm text-blue-600 mt-2 font-medium">{getCurrentPeriodLabel()}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 mr-4">
                <button
                  onClick={navigatePrevious}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Période précédente"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={navigateToday}
                  className="px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Période suivante"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                      selectedPeriod === period
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period === 'week' ? 'Semaines' : period === 'month' ? 'Mois' : 'Années'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques actuelles */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{currentPeriodStats.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Surface Total</p>
                <p className="text-2xl font-bold text-emerald-600">{currentPeriodStats.totalM2.toFixed(1)} m²</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volume Total</p>
                <p className="text-2xl font-bold text-blue-600">{currentPeriodStats.totalM3.toFixed(2)} m³</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{currentPeriodStats.completedOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Livrées</p>
                <p className="text-2xl font-bold text-purple-600">{currentPeriodStats.deliveredOrders}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique en barres - Production */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Production par {selectedPeriod === 'week' ? 'Semaine' : selectedPeriod === 'month' ? 'Mois' : 'Année'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalM2" fill="#10b981" name="M² produits" />
                <Bar dataKey="totalM3" fill="#3b82f6" name="M³ produits" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique linéaire - Tendances */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Commandes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} name="Commandes" />
                <Line type="monotone" dataKey="completedOrders" stroke="#10b981" strokeWidth={2} name="Terminées" />
                <Line type="monotone" dataKey="deliveredOrders" stroke="#3b82f6" strokeWidth={2} name="Livrées" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tableau détaillé */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Détail par Période</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Période</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Commandes</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">M² Total</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">M³ Total</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Terminées</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Livrées</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Taux Réalisation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periodData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handlePeriodClick(data.period, data.filteredSheets)}
                        className="flex items-center space-x-2 font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{data.period}</span>
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{data.orders}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{data.totalM2} m²</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{data.totalM3} m³</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600">{data.completedOrders}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-purple-600 hidden sm:table-cell">{data.deliveredOrders}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${data.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{data.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPeriodData && (
        <PeriodSiteDetailsModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          periodLabel={selectedPeriodData.label}
          sheets={selectedPeriodData.sheets}
        />
      )}
    </div>
  );
}