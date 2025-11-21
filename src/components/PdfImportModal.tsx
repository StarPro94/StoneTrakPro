import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Brain, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Eye, RotateCcw } from 'lucide-react';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, useClaudeVision: boolean) => Promise<any>;
  onViewSheet?: (sheetId: string) => void;
}

type ImportStep = 'select' | 'uploading' | 'analyzing' | 'extracting' | 'saving' | 'complete' | 'error';

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

export default function PdfImportModal({ isOpen, onClose, onImport, onViewSheet }: PdfImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>('select');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = useCallback(() => {
    setSelectedFile(null);
    setCurrentStep('select');
    setProgress(0);
    setResult(null);
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
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const simulateProgress = useCallback((step: ImportStep, duration: number) => {
    return new Promise<void>((resolve) => {
      let currentProgress = 0;
      const increment = 100 / (duration / 50);

      const interval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setProgress(100);
          resolve();
        } else {
          setProgress(Math.min(currentProgress, 95));
        }
      }, 50);
    });
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setCurrentStep('uploading');
      setProgress(0);
      await simulateProgress('uploading', 500);

      setCurrentStep('analyzing');
      await simulateProgress('analyzing', 1000);

      setCurrentStep('extracting');
      setProgress(0);

      const importResult = await onImport(selectedFile, true);

      setCurrentStep('saving');
      setProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(100);
      setResult(importResult);
      setCurrentStep('complete');

    } catch (error: any) {
      console.error('Erreur import:', error);
      setResult({
        success: false,
        error: error.message || 'Erreur inconnue lors de l\'import'
      });
      setCurrentStep('error');
    }
  };

  const getStepLabel = (step: ImportStep): string => {
    const labels: Record<ImportStep, string> = {
      select: 'Sélection du fichier',
      uploading: 'Envoi du fichier...',
      analyzing: 'Analyse IA en cours...',
      extracting: 'Extraction des données...',
      saving: 'Sauvegarde...',
      complete: 'Import terminé !',
      error: 'Erreur'
    };
    return labels[step];
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Import PDF avec Claude Vision AI
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {currentStep === 'select' && (
            <>
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Extraction Intelligente par IA</h3>
                    <p className="text-sm text-gray-600">
                      Claude Vision AI analyse votre PDF avec une précision de 95%+ et extrait automatiquement toutes les données.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-white px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>95%+</span>
                    </div>
                  </div>
                </div>
              </div>

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${
                    isDragging ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Glissez votre fichier PDF ici
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    ou cliquez pour parcourir vos fichiers
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-10 h-10 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={handleImport}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Extraire avec Claude Vision AI</span>
                  </button>
                </div>
              )}
            </>
          )}

          {(currentStep === 'uploading' || currentStep === 'analyzing' || currentStep === 'extracting' || currentStep === 'saving') && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-8">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div
                    className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                  ></div>
                  <Brain className="w-12 h-12 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {getStepLabel(currentStep)}
                </p>
                <p className="text-sm text-gray-500">
                  Veuillez patienter...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{getStepLabel(currentStep)}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['uploading', 'analyzing', 'extracting', 'saving'].map((step, index) => {
                  const steps: ImportStep[] = ['uploading', 'analyzing', 'extracting', 'saving'];
                  const stepIndex = steps.indexOf(currentStep);
                  const isCompleted = index < stepIndex;
                  const isCurrent = index === stepIndex;

                  return (
                    <div
                      key={step}
                      className={`h-1 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    ></div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'complete' && result?.success && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Import réussi !
                </h3>
                <p className="text-gray-600">
                  Feuille de débit créée avec succès
                </p>
              </div>

              {result.confidence !== undefined && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Score de confiance</span>
                    </div>
                    <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${
                        result.confidence >= 0.9 ? 'bg-green-500' :
                        result.confidence >= 0.7 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Qualité: {getConfidenceLabel(result.confidence)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Items extraits</p>
                  <p className="text-2xl font-bold text-gray-900">{result.items_count || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Temps de traitement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.processing_time_ms ? (result.processing_time_ms / 1000).toFixed(1) : 0}s
                  </p>
                </div>
                {result.total_m2 !== undefined && result.total_m2 > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total M²</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total_m2.toFixed(3)}</p>
                  </div>
                )}
                {result.total_m3 !== undefined && result.total_m3 > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total M³</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total_m3.toFixed(3)}</p>
                  </div>
                )}
              </div>

              {result.extracted_data && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Informations extraites</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {result.extracted_data.commercial && (
                      <div>
                        <span className="text-gray-600">Commercial:</span>
                        <span className="ml-2 font-medium text-gray-900">{result.extracted_data.commercial}</span>
                      </div>
                    )}
                    {result.extracted_data.numero_os && (
                      <div>
                        <span className="text-gray-600">N° OS:</span>
                        <span className="ml-2 font-medium text-gray-900">{result.extracted_data.numero_os}</span>
                      </div>
                    )}
                    {result.extracted_data.numero_arc && (
                      <div>
                        <span className="text-gray-600">N° ARC:</span>
                        <span className="ml-2 font-medium text-gray-900">{result.extracted_data.numero_arc}</span>
                      </div>
                    )}
                    {result.extracted_data.date_arc && (
                      <div>
                        <span className="text-gray-600">Date ARC:</span>
                        <span className="ml-2 font-medium text-gray-900">{result.extracted_data.date_arc}</span>
                      </div>
                    )}
                    {result.extracted_data.client && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Client:</span>
                        <span className="ml-2 font-medium text-gray-900">{result.extracted_data.client}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900 mb-2">Avertissements</h4>
                      <ul className="space-y-1 text-sm text-orange-800">
                        {result.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-600 mt-0.5">•</span>
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
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Voir la fiche</span>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {currentStep === 'error' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Erreur d'import
                </h3>
                <p className="text-gray-600 text-center">
                  {result?.error || 'Une erreur est survenue lors de l\'import du fichier'}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Détails de l'erreur</h4>
                <p className="text-sm text-red-800">{result?.error}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetModal();
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Réessayer</span>
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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
