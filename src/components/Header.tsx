import React from 'react';
import { FileText, BarChart3, Bone as Stone, LogOut, User, Grid3X3, Calendar, Shield, Menu, X, LayoutDashboard, Package } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../hooks/useUserProfile';

interface HeaderProps {
  activeTab: 'dashboard' | 'tracking' | 'reports' | 'slabs' | 'planning' | 'scaffolding' | 'admin';
  onTabChange: (tab: 'dashboard' | 'tracking' | 'reports' | 'slabs' | 'planning' | 'scaffolding' | 'admin') => void;
  profile: UserProfile | null;
  profileLoading: boolean;
  isAdmin: boolean;
}

export default function Header({ activeTab, onTabChange, profile, profileLoading, isAdmin }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Visibilité des onglets selon le rôle
  const showDashboard = profile?.role === 'admin' || profile?.role === 'bureau';
  const showTracking = true; // Tous les rôles
  const showReports = profile?.role === 'admin' || profile?.role === 'bureau';
  const showSlabs = true; // Tous les rôles
  const showPlanning = true; // Tous les rôles
  const showScaffolding = profile?.role === 'admin' || profile?.role === 'bureau';
  const showAdminTab = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
  };

  const handleTabChange = (tab: 'dashboard' | 'tracking' | 'reports' | 'slabs' | 'planning' | 'scaffolding' | 'admin') => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4 mr-16 flex-shrink-0 min-w-fit">
            <img
              src="/Sans_titre265-removebg-preview.png"
              alt="DBPM Logo"
              className="h-10 w-10 object-contain bg-white rounded p-1"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold leading-tight whitespace-nowrap">StoneTrak Pro</h1>
              <span className="text-xs text-gray-400 whitespace-nowrap">for DBPM</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation de bureau - masquée sur mobile/tablette */}
            <nav className="hidden md:flex space-x-2">
              {showDashboard && (
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
              )}

              {showTracking && (
                <button
                  onClick={() => handleTabChange('tracking')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'tracking'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Tableau de Suivi</span>
                </button>
              )}

              {showReports && (
                <button
                  onClick={() => handleTabChange('reports')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'reports'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Rapports</span>
                </button>
              )}

              {showSlabs && (
                <button
                  onClick={() => handleTabChange('slabs')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'slabs'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Stock Matière</span>
                </button>
              )}

              {showPlanning && (
                <button
                  onClick={() => handleTabChange('planning')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'planning'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Planning</span>
                </button>
              )}

              {showScaffolding && (
                <button
                  onClick={() => handleTabChange('scaffolding')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'scaffolding'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span className="flex flex-col items-start">
                    <span className="leading-tight">Échafaudage</span>
                    <span className="text-[10px] text-yellow-400 font-semibold leading-none">BETA</span>
                  </span>
                </button>
              )}

              {showAdminTab && (
                <button
                  onClick={() => handleTabChange('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'admin'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              )}
            </nav>

            {/* Informations utilisateur - adaptées pour mobile */}
            {user && (
              <div className="hidden sm:flex items-center space-x-3 border-l border-slate-700 pl-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{user.email}</span>
                  </div>
                  <span className="hidden lg:block text-xs text-gray-400 break-all">ID: {user.id}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all duration-200"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Bouton hamburger - visible sur mobile/tablette uniquement */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all duration-200"
              aria-label="Menu de navigation"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile - overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Fond sombre */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Menu coulissant */}
          <div className="fixed top-0 right-0 h-full w-80 bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* En-tête du menu mobile */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <Stone className="h-6 w-6 text-blue-400" />
                  <span className="text-lg font-bold">StoneTrak Pro</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation mobile */}
              <nav className="flex flex-col p-4 space-y-2 flex-1">
                {showDashboard && (
                  <button
                    onClick={() => handleTabChange('dashboard')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'dashboard'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </button>
                )}

                {showTracking && (
                  <button
                    onClick={() => handleTabChange('tracking')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'tracking'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Tableau de Suivi</span>
                  </button>
                )}

                {showReports && (
                  <button
                    onClick={() => handleTabChange('reports')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'reports'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Rapports</span>
                  </button>
                )}

                {showSlabs && (
                  <button
                    onClick={() => handleTabChange('slabs')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'slabs'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Grid3X3 className="h-5 w-5" />
                    <span>Stock Matière</span>
                  </button>
                )}

                {showPlanning && (
                  <button
                    onClick={() => handleTabChange('planning')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'planning'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Planning</span>
                  </button>
                )}

                {showScaffolding && (
                  <button
                    onClick={() => handleTabChange('scaffolding')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'scaffolding'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    <span className="flex flex-col items-start">
                      <span className="leading-tight">Échafaudage</span>
                      <span className="text-[10px] text-yellow-400 font-semibold leading-none">BETA</span>
                    </span>
                  </button>
                )}

                {showAdminTab && (
                  <button
                    onClick={() => handleTabChange('admin')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'admin'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Administration</span>
                  </button>
                )}
              </nav>

              {/* Informations utilisateur dans le menu mobile */}
              {user && (
                <div className="border-t border-slate-700 p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500">Connecté</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}