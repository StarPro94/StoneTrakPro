import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, AlertTriangle, Clock, Zap, Package, 
  CheckCircle2, ArrowRight, Sparkles, Brain, 
  Calendar, ChevronRight, MoreHorizontal, Activity,
  AlertCircle, BarChart3
} from 'lucide-react';
import { DebitSheet } from '../types';
import ChatAssistant from './ChatAssistant';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  sheets: DebitSheet[];
  onViewSheet?: (sheet: DebitSheet) => void;
}

// --- Composants UI Premium (Micro-Components) ---

const PremiumCard = ({ children, className = "", gradient = false }: { children: React.ReactNode, className?: string, gradient?: boolean }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
    {gradient && (
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-50" />
    )}
    <div className="relative z-10">{children}</div>
  </div>
);

const StatusBadge = ({ status, text }: { status: 'success' | 'warning' | 'error' | 'neutral', text: string }) => {
  const colors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    neutral: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {text}
    </span>
  );
};

// --- Logique Principale ---

export default function Dashboard({ sheets, onViewSheet }: DashboardProps) {
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  // 🧠 LE CERVEAU DU DASHBOARD (Calculs IA)
  const intelligence = useMemo(() => {
    const now = new Date();
    
    // 1. Filtrage de base
    const activeSheets = sheets.filter(s => !s.fini && !s.livre);
    const completedToday = sheets.filter(s => s.fini && s.dateFinition && new Date(s.dateFinition).getDate() === now.getDate()).length;
    
    // 2. Analyse d'Urgence (Scoring)
    const prioritizedSheets = activeSheets.map(sheet => {
      let score = 0;
      let urgentReason = "";
      
      // Facteur Délai
      const delaiStr = sheet.delai?.trim();
      const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;
      let daysRemaining = null;

      if (delaiDays !== null) {
        const creationDate = new Date(sheet.dateCreation);
        const dueDate = new Date(creationDate);
        dueDate.setDate(dueDate.getDate() + delaiDays);
        daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) { score += 50; urgentReason = "En retard"; }
        else if (daysRemaining <= 2) { score += 30; urgentReason = "Échéance imminente"; }
        else if (daysRemaining <= 5) { score += 10; }
      }

      // Facteur Complexité (Volume/Surface)
      if (sheet.m2 > 50 || sheet.m3 > 2) { score += 5; }

      return { ...sheet, score, daysRemaining, urgentReason };
    }).sort((a, b) => b.score - a.score);

    const highPriority = prioritizedSheets.filter(s => s.score >= 30);
    
    // 3. Analyse de Charge
    const totalActiveM2 = activeSheets.reduce((acc, s) => acc + s.m2, 0);
    const totalActiveM3 = activeSheets.reduce((acc, s) => acc + s.m3, 0);
    
    // Simuler une capacité machine (à remplacer par vraie data plus tard)
    const capacityScore = Math.min(100, (activeSheets.length / 15) * 100); 
    let loadStatus: 'light' | 'optimal' | 'heavy' | 'critical' = 'optimal';
    if (capacityScore < 30) loadStatus = 'light';
    else if (capacityScore > 80) loadStatus = 'heavy';
    else if (capacityScore > 95) loadStatus = 'critical';

    // 4. Génération de l'Insight IA du jour (Phrase naturelle)
    let dailyInsight = "Activité normale détectée. Flux de production stable.";
    if (highPriority.length > 3) dailyInsight = "Attention : Accumulation de commandes urgentes. Priorisez la découpe.";
    else if (capacityScore > 90) dailyInsight = "Surcharge machine probable. Envisagez de décaler les livraisons non urgentes.";
    else if (completedToday > 3) dailyInsight = "Excellent rythme aujourd'hui ! La production est fluide.";

    return {
      activeCount: activeSheets.length,
      highPriority,
      totalActiveM2,
      totalActiveM3,
      loadStatus,
      capacityScore,
      dailyInsight,
      completedToday
    };
  }, [sheets]);

  // Helpers d'affichage
  const getLoadColor = (score: number) => {
    if (score < 50) return 'text-emerald-600';
    if (score < 80) return 'text-amber-600';
    return 'text-rose-600';
  };

  const today = format(new Date(), 'dQ MMMM yyyy', { locale: fr });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* --- HEADER: Welcoming & Context --- */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Tableau de Bord
            </h1>
            <p className="mt-1 text-slate-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="group flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900">
              <Brain className="h-4 w-4 text-violet-500 transition group-hover:scale-110" />
              <span>Assistant IA</span>
            </button>
            <button className="group flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg active:scale-95">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span>Analyser</span>
            </button>
          </div>
        </div>

        {/* --- SECTION 1: KPIS (Bento Grid Top) --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Commandes Actives */}
          <PremiumCard className="group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">En Production</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {intelligence.activeCount}
                </h3>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="bg-slate-100 px-2 py-1 rounded-md">{intelligence.totalActiveM2.toFixed(0)} m²</span>
              <span className="bg-slate-100 px-2 py-1 rounded-md">{intelligence.totalActiveM3.toFixed(2)} m³</span>
            </div>
          </PremiumCard>

          {/* KPI 2: Urgences */}
          <PremiumCard className={`group ${intelligence.highPriority.length > 0 ? 'ring-1 ring-rose-100' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Attention Requise</p>
                <h3 className={`mt-2 text-3xl font-bold tracking-tight ${intelligence.highPriority.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {intelligence.highPriority.length}
                </h3>
              </div>
              <div className={`rounded-xl p-3 transition-colors ${intelligence.highPriority.length > 0 ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-100' : 'bg-slate-50 text-slate-400'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Commandes avec échéance &lt; 3 jours
            </p>
          </PremiumCard>

          {/* KPI 3: Charge Machine (IA) */}
          <PremiumCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Charge Atelier</p>
                <h3 className={`mt-2 text-3xl font-bold tracking-tight ${getLoadColor(intelligence.capacityScore)}`}>
                  {intelligence.capacityScore.toFixed(0)}%
                </h3>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600 group-hover:bg-amber-100">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
              <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${intelligence.capacityScore > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${intelligence.capacityScore}%` }}
              />
            </div>
          </PremiumCard>

          {/* KPI 4: Performance Jour */}
          <PremiumCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Terminé auj.</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                  {intelligence.completedToday}
                </h3>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="mr-1 h-3 w-3" /> Performance stable
            </p>
          </PremiumCard>
        </div>

        {/* --- SECTION 2: INTELLIGENCE GRID (Bento Layout) --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Bloc 1: Analyse IA (Large) */}
          <div className="col-span-1 lg:col-span-2">
            <PremiumCard className="h-full !bg-gradient-to-br !from-slate-900 !to-slate-800 !text-white !border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                  <Brain className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="text-lg font-semibold">Analyse StoneTrak AI</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Diagnostic en temps réel</p>
                  <p className="text-xl font-medium leading-relaxed text-slate-100">
                    "{intelligence.dailyInsight}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" /> Recommandation Prioritaire
                    </h4>
                    {intelligence.highPriority.length > 0 ? (
                       <p className="text-sm text-slate-200">
                         Traiter immédiatement la commande <span className="font-bold text-white">{intelligence.highPriority[0].numeroOS}</span> ({intelligence.highPriority[0].nomClient}).
                       </p>
                    ) : (
                      <p className="text-sm text-slate-200">Aucune urgence critique. Optimisez le stock de tranches K2.</p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" /> Efficacité Production
                    </h4>
                    <p className="text-sm text-slate-200">
                      Volume de découpe prévu à <span className="font-bold text-white">{(intelligence.totalActiveM2 * 0.8).toFixed(1)} m²</span> pour demain selon la charge actuelle.
                    </p>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </div>

          {/* Bloc 2: Actions Rapides / Alertes (Side) */}
          <div className="col-span-1">
            <PremiumCard className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-slate-400" />
                  Alertes Système
                </h3>
                <span className="text-xs font-medium text-slate-400">Temps réel</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {intelligence.highPriority.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">Tout est sous contrôle</p>
                  </div>
                ) : (
                  intelligence.highPriority.slice(0, 4).map((sheet) => (
                    <div 
                      key={sheet.id} 
                      onClick={() => onViewSheet?.(sheet)}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-rose-100 hover:bg-rose-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-semibold text-slate-900">{sheet.numeroOS}</p>
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                             {sheet.daysRemaining !== null && sheet.daysRemaining < 0 ? `+${Math.abs(sheet.daysRemaining)}j` : `${sheet.daysRemaining}j`}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500">{sheet.nomClient}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-rose-400" />
                    </div>
                  ))
                )}
              </div>
            </PremiumCard>
          </div>
        </div>

        {/* --- SECTION 3: WORKFLOW (Liste intelligente) --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">File de Production Prioritaire</h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Voir tout le planning <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Ordre (IA)</th>
                  <th className="px-6 py-4">OS / Client</th>
                  <th className="px-6 py-4">Matière</th>
                  <th className="px-6 py-4">Dimensions</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intelligence.highPriority.slice(0, 5).concat(sheets.filter(s => !s.fini).slice(0, 3)).slice(0, 5).map((sheet, idx) => (
                  <tr key={sheet.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${idx < 2 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{sheet.numeroOS}</div>
                      <div className="text-xs text-slate-500">{sheet.nomClient}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block max-w-[150px] truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {sheet.fourniture}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {sheet.m2 > 0 ? <>{sheet.m2.toFixed(2)} m²</> : <>{sheet.m3.toFixed(2)} m³</>}
                    </td>
                    <td className="px-6 py-4">
                      {/* Logic simulée pour l'exemple, à remplacer par un vrai statut de prod */}
                      <StatusBadge 
                        status={idx === 0 ? 'warning' : 'neutral'} 
                        text={idx === 0 ? 'Urgent' : 'En attente'} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewSheet?.(sheet)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sheets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Aucune commande en cours. Importez un PDF pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Assistant Flottant */}
      <ChatAssistant
        sheets={sheets}
        isMinimized={isChatMinimized}
        onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
      />
    </div>
  );
}