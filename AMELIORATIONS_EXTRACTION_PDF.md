# Améliorations de l'extraction PDF - 2025-11-16

## Problèmes résolus

### 1. Numéro ARC non extrait
**Avant :** Le numéro ARC n'était pas récupéré dans certains PDFs malgré sa présence (ex: "11766")

**Solution :**
- Ajout d'une nouvelle fonction `extractARCWithStructuredData()` qui utilise les coordonnées X/Y des éléments de texte
- Recherche du numéro ARC à proximité du label "ARC N°" dans le document
- Recherche dans la zone supérieure droite du document (où l'ARC est généralement situé)
- Fallback avec regex améliorée: `/(?:ARC|Arc)\s*[N°:]*\s*(\d{4,6})/i`

### 2. Client non extrait
**Avant :** Le nom du client restait vide (ex: "PIERRE NOEL" non détecté)

**Solution :**
- Ajout d'une nouvelle fonction `extractClientWithStructuredData()` utilisant la position relative
- Recherche du client dans la zone proche du label "Chantier :" (généralement au-dessus ou à côté)
- Filtrage amélioré pour exclure les mots-clés parasites tout en gardant les vrais noms de clients
- Recherche sur la même ligne et dans une zone de 100 pixels au-dessus de "Chantier"

### 3. Fourniture et Épaisseur non retournées
**Avant :** Ces valeurs étaient calculées mais n'apparaissaient pas dans la réponse de l'API

**Solution :**
- Ajout de `fourniture` et `epaisseur` dans l'interface `ParsedData`
- Calcul de ces valeurs via les fonctions existantes `determineMostFrequentMaterial()` et `determineThickness()`
- Inclusion dans l'objet `extracted_data` de la réponse API (lignes 107-108)

## Modifications techniques

### Fichier modifié
`/tmp/cc-agent/55813320/project/supabase/functions/parse-pdf-debit/index.ts`

### Changements apportés

1. **Interface ParsedData étendue** (lignes 23-38)
   ```typescript
   interface ParsedData {
     // ... champs existants
     fourniture: string;  // NOUVEAU
     epaisseur: string;   // NOUVEAU
   }
   ```

2. **Fonction parseDebitSheetData améliorée** (lignes 162-185)
   - Extraction ARC avec fallback sur données structurées
   - Extraction client avec fallback sur données structurées
   - Calcul et inclusion de fourniture et épaisseur

3. **Nouvelle fonction extractARCWithStructuredData()** (lignes 440-491)
   - Recherche séquentielle dans les éléments du PDF
   - Recherche par proximité Y (moins de 20 pixels)
   - Recherche dans zone supérieure droite (x > 400, y > 700)
   - Regex fallback améliorée

4. **Nouvelle fonction extractClientWithStructuredData()** (lignes 493-547)
   - Localisation du label "Chantier"
   - Filtrage des candidats dans une zone de 100px autour
   - Exclusion des mots-clés parasites
   - Validation de la longueur du nom (3-100 caractères)

5. **Logging amélioré** (lignes 210-218)
   - Récapitulatif de toutes les données extraites
   - Indicateur visuel ❌ VIDE pour les champs manquants
   - Aide au débogage en cas de problème

6. **Réponse API enrichie** (lignes 100-109)
   ```typescript
   extracted_data: {
     commercial: parsedData.commercial,
     client: parsedData.client,
     numero_os: parsedData.numeroOS,
     numero_arc: parsedData.numeroARC,
     date_arc: parsedData.dateArc,
     chantier: parsedData.chantier,
     fourniture: parsedData.fourniture,  // NOUVEAU
     epaisseur: parsedData.epaisseur,    // NOUVEAU
   }
   ```

## Résultat attendu

Avec le PDF exemple (2025FO210), la réponse devrait maintenant contenir :

```json
{
  "success": true,
  "sheet_id": "cd5f591e-88be-4ed9-b4cf-a3751b97bd1d",
  "items_count": 4,
  "total_m2": 3.204,
  "total_m3": 0,
  "extracted_data": {
    "commercial": "AMIC",
    "client": "PIERRE NOEL",          // ✅ CORRIGÉ
    "numero_os": "2025FO210",
    "numero_arc": "11766",            // ✅ CORRIGÉ
    "date_arc": "26/08/2025",
    "chantier": "230138 CHAALIS",
    "fourniture": "CLM LM K3",        // ✅ AJOUTÉ
    "epaisseur": "3"                  // ✅ AJOUTÉ
  }
}
```

## Test et vérification

1. **Déploiement :** ✅ La fonction Edge a été déployée avec succès sur Supabase
2. **Build frontend :** ✅ Le projet compile sans erreur
3. **Interface TypeScript :** ✅ Déjà à jour avec les champs `fourniture` et `epaisseur`

## Compatibilité

- Les anciennes extractions continuent de fonctionner (rétrocompatibilité totale)
- Les fallbacks assurent qu'aucune donnée n'est perdue même si la structure du PDF varie
- Le logging détaillé permet d'identifier rapidement les problèmes d'extraction

## Prochaines étapes suggérées

1. Tester l'import du PDF 2025FO210 via l'interface
2. Vérifier les logs dans la console pour confirmer l'extraction
3. Vérifier que le tableau de suivi affiche correctement toutes les colonnes
4. Tester avec d'autres PDFs du même format pour valider la robustesse
