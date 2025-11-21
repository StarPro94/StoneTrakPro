import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { DebitSheet } from '../types';

interface Anomaly {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  sheetId?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AnomalyDetectorProps {
  sheets: DebitSheet[];
  onViewSheet?: (sheet: DebitSheet) => void;
}

export default function AnomalyDetector({ sheets, onViewSheet }: AnomalyDetectorProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    detectAnomalies();
  }, [sheets]);

  const detectAnomalies = () => {
    const detected: Anomaly[] = [];
    const today = new Date();

    sheets.forEach(sheet => {
      // 1. Dimensions aberrantes
      if (sheet.m2 > 1000) {
        detected.push({
          id: `dim-${sheet.id}`,
          type: 'warning',
          title: 'Surface exceptionnellement élevée',
          message: `La commande ${sheet.numeroOS} a une surface de ${sheet.m2.toFixed(2)} m² qui semble anormalement élevée.`,
          sheetId: sheet.id,
          action: onViewSheet ? {
            label: 'Vérifier',
            onClick: () => onViewSheet(sheet)
          } : undefined
        });
      }

      // 2. Épaisseur aberrante
      const epaisseurNum = parseFloat(sheet.epaisseur);
      if (!isNaN(epaisseurNum) && epaisseurNum > 100) {
        detected.push({
          id: `ep-${sheet.id}`,
          type: 'error',
          title: 'Épaisseur incorrecte',
          message: `La commande ${sheet.numeroOS} a une épaisseur de ${sheet.epaisseur}cm qui semble aberrante (probablement en mm au lieu de cm).`,
          sheetId: sheet.id,
          action: onViewSheet ? {
            label: 'Corriger',
            onClick: () => onViewSheet(sheet)
          } : undefined
        });
      }

      // 3. Délai trop court pour la surface
      const delaiNum = parseInt(sheet.delai);
      if (!isNaN(delaiNum) && sheet.m2 > 50 && delaiNum < 7) {
        detected.push({
          id: `delai-${sheet.id}`,
          type: 'warning',
          title: 'Délai très court',
          message: `La commande ${sheet.numeroOS} (${sheet.m2.toFixed(2)} m²) a un délai de seulement ${delaiNum} jours. Vérifiez la faisabilité.`,
          sheetId: sheet.id,
          action: onViewSheet ? {
            label: 'Voir détails',
            onClick: () => onViewSheet(sheet)
          } : undefined
        });
      }

      // 4. Commande en retard
      if (!sheet.fini && !sheet.livre) {
        const delaiStr = sheet.delai?.trim();
        const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;

        if (delaiDays !== null && delaiDays > 0) {
          const creationDate = new Date(sheet.dateCreation);
          const dueDate = new Date(creationDate);
          dueDate.setDate(dueDate.getDate() + delaiDays);
          const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysOverdue > 0) {
            detected.push({
              id: `retard-${sheet.id}`,
              type: 'error',
              title: 'Commande en retard',
              message: `La commande ${sheet.numeroOS} de ${sheet.nomClient} est en retard de ${daysOverdue} jour(s).`,
              sheetId: sheet.id,
              action: onViewSheet ? {
                label: 'Traiter',
                onClick: () => onViewSheet(sheet)
              } : undefined
            });
          }
        }
      }

      // 5. Commande terminée mais non livrée depuis longtemps
      if (sheet.fini && !sheet.livre && sheet.dateFinition) {
        const finitionDate = new Date(sheet.dateFinition);
        const daysSinceFinished = Math.ceil((today.getTime() - finitionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceFinished > 7) {
          detected.push({
            id: `nonlivre-${sheet.id}`,
            type: 'warning',
            title: 'Commande non livrée',
            message: `La commande ${sheet.numeroOS} est terminée depuis ${daysSinceFinished} jours mais non livrée.`,
            sheetId: sheet.id,
            action: onViewSheet ? {
              label: 'Voir',
              onClick: () => onViewSheet(sheet)
            } : undefined
          });
        }
      }

      // 6. Items non cohérents
      const items = sheet.items || [];
      if (items.length > 0) {
        const itemsWithIssues = items.filter(item => {
          const longueur = item.longueur;
          const largeur = item.largeur;
          const epaisseur = item.epaisseur;

          // Dimensions impossibles
          return longueur > 500 || largeur > 500 || epaisseur > 100 ||
                 longueur < 1 || largeur < 1 || epaisseur < 1;
        });

        if (itemsWithIssues.length > 0) {
          detected.push({
            id: `items-${sheet.id}`,
            type: 'warning',
            title: 'Items avec dimensions suspectes',
            message: `La commande ${sheet.numeroOS} contient ${itemsWithIssues.length} item(s) avec des dimensions potentiellement incorrectes.`,
            sheetId: sheet.id,
            action: onViewSheet ? {
              label: 'Vérifier',
              onClick: () => onViewSheet(sheet)
            } : undefined
          });
        }
      }

      // 7. M² et M³ tous les deux à zéro
      if (sheet.m2 === 0 && sheet.m3 === 0) {
        detected.push({
          id: `zero-${sheet.id}`,
          type: 'error',
          title: 'Quantités nulles',
          message: `La commande ${sheet.numeroOS} n'a aucune surface ni volume enregistré.`,
          sheetId: sheet.id,
          action: onViewSheet ? {
            label: 'Corriger',
            onClick: () => onViewSheet(sheet)
          } : undefined
        });
      }
    });

    // Filtrer les anomalies déjà rejetées
    const filtered = detected.filter(a => !dismissed.has(a.id));
    setAnomalies(filtered);
  };

  const dismissAnomaly = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    setAnomalies(prev => prev.filter(a => a.id !== id));
  };

  if (anomalies.length === 0) {
    return null;
  }

  const getIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = (type: Anomaly['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span>Détection d'Anomalies IA</span>
          <span className="text-sm font-normal text-gray-600">
            ({anomalies.length} détectée{anomalies.length > 1 ? 's' : ''})
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {anomalies.map(anomaly => (
          <div
            key={anomaly.id}
            className={`flex items-start space-x-3 p-4 rounded-lg border ${getStyles(anomaly.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(anomaly.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{anomaly.title}</h4>
              <p className="text-sm mt-1">{anomaly.message}</p>
            </div>
            <div className="flex-shrink-0 flex items-center space-x-2">
              {anomaly.action && (
                <button
                  onClick={anomaly.action.onClick}
                  className="text-xs px-3 py-1 bg-white border border-current rounded hover:bg-opacity-50 transition-colors"
                >
                  {anomaly.action.label}
                </button>
              )}
              <button
                onClick={() => dismissAnomaly(anomaly.id)}
                className="text-current hover:bg-white hover:bg-opacity-50 p-1 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
