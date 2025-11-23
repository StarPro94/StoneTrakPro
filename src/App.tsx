import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TrackingTable from './components/TrackingTable';
import DebitSheetView from './components/DebitSheetView';
import Reports from './components/Reports';
import SlabPark from './components/SlabPark';
import Planning from './components/Planning';
import AdminPanel from './components/AdminPanel';
import ScaffoldingModule from './components/ScaffoldingModule';
import QuotingModule from './components/QuotingModule';
import AuthForm from './components/AuthForm';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmationModal from './components/ConfirmationModal';
import ToastContainer from './components/ToastContainer';
import { ToastProvider } from './contexts/ToastContext';
import { DebitSheet } from './types';
import { useAuth } from './hooks/useAuth';
import { useDebitSheets } from './hooks/useDebitSheets';
import { useUserProfile } from './hooks/useUserProfile';

function App() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    isInitialLoad,
    isAdmin,
    isBureau,
    isAtelier,
    isStockMatiere,
    canAccessDashboard,
    canAccessReports,
    canAccessScaffolding,
    canAccessAdmin,
    canManageUsers,
    canImportSheets,
    canEditSheets,
    canDeleteSheets,
    canManageSlabs,
    canEditSlabs,
    canAddSlabs,
    canManageMachines,
    canEditPlanning,
    canEditOwnMachinePlanning,
    canAccessQuotes
  } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking' | 'reports' | 'slabs' | 'planning' | 'quotes' | 'scaffolding' | 'admin'>('dashboard');
  const [selectedSheet, setSelectedSheet] = useState<DebitSheet | null>(null);
  const [authRefreshKey, setAuthRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);

  // Déterminer le premier onglet accessible pour l'utilisateur
  const getFirstAccessibleTab = (): 'dashboard' | 'tracking' | 'reports' | 'slabs' | 'planning' | 'quotes' | 'scaffolding' | 'admin' => {
    if (canAccessDashboard) return 'dashboard';
    // Tracking est accessible à tous
    if (true) return 'tracking';
    if (canAccessReports) return 'reports';
    // Planning est accessible à tous
    if (true) return 'planning';
    // Slabs est accessible à tous
    if (true) return 'slabs';
    if (canAccessQuotes) return 'quotes';
    if (canAccessScaffolding) return 'scaffolding';
    if (canAccessAdmin) return 'admin';
    return 'tracking'; // Fallback par défaut
  };

  // Rediriger automatiquement vers le premier onglet accessible au chargement
  useEffect(() => {
    if (!profileLoading && profile) {
      const firstAccessibleTab = getFirstAccessibleTab();
      if (activeTab === 'dashboard' && !canAccessDashboard) {
        console.log(`🔄 Redirection automatique: dashboard → ${firstAccessibleTab}`);
        setActiveTab(firstAccessibleTab);
      }
    }
  }, [profileLoading, profile, canAccessDashboard, activeTab]);

  const {
    sheets,
    loading: sheetsLoading,
    error: sheetsError,
    updateSheet,
    addSheet,
    deleteSheet,
    importExcel,
    importPdf
  } = useDebitSheets();

  const handleAuthSuccess = () => {
    setAuthRefreshKey(prev => prev + 1);
  };

  const handleViewSheet = (sheet: DebitSheet) => {
    setSelectedSheet(sheet);
  };

  const handleBackToTable = () => {
    setSelectedSheet(null);
  };

  const handleTabChange = (tab: 'dashboard' | 'tracking' | 'reports' | 'slabs' | 'planning' | 'quotes' | 'scaffolding' | 'admin') => {
    setActiveTab(tab);
    setSelectedSheet(null);
  };

  const handleImportExcel = async (file: File) => {
    try {
      await importExcel(file);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    }
  };

  const handleImportPdf = async (file: File, useClaudeVision: boolean = true) => {
    try {
      return await importPdf(file, useClaudeVision);
    } catch (error) {
      console.error('Erreur lors de l\'import PDF:', error);
      throw error;
    }
  };
  const handleDeleteSheet = async (sheetId: string) => {
    setSheetToDelete(sheetId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSheet = async () => {
    if (sheetToDelete) {
      await deleteSheet(sheetToDelete);
      setShowDeleteConfirm(false);
      setSheetToDelete(null);
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setSheetToDelete(null);
  };

  // Affichage du loader uniquement pendant le chargement initial
  if (authLoading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Vérification de l\'authentification...' : 'Chargement du profil utilisateur...'}
          </p>
        </div>
      </div>
    );
  }

  // Affichage du formulaire d'authentification si non connecté
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // Affichage de la vue détaillée d'une feuille
  if (selectedSheet) {
    return (
      <>
        {sheetsLoading && <LoadingSpinner />}
        <div className="min-h-screen bg-gray-50">
          <Header
            activeTab={activeTab}
            onTabChange={handleTabChange}
            profile={profile}
            profileLoading={profileLoading}
            isAdmin={isAdmin}
          />
          <DebitSheetView
            sheet={selectedSheet}
            profileLoading={profileLoading}
            profile={profile}
            isAdmin={isAdmin}
            isBureau={isBureau}
            isAtelier={isAtelier}
            isStockMatiere={isStockMatiere}
            onUpdateSheet={updateSheet}
            onBack={handleBackToTable}
          />
        </div>
      </>
    );
  }

  // Affichage principal de l'application
  return (
    <ToastProvider>
      {sheetsLoading && <LoadingSpinner />}
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          profile={profile}
          profileLoading={profileLoading}
          isAdmin={isAdmin}
        />

        {activeTab === 'dashboard' && canAccessDashboard ? (
          <Dashboard
            sheets={sheets}
            onViewSheet={handleViewSheet}
          />
        ) : activeTab === 'dashboard' && !canAccessDashboard ? (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Accès Refusé</h2>
                <p className="text-red-600">Vous n'avez pas accès au Dashboard.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'tracking' ? (
          <TrackingTable
            sheets={sheets}
            loading={sheetsLoading}
            error={sheetsError}
            profileLoading={profileLoading}
            profile={profile}
            canImportSheets={canImportSheets}
            canEditSheets={canEditSheets}
            isAdmin={isAdmin}
            isBureau={isBureau}
            isAtelier={isAtelier}
            isStockMatiere={isStockMatiere}
            onUpdateSheet={updateSheet}
            onAddSheet={addSheet}
            onViewSheet={handleViewSheet}
            onDeleteSheet={handleDeleteSheet}
            onImportExcel={handleImportExcel}
            onImportPdf={handleImportPdf}
          />
        ) : activeTab === 'reports' && canAccessReports ? (
          <Reports
            sheets={sheets}
            profileLoading={profileLoading}
            profile={profile}
            isAdmin={isAdmin}
            isBureau={isBureau}
            isAtelier={isAtelier}
            isStockMatiere={isStockMatiere}
          />
        ) : activeTab === 'reports' && !canAccessReports ? (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Accès Refusé</h2>
                <p className="text-red-600">Vous n'avez pas accès aux Rapports.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'planning' ? (
          <Planning 
            sheets={sheets}
            profileLoading={profileLoading}
            profile={profile}
            canManageMachines={canManageMachines}
            canEditPlanning={canEditPlanning}
            canEditOwnMachinePlanning={canEditOwnMachinePlanning}
            isAdmin={isAdmin}
            isBureau={isBureau}
            isAtelier={isAtelier}
            onViewSheet={handleViewSheet}
            onUpdateSheet={updateSheet}
          />
        ) : activeTab === 'quotes' && canAccessQuotes ? (
          <QuotingModule
            profileLoading={profileLoading}
            profile={profile}
            isAdmin={isAdmin}
            isBureau={isBureau}
          />
        ) : activeTab === 'quotes' && !canAccessQuotes ? (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Accès Refusé</h2>
                <p className="text-red-600">Vous n'avez pas accès au module Devis.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'scaffolding' && canAccessScaffolding ? (
          <ScaffoldingModule
            profileLoading={profileLoading}
            profile={profile}
          />
        ) : activeTab === 'scaffolding' && !canAccessScaffolding ? (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Accès Refusé</h2>
                <p className="text-red-600">Vous n'avez pas accès au module Échafaudage.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'admin' && canAccessAdmin ? (
          <AdminPanel
            profileLoading={profileLoading}
            profile={profile}
            canManageUsers={canManageUsers}
          />
        ) : (
          <SlabPark
            profileLoading={profileLoading}
            profile={profile}
            canManageSlabs={canManageSlabs}
            canEditSlabs={canEditSlabs}
            canAddSlabs={canAddSlabs}
            isAtelier={isAtelier}
          />
        )}

        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={closeDeleteConfirm}
          onConfirm={confirmDeleteSheet}
          title="Supprimer la feuille de débit"
          message="Êtes-vous sûr de vouloir supprimer cette feuille de débit ?\n\nCette action est irréversible et supprimera également tous les éléments associés."
          confirmButtonText="Supprimer"
          cancelButtonText="Annuler"
          type="danger"
        />
      </div>
    </ToastProvider>
  );
}

export default App;