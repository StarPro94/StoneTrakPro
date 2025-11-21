# Guide de test - Extraction PDF améliorée

## Comment tester les corrections

### 1. Préparer le test

1. Ouvrez votre application dans le navigateur
2. Connectez-vous avec un compte ayant les droits d'import
3. Ouvrez la console développeur (F12) pour voir les logs détaillés

### 2. Importer le PDF de test

1. Dans le tableau de suivi, cliquez sur le bouton d'import PDF
2. Sélectionnez le fichier `2025FO210.pdf` (ou tout autre PDF au format DBPM)
3. Attendez la fin du traitement

### 3. Vérifier dans la console

Vous devriez voir des logs détaillés comme :

```
📄 Extraction du texte du PDF avec données positionnelles...
🔍 Parsing des données de la feuille de débit...
📊 Parsing des items du tableau avec données structurées...
📍 En-tête du tableau trouvé à y = 645.36
✓ Item extrait: CLM - LM K3 - 91x63.5x3
✓ Item extrait: CLM - LM K3 - 161.3x63.5x3
✓ Item extrait: CLM - LM K3 - 123.8x63.5x3
✓ Item extrait: CLM - LM K3 - 128.5x63.5x3

📋 Données extraites récapitulatif:
   Commercial: AMIC
   Client: PIERRE NOEL          ← Devrait être rempli
   N° OS: 2025FO210
   N° ARC: 11766                ← Devrait être rempli
   Date ARC: 26/08/2025
   Fourniture: CLM LM K3        ← Devrait être rempli
   Épaisseur: 3                 ← Devrait être rempli
   Chantier: 230138 CHAALIS

✅ Extraction terminée: 4 items trouvés
```

### 4. Vérifier la réponse API

Dans la console, vous devriez voir une réponse JSON complète :

```json
{
  "success": true,
  "sheet_id": "...",
  "items_count": 4,
  "total_m2": 3.204,
  "total_m3": 0,
  "extracted_data": {
    "commercial": "AMIC",
    "client": "PIERRE NOEL",      ← DOIT ÊTRE REMPLI
    "numero_os": "2025FO210",
    "numero_arc": "11766",        ← DOIT ÊTRE REMPLI
    "date_arc": "26/08/2025",
    "chantier": "230138 CHAALIS",
    "fourniture": "CLM LM K3",    ← DOIT ÊTRE REMPLI
    "epaisseur": "3"              ← DOIT ÊTRE REMPLI
  }
}
```

### 5. Vérifier dans le tableau de suivi

La nouvelle ligne ajoutée devrait contenir :
- ✅ Commercial : AMIC
- ✅ Client : PIERRE NOEL (pas vide !)
- ✅ N° OS : 2025FO210
- ✅ N° ARC : 11766 (pas vide !)
- ✅ Fourniture : CLM LM K3 (pas vide !)
- ✅ Épaisseur : 3 (pas vide !)
- ✅ Date ARC : 26/08/2025
- ✅ Chantier : 230138 CHAALIS

### 6. Vérifier dans la base de données

Si vous avez accès à Supabase Studio :

```sql
SELECT
  cial,
  nom_client,
  numero_os,
  numero_arc,
  fourniture,
  epaisseur,
  ref_chantier
FROM debit_sheets
WHERE numero_os = '2025FO210'
ORDER BY created_at DESC
LIMIT 1;
```

Résultat attendu :
```
cial  | nom_client  | numero_os  | numero_arc | fourniture | epaisseur | ref_chantier
------|-------------|------------|------------|------------|-----------|----------------
AMIC  | PIERRE NOEL | 2025FO210  | 11766      | CLM LM K3  | 3         | 230138 CHAALIS
```

## Cas de problème

### Si le numéro ARC reste vide

Vérifiez dans les logs :
```
📍 Extraction ARC avec données structurées: ...
```

Si vous voyez `⚠️ Numéro ARC non trouvé`, cela signifie que :
- Le format du PDF est très différent
- Le numéro ARC n'est pas dans la zone attendue

### Si le client reste vide

Vérifiez dans les logs :
```
📍 Extraction client avec données structurées: ...
```

Si vous voyez `⚠️ Client non trouvé avec données structurées`, cela signifie que :
- Le client n'est pas à proximité du champ "Chantier"
- Le nom du client contient des caractères spéciaux non gérés

### Si la fourniture ou l'épaisseur sont vides

Cela peut arriver si :
- Aucun item n'a été extrait du tableau (vérifier `items_count`)
- Les items extraits n'ont pas de matériau valide

## Logs de débogage détaillés

Pour activer plus de logs, ouvrez la console des Edge Functions dans Supabase :
1. Allez sur dashboard.supabase.com
2. Sélectionnez votre projet
3. Allez dans "Edge Functions"
4. Sélectionnez "parse-pdf-debit"
5. Cliquez sur "Logs"

Vous pourrez voir tous les `console.log()` du serveur en temps réel.

## Fichiers de test disponibles

Dans le dossier `supabase/data/raw_pdfs/`, vous avez plusieurs PDFs de test :
- `25FA06.pdf`
- `25FO050.pdf`
- `25FO055.pdf`
- `2024FO115.pdf`
- `2025FO148 11742.pdf`

Testez avec plusieurs pour vérifier la robustesse de l'extraction.

## En cas de bug

Si vous constatez qu'un champ n'est toujours pas extrait :
1. Vérifiez les logs de la console (F12)
2. Notez le PDF problématique
3. Vérifiez la structure du PDF (où se trouve l'info manquante ?)
4. Ajustez les coordonnées X/Y dans les fonctions d'extraction si nécessaire

Les fonctions à ajuster sont dans :
`supabase/functions/parse-pdf-debit/index.ts`
- `extractARCWithStructuredData()` pour le numéro ARC
- `extractClientWithStructuredData()` pour le client
