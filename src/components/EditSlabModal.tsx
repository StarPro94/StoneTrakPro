import React, { useState, useEffect } from 'react';
import { X, Save, Euro } from 'lucide-react';
import { Slab, DebitSheet } from '../types';
import { useMaterials } from '../hooks/useMaterials';
import MaterialSearchCombobox from './MaterialSearchCombobox';

interface EditSlabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (slab: Slab) => void;
  slab: Slab | null;
  debitSheets: DebitSheet[];
}

export default function EditSlabModal({ isOpen, onClose, onUpdate, slab, debitSheets }: EditSlabModalProps) {
  const { materials } = useMaterials();

  // Filtrer uniquement les matières en K (tranches)
  const slabMaterials = materials
    .filter(m => /\bK\d+/i.test(m.name))
    .map(m => m.name);

  const [formData, setFormData] = useState({
    position: '',
    material: '',
    length: '',
    width: '',
    thickness: '',
    quantity: '',
    status: 'dispo' as 'dispo' | 'réservé',
    debitSheetId: '',
    priceEstimate: ''
  });

  useEffect(() => {
    if (slab) {
      setFormData({
        position: slab.position,
        material: slab.material,
        length: slab.length.toString(),
        width: slab.width.toString(),
        thickness: slab.thickness.toString(),
        quantity: slab.quantity.toString(),
        status: slab.status,
        debitSheetId: slab.debitSheetId || '',
        priceEstimate: slab.priceEstimate?.toString() || ''
      });
    }
  }, [slab]);

  // Fonction pour extraire l'épaisseur du nom de matière (ex: "YELLOW ROCK K3" -> "3")
  const extractThicknessFromMaterial = (materialName: string): string => {
    const match = materialName.match(/K(\d+(?:[.,]\d+)?)/i);
    if (match) {
      return match[1].replace(',', '.');
    }
    return '';
  };

  const handleMaterialChange = (value: string) => {
    const thickness = extractThicknessFromMaterial(value);
    setFormData({
      ...formData,
      material: value,
      thickness: thickness || formData.thickness // Préremplir l'épaisseur si trouvée, sinon garder la valeur existante
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!slab || !formData.position || !formData.material || !formData.length || !formData.width || !formData.thickness || !formData.quantity) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity < 1) {
      alert('La quantité doit être supérieure à 0');
      return;
    }

    onUpdate({
      ...slab,
      position: formData.position,
      material: formData.material,
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      thickness: parseFloat(formData.thickness),
      quantity: quantity,
      status: formData.status,
      debitSheetId: formData.status === 'réservé' && formData.debitSheetId ? formData.debitSheetId : undefined,
      priceEstimate: formData.priceEstimate ? parseFloat(formData.priceEstimate) : undefined
    });

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !slab) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Save className="h-5 w-5 text-blue-600" />
            <span>Modifier la Tranche</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position *
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value.toUpperCase() })}
              placeholder="Ex: A1, B5, C3..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <MaterialSearchCombobox
              materials={slabMaterials}
              value={formData.material}
              onChange={handleMaterialChange}
              placeholder="Rechercher une matière en K..."
              label="Matière"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Largeur (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Épaisseur (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.thickness}
                onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre de tranches identiques à cet emplacement
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-emerald-600" />
                <span>Valeur estimée</span>
              </div>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.priceEstimate}
                onChange={(e) => setFormData({ ...formData, priceEstimate: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">EUR</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Prix estimé de la tranche (optionnel)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'dispo' | 'réservé' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dispo">Disponible</option>
              <option value="réservé">Réservé</option>
            </select>
          </div>

          {formData.status === 'réservé' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feuille de Débit (OS)
              </label>
              <select
                value={formData.debitSheetId}
                onChange={(e) => setFormData({ ...formData, debitSheetId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une feuille de débit...</option>
                {debitSheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.numeroOS} - {sheet.nomClient}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}