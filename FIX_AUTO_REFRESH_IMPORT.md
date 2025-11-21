# Correction - Rafraîchissement Automatique après Import

## Problème
Après l'import d'un PDF ou d'un fichier Excel, la nouvelle feuille de débit n'apparaît pas dans le tableau de suivi. L'utilisateur doit rafraîchir manuellement la page (F5) pour voir la nouvelle commande.

## Cause Principale
Les fonctions `importPdf` et `importExcel` ne forçaient pas de rechargement des données après un import réussi. Elles comptaient uniquement sur le système Realtime de Supabase, qui peut avoir un délai de propagation.

## Solutions Implémentées

### 1. Hook useDebitSheets.ts

#### importPdf()
- Ajout de logs détaillés pour le debugging
- Ajout d'une attente de 1 seconde après import réussi pour laisser Supabase propager les données
- **Appel explicite de `fetchSheets()`** après l'import pour forcer le rechargement
- Logs console pour tracer tout le processus

#### importExcel()
- Même amélioration que pour importPdf
- Attente de 1 seconde + appel de `fetchSheets()`
- Logs console détaillés

### 2. DebitSheetView.tsx
- **Suppression du `window.location.reload()`** qui forçait un rechargement complet de la page
- Ce rechargement brutal n'est plus nécessaire maintenant que le hook gère correctement le rafraîchissement

## Flux Mis à Jour

### Avant
```
1. Upload PDF/Excel → Edge Function
2. Edge Function crée la feuille en DB
3. ❌ Attente du Realtime (délai imprévisible)
4. ❌ Parfois la feuille n'apparaît pas
5. ⚠️ window.location.reload() (rechargement brutal)
```

### Après
```
1. Upload PDF/Excel → Edge Function
2. Edge Function crée la feuille en DB
3. ✅ Attente de 1 seconde (propagation DB)
4. ✅ Appel explicite de fetchSheets()
5. ✅ Feuille apparaît immédiatement dans le tableau
6. ✅ Pas de rechargement de page nécessaire
```

## Bénéfices

1. **Expérience Utilisateur Améliorée**
   - La nouvelle feuille apparaît immédiatement (< 2 secondes)
   - Plus besoin de rafraîchir manuellement
   - Feedback visuel cohérent

2. **Fiabilité**
   - Ne dépend plus uniquement du Realtime
   - Garantit que les données sont chargées après import
   - Logs détaillés pour le debugging

3. **Performance**
   - Plus de rechargement brutal de toute la page
   - Mise à jour ciblée des données
   - État de l'application préservé

## Tests Recommandés

1. ✅ Import d'un PDF → Vérifier apparition immédiate
2. ✅ Import d'un Excel → Vérifier apparition immédiate
3. ✅ Import multiple → Vérifier que toutes les feuilles apparaissent
4. ✅ Vérifier les logs console pour confirmer le flux

## Notes Techniques

- Le délai de 1 seconde est un compromis entre vitesse et fiabilité
- Le système Realtime reste actif en arrière-plan pour les mises à jour en temps réel
- `fetchSheets()` garantit que les données les plus récentes sont affichées
