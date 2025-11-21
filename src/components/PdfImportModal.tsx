import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, FileText, Brain, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Eye, RotateCcw, Loader2 } from 'lucide-react';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, useClaudeVision: boolean) => Promise<any>;
  onViewSheet?: (sheetId: string) => void;
}

type ImportStep = 'select' | 'processing' | 'complete' | 'error';

interface ImportResult {
  success: boolean;
  sheet_id?: string;
  items_count?: number;
  total_m2?: number;
  total_m3?: number;
  confidence?: number;
  warnings?: string[];
  processing_time_ms?: number;
  extracted_data?: {
    commercial: string;
    client: string;
    numero_os: string;
    numero_arc: string;
    date_arc: string;
    chantier: string;
  };
  error?: string;
}

const LOADING_MESSAGES = [
  "Envoi du fichier sécurisé...",
  "Lecture du document par Claude Vision...",
  "Identification de la structure des tableaux...",
  "Extraction des dimensions et matériaux...",
  "Vérification de la cohérence des données...",
  "Calcul des surfaces et volumes...",
  "Finalisation de l'import..."
];

export default function PdfImportModal({ isOpen, onClose, onImport, onViewSheet }: PdfImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>('select');
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs pour les timers afin de pouvoir les nettoyer
  const progressInterval = useRef<number | null>(null);
  const messageInterval = useRef<number | null>(null);

  const resetModal = useCallback(() => {
    setSelectedFile(null);
    setCurrentStep('select');
    setProgress(0);
    setMessageIndex(0);
    setResult(null);
    stopTimers();
  }, []);

  const stopTimers = () => {
    if (progressInterval.current) window.clearInterval(progressInterval.current);
    if (messageInterval.current) window.clearInterval(messageInterval.current);
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => stopTimers();
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setSelectedFile(file);
      setCurrentStep('select');
    } else {
      alert('Veuillez sélectionner un fichier PDF');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const startFakeProgress = () => {
    setProgress(0);
    setMessageIndex(0);
    
    // Progression asymptotique : rapide au début, puis ralentit sans jamais atteindre 100%
    progressInterval.current = window.setInterval(() => {
      setProgress(prev => {
        // Formule : on ajoute 10% de la distance restante vers 95%
        const remaining = 95 - prev;
        if (remaining < 0.5) return prev; // On stagne à ~95%
        // Ajoute un peu de hasard pour faire "naturel"
        const increment = (remaining * 0.05) + (Math.random() * 0.5); 
        return Math.min(prev + increment, 95);
      });
    }, 200);

    // Changement de message toutes les 2.5 secondes
    messageInterval.current = window.setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setCurrentStep('processing');
      startFakeProgress();

      // Appel réel à l'API (c'est ici que ça prend du temps)
      const importResult = await onImport(selectedFile, true);

      // Une fois fini, on force à 100%
      stopTimers();
      setProgress(100);
      setResult(importResult);
      
      // Petite pause pour voir la barre à 100% avant d'afficher le succès
      setTimeout(() => {
        setCurrentStep('complete');
      }, 500);

    } catch (error: any) {
      console.error('Erreur import:', error);
      stopTimers();
      setResult({
        success: false,
        error: error.message || 'Erreur inconnue lors de l\'import'
      });
      setCurrentStep('error');
    }
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number): string => {
    if (!confidence) return 'N/A';
    if (confidence >= 0.9) return 'Excellente';
    if (confidence >= 0.7) return 'Bonne';
    return 'Faible';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Import IA Intelligent
              </h2>
              <p className="text-xs text-gray-500">Propulsé par Claude Vision</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* ÉTAPE 1 : SÉLECTION */}
          {currentStep === 'select' && (
            <div className="animate-fadeIn">
              <div className="mb-8 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900 mb-1">Analyse Visuelle Avancée</h3>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      L'IA ne se contente pas de lire le texte : elle "voit" le document comme un humain. 
                      Elle comprend les tableaux complexes, corrige les erreurs de frappe et valide les calculs automatiquement.
                    </p>
                  </div>
                </div>
              </div>

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-blue-500'}`} />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Glissez votre fichier PDF ici
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    ou cliquez pour parcourir vos dossiers
                  </p>
                  <button
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                  >
                    Sélectionner un fichier
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white border-2 border-blue-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 font-medium">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={handleImport}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-3 group"
                  >
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    <span>Lancer l'Analyse IA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : TRAITEMENT (Feedback Amélioré) */}
          {currentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center text-center animate-fadeIn">
              <div className="relative w-32 h-32 mb-8">
                {/* Cercles animés */}
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analyse en cours...
              </h3>
              
              {/* Message rotatif avec animation */}
              <div className="h-8 overflow-hidden mb-6">
                <p className="text-blue-600 font-medium animate-slideUp key={messageIndex}">
                  {LOADING_MESSAGES[messageIndex]}
                </p>
              </div>

              {/* Barre de progression fluide */}
              <div className="w-full max-w-md bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono">{Math.round(progress)}%</p>
            </div>
          )}

          {/* ÉTAPE 3 : SUCCÈS */}
          {currentStep === 'complete' && result?.success && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-1">
                  Analyse Terminée avec Succès !
                </h3>
                <p className="text-green-700">
                  Toutes les données ont été extraites et structurées.
                </p>
              </div>

              {result.confidence !== undefined && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-gray-700">Indice de Confiance IA</span>
                    </div>
                    <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        result.confidence >= 0.9 ? 'bg-green-500' :
                        result.confidence >= 0.7 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Items extraits</p>
                  <p className="text-2xl font-bold text-gray-900">{result.items_count || 0}</p>
                </div>
                {result.total_m2 !== undefined && result.total_m2 > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Surface (M²)</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total_m2.toFixed(2)}</p>
                  </div>
                )}
                {result.total_m3 !== undefined && result.total_m3 > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Volume (M³)</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total_m3.toFixed(3)}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Temps Traitement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.processing_time_ms ? (result.processing_time_ms / 1000).toFixed(1) : 0}s
                  </p>
                </div>
              </div>

              {result.extracted_data && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Aperçu des données
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <div><span className="text-slate-500">Client:</span> <span className="font-medium">{result.extracted_data.client}</span></div>
                    <div><span className="text-slate-500">OS:</span> <span className="font-medium">{result.extracted_data.numero_os}</span></div>
                    <div><span className="text-slate-500">ARC:</span> <span className="font-medium">{result.extracted_data.numero_arc}</span></div>
                    <div><span className="text-slate-500">Chantier:</span> <span className="font-medium truncate block">{result.extracted_data.chantier}</span></div>
                  </div>
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-orange-900 mb-2">Points d'attention</h4>
                      <ul className="space-y-1 text-sm text-orange-800">
                        {result.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {result.sheet_id && onViewSheet && (
                  <button
                    onClick={() => {
                      onViewSheet(result.sheet_id!);
                      handleClose();
                    }}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Voir la fiche</span>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="py-3 px-6 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : ERREUR */}
          {currentStep === 'error' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col items-center py-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-bounce-short">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Échec de l'analyse
                </h3>
                <p className="text-gray-600 text-center max-w-sm mx-auto">
                  L'IA n'a pas pu traiter ce fichier correctement.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h4 className="font-bold text-red-900 mb-2">Rapport d'erreur :</h4>
                <p className="text-sm text-red-700 font-mono bg-red-100 p-3 rounded-lg overflow-x-auto">
                  {result?.error}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetModal}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Réessayer</span>
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}