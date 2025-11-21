import React, { useState } from 'react';
import { X, Package, MapPin, Ruler, Calendar, FileText, QrCode, Download } from 'lucide-react';
import { Slab } from '../types';
import { getMaterialColor, getMaterialBadgeColor } from '../utils/materialColors';
import { formatDimensions, calculateSlabArea, calculateSlabVolume, formatArea, formatVolume, getSlabAgeDays } from '../utils/slabCalculations';
import { generateQRCodeURL, downloadQRCode } from '../utils/qrCode';

interface SlabDetailModalProps {
  slab: Slab | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (slab: Slab) => void;
}

export default function SlabDetailModal({ slab, isOpen, onClose, onUpdate }: SlabDetailModalProps) {
  const [notes, setNotes] = useState(slab?.notes || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen || !slab) return null;

  const materialColor = getMaterialColor(slab.material);
  const area = calculateSlabArea(slab);
  const volume = calculateSlabVolume(slab);
  const ageDays = getSlabAgeDays(slab.createdAt);
  const qrUrl = generateQRCodeURL(slab);

  const handleSaveNotes = () => {
    if (onUpdate) {
      onUpdate({ ...slab, notes });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className={`${materialColor.bg} border-b-4 ${materialColor.border} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className={`text-2xl font-bold ${materialColor.text}`}>Position {slab.position}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMaterialBadgeColor(slab.material)}`}>
                  {slab.material}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  slab.status === 'dispo'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-orange-200 text-orange-800'
                }`}>
                  {slab.status === 'dispo' ? 'Disponible' : 'Réservé'}
                </span>
              </div>
              <p className={`text-sm ${materialColor.text} opacity-75`}>ID: {slab.id.substring(0, 8)}...</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Ruler className="h-5 w-5 text-blue-600" />
                  <span>Dimensions</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longueur:</span>
                    <span className="font-mono font-medium">{slab.length} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Largeur:</span>
                    <span className="font-mono font-medium">{slab.width} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Épaisseur:</span>
                    <span className="font-mono font-medium">{slab.thickness} cm</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-600">Surface:</span>
                    <span className="font-bold text-blue-600">{formatArea(area)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-bold text-blue-600">{formatVolume(volume)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>Informations</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Âge du stock:</span>
                    <span className={`font-medium ${ageDays > 60 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {ageDays} jour{ageDays > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créé le:</span>
                    <span className="font-medium">{slab.createdAt.toLocaleDateString('fr-FR')}</span>
                  </div>
                  {slab.lastMovedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Déplacé le:</span>
                      <span className="font-medium">{new Date(slab.lastMovedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {slab.numeroOS && (
                    <>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="text-gray-600">N° OS:</span>
                        <span className="font-bold text-blue-600">{slab.numeroOS}</span>
                      </div>
                      {slab.refChantier && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Réf chantier:</span>
                          <span className="font-medium">{slab.refChantier}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <span>QR Code</span>
                </h3>
                <div className="flex flex-col items-center">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-48 h-48 bg-white p-2 rounded-lg shadow-md mb-3"
                  />
                  <button
                    onClick={() => downloadQRCode(slab)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span>Notes</span>
                  </h3>
                  {!isEditing && onUpdate && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Modifier
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Ajoutez des notes..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveNotes}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setNotes(slab.notes || '');
                          setIsEditing(false);
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {slab.notes || <span className="text-gray-400 italic">Aucune note</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
