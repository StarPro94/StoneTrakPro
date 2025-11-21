# Configuration OpenAI pour le Parsing PDF

## Migration de Chandra OCR vers OpenAI GPT-4o

Le système utilise désormais **OpenAI GPT-4o** pour l'extraction et le parsing des feuilles de débit PDF au lieu de Chandra OCR (DataLab).

## Avantages de la nouvelle solution

✅ **Pas d'abonnement coûteux** - Paiement uniquement à l'usage
✅ **Contrôle total** - Possibilité d'ajuster le prompt selon vos besoins
✅ **Logging exhaustif** - Traçabilité complète de chaque étape
✅ **Retry automatique** - 3 tentatives avec backoff exponentiel
✅ **Meilleure fiabilité** - Parsing précis avec validation automatique
✅ **Coûts prévisibles** - Environ 0,02€ par PDF traité

## Configuration requise

### 1. Obtenir une clé API OpenAI

1. Créez un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Ajoutez un moyen de paiement dans [Billing](https://platform.openai.com/account/billing)
3. Générez une clé API dans [API Keys](https://platform.openai.com/api-keys)
4. Copiez la clé (elle commence par `sk-...`)

**Important** : Gardez cette clé secrète et ne la partagez jamais.

### 2. Configurer la clé dans Supabase

#### Via le Dashboard Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase
2. Allez dans **Project Settings** → **Edge Functions** → **Secrets**
3. Cliquez sur **Add Secret**
4. Nom: `OPENAI_API_KEY`
5. Valeur: Votre clé OpenAI (commence par `sk-...`)
6. Cliquez sur **Save**

#### Via la CLI Supabase (Alternative)

```bash
supabase secrets set OPENAI_API_KEY=sk-votre-cle-ici
```

### 3. Redéployer la fonction Edge

Après avoir configuré la clé, redéployez la fonction:

1. Dans le Dashboard Supabase, allez dans **Edge Functions**
2. Sélectionnez `parse-pdf-intelligent`
3. Cliquez sur **Deploy**
4. Attendez que le déploiement soit terminé (statut vert)

## Fonctionnalités implémentées

### Système de logging exhaustif

Chaque extraction PDF génère des logs détaillés sauvegardés dans la table `pdf_extraction_logs`:

- Timestamp de chaque étape
- Contenu brut extrait (échantillon)
- Réponse complète de l'IA
- Erreurs avec stack traces
- Métriques de performance
- Tokens utilisés

**Accès aux logs** :
```sql
SELECT * FROM pdf_extraction_logs
WHERE user_id = 'votre-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Système de retry intelligent

- **3 tentatives automatiques** en cas d'échec
- **Backoff exponentiel** : 1s, 2s, 4s entre chaque tentative
- **Détection des erreurs** :
  - Rate limit (429) → retry automatique
  - Erreur serveur (5xx) → retry automatique
  - Erreur client (4xx) → échec immédiat
- **Nettoyage JSON** : Si le JSON est invalide, tentative de nettoyage automatique

### Validation automatique des données

- Recalcul des totaux M² et M³ à partir des items
- Détection d'écarts avec les valeurs du PDF (seuil 5%)
- Vérification de cohérence des types K/Q
- Détection d'anomalies sur les formats

### Apprentissage continu

Les corrections manuelles sont sauvegardées dans `ai_learning_data` et utilisées pour améliorer les extractions futures:

```typescript
// Automatique lors de la correction dans l'interface
{
  field_name: 'numeroOS',
  extracted_value: '2025F0148',  // Ce que l'IA a extrait
  corrected_value: '2025FO148',  // Correction manuelle
  confidence_score: 0.95
}
```

## Estimation des coûts

### Modèle GPT-4o

- **Input** : ~0,005$ / 1K tokens
- **Output** : ~0,015$ / 1K tokens

### Coût moyen par PDF

Pour un PDF typique de feuille de débit:
- Input: ~2000 tokens (prompt + PDF) = 0,01$
- Output: ~800 tokens (JSON structuré) = 0,012$
- **Total: ~0,022$ (0,02€) par PDF**

### Exemples de volumes mensuels

| PDFs/mois | Coût estimé |
|-----------|-------------|
| 50        | 1,10€       |
| 100       | 2,20€       |
| 500       | 11,00€      |
| 1000      | 22,00€      |

**Note** : Ces coûts incluent les 3 tentatives en cas d'échec.

## Monitoring et dépannage

### Vérifier que tout fonctionne

1. Importez un PDF de test
2. Vérifiez que l'extraction réussit
3. Consultez les logs dans le Dashboard Supabase:
   - **Edge Functions** → `parse-pdf-intelligent` → **Logs**
   - Recherchez "✅ Extraction success"

### Messages d'erreur courants

#### "Clé API OpenAI manquante"
→ La variable `OPENAI_API_KEY` n'est pas configurée
**Solution** : Suivez l'étape 2 de configuration

#### "OpenAI API error: 401"
→ Clé API invalide ou expirée
**Solution** : Générez une nouvelle clé sur OpenAI Platform

#### "OpenAI rate limit atteint"
→ Trop de requêtes en peu de temps
**Solution** : Attendez quelques secondes, le retry automatique gère cela

#### "Erreur parsing JSON OpenAI"
→ Le format de réponse est invalide
**Solution** : Le système tente automatiquement un nettoyage. Si l'erreur persiste, vérifiez les logs complets.

### Accéder aux logs détaillés

Dans la table `pdf_extraction_logs`, chaque entrée contient:

```typescript
{
  pdf_filename: "25FO050.pdf",
  extraction_status: "success",
  raw_data: {
    extraction_method: "openai",
    pdf_base64_sample: "JVBERi0x...",  // 1000 premiers caractères
    full_logs: [
      {
        timestamp: "2025-01-16T10:30:00Z",
        step: "openai_extraction_start",
        status: "info",
        data: { filename: "25FO050.pdf" }
      },
      // ... tous les logs de l'extraction
    ]
  },
  parsed_data: { /* Données extraites */ },
  errors: [],  // Anomalies détectées
  processing_time_ms: 3500
}
```

## Améliorer la précision du parsing

### Ajuster le prompt

Le prompt est défini dans la fonction `buildExtractionPrompt()`. Vous pouvez:

1. Ajouter des exemples spécifiques à vos PDFs
2. Préciser des patterns particuliers
3. Ajouter des règles de validation

### Utiliser l'apprentissage

Plus vous corrigez manuellement les données extraites, plus l'IA apprend:

1. Lors de la prévisualisation, corrigez les champs erronés
2. Les corrections sont automatiquement sauvegardées
3. Les 10 dernières corrections sont incluses dans le prompt
4. L'IA s'améliore progressivement

## Support et dépannage

### Problème persistant ?

1. **Vérifiez les logs** dans le Dashboard Supabase
2. **Consultez la table pdf_extraction_logs** pour voir les détails
3. **Testez avec un PDF simple** (1 page, peu d'items)
4. **Vérifiez votre crédit OpenAI** sur [OpenAI Platform](https://platform.openai.com/account/usage)

### Besoin d'aide ?

Ouvrez un ticket avec:
- Le nom du fichier PDF problématique
- Le message d'erreur exact
- Les logs de la table `pdf_extraction_logs` pour ce fichier
- L'ID de l'extraction concernée

---

**Dernière mise à jour** : Janvier 2025
**Version** : 2.0 (OpenAI GPT-4o)
