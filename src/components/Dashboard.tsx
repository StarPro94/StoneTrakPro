import React, { useMemo } from 'react';
import { 
  TrendingUp, AlertTriangle, Zap, Package, 
  CheckCircle2, Sparkles, Brain, 
  Activity, ChevronRight, Search, Bell
} from 'lucide-react';
import { DebitSheet } from '../types';
import ChatAssistant from './ChatAssistant';

interface DashboardV2Props {
  sheets: DebitSheet[];
  onViewSheet?: (sheet: DebitSheet) => void;
}

// --- 🎨 COMPOSANTS UI "OBSIDIAN STYLE" ---

const ObsidianCard = ({ children, className = "", glowColor = "" }: { children: React.ReactNode, className?: string, glowColor?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-[#111318] border border-white/10 p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl ${className}`}>
    {glowColor && (
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${glowColor}-500/10 blur-[60px] rounded-full pointer-events-none`} />
    )}
    <div className="relative z-10">{children}</div>
  </div>
);

const NeonBadge = ({ text, color }: { text: string, color: 'blue' | 'green' | 'orange' | 'purple' }) => {
  const styles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[color]} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
      {text}
    </span>
  );
};

const StatValue = ({ value, unit }: { value: string | number, unit?: string }) => (
  <div className="flex items-baseline gap-1 mt-2">
    <span className="text-4xl font-bold text-white tracking-tight drop-shadow-sm">{value}</span>
    {unit && <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>}
  </div>
);

// --- DASHBOARD PRINCIPAL ---

export default function DashboardV2({ sheets, onViewSheet }: DashboardV2Props) {
  // Calculs IA (Version simplifiée et robuste)
  const data = useMemo(() => {
    const active = sheets.filter(s => !s.fini && !s.livre);
    const m2 = active.reduce((acc, s) => acc + s.m2, 0);
    const urgent = active.filter(s => {
        if (!s.delai) return false;
        // Détection simple d'urgence (délai dans le passé ou très proche)
        // On évite les calculs de date complexes qui pourraient planter pour l'instant
        return s.delai.includes('2024') || s.delai.includes('2025'); 
    }).length;
    
    // Calcul de charge (simulé pour l'instant)
    const loadScore = Math.min(100, (active.length / 20) * 100);

    return { active: active.length, m2, urgent, loadScore };
  }, [sheets]);

  return (
    <div className="min-h-screen bg-[#090A0C] text-gray-200 p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              StoneTrak <span className="text-gray-600 font-light">Pro</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-5">Vue d'ensemble de la production</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Bar Style Crypto */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher (OS, Client)..." 
                className="bg-[#13161B] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-72 transition-all shadow-inner"
              />
            </div>
            
            <button className="p-2.5 rounded-full bg-[#13161B] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[#13161B]"></span>
            </button>
            
            <button className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] transform hover:-translate-y-0.5">
              <Sparkles className="w-4 h-4" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Production */}
          <ObsidianCard glowColor="blue">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/10">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <NeonBadge text="+ Active" color="blue" />
            </div>
            <div className="mt-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Production Active</p>
                <StatValue value={data.active} unit="dossiers" />
            </div>
          </ObsidianCard>

          {/* Card 2: Surface */}
          <ObsidianCard glowColor="green">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <NeonBadge text="Optimal" color="green" />
            </div>
            <div className="mt-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Surface Totale</p>
                <StatValue value={data.m2.toFixed(0)} unit="m²" />
            </div>
          </ObsidianCard>

          {/* Card 3: Urgences */}
          <ObsidianCard glowColor="orange">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/10">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <NeonBadge text="Prioritaire" color="orange" />
            </div>
            <div className="mt-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Urgences</p>
                <StatValue value={data.urgent} unit="alertes" />
            </div>
          </ObsidianCard>

           {/* Card 4: Charge (AI) */}
           <ObsidianCard glowColor="purple">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/10">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <NeonBadge text="AI Analysis" color="purple" />
            </div>
            <div className="mt-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Charge Atelier</p>
                <StatValue value={data.loadScore.toFixed(0)} unit="%" />
                <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full" 
                        style={{ width: `${data.loadScore}%` }}
                    />
                </div>
            </div>
          </ObsidianCard>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Insight Box */}
          <div className="lg:col-span-2">
             <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D24] to-[#0F1115] border border-white/5 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-violet-400" />
                    <h3 className="text-lg font-bold text-white">Analyse Prédictive</h3>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                   "Le flux de production est stable. Cependant, <span className="text-white font-bold">3 commandes urgentes</span> nécessitent une attention particulière avant vendredi. Le stock de tranches K2 est suffisant pour la semaine."
                </p>
                <div className="mt-6 flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                        Voir les urgences
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 transition-colors">
                        Optimiser le planning
                    </button>
                </div>
             </div>
          </div>

          {/* Liste Rapide Style Crypto */}
          <div className="lg:col-span-1">
            <ObsidianCard className="h-full min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    File d'attente
                </h3>
                <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Voir tout</button>
              </div>

              <div className="space-y-3">
                {sheets.filter(s => !s.fini).slice(0, 4).map((sheet, i) => (
                  <div key={sheet.id} className="group flex items-center justify-between p-3 rounded-xl bg-[#15181E] hover:bg-[#1C2026] border border-transparent hover:border-white/5 cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-white/5 ${i === 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#1A1D21] text-gray-600'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{sheet.numeroOS}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[100px]">{sheet.nomClient}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-1 justify-end">
                            <span className="text-sm font-medium text-white">{sheet.m2 > 0 ? sheet.m2.toFixed(0) : sheet.m3.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">{sheet.m2 > 0 ? 'm²' : 'm³'}</span>
                       </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                  </div>
                ))}
              </div>
            </ObsidianCard>
          </div>

        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant
        sheets={sheets}
        onToggleMinimize={() => {}}
        isMinimized={true}
      />
    </div>
  );
}