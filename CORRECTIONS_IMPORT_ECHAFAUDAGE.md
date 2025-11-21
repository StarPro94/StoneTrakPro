# Corrections des Imports d'Échafaudage

## Problème Identifié

Les imports d'inventaire (Importer Stock) et de commandes d'échafaudage (Importer Livraison) ne fonctionnaient pas correctement en raison de :

1. **Détection rigide des colonnes** : Le code recherchait des noms de colonnes exacts (`"Référence"`, `"Quantité"`, etc.), ce qui échouait avec des variations d'accents, d'espaces ou de casse
2. **En-têtes non détectés** : Les en-têtes n'étaient pas sur la première ligne dans certains fichiers
3. **Extraction des métadonnées** : Les numéros de commande, dates, préparateurs, etc. n'étaient pas correctement extraits
4. **Messages d'erreur peu clairs** : Pas d'indication précise sur ce qui ne fonctionnait pas

## Solution Implémentée

### 1. Nouveau Parser Excel Robuste (`src/utils/scaffoldingExcelParser.ts`)

Création d'une fonction utilitaire complète qui gère :

- **Normalisation des noms de colonnes** : Suppression des accents, espaces, caractères spéciaux et conversion en minuscules pour une comparaison flexible
- **Détection intelligente des en-têtes** : Recherche de la ligne contenant "Référence" ou "Reference" dans le fichier
- **Extraction automatique des métadonnées** : Numéro, date, chantier, préparateur, réceptionnaire, transporteur
- **Parsing flexible des valeurs numériques** : Gère les virgules, points, espaces et caractères parasites
- **Support des quantités HS** : Détection et traitement des éléments hors service
- **Calcul du poids total** : Agrégation automatique du poids total de l'import
- **Validation des données** : Vérification de la cohérence des données avant import

### 2. Mise à Jour de StockManager

Modifications dans `src/components/StockManager.tsx` :

- **Import d'inventaire** (`handleImportStock`) :
  - Utilise le nouveau parser pour extraire les données
  - Valide les données avant traitement
  - Affiche les références non trouvées dans le catalogue
  - Indique le poids total importé

- **Import de commande Layher** (`handleImportLayherCommande`) :
  - Extrait automatiquement le numéro de commande du fichier
  - Associe correctement toutes les références du catalogue
  - Affiche un résumé détaillé (nombre d'éléments + poids)

- **Import de retour Layher** (`handleImportLayherRetour`) :
  - Détecte le numéro de commande dans le fichier
  - Retourne tous les éléments de la location
  - Gère les locations multiples avec le même numéro

### 3. Mise à Jour de SiteDetailsModal

Modifications dans `src/components/SiteDetailsModal.tsx` :

- **Import de livraison** (`handleImportDelivery`) :
  - Extrait les informations du document (préparateur, réceptionnaire, transporteur)
  - Vérifie la disponibilité du stock avant la livraison
  - Affiche clairement les éléments indisponibles
  - Suggère de passer commande chez Layher si stock insuffisant

- **Import de retour** (`handleImportReturn`) :
  - Gère les quantités normales et les quantités HS séparément
  - Crée les mouvements appropriés (retour stock / matériel HS)
  - Affiche un résumé avec le nombre d'éléments HS

## Formats de Fichier Supportés

Le parser supporte maintenant les variations suivantes :

### Colonnes Principales
- **Référence** : `Référence`, `Reference`, `Ref`
- **Désignation** : `Désignation`, `Designation`, `Libellé`, `Libelle`
- **Quantité** : `Quantité`, `Quantite`, `Qté`, `Qte`, `Qty`
- **Poids Unitaire** : `Poids unitaire`, `Poids Unitaire`, `PoidsUnitaire`, `Poids`
- **Poids Total** : `Poids total`, `Poids Total`, `PoidsTotal`, `Total`
- **Quantité HS** : `Quantité HS`, `Quantite HS`, `QuantiteHS`, `HS`

### Métadonnées
- **Numéro** : `Numéro`, `Numero`, `N° Chantier`, `N° Commande`
- **Date** : `Date`
- **Chantier** : `Chantier`
- **Préparateur** : `Préparateur`, `Preparateur`
- **Réceptionnaire** : `Réceptionnaire`, `Receptionnaire`
- **Transporteur** : `Transporteur`

## Améliorations des Messages

Les nouveaux messages d'erreur et de succès incluent :

- **Validation du fichier** : Indique précisément ce qui manque ou est invalide
- **Références non trouvées** : Liste les références absentes du catalogue
- **Stock insuffisant** : Détaille exactement quels éléments manquent et en quelle quantité
- **Confirmation d'import** : Affiche le numéro de liste/commande, le nombre d'éléments et le poids total

## Cas d'Usage Testés

1. ✅ Import d'inventaire complet (192 tonnes, 100+ références)
2. ✅ Import de commande de livraison avec métadonnées complètes
3. ✅ Import de liste vierge (quantités à 0 correctement ignorées)
4. ✅ Détection des références manquantes dans le catalogue
5. ✅ Vérification de disponibilité avant livraison
6. ✅ Gestion des éléments HS lors des retours

## Fichiers Modifiés

- ✅ `src/utils/scaffoldingExcelParser.ts` (nouveau)
- ✅ `src/components/StockManager.tsx`
- ✅ `src/components/SiteDetailsModal.tsx`

## Résultat

Les imports d'inventaire et de commandes d'échafaudage fonctionnent maintenant correctement avec :
- Détection automatique et flexible des colonnes
- Validation robuste des données
- Messages d'erreur informatifs
- Support complet des métadonnées
- Calculs automatiques des poids totaux
- Gestion des éléments hors service

Le système est maintenant prêt à importer des fichiers Excel d'échafaudage avec différents formats et variations de colonnes.
