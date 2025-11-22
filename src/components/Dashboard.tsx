import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, AlertTriangle, Zap, Package, 
  CheckCircle2, Sparkles, Brain, 
  Activity, ChevronRight, Search, Bell, MoreHorizontal
} from 'lucide-react';
import { DebitSheet } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import ChatAssistant from './ChatAssistant';
import { format, subDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  sheets: DebitSheet[];
  onViewSheet?: (sheet: DebitSheet) => void;
}

// --- 🎨 MICRO-COMPOSANTS UI "OBSIDIAN" ---

const ObsidianCard = ({ 
  children, 
  className = "", 
  glowColor = "indigo",
  delay = 0
}: { 
  children: React.ReactNode, 
  className?: string, 
  glowColor?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue',
  delay?: number
}) => {
  const glows = {
    indigo: 'bg-indigo-500/10',
    emerald: 'bg-emerald-500/10',
    rose: 'bg-rose-500/10',
    amber: 'bg-amber-500/10',
    blue: 'bg-blue-500/10'
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-[#111318] border border-white/5 p-6 transition-all duration-500 hover:border-white/10 hover:shadow-2xl group animate-fadeIn ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${glows[glowColor]} blur-[80px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-80 opacity-40`} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

const NeonBadge = ({ text, color }: { text: string, color: 'blue' | 'green' | 'orange' | 'purple' }) => {
  const styles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
    purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[color]}`}>
      {text}
    </span>
  );
};

const StatValue = ({ value, unit, trend }: { value: string | number, unit?: string, trend?: string }) => (
  <div className="flex items-end gap-2 mt-3">
    <span className="text-4xl font-bold text-white tracking-tight leading-none">{value}</span>
    <div className="flex flex-col mb-0.5">
      {unit && <span className="text-xs font-medium text-gray-500">{unit}</span>}
      {trend && <span className="text-xs font-bold text-emerald-400">{trend}</span>}
    </div>
  </div>
);

// --- DASHBOARD INTELLIGENT ---

export default function Dashboard({ sheets = [], onViewSheet }: DashboardProps) {
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  // 🧠 CALCULS INTELLIGENTS (MÉMOISÉS)
  const analytics = useMemo(() => {
    const safeSheets = Array.isArray(sheets) ? sheets : [];
    const now = new Date();
    
    // 1. Données de base
    const active = safeSheets.filter(s => !s.fini && !s.livre);
    const finished = safeSheets.filter(s => s.fini);
    
    const totalM2 = active.reduce((acc, s) => acc + (s.m2 || 0), 0);
    const totalM3 = active.reduce((acc, s) => acc + (s.m3 || 0), 0);

    // 2. Détection d'urgences (Date parsing robuste)
    const urgencies = active.filter(s => {
      if (!s.delai) return false;
      try {
        // Parsing basique de la date si string, ou utilisation direct si Date
        const delaiDate = new Date(s.delai); 
        // Fallback simple si le parsing échoue ou si c'est du texte libre
        if (isNaN(delaiDate.getTime())) return s.delai.toLowerCase().includes('urgent');
        
        const diffTime = delaiDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 5; // Urgent si < 5 jours
      } catch {
        return false;
      }
    });

    // 3. Score de charge (0-100)
    // Basé sur le nombre de commandes actives vs "capacité théorique" (ex: 20)
    const loadScore = Math.min(100, Math.round((active.length / 20) * 100));
    
    // 4. Génération des données pour le Graphique (7 derniers jours)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(now, 6 - i);
      // Trouver les commandes créées ce jour-là
      const daySheets = safeSheets.filter(s => {
        if (!s.dateCreation) return false;
        return isSameDay(new Date(s.dateCreation), date);
      });
      
      return {
        name: format(date, 'EEE', { locale: fr }), // Lun, Mar...
        fullDate: format(date, 'd MMM', { locale: fr }),
        m2: daySheets.reduce((acc, s) => acc + (s.m2 || 0), 0),
        orders: daySheets.length
      };
    });

    // 5. Insight IA généré
    let insight = "Flux de production stable.";
    let insightType: 'neutral' | 'warning' | 'good' = 'neutral';
    
    if (urgencies.length > 3) {
      insight = `${urgencies.length} commandes arrivent à échéance cette semaine. Priorité requise.`;
      insightType = 'warning';
    } else if (loadScore > 85) {
      insight = "Surcharge atelier détectée (>85%). Risque de goulot d'étranglement.";
      insightType = 'warning';
    } else if (active.length > 0) {
      insight = "Production fluide. Charge atelier optimale pour de nouvelles entrées.";
      insightType = 'good';
    }

    return {
      activeCount: active.length,
      finishedCount: finished.length,
      totalM2,
      totalM3,
      urgentCount: urgencies.length,
      loadScore,
      chartData,
      insight,
      insightType,
      topUrgent: urgencies.slice(0, 3)
    };
  }, [sheets]);

  return (
    <div className="min-h-screen bg-[#090A0C] text-gray-300 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="mx-auto max-w-[1600px] space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="animate-slideRight">
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-4">
              <div className="h-10 w-1.5 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
              <span className="tracking-tight">StoneTrak <span className="text-gray-600 font-light">Pro</span></span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 ml-6 font-medium">
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-slideLeft">
            {/* Search Bar */}
            <div className="relative hidden lg:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher un dossier..." 
                className="bg-[#13161B] border border-white/5 rounded-full py-3 pl-11 pr-6 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-80 transition-all shadow-inner"
              />
            </div>
            
            {/* Notifications */}
            <button className="p-3 rounded-full bg-[#13161B] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all relative group">
              <Bell className="w-5 h-5 group-hover:animate-swing" />
              {analytics.urgentCount > 0 && (
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-rose-500 rounded-full ring-4 ring-[#13161B] animate-pulse"></span>
              )}
            </button>
            
            {/* AI Button */}
            <button className="flex items-center gap-2 bg-white text-[#090A0C] px-6 py-3 rounded-full text-sm font-bold hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Assistant IA</span>
            </button>
          </div>
        </div>

        {/* --- KPI GRID (Bento Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* KPI 1: Production Active */}
          <ObsidianCard glowColor="indigo" delay={100}>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <NeonBadge text="En cours" color="blue" />
            </div>
            <div className="mt-6">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dossiers Actifs</p>
                <StatValue value={analytics.activeCount} unit="commandes" />
            </div>
          </ObsidianCard>

          {/* KPI 2: Surface (M2) */}
          <ObsidianCard glowColor="emerald" delay={200}>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Package className="w-6 h-6" />
              </div>
              <NeonBadge text="+12% vs sem." color="green" />
            </div>
            <div className="mt-6">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Surface Totale</p>
                <StatValue value={analytics.totalM2.toFixed(0)} unit="m²" />
            </div>
          </ObsidianCard>

          {/* KPI 3: Urgences */}
          <ObsidianCard glowColor="rose" delay={300} className={analytics.urgentCount > 0 ? 'border-rose-500/20' : ''}>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              {analytics.urgentCount > 0 && <NeonBadge text="Prioritaire" color="orange" />}
            </div>
            <div className="mt-6">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Urgences</p>
                <StatValue value={analytics.urgentCount} unit="dossiers" />
            </div>
          </ObsidianCard>

          {/* KPI 4: Charge Atelier (AI) */}
          <ObsidianCard glowColor="amber" delay={400}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-400/80">
                <Brain className="w-3 h-3" />
                <span>AI Analysis</span>
              </div>
            </div>
            <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Charge Atelier</p>
                  <span className={`text-xl font-bold ${analytics.loadScore > 80 ? 'text-rose-400' : 'text-white'}`}>
                    {analytics.loadScore}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          analytics.loadScore > 80 ? 'bg-gradient-to-r from-rose-600 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                        }`}
                        style={{ width: `${analytics.loadScore}%` }}
                    />
                </div>
            </div>
          </ObsidianCard>

        </div>

        {/* --- CENTRAL DASHBOARD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CHART SECTION (Large) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Insight Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#161b22] to-[#0d1117] border border-white/5 p-1 shadow-lg animate-fadeIn" style={{ animationDelay: '500ms' }}>
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50"></div>
              <div className="bg-[#111318]/80 backdrop-blur-xl rounded-xl p-6 flex items-start gap-5">
                 <div className="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                   <Sparkles className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                   <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                     Analyse Quotidienne
                     {analytics.insightType === 'warning' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"/>}
                   </h3>
                   <p className="text-gray-400 text-sm leading-relaxed">
                     "{analytics.insight}"
                     {analytics.urgentCount > 0 && (
                       <span className="block mt-2 text-indigo-400 text-xs cursor-pointer hover:text-indigo-300 flex items-center gap-1">
                         Voir les recommandations <ArrowRight className="w-3 h-3" />
                       </span>
                     )}
                   </p>
                 </div>
              </div>
            </div>

            {/* Graphique de Vélocité */}
            <ObsidianCard className="min-h-[400px] flex flex-col" delay={600}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold text-white">Vélocité de Production</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Mètres carrés produits (7 derniers jours)</p>
                </div>
                {/* Chart Filters */}
                <div className="flex gap-2 bg-[#090A0C] p-1 rounded-lg border border-white/5">
                  {['7J', '30J', '1A'].map((period, i) => (
                    <button 
                      key={period}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        i === 0 ? 'bg-[#1A1D21] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorM2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 11, fontWeight: 600}} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 11}} 
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1A1D21', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{color: '#e2e8f0', fontSize: '12px', fontWeight: 600}}
                      cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '5 5'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="m2" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorM2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ObsidianCard>
          </div>

          {/* SIDEBAR (Queue de production) */}
          <div className="lg:col-span-1">
            <ObsidianCard className="h-full flex flex-col" delay={700}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <TrendingUp className="w-5 h-5 text-emerald-400" />
                   Flux de sortie
                </h3>
                <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-md">
                  Tout voir
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {sheets.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl bg-[#0C0E12]">
                    <Package className="w-8 h-8 mb-2 opacity-20" />
                    Aucune commande
                  </div>
                ) : (
                  sheets.filter(s => !s.fini).slice(0, 6).map((sheet, i) => {
                     const isTopUrgent = analytics.topUrgent.find(u => u.id === sheet.id);
                     return (
                      <div 
                        key={sheet.id} 
                        onClick={() => onViewSheet?.(sheet)}
                        className={`group relative overflow-hidden p-3 rounded-xl bg-[#15181E] border transition-all cursor-pointer
                          ${isTopUrgent 
                            ? 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10' 
                            : 'border-transparent hover:border-white/10 hover:bg-[#1C2026]'
                          }`}
                      >
                        {isTopUrgent && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-white/5 
                              ${i === 0 ? 'bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10' : 'bg-[#1A1D21] text-gray-600'}`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{sheet.numeroOS}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[100px]">{sheet.nomClient}</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className={`text-xs font-bold ${sheet.m2 > 50 ? 'text-indigo-300' : 'text-gray-400'}`}>
                              {sheet.m2 > 0 ? sheet.m2.toFixed(0) : sheet.m3.toFixed(1)}
                              <span className="text-[10px] ml-0.5 text-gray-600">{sheet.m2 > 0 ? 'm²' : 'm³'}</span>
                            </span>
                            {isTopUrgent && <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mt-1">Urgent</span>}
                          </div>
                        </div>
                        
                        {/* Hover Action */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <div className="bg-white text-black p-1.5 rounded-lg shadow-lg">
                             <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Importer une commande
              </button>
            </ObsidianCard>
          </div>

        </div>
      </div>

      {/* Chat Assistant (Hidden but present) */}
      <ChatAssistant
        sheets={sheets}
        onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
        isMinimized={isChatMinimized}
      />
      
      {/* Global Styles for Scrollbar & Animations */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0F1115; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideRight { animation: slideRight 0.5s ease-out forwards; }
        
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideLeft { animation: slideLeft 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}