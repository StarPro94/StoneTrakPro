import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Clock, Zap, Target, Package, CheckCircle2, Eye, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { DebitSheet } from '../types';
import ChatAssistant from './ChatAssistant';

interface DashboardProps {
  sheets: DebitSheet[];
  onViewSheet?: (sheet: DebitSheet) => void;
}

interface Anomaly {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  sheet?: DebitSheet;
}

export default function Dashboard({ sheets, onViewSheet }: DashboardProps) {
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  const { insights, anomalies } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeSheets = sheets.filter(s => !s.fini && !s.livre);
    const completedSheets = sheets.filter(s => s.fini);
    const deliveredSheets = sheets.filter(s => s.livre);

    const recentSheets = sheets.filter(s => {
      const creationDate = new Date(s.dateCreation);
      return creationDate >= sevenDaysAgo;
    });

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

    const totalM2Active = activeSheets.reduce((sum, s) => sum + s.m2, 0);
    const totalM3Active = activeSheets.reduce((sum, s) => sum + s.m3, 0);
    const totalM2ThisWeek = recentSheets.reduce((sum, s) => sum + s.m2, 0);

    const sheetsWithDelai = completedSheets.filter(s => s.dateFinition);
    const avgDelai = sheetsWithDelai.length > 0
      ? sheetsWithDelai.reduce((sum, s) => {
          const creationDate = new Date(s.dateCreation);
          const finitionDate = s.dateFinition ? new Date(s.dateFinition) : new Date();
          const daysSpent = Math.ceil((finitionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + daysSpent;
        }, 0) / sheetsWithDelai.length
      : 0;

    const workloadScore = Math.min(100, (activeSheets.length / 20) * 100);
    const completionRate = sheets.length > 0 ? (completedSheets.length / sheets.length) * 100 : 0;

    const previous7Days = sheets.filter(s => {
      const creationDate = new Date(s.dateCreation);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return creationDate >= fourteenDaysAgo && creationDate < sevenDaysAgo;
    });

    const trendNewOrders = recentSheets.length - previous7Days.length;

    const detected: Anomaly[] = [];

    sheets.forEach(sheet => {
      if (sheet.m2 > 1000) {
        detected.push({
          id: `dim-${sheet.id}`,
          type: 'warning',
          title: 'Surface exceptionnellement élevée',
          message: `${sheet.numeroOS} - ${sheet.m2.toFixed(2)} m²`,
          sheet
        });
      }

      const epaisseurNum = parseFloat(sheet.epaisseur);
      if (!isNaN(epaisseurNum) && epaisseurNum > 100) {
        detected.push({
          id: `ep-${sheet.id}`,
          type: 'error',
          title: 'Épaisseur incorrecte',
          message: `${sheet.numeroOS} - ${sheet.epaisseur}cm (probablement en mm)`,
          sheet
        });
      }

      if (!sheet.fini && !sheet.livre) {
        const delaiStr = sheet.delai?.trim();
        const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;

        if (delaiDays !== null && delaiDays > 0) {
          const creationDate = new Date(sheet.dateCreation);
          const dueDate = new Date(creationDate);
          dueDate.setDate(dueDate.getDate() + delaiDays);
          const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysOverdue > 0) {
            detected.push({
              id: `retard-${sheet.id}`,
              type: 'error',
              title: 'Commande en retard',
              message: `${sheet.numeroOS} - ${sheet.nomClient} (+${daysOverdue}j)`,
              sheet
            });
          }
        }
      }

      if (sheet.fini && !sheet.livre && sheet.dateFinition) {
        const finitionDate = new Date(sheet.dateFinition);
        const daysSinceFinished = Math.ceil((now.getTime() - finitionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceFinished > 7) {
          detected.push({
            id: `nonlivre-${sheet.id}`,
            type: 'warning',
            title: 'Commande non livrée',
            message: `${sheet.numeroOS} - Terminée depuis ${daysSinceFinished}j`,
            sheet
          });
        }
      }

      if (sheet.m2 === 0 && sheet.m3 === 0) {
        detected.push({
          id: `zero-${sheet.id}`,
          type: 'error',
          title: 'Quantités nulles',
          message: `${sheet.numeroOS} - Aucune surface ni volume`,
          sheet
        });
      }
    });

    return {
      insights: {
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
        trendNewOrders
      },
      anomalies: detected.slice(0, 8)
    };
  }, [sheets]);

  const getWorkloadColor = (score: number) => {
    if (score < 40) return { bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-700', ring: 'ring-emerald-200' };
    if (score < 70) return { bg: 'from-amber-500 to-orange-500', text: 'text-amber-700', ring: 'ring-amber-200' };
    return { bg: 'from-red-500 to-rose-500', text: 'text-red-700', ring: 'ring-red-200' };
  };

  const getWorkloadLabel = (score: number) => {
    if (score < 40) return 'Faible';
    if (score < 70) return 'Modérée';
    return 'Élevée';
  };

  const workloadColor = getWorkloadColor(insights.workloadScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Dashboard Intelligent</h1>
            <p className="text-slate-600">Vue d'ensemble et insights IA en temps réel</p>
          </div>
          <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600">Données en direct</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{insights.activeSheets}</div>
                  <div className="text-xs text-slate-500 mt-1">commandes</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Commandes Actives</h3>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="font-medium">{insights.totalM2Active.toFixed(0)} m²</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium">{insights.totalM3Active.toFixed(2)} m³</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{insights.urgentSheets}</div>
                  <div className="text-xs text-slate-500 mt-1">urgentes</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Urgences</h3>
              {insights.overdueSheets > 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 font-semibold">
                  <AlertCircle className="h-3 w-3" />
                  <span>{insights.overdueSheets} en retard</span>
                </div>
              )}
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{insights.completionRate}%</div>
                  <div className="text-xs text-slate-500 mt-1">complété</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Taux de Complétion</h3>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${insights.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${workloadColor.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${workloadColor.bg} rounded-xl shadow-lg`}>
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${workloadColor.text}`}>{insights.workloadScore}</div>
                  <div className="text-xs text-slate-500 mt-1">sur 100</div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Charge de Travail</h3>
              <div className={`text-xs font-semibold ${workloadColor.text}`}>
                {getWorkloadLabel(insights.workloadScore)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Insights IA</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                {insights.trendNewOrders >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{Math.abs(insights.trendNewOrders)}</span> {insights.trendNewOrders >= 0 ? 'nouvelles commandes' : 'commandes en moins'} cette semaine
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    Production hebdomadaire : <span className="font-bold text-slate-900">{insights.totalM2ThisWeek.toFixed(0)} m²</span>
                  </p>
                </div>
              </div>

              {insights.avgDelai > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                  <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      Délai moyen : <span className="font-bold text-slate-900">{insights.avgDelai} jours</span>
                    </p>
                  </div>
                </div>
              )}

              {insights.workloadScore > 80 && (
                <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      Charge critique ! Priorisez les urgences.
                    </p>
                  </div>
                </div>
              )}

              {insights.completionRate > 80 && insights.overdueSheets === 0 && (
                <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800">
                      Performance excellente ! Aucun retard.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-orange-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Anomalies Détectées</h2>
              </div>
              {anomalies.length > 0 && (
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
                  {anomalies.length}
                </span>
              )}
            </div>

            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                <p className="text-slate-600 font-medium">Aucune anomalie détectée</p>
                <p className="text-slate-400 text-sm mt-1">Toutes les commandes sont conformes</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {anomalies.map(anomaly => (
                  <div
                    key={anomaly.id}
                    className={`group flex items-start space-x-3 p-3 rounded-xl transition-all duration-200 ${
                      anomaly.type === 'error'
                        ? 'bg-red-50 hover:bg-red-100'
                        : anomaly.type === 'warning'
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {anomaly.type === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : anomaly.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-semibold ${
                        anomaly.type === 'error' ? 'text-red-900' : anomaly.type === 'warning' ? 'text-orange-900' : 'text-blue-900'
                      }`}>
                        {anomaly.title}
                      </h4>
                      <p className={`text-xs mt-0.5 ${
                        anomaly.type === 'error' ? 'text-red-700' : anomaly.type === 'warning' ? 'text-orange-700' : 'text-blue-700'
                      }`}>
                        {anomaly.message}
                      </p>
                    </div>
                    {anomaly.sheet && onViewSheet && (
                      <button
                        onClick={() => onViewSheet(anomaly.sheet!)}
                        className={`flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                          anomaly.type === 'error'
                            ? 'hover:bg-red-200 text-red-700'
                            : anomaly.type === 'warning'
                            ? 'hover:bg-orange-200 text-orange-700'
                            : 'hover:bg-blue-200 text-blue-700'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Besoin d'aide ?</h3>
              <p className="text-slate-300 text-sm">L'IA est là pour vous accompagner dans la gestion de votre production</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-slate-400 text-sm">Propulsé par IA</span>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <ChatAssistant
        sheets={sheets}
        isMinimized={isChatMinimized}
        onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
      />
    </div>
  );
}
