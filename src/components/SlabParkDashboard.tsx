import React from 'react';
import { Package, CheckCircle, AlertCircle, Grid3x3, Layers, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSlabStatistics } from '../hooks/useSlabStatistics';
import { formatCurrency, formatArea, formatVolume } from '../utils/slabCalculations';

const SlabParkDashboard = React.memo(function SlabParkDashboard() {
  const { statistics, loading, occupationRate, availabilityRate } = useSlabStatistics();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) return null;

  const kpiCards = [
    {
      title: 'Tranches totales',
      value: statistics.totalSlabs,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Disponibles',
      value: statistics.availableSlabs,
      subtitle: `${availabilityRate.toFixed(0)}% du stock`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Réservées',
      value: statistics.reservedSlabs,
      subtitle: `${statistics.totalSlabs > 0 ? ((statistics.reservedSlabs / statistics.totalSlabs) * 100).toFixed(0) : 0}% du stock`,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Occupation',
      value: `${occupationRate.toFixed(0)}%`,
      subtitle: `${statistics.totalPositionsOccupied}/96 positions`,
      icon: Grid3x3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  const statsCards = [
    {
      title: 'Surface totale',
      value: formatArea(statistics.totalSurfaceM2),
      icon: Layers,
      color: 'text-cyan-600',
    },
    {
      title: 'Volume total',
      value: formatVolume(statistics.totalVolumeM3),
      icon: Layers,
      color: 'text-teal-600',
    },
    {
      title: 'Valeur estimée',
      value: formatCurrency(statistics.totalEstimatedValue),
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Parc à Tranches</h2>
            <p className="text-blue-100">Vue d'ensemble de votre stock</p>
          </div>
          <Package className="h-16 w-16 opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-md border-2 ${card.borderColor} p-5 transition-all hover:shadow-lg hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            {card.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <div>
                <p className="text-xs text-gray-600">{card.title}</p>
                <p className="text-lg font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {statistics.oldSlabsCount > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900">Alerte stock ancien</h4>
              <p className="text-sm text-orange-800">
                {statistics.oldSlabsCount} tranche{statistics.oldSlabsCount > 1 ? 's' : ''} immobilisée{statistics.oldSlabsCount > 1 ? 's' : ''} depuis plus de 60 jours
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SlabParkDashboard;
