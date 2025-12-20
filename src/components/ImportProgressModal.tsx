import React from 'react';
import { X, FileSpreadsheet, Search, Package, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ImportProgress } from '../hooks/useSlabs';

interface ImportProgressModalProps {
  isOpen: boolean;
  progress: ImportProgress | null;
  onClose: () => void;
}

export default function ImportProgressModal({ isOpen, progress, onClose }: ImportProgressModalProps) {
  if (!isOpen || !progress) return null;

  const getPhaseLabel = (phase: ImportProgress['phase']) => {
    switch (phase) {
      case 'parsing':
        return 'Lecture du fichier Excel...';
      case 'checking':
        return 'Verification des doublons...';
      case 'materials':
        return 'Traitement des matieres...';
      case 'inserting':
        return 'Insertion des tranches...';
      case 'done':
        return 'Import termine';
    }
  };

  const getPhaseIcon = (phase: ImportProgress['phase']) => {
    switch (phase) {
      case 'parsing':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'checking':
        return <Search className="h-5 w-5" />;
      case 'materials':
        return <Package className="h-5 w-5" />;
      case 'inserting':
        return <Upload className="h-5 w-5" />;
      case 'done':
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const progressPercent = progress.totalSlabs > 0
    ? Math.round((progress.processedSlabs / progress.totalSlabs) * 100)
    : 0;

  const isDone = progress.phase === 'done';
  const hasErrors = progress.errors.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {isDone ? (
              hasErrors ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )
            ) : (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            <span>Import Excel</span>
          </h2>
          {isDone && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-3 text-gray-700">
            <div className={`p-2 rounded-lg ${isDone ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              {getPhaseIcon(progress.phase)}
            </div>
            <span className="font-medium">{getPhaseLabel(progress.phase)}</span>
          </div>

          {progress.phase === 'inserting' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progression</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-sm text-gray-500 text-center">
                {progress.processedSlabs} / {progress.totalSlabs} tranches traitees
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{progress.totalLines}</div>
              <div className="text-sm text-gray-500">Lignes Excel</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{progress.totalSlabs}</div>
              <div className="text-sm text-gray-500">Tranches totales</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{progress.insertedSlabs}</div>
              <div className="text-sm text-green-700">Inserees</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{progress.skippedSlabs}</div>
              <div className="text-sm text-amber-700">Ignorees (doublons)</div>
            </div>
          </div>

          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-700 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>{progress.errors.length} erreur{progress.errors.length > 1 ? 's' : ''}</span>
              </div>
              <div className="max-h-32 overflow-y-auto text-sm text-red-600 space-y-1">
                {progress.errors.slice(0, 10).map((err, i) => (
                  <div key={i} className="truncate">{err}</div>
                ))}
                {progress.errors.length > 10 && (
                  <div className="text-red-500 italic">... et {progress.errors.length - 10} autres erreurs</div>
                )}
              </div>
            </div>
          )}

          {isDone && !hasErrors && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-green-700 font-medium">
                Import termine avec succes
              </div>
              <div className="text-sm text-green-600 mt-1">
                {progress.insertedSlabs} tranche{progress.insertedSlabs > 1 ? 's ajoutees' : ' ajoutee'}
                {progress.skippedSlabs > 0 && `, ${progress.skippedSlabs} doublon${progress.skippedSlabs > 1 ? 's ignores' : ' ignore'}`}
              </div>
            </div>
          )}
        </div>

        {isDone && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
