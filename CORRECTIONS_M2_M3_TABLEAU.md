# Correction - Inversion M2/M3 dans le Tableau de Suivi

## Problème
Dans le tableau de suivi des commandes, les valeurs M2 et M3 semblaient inversées ou incorrectes par rapport aux valeurs affichées dans les détails de la feuille de débit.

## Cause Racine
Le tableau de suivi (`TrackingTable.tsx`) utilisait directement les valeurs `sheet.m2` et `sheet.m3` **stockées en base de données** lors de la création de la feuille.

Ces valeurs peuvent être :
- Incorrectes si calculées avec une vieille logique
- Inversées lors de l'import
- Non mises à jour quand les items changent

En revanche, `DebitSheetView.tsx` calculait correctement les totaux **en temps réel** depuis les items individuels via `calculateSheetTotals()`.

## Solution Implémentée

### 1. Ajout de l'import
```typescript
import { calculateSheetTotals } from '../utils/materialUtils';
```

### 2. Fonction Helper
Création de `getSheetTotals()` qui calcule les M2/M3 depuis les **items** (source de vérité) :

```typescript
const getSheetTotals = (sheet: DebitSheet): { m2: number; m3: number } => {
  const items = sheet.items || [];
  if (items.length === 0) {
    // Fallback sur les valeurs DB si pas d'items
    return { m2: sheet.m2 || 0, m3: sheet.m3 || 0 };
  }
  // Calcul depuis les items (source de vérité)
  const totals = calculateSheetTotals(items);
  return { m2: totals.totalM2, m3: totals.totalM3 };
};
```

### 3. Mise à Jour des Affichages

#### Tableau principal
```typescript
// Avant
<td>{sheet.m2.toFixed(2)}</td>
<td>{sheet.m3.toFixed(2)}</td>

// Après
<td>{getSheetTotals(sheet).m2.toFixed(2)}</td>
<td>{getSheetTotals(sheet).m3.toFixed(2)}</td>
```

#### Totaux restants (useMemo)
```typescript
// Avant
const totalM2 = nonFinishedSheets.reduce((sum, sheet) => sum + sheet.m2, 0);
const totalM3 = nonFinishedSheets.reduce((sum, sheet) => sum + sheet.m3, 0);

// Après
const totalM2 = nonFinishedSheets.reduce((sum, sheet) => {
  const totals = getSheetTotals(sheet);
  return sum + totals.m2;
}, 0);
const totalM3 = nonFinishedSheets.reduce((sum, sheet) => {
  const totals = getSheetTotals(sheet);
  return sum + totals.m3;
}, 0);
```

#### Export CSV
```typescript
// Avant
sheet.m2.toFixed(2),
sheet.m3.toFixed(2),

// Après
const totals = getSheetTotals(sheet);
totals.m2.toFixed(2),
totals.m3.toFixed(2),
```

## Bénéfices

### Cohérence
- ✅ Les M2/M3 affichés dans le tableau correspondent exactement à ceux des détails
- ✅ Une seule source de vérité : les items individuels
- ✅ Calculs identiques partout (via `calculateSheetTotals`)

### Précision
- ✅ Prise en compte de la matière (tranche vs bloc)
- ✅ Prise en compte des champs `m2Item` et `m3Item` personnalisés
- ✅ Calculs basés sur les dimensions réelles des items

### Maintenabilité
- ✅ Suppression de la duplication de logique
- ✅ Plus facile à debugger
- ✅ Une seule fonction à maintenir

## Flux de Calcul

### Avant (Incohérent)
```
Tableau: sheet.m2 / sheet.m3 (DB)
         ↓
    ❌ Valeurs potentiellement incorrectes

Détails: calculateSheetTotals(items)
         ↓
    ✅ Valeurs correctes
```

### Après (Cohérent)
```
Tableau: getSheetTotals(sheet)
         ↓
    calculateSheetTotals(items)
         ↓
    ✅ Valeurs correctes

Détails: calculateSheetTotals(items)
         ↓
    ✅ Valeurs correctes
```

## Tests Validés

✅ Build réussi sans erreurs TypeScript
✅ Calculs M2/M3 cohérents entre tableau et détails
✅ Export CSV utilise les bonnes valeurs
✅ Totaux restants calculés correctement
✅ Fallback sur DB si items vides

## Note Technique

La fonction `calculateSheetTotals` dans `materialUtils.ts` gère intelligemment :
- Les tranches (suffixe K) : seulement M2
- Les blocs (suffixe Q/PBQ) : seulement M3
- Les matières mixtes : M2 et M3
- Les champs personnalisés `m2Item` / `m3Item` s'ils existent

Cette logique est maintenant appliquée uniformément partout dans l'application.

---

**Date** : 2025-11-16
**Fichier modifié** : `src/components/TrackingTable.tsx`
**Status** : ✅ Correction complète et testée
