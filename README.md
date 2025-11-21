# StoneTrak Pro - Application Web

Système de gestion des feuilles de débit pour la pierre - Application web avec base de données cloud

## 🚀 Fonctionnalités

- ✅ **Authentification sécurisée** avec Supabase
- ✅ **Import automatique de feuilles de débit PDF** avec parsing robuste côté serveur
- ✅ **Base de données cloud** PostgreSQL via Supabase
- ✅ **Tableau de suivi des commandes** en temps réel
- ✅ **Calcul automatique des surfaces (M²) et volumes (M³)**
- ✅ **Gestion des épaisseurs multiples** avec logique métier avancée
- ✅ **Système de check-in pour les éléments** avec synchronisation cloud
- ✅ **Rapports hebdomadaires/mensuels** avec graphiques interactifs
- ✅ **Interface responsive** optimisée pour tous les appareils
- ✅ **Sécurité Row Level Security (RLS)** - chaque utilisateur ne voit que ses données

## 🏗️ Architecture

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** pour le design
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes
- **Vite** comme bundler

### Backend
- **Supabase** pour la base de données PostgreSQL
- **Supabase Auth** pour l'authentification
- **Edge Functions** pour le parsing PDF côté serveur
- **Row Level Security** pour la sécurité des données

### Parsing PDF Intelligent (OpenAI GPT-4o)
- **Intelligence Artificielle OpenAI GPT-4o** pour extraction précise
- **Logging exhaustif** pour traçabilité complète
- **Retry automatique** avec 3 tentatives et backoff exponentiel
- **Apprentissage continu** des corrections manuelles
- **Validation automatique** des données extraites
- **Gestion des suffixes K/Q** pour les calculs M²/M³
- **Support des épaisseurs multiples**

## 🛠️ Configuration

### 1. Configuration Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com)
2. Cliquez sur "Connect to Supabase" dans l'interface Bolt
3. Les migrations de base de données seront appliquées automatiquement

### 2. Variables d'environnement

#### Frontend (automatiques)
- `VITE_SUPABASE_URL` - URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` - Clé publique Supabase

#### Backend (à configurer manuellement)
- `OPENAI_API_KEY` - Clé API OpenAI pour le parsing PDF

**📖 Guide de configuration** : Consultez `GUIDE_ACTIVATION_RAPIDE.md` pour configurer OpenAI en 5 minutes

### 3. Déploiement

L'application peut être déployée sur :
- **Bolt Hosting** (recommandé)
- Vercel
- Netlify
- Firebase Hosting

## 📋 Utilisation

### Première connexion
1. Créez un compte avec votre email et mot de passe
2. Vous serez automatiquement connecté (pas de confirmation email requise)

### Import de PDF
1. Cliquez sur "Importer PDF" dans le tableau de suivi
2. Sélectionnez votre fichier PDF de feuille de débit
3. Le système extraira automatiquement :
   - Commercial (Resp :)
   - Numéro OS (OS N° :)
   - Nom du client
   - Matériaux et type de calcul (K/Q)
   - Numéro ARC et date
   - Délai de livraison
   - Détail des éléments avec dimensions

### Gestion des commandes
- **Visualisation** : Cliquez sur l'œil pour voir le détail d'une feuille
- **Modification** : Cliquez sur le crayon pour éditer les informations
- **Suivi** : Cochez les éléments terminés dans la vue détaillée
- **Statuts** : Marquez les commandes comme finies ou livrées

### Rapports
- Consultez les statistiques par semaine, mois ou année
- Visualisez les tendances avec des graphiques interactifs
- Analysez les performances de production

## 🔒 Sécurité

- **Authentification obligatoire** pour accéder aux données
- **Row Level Security** : chaque utilisateur ne voit que ses propres feuilles
- **Validation côté serveur** pour tous les imports PDF
- **HTTPS** automatique en production

## 📊 Parsing PDF Intelligent avec OpenAI

### Fonctionnalités avancées

Le système utilise **OpenAI GPT-4o** pour extraire automatiquement :
- **Suffixe K** : Calcul en M² uniquement
- **Suffixe Q** : Calcul en M³ uniquement
- **Épaisseurs multiples** : Gestion intelligente (> 3 = "Q")
- **Formats variables** : Adaptation aux différents layouts PDF

### Avantages

- ✅ **Précision élevée** grâce à l'IA de pointe
- ✅ **Logging complet** de chaque extraction pour diagnostic
- ✅ **3 tentatives automatiques** en cas d'échec
- ✅ **Apprentissage continu** des corrections manuelles
- ✅ **Coût prévisible** : ~0,02€ par PDF (pas d'abonnement)
- ✅ **Validation automatique** avec recalcul des totaux

### Documentation

- **Guide rapide** : `GUIDE_ACTIVATION_RAPIDE.md` - Configuration en 5 min
- **Configuration détaillée** : `CONFIGURATION_OPENAI.md` - Toutes les options
- **Détails techniques** : `MIGRATION_OPENAI_COMPLETE.md` - Architecture complète

## 🚀 Scripts de développement

```bash
# Développement local
npm run dev

# Construction pour production
npm run build

# Aperçu de la version construite
npm run preview

# Linting du code
npm run lint
```

## 📝 Structure des données

### Feuille de débit
- Informations commerciales (commercial, client, commande)
- Spécifications techniques (matériau, épaisseur, dimensions)
- Suivi de production (statuts, dates)
- Calculs automatiques (M², M³)

### Éléments de débit
- Description détaillée de chaque pièce
- Dimensions précises (longueur, largeur, épaisseur)
- Quantités et statut de réalisation
- Calculs individuels de surface/volume

---

**StoneTrak Pro** - La solution complète pour la gestion de vos feuilles de débit en pierre naturelle.