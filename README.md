VisionArt Back Office - Description Fonctionnelle & Architecture
1. OBJECTIF DU BACK OFFICE
Tableau de bord administratif permettant de visualiser, analyser et gérer toutes les données de l'application VisionArt. Interface réservée aux administrateurs pour le suivi en temps réel des métriques clés.

2. ARCHITECTURE GLOBALE
text
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR (Client)                      │
│         React/Next.js (Port 3000 - Interface Admin)        │
└───────────────────────────┬─────────────────────────────────┘
                            │ API Routes (/api/*)
┌───────────────────────────▼─────────────────────────────────┐
│                    NEXT.JS (Backend léger)                  │
│         • Routes API pour les statistiques                  │
│         • Authentification admin                            │
│         • Logique métier                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ Connexion directe (MySQL)
┌───────────────────────────▼─────────────────────────────────┐
│              BASE DE DONNÉES MYSQL EXISTANTE                │
│         • MÊME base que l'application mobile                │
│         • Tables: users, artworks, transactions, etc.       │
└─────────────────────────────────────────────────────────────┘
3. STRUCTURE DU PROJET
text
backoffice/
├── 📁 app/                    # Routes et pages (App Router Next.js)
│   ├── 📁 api/                # BACKEND - Toutes les routes API
│   │   ├── 📁 admin/           # Routes protégées (admin uniquement)
│   │   │   ├── 📁 dashboard/    # Données pour le dashboard
│   │   │   ├── 📁 users/        # Gestion des utilisateurs
│   │   │   ├── 📁 artworks/     # Gestion des œuvres
│   │   │   ├── 📁 stats/        # Statistiques avancées
│   │   │   └── 📁 reports/      # Génération de rapports
│   │   └── 📁 auth/             # Authentification admin
│   │
│   ├── 📁 (admin)/             # Groupe de routes pour l'admin
│   │   ├── 📁 dashboard/        # Page dashboard
│   │   ├── 📁 users/            # Page gestion utilisateurs
│   │   ├── 📁 artworks/         # Page gestion œuvres
│   │   ├── 📁 analytics/        # Page analytics détaillés
│   │   └── 📁 settings/         # Configuration
│   │
│   ├── 📁 (auth)/               # Routes d'authentification
│   │   ├── 📁 login/            # Page de connexion
│   │   └── 📁 logout/           # Déconnexion
│   │
│   └── 📄 layout.tsx             # Layout principal avec sidebar
│
├── 📁 components/              # FRONTEND - Composants réutilisables
│   ├── 📁 layout/               # Composants de structure
│   │   ├── 📄 Sidebar.tsx        # Menu latéral
│   │   ├── 📄 Header.tsx         # En-tête avec infos admin
│   │   └── 📄 Footer.tsx         # Pied de page
│   │
│   ├── 📁 cards/                # Cartes de statistiques
│   │   ├── 📄 StatCard.tsx       # Carte KPI générique
│   │   ├── 📄 UsersCard.tsx      # Carte utilisateurs
│   │   ├── 📄 RevenueCard.tsx    # Carte revenus
│   │   └── 📄 ActivityCard.tsx   # Carte activité
│   │
│   ├── 📁 charts/               # Graphiques et visualisations
│   │   ├── 📄 UsersChart.tsx     # Évolution utilisateurs
│   │   ├── 📄 GenerationsChart.tsx # Générations IA
│   │   ├── 📄 RevenueChart.tsx   # Évolution revenus
│   │   ├── 📄 PieChart.tsx       # Répartition (styles, etc.)
│   │   └── 📄 HeatmapChart.tsx   # Carte de chaleur géographique
│   │
│   ├── 📁 tables/                # Tableaux de données
│   │   ├── 📄 UsersTable.tsx     # Liste utilisateurs
│   │   ├── 📄 ArtworksTable.tsx  # Liste œuvres
│   │   └── 📄 TransactionsTable.tsx # Liste transactions
│   │
│   ├── 📁 forms/                 # Formulaires
│   │   ├── 📄 LoginForm.tsx      # Formulaire de connexion
│   │   └── 📄 FilterForm.tsx     # Filtres pour les tableaux
│   │
│   └── 📁 ui/                    # Composants UI génériques
│       ├── 📄 Button.tsx
│       ├── 📄 Input.tsx
│       ├── 📄 Select.tsx
│       ├── 📄 Modal.tsx
│       └── 📄 Spinner.tsx
│
├── 📁 lib/                      # BACKEND - Logique métier
│   ├── 📄 db.ts                  # Connexion à MySQL (MÊME DB)
│   ├── 📄 queries.ts              # Requêtes SQL réutilisables
│   ├── 📁 models/                 # Modèles de données
│   │   ├── 📄 UserModel.ts        # Opérations sur users
│   │   ├── 📄 ArtworkModel.ts     # Opérations sur artworks
│   │   └── 📄 StatsModel.ts       # Agrégations statistiques
│   │
│   ├── 📄 auth.ts                 # Logique d'authentification
│   ├── 📄 utils.ts                 # Fonctions utilitaires
│   └── 📄 constants.ts             # Constantes globales
│
├── 📁 hooks/                     # Custom React hooks
│   ├── 📄 useAuth.ts              # Hook authentification
│   ├── 📄 useStats.ts             # Hook récupération stats
│   └── 📄 useDebounce.ts          # Hook debounce pour recherche
│
├── 📁 types/                     # TypeScript type definitions
│   ├── 📄 user.ts                 # Types pour utilisateurs
│   ├── 📄 artwork.ts              # Types pour œuvres
│   └── 📄 api.ts                  # Types pour réponses API
│
├── 📁 public/                    # Assets statiques
│   ├── 📁 images/
│   └── 📁 icons/
│
├── 📄 middleware.ts               # Protection des routes admin
├── 📄 next.config.js              # Configuration Next.js
├── 📄 .env.local                  # Variables d'environnement
└── 📄 package.json
4. FLUX DE DONNÉES
A. Connexion Admin
text
1. Admin → Page login (/login)
2. Saisie identifiants
3. API (/api/auth/login) vérifie dans table `admins`
4. Génération JWT token
5. Redirection vers dashboard
6. Token inclus dans chaque requête API
B. Chargement Dashboard
text
1. Page dashboard (/dashboard) se charge
2. useEffect lance requêtes parallèles:
   - fetch('/api/admin/dashboard/main')
   - fetch('/api/admin/dashboard/users')
   - fetch('/api/admin/dashboard/activity')
3. API routes exécutent requêtes SQL sur la DB
4. Données formatées en JSON
5. Composants affichent avec états de chargement
C. Filtres et Recherche
text
1. Utilisateur sélectionne filtres (date, type, etc.)
2. Paramètres dans URL query string
3. API reçoit paramètres
4. Construction dynamique des requêtes SQL
5. Retour des données filtrées
5. FONCTIONNALITÉS PAR PAGE
📊 Page Dashboard (/dashboard)
text
Objectif: Vue d'ensemble instantanée de l'activité

Composants:
- Cartes KPI (4-6 en haut):
  * Total utilisateurs (+ nouveau aujourd'hui)
  * Total générations (+ aujourd'hui)
  * Revenus (mois en cours)
  * Taux de conversion
  * Utilisateurs actifs (24h/7j)
  * Temps moyen de génération

- Graphiques:
  * Évolution utilisateurs (30 jours)
  * Générations par jour (30 jours)
  * Répartition par style (camembert)
  * Activité par heure (heatmap)

- Tableaux récents:
  * Derniers utilisateurs inscrits
  * Dernières œuvres générées

- Alertes (si anomalies):
  * Baisse d'activité
  * Erreurs IA
  * Serveur lent
👥 Page Utilisateurs (/users)
text
Objectif: Gestion complète des utilisateurs

Vue principale:
- Tableau avec colonnes:
  * ID / Avatar
  * Nom d'utilisateur
  * Email
  * Date d'inscription
  * Dernière connexion
  * Total générations
  * Statut (actif/bloqué)
  * Actions (bloquer, voir détails)

Filtres:
- Par date d'inscription
- Par activité (actifs/inactifs)
- Par nombre de générations
- Par statut

Actions:
- Bloquer/Débloquer utilisateur
- Voir historique complet
- Exporter liste (CSV/Excel)
- Envoyer notification

Détail utilisateur (modal):
- Profil complet
- Historique des générations
- Styles préférés
- Appareils utilisés
- Localisations
- Transactions
🎨 Page Œuvres (/artworks)
text
Objectif: Visualiser et modérer les générations

Vue principale:
- Grille/Mosaïque des œuvres
- Tableau avec:
  * Image miniature
  * Titre / Prompt
  * Créateur
  * Style utilisé
  * Date de création
  * Likes / Vues
  * Statut (publié/signalé)
  * Actions

Filtres:
- Par style
- Par utilisateur
- Par période
- Par popularité
- Signalées uniquement

Actions:
- Masquer une œuvre
- Signaler un abus
- Voir prompt complet
- Télécharger image
📈 Page Analytics (/analytics)
text
Objectif: Analyses approfondies et tendances

Sections:

1. Général:
   * Croissance sur période personnalisable
   * Rétention utilisateurs (J7, J30, J90)
   * Taux de conversion gratuit → premium

2. IA & Générations:
   * Modèles les plus utilisés
   * Temps de génération moyen par modèle
   * Taux de succès / échec
   * Prompts les plus populaires

3. Contextes:
   * Styles les plus demandés
   * Moments de la journée
   * Météo associée
   * Localisations populaires

4. Monétisation:
   * Revenus par jour/semaine/mois
   * Produits les plus vendus
   * Taux d'abonnement
   * Churn rate

5. Prédictions:
   * Projections utilisateurs (ML)
   * Tendances styles
📊 Page Rapports (/reports)
text
Objectif: Génération et export de rapports

Types de rapports:
- Rapport quotidien (PDF)
- Rapport hebdomadaire
- Rapport mensuel
- Rapport personnalisé

Options:
- Période (date à date)
- Métriques à inclure
- Format (PDF/CSV/Excel)
- Envoi par email automatique

Rapports pré-définis:
- Activité utilisateurs
- Performance IA
- États financiers
- Top contenus
⚙️ Page Configuration (/settings)
text
Objectif: Paramètres du back office

Sections:
- Admins: Gestion des comptes admin
- Notifications: Configuration alertes
- API: Gestion clés d'accès
- Maintenance: Actions manuelles (cache, backup)
- Thème: Personnalisation interface
6. ROUTES API DÉTAILLÉES
typescript
// AUTHENTIFICATION
POST   /api/auth/login          → Connexion admin
POST   /api/auth/logout         → Déconnexion
GET    /api/auth/me             → Infos admin connecté

// DASHBOARD
GET    /api/admin/dashboard/main    → KPIs principaux
GET    /api/admin/dashboard/charts  → Données pour graphiques
GET    /api/admin/dashboard/recent  → Activités récentes

// UTILISATEURS
GET    /api/admin/users          → Liste paginée + filtres
GET    /api/admin/users/:id      → Détail utilisateur
PUT    /api/admin/users/:id/block → Bloquer utilisateur
PUT    /api/admin/users/:id/unblock → Débloquer
DELETE /api/admin/users/:id      → Supprimer (soft delete)
GET    /api/admin/users/:id/history → Historique complet

// ŒUVRES
GET    /api/admin/artworks       → Liste avec filtres
GET    /api/admin/artworks/:id   → Détail œuvre
PUT    /api/admin/artworks/:id/hide → Masquer
PUT    /api/admin/artworks/:id/show → Rendre visible
DELETE /api/admin/artworks/:id   → Supprimer

// STATISTIQUES
GET    /api/admin/stats/overview → Stats générales
GET    /api/admin/stats/users    → Stats utilisateurs
GET    /api/admin/stats/artworks → Stats générations
GET    /api/admin/stats/revenue  → Stats financières
GET    /api/admin/stats/trends   → Tendances et prédictions
GET    /api/admin/stats/export   → Export données brutes

// RAPPORTS
POST   /api/admin/reports/generate → Générer rapport
GET    /api/admin/reports/list   → Rapports générés
GET    /api/admin/reports/:id    → Télécharger rapport
DELETE /api/admin/reports/:id    → Supprimer rapport

// SYSTÈME
GET    /api/admin/health         → État connexion DB
GET    /api/admin/logs           → Logs récents
POST   /api/admin/cache/clear    → Vider cache
GET    /api/admin/config         → Configuration actuelle
7. SCHÉMA DE LA BASE DE DONNÉES (MÊME QUE L'APP)
sql
-- Tables existantes utilisées:
users
artworks
transactions
subscriptions
ai_generations_logs
user_activity

-- Tables supplémentaires pour le back office:
admin_users (id, email, password, role, last_login)
audit_logs (id, admin_id, action, target, timestamp)
reports (id, name, type, params, file_path, created_at)
notifications_settings (id, admin_id, type, enabled)
8. AUTHENTIFICATION ADMIN
typescript
// Table admin_users (séparée des users normaux)
- id: UUID (PK)
- email: string (unique)
- password: string (hashé)
- role: enum('super_admin', 'admin', 'viewer')
- last_login: timestamp
- created_at: timestamp
- is_active: boolean

// Permissions par rôle
super_admin: accès total + gestion admins
admin: tout sauf gestion admins
viewer: lecture seule
9. FLUX D'INTERACTION UTILISATEUR
text
1. Admin ouvre /login
2. Saisit email/mot de passe
3. API vérifie credentials dans admin_users
4. Génération JWT (durée 8h)
5. Redirection /dashboard
6. Navigation dans sidebar
7. Chaque page charge ses données via API
8. Possibilité d'exporter, filtrer, modifier
9. Logout → suppression token
10. MÉTRIQUES CLÉS À SURVEILLER
typescript
// Quotidiennes
- Nouveaux utilisateurs
- Générations totales
- Revenus
- Taux d'erreur IA
- Temps de réponse moyen

// Hebdomadaires
- Croissance utilisateurs
- Rétention
- Styles trending
- Utilisateurs actifs

// Mensuelles
- Chiffre d'affaires
- Évolution MRR
- Coûts infrastructure
- ROI par campagne
11. ALERTES ET NOTIFICATIONS
typescript
// Alertes automatiques (thresholds)
- Baisse d'activité > 20%
- Erreurs IA > 5%
- Serveur lent > 2s
- Nouveau utilisateur suspect
- Stockage presque plein

// Canaux
- In-app (notifications)
- Email (optionnel)
- Slack (optionnel)
12. SÉCURITÉ
text
- Routes API protégées par middleware
- JWT tokens avec expiration courte
- Rate limiting sur les endpoints
- Logs de toutes les actions admin
- IP whitelist optionnelle
- Double authentification optionnelle
13. PERFORMANCE
text
- Cache Redis pour les stats fréquentes
- Pagination sur tous les tableaux
- Requêtes SQL optimisées
- Lazy loading des images
- Debounce sur la recherche
- Préchargement des données fréquentes
14. ÉVOLUTIONS FUTURES
text
- Dashboard en temps réel (WebSockets)
- Export PDF avancé
- Analyse prédictive (ML)
- A/B testing dashboard
- Multi-langues
- Mode sombre
- Mobile responsive
- Intégration Stripe dashboard
15. STACK TECHNIQUE
text
Frontend:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (graphiques)
- Material-UI (composants)
- React Hook Form

Backend:
- Next.js API Routes
- MySQL2 (driver)
- JWT (authentification)
- Bcrypt (hash)

Outils:
- ESLint
- Prettier
- Husky (pre-commit)
- Jest (tests)
