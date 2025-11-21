import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, Zap, Target, Package } from 'lucide-react';
import { DebitSheet } from '../types';

interface AiInsightsDashboardProps {
  sheets: DebitSheet[];
}

export default function AiInsightsDashboard({ sheets }: AiInsightsDashboardProps) {
  const insights = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Commandes actives
    const activeSheets = sheets.filter(s => !s.fini && !s.livre);
    const completedSheets = sheets.filter(s => s.fini);
    const deliveredSheets = sheets.filter(s => s.livre);

    // Commandes récentes (7 derniers jours)
    const recentSheets = sheets.filter(s => {
      const creationDate = new Date(s.dateCreation);
      return creationDate >= sevenDaysAgo;
    });

    // Commandes urgentes
    const urgentSheets = activeSheets.filter(sheet => {
      const delaiStr = sheet.delai?.trim();
      const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;

      if (delaiDays === null || delaiDays <= 0) return false;

      const creationDate = new Date(sheet.dateCreation);
      const dueDate = new Date(creationDate);
      dueDate.setDate(dueDate.getDate() + delaiDays);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    });

    // Commandes en retard
    const overdueSheets = activeSheets.filter(sheet => {
      const delaiStr = sheet.delai?.trim();
      const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;

      if (delaiDays === null || delaiDays <= 0) return false;

      const creationDate = new Date(sheet.dateCreation);
      const dueDate = new Date(creationDate);
      dueDate.setDate(dueDate.getDate() + delaiDays);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue < 0;
    });

    // Calcul des surfaces et volumes
    const totalM2Active = activeSheets.reduce((sum, s) => sum + s.m2, 0);
    const totalM3Active = activeSheets.reduce((sum, s) => sum + s.m3, 0);

    const totalM2ThisWeek = recentSheets.reduce((sum, s) => sum + s.m2, 0);

    // Analyse des délais moyens
    const sheetsWithDelai = completedSheets.filter(s => s.dateFinition);
    const avgDelai = sheetsWithDelai.length > 0
      ? sheetsWithDelai.reduce((sum, s) => {
          const creationDate = new Date(s.dateCreation);
          const finitionDate = s.dateFinition ? new Date(s.dateFinition) : new Date();
          const daysSpent = Math.ceil((finitionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + daysSpent;
        }, 0) / sheetsWithDelai.length
      : 0;

    // Prédiction de charge de travail
    const workloadScore = Math.min(100, (activeSheets.length / 20) * 100);

    // Taux de complétion
    const completionRate = sheets.length > 0
      ? (completedSheets.length / sheets.length) * 100
      : 0;

    // Tendances (comparaison 7 derniers jours vs 7 jours précédents)
    const previous7Days = sheets.filter(s => {
      const creationDate = new Date(s.dateCreation);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return creationDate >= fourteenDaysAgo && creationDate < sevenDaysAgo;
    });

    const trendNewOrders = recentSheets.length - previous7Days.length;
    const trendPercentage = previous7Days.length > 0
      ? ((trendNewOrders / previous7Days.length) * 100).toFixed(1)
      : '0';

    return {
      activeSheets: activeSheets.length,
      completedSheets: completedSheets.length,
      deliveredSheets: deliveredSheets.length,
      urgentSheets: urgentSheets.length,
      overdueSheets: overdueSheets.length,
      recentSheets: recentSheets.length,
      totalM2Active,
      totalM3Active,
      totalM2ThisWeek,
      avgDelai: Math.round(avgDelai),
      workloadScore: Math.round(workloadScore),
      completionRate: Math.round(completionRate),
      trendNewOrders,
      trendPercentage
    };
  }, [sheets]);

  const getWorkloadColor = (score: number) => {
    if (score < 40) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getWorkloadLabel = (score: number) => {
    if (score < 40) return 'Faible';
    if (score < 70) return 'Modérée';
    return 'Élevée';
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commandes actives */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes Actives</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{insights.activeSheets}</p>
              <p className="text-xs text-gray-500 mt-1">
                {insights.totalM2Active.toFixed(0)} m² | {insights.totalM3Active.toFixed(2)} m³
              </p>
            </div>
            <Package className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        {/* Commandes urgentes */}
        <div className="bg-white border-2 border-orange-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgences</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{insights.urgentSheets}</p>
              {insights.overdueSheets > 0 && (
                <p className="text-xs text-red-600 font-semibold mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {insights.overdueSheets} en retard
                </p>
              )}
            </div>
            <Clock className="h-10 w-10 text-orange-400" />
          </div>
        </div>

        {/* Taux de complétion */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de Complétion</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{insights.completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {insights.completedSheets} terminées
              </p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
        </div>

        {/* Charge de travail */}
        <div className={`bg-white border-2 rounded-lg p-4 shadow-sm ${getWorkloadColor(insights.workloadScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Charge de Travail</p>
              <p className="text-3xl font-bold mt-1">{getWorkloadLabel(insights.workloadScore)}</p>
              <p className="text-xs font-semibold mt-1">
                Score: {insights.workloadScore}/100
              </p>
            </div>
            <Zap className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Insights IA */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Target className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-900 mb-3">Insights IA de la Semaine</h3>
            <div className="space-y-2 text-sm">
              {/* Tendance nouvelles commandes */}
              <div className="flex items-center space-x-2">
                {insights.trendNewOrders >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <p className="text-gray-800">
                  <span className="font-semibold">{Math.abs(insights.trendNewOrders)}</span> {insights.trendNewOrders >= 0 ? 'nouvelles' : 'commandes en moins'} cette semaine
                  ({insights.trendNewOrders >= 0 ? '+' : ''}{insights.trendPercentage}% vs semaine précédente)
                </p>
              </div>

              {/* Production hebdomadaire */}
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-gray-800">
                  Production hebdomadaire : <span className="font-semibold">{insights.totalM2ThisWeek.toFixed(0)} m²</span>
                </p>
              </div>

              {/* Délai moyen */}
              {insights.avgDelai > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <p className="text-gray-800">
                    Délai moyen de production : <span className="font-semibold">{insights.avgDelai} jours</span>
                  </p>
                </div>
              )}

              {/* Alerte si surcharge */}
              {insights.workloadScore > 80 && (
                <div className="flex items-center space-x-2 mt-3 p-2 bg-red-50 rounded border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-800 font-medium">
                    ⚠️ Charge de travail critique ! Envisagez de prioriser les commandes urgentes ou d'augmenter les ressources.
                  </p>
                </div>
              )}

              {/* Félicitations si bonne perf */}
              {insights.completionRate > 80 && insights.overdueSheets === 0 && (
                <div className="flex items-center space-x-2 mt-3 p-2 bg-green-50 rounded border border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-green-800 font-medium">
                    ✅ Excellente performance ! {insights.completionRate}% de taux de complétion sans retard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
