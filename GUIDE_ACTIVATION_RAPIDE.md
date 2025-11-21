# 🚀 Guide d'activation rapide - Parsing PDF avec OpenAI

## ⚡ En 5 minutes chrono

### Étape 1 : Obtenir votre clé OpenAI (2 min)

1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Connectez-vous ou créez un compte
3. Ajoutez un moyen de paiement dans **Billing**
4. Allez dans [API Keys](https://platform.openai.com/api-keys)
5. Cliquez sur **Create new secret key**
6. Copiez la clé (commence par `sk-proj-...`)

**💰 Budget recommandé** : 5-10€ pour commencer (500 PDFs environ)

### Étape 2 : Configurer Supabase (1 min)

1. Connectez-vous à votre [Dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Project Settings** (⚙️)
4. Cliquez sur **Edge Functions** dans le menu latéral
5. Cliquez sur l'onglet **Secrets**
6. Cliquez sur **Add Secret**
7. Remplissez :
   - **Name** : `OPENAI_API_KEY`
   - **Value** : Votre clé OpenAI (collez-la ici)
8. Cliquez sur **Save**

✅ La clé est maintenant configurée et sécurisée !

### Étape 3 : Déployer la fonction (1 min)

1. Dans le Dashboard Supabase, allez dans **Edge Functions**
2. Trouvez la fonction `parse-pdf-intelligent`
3. Cliquez sur le bouton **Deploy** (🚀)
4. Attendez que le statut devienne vert (✅ Deployed)

**Note** : Si la fonction n'apparaît pas, vous devez d'abord la déployer via le code fourni.

### Étape 4 : Tester l'import (1 min)

1. Ouvrez votre application StoneTrak Pro
2. Allez dans le **Tableau de suivi**
3. Cliquez sur **Importer PDF**
4. Sélectionnez un PDF de feuille de débit
5. Attendez l'analyse (3-10 secondes)
6. Vérifiez les données extraites dans la prévisualisation
7. Cliquez sur **Confirmer l'import**

✅ **Ça marche !** Votre PDF a été analysé avec OpenAI GPT-4o

---

## 🔍 Vérification

### Comment savoir si ça fonctionne ?

#### ✅ Signes de succès

- Le PDF est analysé en 3-10 secondes
- La prévisualisation affiche toutes les données extraites
- Le message "Extraction method: openai" apparaît dans les logs
- Pas de message d'erreur

#### ❌ Signes d'échec

| Message d'erreur | Cause | Solution |
|------------------|-------|----------|
| "Clé API OpenAI manquante" | Variable non configurée | Refaire l'Étape 2 |
| "OpenAI API error: 401" | Clé invalide | Vérifier la clé dans OpenAI Platform |
| "OpenAI API error: 429" | Rate limit atteint | Attendre 1 minute ou augmenter le quota |
| "Timeout" | PDF trop lourd ou lent | Réessayer, le système a 3 tentatives |

### Consulter les logs détaillés

#### Via Supabase Dashboard

1. **Edge Functions** → `parse-pdf-intelligent` → **Logs**
2. Filtrez par date/heure de votre test
3. Recherchez "Extraction success" ou "Error"

#### Via SQL

```sql
-- Voir les 10 dernières extractions
SELECT
  pdf_filename,
  extraction_status,
  processing_time_ms,
  created_at,
  (parsed_data->>'overallConfidence')::int as confidence
FROM pdf_extraction_logs
ORDER BY created_at DESC
LIMIT 10;
```

```sql
-- Voir les logs complets d'une extraction
SELECT
  pdf_filename,
  raw_data->'full_logs' as logs,
  errors
FROM pdf_extraction_logs
WHERE pdf_filename = '25FO050.pdf'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 💡 Optimisation

### Améliorer la précision

#### 1. Corrigez les erreurs manuellement

Lors de la prévisualisation, corrigez les champs mal extraits :
- Ces corrections sont automatiquement sauvegardées
- Les 10 dernières corrections sont utilisées pour améliorer l'IA
- Plus vous corrigez, plus l'IA devient précise

#### 2. Ajustez le prompt si nécessaire

Si un type de champ est systématiquement mal extrait :

1. Ouvrez `supabase/functions/parse-pdf-intelligent/index.ts`
2. Trouvez la fonction `buildExtractionPrompt()`
3. Ajoutez des exemples spécifiques dans le prompt
4. Redéployez la fonction

**Exemple** : Ajouter un pattern pour un format de N°OS spécifique
```typescript
- numeroOS: après "OS N°:" ou "N° OS:" (ex: "2025FO148", "2024FA123")
+ numeroOS: après "OS N°:" ou "N° OS:" (ex: "2025FO148", "2024FA123", "25FO-001")
```

### Réduire les coûts

#### Option 1 : Limiter le contexte

Dans `attemptOpenAIExtraction()`, réduisez la taille du PDF envoyé :
```typescript
// Actuellement : 50 000 caractères
content: `...${base64Pdf.substring(0, 50000)}`

// Optimisé : 30 000 caractères (suffit pour 1-2 pages)
content: `...${base64Pdf.substring(0, 30000)}`
```

#### Option 2 : Utiliser gpt-4o-mini

Remplacez dans `attemptOpenAIExtraction()` :
```typescript
model: 'gpt-4o'        // 0,02€ par PDF
↓
model: 'gpt-4o-mini'   // 0,005€ par PDF (4x moins cher)
```

**Note** : gpt-4o-mini est moins précis mais largement suffisant pour des PDFs structurés.

---

## 📊 Suivi des coûts

### Via OpenAI Dashboard

1. [OpenAI Platform](https://platform.openai.com/) → **Usage**
2. Sélectionnez la période
3. Filtrez par modèle "gpt-4o"
4. Consultez les coûts et tokens utilisés

### Calcul approximatif

```
Coût par PDF = ~0,02€

Formule :
- Input : (prompt + PDF) ≈ 2000 tokens × 0,005$ / 1K = 0,01$
- Output : JSON structuré ≈ 800 tokens × 0,015$ / 1K = 0,012$
- Total : 0,022$ ≈ 0,02€

Avec 3 tentatives max en cas d'échec : 0,06€ max par PDF
```

### Budget mensuel recommandé

| Usage | PDFs/mois | Budget |
|-------|-----------|--------|
| Faible | 50 | 1-2€ |
| Moyen | 200 | 4-5€ |
| Élevé | 500 | 10-15€ |
| Très élevé | 1000+ | 25-30€ |

**Astuce** : Configurez des alertes sur OpenAI Platform :
- **Billing** → **Usage limits** → Set limit (ex: 20€/mois)

---

## 🆘 Dépannage rapide

### Problème : "Clé API manquante"

```bash
# Vérifier que la clé est bien configurée
supabase secrets list

# Devrait afficher : OPENAI_API_KEY

# Si absent, configurer :
supabase secrets set OPENAI_API_KEY=sk-votre-cle
```

### Problème : "Rate limit atteint"

**Cause** : Trop de requêtes en peu de temps

**Solutions** :
1. Attendre 1 minute (le retry automatique gère ça)
2. Augmenter votre quota OpenAI :
   - [OpenAI Platform](https://platform.openai.com/) → **Settings** → **Limits**
   - Augmenter le "Requests per minute" (default: 3-5)

### Problème : "Extraction incomplète"

**Cause** : PDF complexe ou format inhabituel

**Solutions** :
1. Vérifier le PDF manuellement
2. Consulter les logs pour voir ce qui a été extrait
3. Corriger manuellement les champs manquants
4. Ces corrections améliorent l'IA pour la prochaine fois

### Problème : "Timeout"

**Cause** : PDF trop lourd ou API lente

**Solutions** :
1. Le système réessaye automatiquement 3 fois
2. Si le problème persiste, essayer à un autre moment
3. Vérifier le statut d'OpenAI : [status.openai.com](https://status.openai.com/)

---

## 📞 Support

### Besoin d'aide ?

1. **Vérifiez d'abord les logs** (étape Vérification ci-dessus)
2. **Consultez la documentation** :
   - `CONFIGURATION_OPENAI.md` : Configuration détaillée
   - `MIGRATION_OPENAI_COMPLETE.md` : Détails techniques
3. **Testez avec un PDF simple** (1 page, peu d'items)
4. **Vérifiez votre crédit OpenAI** sur le Dashboard

### Informations à fournir si problème

- Nom du fichier PDF
- Message d'erreur exact
- Logs de `pdf_extraction_logs` pour ce fichier
- Timestamp de la tentative

---

## ✨ Félicitations !

Vous êtes maintenant prêt à utiliser le parsing PDF intelligent avec OpenAI GPT-4o !

**Rappel des avantages** :
- ✅ Pas d'abonnement mensuel
- ✅ Coût à l'usage (0,02€ par PDF)
- ✅ Logging exhaustif pour diagnostics
- ✅ 3 tentatives automatiques
- ✅ Apprentissage continu des corrections
- ✅ Contrôle total sur le prompt

**Prochaines étapes** :
1. Importez vos premiers PDFs réels
2. Corrigez les erreurs manuellement si besoin
3. L'IA s'améliorera progressivement
4. Surveillez les coûts sur OpenAI Platform

🎉 **Bon parsing !**

---

**Date** : Janvier 2025
**Version** : 2.0
**Temps d'activation** : ~5 minutes
