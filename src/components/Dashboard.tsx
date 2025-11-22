import React, { useMemo } from 'react';
import { 
  TrendingUp, AlertTriangle, Zap, Package, 
  CheckCircle2, Sparkles, Brain, 
  Activity, ChevronRight, Search, Bell, Settings
} from 'lucide-react';
import { DebitSheet } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChatAssistant from './ChatAssistant';

interface DashboardProps {
  sheets: DebitSheet[];
  onViewSheet?: (sheet: DebitSheet) => void;
}

// --- 🎨 COMPOSANTS UI "OBSIDIAN STYLE" ---

const ObsidianCard = ({ children, className = "", glowColor = "" }: { children: React.ReactNode, className?: string, glowColor?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-[#1A1D21] border border-white/5 p-6 transition-all duration-300 hover:border-white/10 ${className}`}>
    {glowColor && (
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${glowColor}-500/20 blur-[50px] rounded-full pointer-events-none`} />
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[color]}`}>
      {text}
    </span>
  );
};

const StatValue = ({ value, unit }: { value: string | number, unit?: string }) => (
  <div className="flex items-baseline gap-1">
    <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
    {unit && <span className="text-sm font-medium text-gray-400">{unit}</span>}
  </div>
);

// --- DASHBOARD PRINCIPAL ---

export default function Dashboard({ sheets, onViewSheet }: DashboardProps) {
  // Calculs d'intelligence (identiques à avant, mais simplifiés pour l'affichage)
  const data = useMemo(() => {
    const active = sheets.filter(s => !s.fini && !s.livre);
    const m2 = active.reduce((acc, s) => acc + s.m2, 0);
    const m3 = active.reduce((acc, s) => acc + s.m3, 0);
    const urgent = active.filter(s => {
        if (!s.delai) return false;
        // Simulation simple pour démo
        return s.delai.includes('2025'); 
    }).length;
    
    // Données simulées pour le graphique (à remplacer par vraies données plus tard)
    const chartData = [
      { name: 'Lun', m2: 120 }, { name: 'Mar', m2: 132 },
      { name: 'Mer', m2: 101 }, { name: 'Jeu', m2: 134 },
      { name: 'Ven', m2: 190 }, { name: 'Sam', m2: 230 },
      { name: 'Dim', m2: 210 },
    ];

    return { active: active.length, m2, m3, urgent, chartData };
  }, [sheets]);

  return (
    <div className="min-h-screen bg-[#0F1115] text-gray-200 p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-violet-600 rounded-full mr-2"></div>
              StoneTrak <span className="text-gray-500 font-light">Dashboard</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Bar Style Crypto */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-[#1A1D21] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-64 transition-all"
              />
            </div>
            
            <button className="p-2 rounded-full bg-[#1A1D21] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            
            <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Sparkles className="w-4 h-4" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Production */}
          <ObsidianCard glowColor="blue">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <NeonBadge text="+12.5%" color="blue" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Production Active</p>
            <StatValue value={data.active} unit="commandes" />
            <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[70%]" />
            </div>
          </ObsidianCard>

          {/* Card 2: Surface */}
          <ObsidianCard glowColor="green">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <NeonBadge text="Optimal" color="green" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Surface Totale</p>
            <StatValue value={data.m2.toFixed(0)} unit="m²" />
             <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[45%]" />
            </div>
          </ObsidianCard>

          {/* Card 3: Urgences */}
          <ObsidianCard glowColor="orange">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <NeonBadge text="Action requise" color="orange" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Urgences</p>
            <StatValue value={data.urgent} unit="dossiers" />
             <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 w-[20%]" />
            </div>
          </ObsidianCard>

          {/* Card 4: AI Insight */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 to-[#1A1D21] border border-violet-500/30 p-6 shadow-lg group cursor-pointer">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center gap-2 text-violet-200 mb-2">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-bold">StoneTrak AI</span>
              </div>
              <div>
                <p className="text-white text-lg font-medium leading-snug mb-3">
                  "La charge machine est élevée. Suggérez de décaler la commande 2025FO148."
                </p>
                <div className="flex items-center text-xs text-violet-300 font-medium group-hover:text-white transition-colors">
                  Voir l'analyse complète <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Chart (Graphique de prod style crypto) */}
          <div className="lg:col-span-2">
            <ObsidianCard className="h-full min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Vélocité de Production</h3>
                  <p className="text-sm text-gray-500">Surface traitée sur les 7 derniers jours</p>
                </div>
                <select className="bg-[#0F1115] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1 outline-none">
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                </select>
              </div>
              
              <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData}>
                    <defs>
                      <linearGradient id="colorM2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 12}} 
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1A1D21', border: '1px solid #333', borderRadius: '8px'}}
                      itemStyle={{color: '#fff'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="m2" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorM2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ObsidianCard>
          </div>

          {/* Right: Liste Rapide (Style Crypto Assets) */}
          <div className="lg:col-span-1">
            <ObsidianCard className="h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">File d'attente</h3>
                <button className="text-xs text-blue-400 hover:text-blue-300">Voir tout</button>
              </div>

              <div className="space-y-4">
                {sheets.filter(s => !s.fini).slice(0, 5).map((sheet, i) => (
                  <div key={sheet.id} className="group flex items-center justify-between p-3 rounded-xl bg-[#0F1115] hover:bg-[#23262b] transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-[#1A1D21] text-gray-500'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{sheet.numeroOS}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{sheet.nomClient}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-300">{sheet.m2 > 0 ? sheet.m2.toFixed(2) : sheet.m3.toFixed(3)} <span className="text-xs text-gray-600">{sheet.m2 > 0 ? 'm²' : 'm³'}</span></p>
                      {i === 0 && <span className="text-[10px] text-orange-500 font-medium">Urgent</span>}
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Importer une commande
              </button>
            </ObsidianCard>
          </div>

        </div>
      </div>

      {/* Chat Assistant en mode sombre */}
      <ChatAssistant
        sheets={sheets}
        onToggleMinimize={() => {}}
        isMinimized={true}
      />
    </div>
  );
}