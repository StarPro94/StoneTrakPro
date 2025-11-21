# État d'Implémentation des Améliorations

## ✅ Complété

### 1. Base de Données
- ✅ Migration pour table `materials` (liste maîtresse des matières)
- ✅ Migration pour table `blocks` (parc à blocs)
- ✅ Migration pour ajout de `numero_palette` dans `debit_items`
- ✅ Migration pour suppression de `stock_commande_ext` dans `debit_sheets`
- ✅ Toutes les migrations appliquées avec succès

### 2. Types TypeScript
- ✅ Suppression de `stockCommandeExt` dans `DebitSheet`
- ✅ Ajout de `numeroPalette` dans `DebitItem`
- ✅ Création de l'interface `Material`
- ✅ Création de l'interface `Block`

### 3. Hooks Custom
- ✅ `useMaterials.ts` - Gestion complète des matières (CRUD + import CSV)
- ✅ `useBlocks.ts` - Gestion complète des blocs (CRUD)

### 4. Utilitaires
- ✅ `materialUtils.ts` - Fonctions pour détecter type matière K vs Q/PBQ
- ✅ Fonctions de calcul distinguant tranches (m²) et blocs (m³)

### 5. Composants
- ✅ `MaterialsManager.tsx` - Interface admin pour gérer la liste des matières

## 🚧 En Cours / À Faire

### 6. Corrections des Calculs (PRIORITAIRE)
- ⏳ Modifier `DebitSheetView.tsx` pour utiliser les calculs K vs Q/PBQ
- ⏳ Modifier `Reports.tsx` pour séparer les totaux K et Q/PBQ
- ⏳ Mettre à jour `PlanningDebitSheetCard.tsx` pour afficher m² ET m³

### 7. Tableau de Suivi
- ⏳ Supprimer colonne "Stock CMD EXT" de l'affichage
- ⏳ Modifier colonne "Délai" pour afficher la date calculée (Date Arc + délai en jours)
- ⏳ Implémenter validation: bouton "Terminé" actif seulement si tous items cochés
- ⏳ Implémenter validation: "Livré" possible seulement si "Terminé"

### 8. Reports - Navigation Temporelle
- ⏳ Créer composant `DateNavigator` avec flèches précédent/suivant
- ⏳ Intégrer la navigation dans Reports pour semaines/mois/années

### 9. Parc à Blocs
- ⏳ Créer composant `BlockPark` pour afficher les blocs par lignes (A-Z)
- ⏳ Créer modal `AddBlockModal` pour ajouter des blocs
- ⏳ Créer modal `EditBlockModal` pour modifier des blocs
- ⏳ Créer modal `BlockDetailModal` pour voir détails d'un bloc
- ⏳ Ajouter onglet dans `SlabPark` pour basculer Tranches/Blocs
- ⏳ Créer modal `BlockToSlabTransformModal` pour transformation

### 10. Recherche Intelligente Améliorée
- ⏳ Modifier `SlabMatchingModal` pour recherche dynamique (sans bouton)
- ⏳ Remplacer input matière par menu déroulant (liste maîtresse)
- ⏳ Réorganiser algorithme de scoring: Épaisseur 80%, Longueur 15%, Largeur 5%
- ⏳ Modifier `AddSlabModal` et `EditSlabModal` pour menu déroulant matières

### 11. Feuille de Débit - Palettes
- ⏳ Ajouter input `numeroPalette` pour chaque item dans `DebitSheetView`
- ⏳ Créer bouton "Imprimer Feuille de Palettes"
- ⏳ Créer modal `PaletteSelectionModal` pour sélectionner palettes
- ⏳ Installer et configurer bibliothèque PDF (jsPDF ou react-to-pdf)
- ⏳ Implémenter génération PDF multi-pages (fiche de colisage)

### 12. Gestion des Machines dans Admin
- ⏳ Ajouter section gestion machines dans `AdminPanel`
- ⏳ Permettre création, renommage, suppression des machines
- ⏳ Créer interface pour lier utilisateurs aux machines

### 13. Permissions et Rôles
- ⏳ Mettre à jour `useUserProfile` selon spécifications:
  - Admin: accès complet
  - Bureau: accès tout sauf Admin, CRUD complet
  - Atelier: pas Reports ni Admin, actions limitées à sa machine
  - Stock Matière: CRUD stock uniquement
- ⏳ Appliquer les nouvelles permissions dans tous les composants

### 14. Intégration dans AdminPanel
- ⏳ Ajouter onglet "Matières" dans AdminPanel
- ⏳ Intégrer le composant `MaterialsManager`

## 📋 Notes Importantes

### Ordre Recommandé d'Implémentation
1. **Corrections des calculs K vs Q/PBQ** (impact immédiat sur précision)
2. **Modifications Tableau de Suivi** (suppression Stock CMD EXT, colonne Délai)
3. **Logique Terminé/Livré** (validation workflow)
4. **Parc à Blocs** (nouvelle fonctionnalité majeure)
5. **Recherche Intelligente améliorée**
6. **Palettes et PDF** (workflow de sortie)
7. **Navigation temporelle Reports**
8. **Gestion machines**
9. **Permissions finales**

### Fichiers Principaux à Modifier
- `src/components/DebitSheetView.tsx`
- `src/components/Reports.tsx`
- `src/components/TrackingTable.tsx`
- `src/components/SlabPark.tsx`
- `src/components/SlabMatchingModal.tsx`
- `src/components/Planning.tsx`
- `src/components/AdminPanel.tsx`
- `src/hooks/useUserProfile.ts`

### Dépendances à Ajouter
```bash
npm install jspdf jspdf-autotable
# OU
npm install @react-pdf/renderer
```

## 🎯 Prochaines Étapes Immédiates
1. Corriger les calculs dans DebitSheetView et Reports
2. Modifier TrackingTable (supprimer Stock CMD EXT, corriger Délai)
3. Implémenter validation Terminé/Livré
4. Créer l'interface du Parc à Blocs
