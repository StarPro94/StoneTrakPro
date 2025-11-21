import React, { useState, useRef } from 'react';
import { Upload, Plus, Eye, Edit2, Save, X, CheckCircle2, Truck, FileText, Trash2, Search, Download, Clock, AlertTriangle, Package, TrendingUp, Brain } from 'lucide-react';
import { DebitSheet } from '../types';
import DebitSheetCard from './DebitSheetCard';
import ConfirmationModal from './ConfirmationModal';
import PdfImportModal from './PdfImportModal';
import { UserProfile } from '../hooks/useUserProfile';
import { useToast } from '../contexts/ToastContext';
import { calculateSheetTotals } from '../utils/materialUtils';

interface TrackingTableProps {
  sheets: DebitSheet[];
  loading: boolean;
  error: string | null;
  profileLoading: boolean;
  profile: UserProfile | null;
  canImportSheets: boolean;
  canEditSheets: boolean;
  isAdmin: boolean;
  isBureau: boolean;
  isAtelier: boolean;
  isStockMatiere: boolean;
  onUpdateSheet: (sheet: DebitSheet) => void;
  onAddSheet: (sheet: Omit<DebitSheet, 'id'>) => void;
  onViewSheet: (sheet: DebitSheet) => void;
  onImportExcel: (file: File) => void;
  onImportPdf: (file: File, useClaudeVision?: boolean) => Promise<any>;
  onDeleteSheet: (sheetId: string) => void;
}

export default function TrackingTable({
  sheets,
  loading,
  error,
  profileLoading,
  profile,
  canImportSheets,
  canEditSheets,
  isAdmin,
  isBureau,
  isAtelier,
  isStockMatiere,
  onUpdateSheet,
  onAddSheet,
  onViewSheet,
  onImportExcel,
  onImportPdf,
  onDeleteSheet
}: TrackingTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DebitSheet>>({});

  // Fonction helper pour calculer M2/M3 depuis les items (source de vérité)
  const getSheetTotals = (sheet: DebitSheet): { m2: number; m3: number } => {
    const items = sheet.items || [];
    if (items.length === 0) {
      return { m2: sheet.m2 || 0, m3: sheet.m3 || 0 };
    }
    const totals = calculateSheetTotals(items);
    return { m2: totals.totalM2, m3: totals.totalM3 };
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmType, setConfirmType] = useState<'danger' | 'warning' | 'info'>('warning');
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);

  const { addToast } = useToast();

  // Calculer les totaux restants pour les commandes non terminées
  const remainingTotals = React.useMemo(() => {
    const nonFinishedSheets = sheets.filter(sheet => !sheet.fini);
    const totalM2 = nonFinishedSheets.reduce((sum, sheet) => {
      const totals = getSheetTotals(sheet);
      return sum + totals.m2;
    }, 0);
    const totalM3 = nonFinishedSheets.reduce((sum, sheet) => {
      const totals = getSheetTotals(sheet);
      return sum + totals.m3;
    }, 0);
    const count = nonFinishedSheets.length;

    return {
      totalM2: Math.round(totalM2 * 100) / 100,
      totalM3: Math.round(totalM3 * 1000) / 1000,
      count
    };
  }, [sheets]);

  // Filtrer les feuilles selon le terme de recherche
  const filteredSheets = sheets.filter(sheet => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sheet.numeroOS.toLowerCase().includes(searchLower) ||
      sheet.nomClient.toLowerCase().includes(searchLower) ||
      sheet.cial.toLowerCase().includes(searchLower) ||
      sheet.fourniture.toLowerCase().includes(searchLower) ||
      sheet.epaisseur.toLowerCase().includes(searchLower) ||
      sheet.numeroARC.toLowerCase().includes(searchLower) ||
      sheet.delai.toLowerCase().includes(searchLower)
    );
  });

  // Fonction d'export CSV
  const handleExportCSV = () => {
    const headers = [
      'Commercial', 'N°OS', 'Client', 'Fourniture', 'Épaisseur', 
      'N°ARC', 'Date Arc', 'Délai', 'M²', 'M³', 'Fini', 'Livré', 'Date Création'
    ];
    
    const csvData = filteredSheets.map(sheet => {
      const totals = getSheetTotals(sheet);
      return [
        sheet.cial,
        sheet.numeroOS,
        sheet.nomClient,
        sheet.fourniture,
        sheet.epaisseur,
        sheet.numeroARC,
        sheet.dateArc,
        sheet.delai,
        totals.m2.toFixed(2),
        totals.m3.toFixed(2),
        sheet.fini ? 'Oui' : 'Non',
        sheet.livre ? 'Oui' : 'Non',
        sheet.dateCreation.toLocaleDateString('fr-FR')
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feuilles_debit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (sheet: DebitSheet) => {
    setEditingId(sheet.id);
    setEditData({
      ...sheet,
      dateArc: sheet.dateArc.toISOString().split('T')[0],
      dateFinition: sheet.dateFinition ? sheet.dateFinition.toISOString().split('T')[0] : undefined,
      dateLivraison: sheet.dateLivraison ? sheet.dateLivraison.toISOString().split('T')[0] : undefined
    });
  };

  const handleSave = () => {
    if (editingId && editData) {
      // Validate and convert date strings back to Date objects
      const dateArc = new Date(editData.dateArc as string);
      if (isNaN(dateArc.getTime())) {
        alert('Date ARC invalide');
        return;
      }

      const updatedSheet: DebitSheet = {
        ...sheets.find(s => s.id === editingId)!,
        ...editData,
        dateArc,
        dateFinition: editData.dateFinition ? new Date(editData.dateFinition as string) : undefined,
        dateLivraison: editData.dateLivraison ? new Date(editData.dateLivraison as string) : undefined
      };

      onUpdateSheet(updatedSheet);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAddNew = () => {
    if (editData) {
      // Validate dateArc
      const dateArc = new Date(editData.dateArc as string);
      if (isNaN(dateArc.getTime())) {
        alert('Date ARC invalide');
        return;
      }

      const newSheet: Omit<DebitSheet, 'id'> = {
        cial: editData.cial || '',
        numeroOS: editData.numeroOS || '',
        nomClient: editData.nomClient || '',
        fourniture: editData.fourniture || '',
        epaisseur: editData.epaisseur || '',
        numeroARC: editData.numeroARC || '',
        dateArc,
        delai: editData.delai || '',
        m2: editData.m2 || 0,
        m3: editData.m3 || 0,
        fini: false,
        livre: false,
        dateCreation: new Date(),
        items: []
      };
      onAddSheet(newSheet);
      setShowAddForm(false);
      setEditData({});
    }
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.endsWith('.xlsx') || 
                 file.name.endsWith('.xls'))) {
      onImportExcel(file);
      // Reset file input
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    } else {
      alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
    }
  };

  const handleViewSheetById = async (sheetId: string) => {
    // Attendre que la liste soit mise à jour après l'import
    // Le hook useDebitSheets attend déjà 1000ms puis fait fetchSheets()
    // On attend donc 1500ms au total pour être sûr que la feuille est disponible
    await new Promise(resolve => setTimeout(resolve, 1500));

    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet) {
      onViewSheet(sheet);
    } else {
      console.error('Feuille non trouvée avec ID:', sheetId, 'dans', sheets.length, 'feuilles');
      addToast({
        type: 'error',
        message: 'Impossible de charger la feuille. Veuillez fermer la modale et cliquer sur "Voir" dans le tableau.'
      });
    }
  };

  const handlePdfImport = async (file: File, useClaudeVision: boolean) => {
    console.log('📄 Début import PDF:', file.name, '|', (file.size / 1024).toFixed(2), 'KB', '| Méthode:', useClaudeVision ? 'Claude Vision AI' : 'Regex classique');

    try {
      const result = await onImportPdf(file, useClaudeVision);

      if (result && result.success) {
        console.log('✅ Import PDF réussi:', result);

        addToast({
          type: 'success',
          title: 'Import PDF réussi !',
          message: `Feuille de débit créée avec ${result.items_count} élément(s)${useClaudeVision && result.confidence ? ` - Confiance: ${(result.confidence * 100).toFixed(0)}%` : ''}`,
          duration: 5000
        });

        if (result.warnings && result.warnings.length > 0) {
          console.warn('⚠️ Warnings:', result.warnings);
          addToast({
            type: 'warning',
            title: 'Avertissements détectés',
            message: result.warnings.join(' • '),
            duration: 8000
          });
        }
      }

      return result;
    } catch (error: any) {
      console.error('❌ Erreur import PDF:', error);
      addToast({
        type: 'error',
        title: 'Erreur d\'import PDF',
        message: error.message || 'Impossible d\'importer le fichier PDF',
        duration: 8000
      });
      throw error;
    }
  };


  const handleToggleFini = async (sheet: DebitSheet) => {
    const newFiniStatus = !sheet.fini;

    // Vérifier si tous les éléments sont terminés
    const items = sheet.items || [];
    const allItemsCompleted = items.length === 0 || items.every(item => item.termine);

    // Si on marque comme fini ET que tous les éléments ne sont pas terminés, demander confirmation
    if (newFiniStatus && !allItemsCompleted) {
      setConfirmTitle('Confirmer la finalisation de la commande');
      const unfinishedCount = items.filter(item => !item.termine).length;
      setConfirmMessage(`⚠️ ATTENTION : Cette commande contient encore des éléments non terminés !\n\n${unfinishedCount} élément(s) sur ${items.length} ne sont pas encore cochés.\n\nEn marquant cette commande comme terminée :\n• Toutes les tranches assignées seront supprimées du stock\n• La commande apparaîtra dans les rapports de production\n\nÊtes-vous sûr de vouloir continuer ?\n\nCommande : ${sheet.numeroOS} - ${sheet.nomClient}`);
      setConfirmType('warning');
      setConfirmAction(() => async () => {
        const updatedSheet: DebitSheet = {
          ...sheet,
          fini: newFiniStatus,
          dateFinition: newFiniStatus ? new Date() : undefined
        };
        await onUpdateSheet(updatedSheet);
      });
      setShowConfirmModal(true);
      return;
    }
    
    // Si on marque comme fini ET que tous les éléments sont terminés, avertir de la suppression des tranches
    if (newFiniStatus && allItemsCompleted) {
      setConfirmTitle('Marquer comme terminée');
      setConfirmMessage(`Êtes-vous sûr de vouloir marquer cette commande comme terminée ?\n\n✅ Tous les éléments sont cochés\n⚠️ ATTENTION : Toutes les tranches assignées à cette commande seront automatiquement supprimées du stock car elles ont été utilisées pour la production.\n\nCommande : ${sheet.numeroOS} - ${sheet.nomClient}`);
      setConfirmType('warning');
      setConfirmAction(() => async () => {
        const updatedSheet: DebitSheet = {
          ...sheet,
          fini: newFiniStatus,
          dateFinition: newFiniStatus ? new Date() : undefined
        };
        await onUpdateSheet(updatedSheet);
      });
      setShowConfirmModal(true);
      return;
    }

    // Si on remet en cours, pas besoin de confirmation
    const updatedSheet: DebitSheet = {
      ...sheet,
      fini: newFiniStatus,
      dateFinition: newFiniStatus ? new Date() : undefined
    };
    await onUpdateSheet(updatedSheet);
  };

  const handleToggleLivre = async (sheet: DebitSheet) => {
    const newLivreStatus = !sheet.livre;

    if (newLivreStatus && !sheet.fini) {
      setConfirmTitle('Marquer comme livré');
      setConfirmMessage(`Cette commande n'est pas encore marquée comme terminée.\n\nEn marquant cette commande comme livrée, elle sera automatiquement marquée comme terminée également.\n\nCommande : ${sheet.numeroOS} - ${sheet.nomClient}\n\nVoulez-vous continuer ?`);
      setConfirmType('warning');
      setConfirmAction(() => async () => {
        const updatedSheet: DebitSheet = {
          ...sheet,
          fini: true,
          livre: true,
          dateFinition: new Date(),
          dateLivraison: new Date()
        };
        await onUpdateSheet(updatedSheet);
      });
      setShowConfirmModal(true);
      return;
    }

    const updatedSheet: DebitSheet = {
      ...sheet,
      livre: newLivreStatus,
      dateLivraison: newLivreStatus ? new Date() : undefined
    };

    await onUpdateSheet(updatedSheet);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmTitle('');
    setConfirmMessage('');
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('fr-FR');
  };

  // Calculer les notifications
  const urgentSheets = sheets.filter(sheet => {
    if (sheet.fini || sheet.livre) return false;

    // Le champ delai est une DATE d'échéance au format DD/MM/YYYY ou YYYY-MM-DD
    const delaiStr = sheet.delai?.trim();
    if (!delaiStr) return false;

    let dueDate: Date | null = null;

    // Parser la date d'échéance
    if (delaiStr.includes('/')) {
      // Format DD/MM/YYYY
      const parts = delaiStr.split('/');
      if (parts.length === 3) {
        dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (delaiStr.includes('-')) {
      // Format YYYY-MM-DD
      dueDate = new Date(delaiStr);
    }

    // Vérifier si la date est valide
    if (!dueDate || isNaN(dueDate.getTime())) return false;

    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3;
  });

  // Vérifier les permissions
  const canImport = canImportSheets;
  const canEdit = canEditSheets;
  const canManageSheets = isAdmin || isBureau;
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">Erreur: {error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold">Tableau de Suivi des Commandes</h2>
                {urgentSheets.length > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <span className="text-orange-200 text-sm">
                      {urgentSheets.length} commande{urgentSheets.length > 1 ? 's' : ''} urgente{urgentSheets.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 w-full md:w-64"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                
                {canImport && (
                  <>
                    <button
                      onClick={() => excelInputRef.current?.click()}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Importer Excel</span>
                    </button>
                    
                    <button
                      onClick={() => setShowPdfImportModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <Brain className="h-4 w-4" />
                      <span>Importer avec IA</span>
                    </button>
                  </>
                )}
                
                {canManageSheets && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle Ligne</span>
                  </button>
                )}
              </div>
            </div>
            
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
            
          </div>

          {/* Affichage mobile avec cartes */}
          <div className="md:hidden">
            {loading || profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  {loading ? 'Chargement des données...' : 'Chargement du profil...'}
                </span>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredSheets.map((sheet) => (
                  <DebitSheetCard
                    key={sheet.id}
                    sheet={sheet}
                    onView={() => onViewSheet(sheet)}
                    onEdit={() => handleEdit(sheet)}
                    onDelete={() => onDeleteSheet(sheet.id)}
                  />
                ))}
                {filteredSheets.length === 0 && searchTerm && (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">Aucun résultat pour "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Affichage desktop avec tableau */}
          <div className="hidden md:block overflow-x-auto">
            {loading || profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  {loading ? 'Chargement des données...' : 'Chargement du profil...'}
                </span>
              </div>
            ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cial</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">N°OS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Chantier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fourniture</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Épaisseur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">N°ARC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Arc</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Échéance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">M²</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">M³</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fini</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Livré</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {showAddForm && canManageSheets && (
                  <tr className="bg-blue-50 border-l-4 border-l-blue-500">
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="Commercial" onChange={(e) => setEditData({...editData, cial: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="N°OS" onChange={(e) => setEditData({...editData, numeroOS: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="Client" onChange={(e) => setEditData({...editData, nomClient: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="Chantier" onChange={(e) => setEditData({...editData, refChantier: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="Matériau" onChange={(e) => setEditData({...editData, fourniture: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="Épaisseur" onChange={(e) => setEditData({...editData, epaisseur: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="N°ARC" onChange={(e) => setEditData({...editData, numeroARC: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" type="date" placeholder="Date Arc" onChange={(e) => setEditData({...editData, dateArc: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" placeholder="Délai" onChange={(e) => setEditData({...editData, delai: e.target.value})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" type="number" step="0.01" placeholder="M²" onChange={(e) => setEditData({...editData, m2: parseFloat(e.target.value) || 0})} /></td>
                    <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" type="number" step="0.01" placeholder="M³" onChange={(e) => setEditData({...editData, m3: parseFloat(e.target.value) || 0})} /></td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button onClick={handleAddNew} className="text-green-600 hover:text-green-800 p-1"><Save className="h-4 w-4" /></button>
                        <button onClick={() => setShowAddForm(false)} className="text-red-600 hover:text-red-800 p-1"><X className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredSheets.map((sheet) => {
                  // Calculer les indicateurs de date pour chaque ligne
                  const today = new Date();

                  // Le champ delai est une DATE d'échéance au format DD/MM/YYYY ou YYYY-MM-DD
                  const delaiStr = sheet.delai?.trim();
                  let isOverdue = false;
                  let isUrgent = false;
                  let dueDate: Date | null = null;

                  // Parser la date d'échéance si elle existe
                  if (delaiStr) {
                    // Essayer de parser la date (formats: DD/MM/YYYY ou YYYY-MM-DD)
                    if (delaiStr.includes('/')) {
                      // Format DD/MM/YYYY
                      const parts = delaiStr.split('/');
                      if (parts.length === 3) {
                        dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                      }
                    } else if (delaiStr.includes('-')) {
                      // Format YYYY-MM-DD
                      dueDate = new Date(delaiStr);
                    }

                    // Vérifier si la date est valide
                    if (dueDate && !isNaN(dueDate.getTime())) {
                      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      isOverdue = daysUntilDue < 0;
                      isUrgent = daysUntilDue >= 0 && daysUntilDue <= 3;
                    } else {
                      dueDate = null;
                    }
                  }

                  // Vérifier les permissions selon le rôle
                  // Stock Matière et Atelier : LECTURE SEULE uniquement (pas de toggle)
                  const canToggleFini = isAdmin || isBureau;
                  const canToggleLivre = isAdmin || isBureau;
                  return (
                  <tr key={sheet.id} className="hover:bg-gray-50 transition-colors duration-150">
                    {editingId === sheet.id && canEdit ? (
                      <>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.cial || ''} onChange={(e) => setEditData({...editData, cial: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.numeroOS || ''} onChange={(e) => setEditData({...editData, numeroOS: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.nomClient || ''} onChange={(e) => setEditData({...editData, nomClient: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.refChantier || ''} onChange={(e) => setEditData({...editData, refChantier: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.fourniture || ''} onChange={(e) => setEditData({...editData, fourniture: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.epaisseur || ''} onChange={(e) => setEditData({...editData, epaisseur: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.numeroARC || ''} onChange={(e) => setEditData({...editData, numeroARC: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" type="date" value={editData.dateArc || ''} onChange={(e) => setEditData({...editData, dateArc: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" value={editData.delai || ''} onChange={(e) => setEditData({...editData, delai: e.target.value})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" type="number" step="0.01" value={editData.m2 || 0} onChange={(e) => setEditData({...editData, m2: parseFloat(e.target.value) || 0})} /></td>
                        <td className="px-4 py-3"><input className="w-full px-2 py-1 border rounded text-sm" type="number" step="0.01" value={editData.m3 || 0} onChange={(e) => setEditData({...editData, m3: parseFloat(e.target.value) || 0})} /></td>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={editData.fini || false} 
                            onChange={(e) => setEditData({...editData, fini: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={editData.livre || false} 
                            onChange={(e) => setEditData({...editData, livre: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button onClick={handleSave} className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"><Save className="h-4 w-4" /></button>
                            <button onClick={handleCancel} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900">{sheet.cial}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{sheet.numeroOS}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{sheet.nomClient}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{sheet.refChantier || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{sheet.fourniture}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{sheet.epaisseur}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{sheet.numeroARC}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(sheet.dateArc)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {dueDate ? (
                              <span
                                className={`text-sm ${
                                  isOverdue ? 'text-red-600 font-semibold' :
                                  isUrgent ? 'text-orange-600 font-semibold' :
                                  'text-gray-900'
                                }`}
                                title={`Échéance: ${formatDate(dueDate)}`}
                              >
                                {formatDate(dueDate)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                            {(isOverdue || isUrgent) && (
                              <div className="flex items-center">
                                {isOverdue ? (
                                  <AlertTriangle className="h-4 w-4 text-red-500" title="Échéance dépassée" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-500" title="Échéance proche (≤3j)" />
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{getSheetTotals(sheet).m2.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{getSheetTotals(sheet).m3.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {canToggleFini ? (
                            <button
                              onClick={() => handleToggleFini(sheet)}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md ${
                                sheet.fini 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                              title={sheet.fini ? "Marquer comme en cours" : "Marquer comme terminé"}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {sheet.fini ? 'Terminé' : 'En cours'}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              sheet.fini 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {sheet.fini ? 'Terminé' : 'En cours'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {canToggleLivre ? (
                            <button
                              onClick={() => handleToggleLivre(sheet)}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md ${
                                sheet.livre 
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                              title={sheet.livre ? "Marquer comme en attente" : "Marquer comme livré"}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              {sheet.livre ? 'Livré' : 'En attente'}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              sheet.livre 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <Truck className="h-3 w-3 mr-1" />
                              {sheet.livre ? 'Livré' : 'En attente'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => onViewSheet(sheet)}
                              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Voir la feuille de débit"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canEdit && (
                              <button 
                                onClick={() => handleEdit(sheet)}
                                className="text-orange-600 hover:text-orange-800 p-1 hover:bg-orange-50 rounded transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            {canManageSheets && (
                              <button 
                                onClick={() => onDeleteSheet(sheet.id)}
                                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>

          {/* Message d'état vide */}
          {sheets.length === 0 && !loading && !profileLoading && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Aucune feuille de débit importée</p>
              <p className="text-gray-400 text-sm mt-2">Importez un PDF ou ajoutez une nouvelle ligne pour commencer</p>
            </div>
          )}

          {/* Message de recherche vide */}
          {filteredSheets.length === 0 && sheets.length > 0 && searchTerm && !loading && !profileLoading && (
            <div className="text-center py-12 hidden md:block">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Aucun résultat pour "{searchTerm}"</p>
              <p className="text-gray-400 text-sm mt-2">Essayez avec d'autres termes de recherche</p>
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={closeConfirmModal}
          onConfirm={handleConfirm}
          title={confirmTitle}
          message={confirmMessage}
          confirmButtonText="Confirmer"
          cancelButtonText="Annuler"
          type={confirmType}
        />

        <PdfImportModal
          isOpen={showPdfImportModal}
          onClose={() => setShowPdfImportModal(false)}
          onImport={handlePdfImport}
          onViewSheet={handleViewSheetById}
        />
      </div>

      {/* Barre de suivi fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white shadow-lg z-40 border-t border-slate-700">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-center sm:space-x-8">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium">En cours:</span>
              <span className="text-lg font-bold text-blue-300">{remainingTotals.count}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium hidden sm:inline">Surface restante:</span>
              <span className="text-sm font-medium sm:hidden">M²:</span>
              <span className="text-lg font-bold text-emerald-300">{remainingTotals.totalM2} m²</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <span className="text-sm font-medium hidden sm:inline">Volume restant:</span>
              <span className="text-sm font-medium sm:hidden">M³:</span>
              <span className="text-lg font-bold text-purple-300">{remainingTotals.totalM3} m³</span>
            </div>
          </div>
        </div>
      </div>

      {/* Espacement pour éviter que le contenu soit caché par la barre fixe */}
      <div className="h-24 sm:h-20"></div>
    </div>
  );
}