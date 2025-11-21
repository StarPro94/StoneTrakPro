# Corrections - Page Blanche après Import PDF

## Problème
Après l'import d'un PDF, lorsqu'on clique sur "Voir la fiche", une page blanche apparaît avec l'erreur :
```
TypeError: Cannot read properties of undefined (reading 'filter')
at DebitSheetView.tsx:36
```

## Cause
Race condition lors de l'import PDF : la feuille de débit est créée avant que ses items ne soient insérés dans la base de données. Pendant ce court laps de temps, `sheet.items` est `undefined`, ce qui provoque l'erreur dans `DebitSheetView.tsx`.

## Solutions Implémentées

### 1. Type System (src/types/index.ts)
- Changé `items: DebitItem[]` en `items?: DebitItem[]` pour refléter que les items peuvent être temporairement absents

### 2. DebitSheetView.tsx
- Ajout de protection avec `|| []` dans toutes les initialisations d'état
- Ajout d'un `useEffect` pour synchroniser les items quand ils arrivent via Realtime
- Protection dans les calculs de `remainingM2` et `remainingM3`

### 3. useDebitSheets.ts Hook
- Ajout de `|| []` dans le mapping de `debit_items` (3 endroits)
- Protection dans `updateSheet` pour l'itération sur les items
- Protection dans `addSheet` pour l'insertion des items
- Ajout de champs manquants dans la synchronisation Realtime

### 4. Autres Composants
- **TrackingTable.tsx** : Protection dans `handleToggleFini`
- **Reports.tsx** : Protection dans les calculs de totaux (2 endroits)
- **AnomalyDetector.tsx** : Protection dans la détection d'anomalies

## Bénéfices
- Plus d'erreur de page blanche après import PDF
- Meilleure gestion des états de chargement
- Code plus robuste face aux race conditions
- Synchronisation correcte des items via Realtime

## Tests
✅ Build réussi sans erreurs TypeScript
✅ Toutes les protections ajoutées
✅ Types cohérents dans toute l'application
