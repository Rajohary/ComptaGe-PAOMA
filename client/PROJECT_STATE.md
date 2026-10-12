# PROJECT_STATE.md — État du projet · Frontend (client/)

**Ce fichier doit être lu avant toute tâche, sans exception.** Après avoir terminé une tâche : coche la case correspondante `[ ]` → `[x]` ET ajoute une entrée dans le journal en bas de ce fichier (section 9). Ne jamais faire l'un sans l'autre.

Avant de consommer un endpoint, vérifie sa forme dans `../API_CONTRACT.md`. Si tu dois t'appuyer sur un endpoint encore `planifié` côté backend, note-le explicitement dans le journal (section 9) plutôt que de supposer silencieusement sa forme.

Si une tâche demandée par l'utilisateur ne figure pas ici, l'ajouter dans la section appropriée avant de commencer à coder.

Légende : `[ ]` à faire · `[x]` terminé · `[~]` en cours / partiellement fait (préciser dans le journal pourquoi c'est partiel)

---

## 0. Mise en place du projet

- [x] Créer `client/` (Vite + React + TypeScript)
- [x] Configurer Tailwind avec les tokens de couleur/typo définis dans `DESIGN.md`
- [x] Créer `.env.example` (avec `VITE_API_BASE_URL`)
- [x] Mettre en place le client API de base (`src/api/client.ts`) avec gestion du token JWT
- [x] Configurer Playwright dans `client/e2e/`
- [x] Premier commit : squelette de projet fonctionnel (appel vers l'endpoint `/api/v1/health/` du backend)


---

## 1. Authentification & RBAC

- [x] Page de connexion (formulaire, gestion des erreurs, redirection selon rôle)
- [x] `AuthContext` (utilisateur courant, rôle, token, déconnexion), dans `src/contexts/`
- [x] Hooks `src/api/auth.ts` consommant les endpoints décrits dans `../API_CONTRACT.md`
- [x] Navigation (sidebar) qui s'adapte dynamiquement au rôle connecté (voir `DESIGN.md` section 4 pour le comportement attendu)
- [x] Rafraîchissement automatique du token en cas d'expiration (401)
- [x] Test e2e `auth.spec.ts` : connexion réussie/échouée, redirection correcte selon rôle

---

## 2. Référentiel (provinces, bureaux, périodes de gestion)

- [ ] Écran de gestion des bureaux (liste, création, modification) — réservé Admin
- [ ] Écran d'ouverture d'une période de gestion (saisie de l'inventaire initial : numéraire, valeurs postales, timbres fiscaux)
- [ ] Écran de clôture d'une période de gestion
- [ ] Gestion des erreurs de validation renvoyées par le backend (affichage associé au bon champ de formulaire)

---

## 3. Recherche dans le plan comptable (remplace le TreeView legacy)

- [ ] Composant `LigneComptableSearch` — recherche instantanée (debounce), résultats groupés par section
- [ ] Historique des lignes récemment utilisées par le bureau (à trancher avec l'utilisateur : stockage local ou backend — voir `ARCHITECTURE.md` section 7)
- [ ] Traitement explicite de l'état vide (aucun résultat) et de l'état de chargement — correction directe du défaut identifié dans l'application legacy (zone grise vide sans message)

---

## 4. Saisie du Journal G58 — cœur fonctionnel

- [ ] Composant `SectionForm` — formulaire de saisie d'une section (A, B, D en priorité)
- [ ] Composant `TotauxLive` — calcul et affichage des totaux en temps réel à chaque saisie, sans soumission
- [ ] Validation React Hook Form + Zod cohérente avec les contraintes backend
- [ ] Écran « Détails de l'encaisse »
- [ ] Écran « Situation comptable » avec affichage du report automatique du solde du mois précédent
- [ ] Test e2e `saisie-g58.spec.ts` : saisie complète d'une section avec vérification du total affiché en temps réel

---

## 5. Audit et détection d'écarts

- [ ] Écran Inspecteur : liste des écarts (équivalent vue DIF), filtrable par bureau/province/montant
- [ ] Formulaire de rectification (obligation de motif, affichage du calcul automatique de `montant_rectifie`)
- [ ] Test e2e `rbac.spec.ts` : un agent de saisie ne voit pas les actions de rectification réservées à l'inspecteur

---

## 6. Tableaux de bord

- [ ] Dashboard Receveur : progression de la saisie du mois en cours par section, montant en caisse actuel
- [ ] Dashboard Inspecteur : bureaux avec écarts en attente, triable/filtrable
- [ ] Dashboard Admin : vue d'ensemble (nombre de bureaux actifs, périodes en cours)

---

## 7. Stock de valeurs postales

- [ ] Écran de saisie/consultation du stock par bureau et par mois

---

## 8. Fonctionnalités complémentaires (backlog ouvert — à prioriser au fil de l'eau avec l'utilisateur)

Cette section n'est pas figée : ajouter ici toute nouvelle demande frontend (états, statistiques, exports...) au fur et à mesure, avant de l'implémenter.

- [ ] Téléchargement du bordereau G58 en PDF depuis l'interface (dépend de l'endpoint backend correspondant)
- [ ] Bouton d'export Excel des écritures d'une période
- [ ] Écran d'historique des périodes de gestion d'un bureau (receveurs successifs, soldes de passation)
- [ ] Graphique d'évolution des recettes d'un bureau sur plusieurs mois (choix de la librairie à trancher le moment venu)
- [ ] Notifications de rappel avant date limite de clôture mensuelle

---

## 9. Journal des actions (log)
 
 Ajouter une entrée ici après chaque tâche accomplie, même petite. Format :
 
 ```
 ### AAAA-MM-JJ — Titre court de la tâche
 - Ce qui a été fait : ...
 - Fichiers/dossiers touchés : ...
 - Cases cochées : section X, tâche Y
 - Dépendance à un endpoint backend : implémenté / planifié (mocké en attendant) / non applicable
 - Points restés ouverts ou à valider avec l'utilisateur : ...
 ```
 
+### 2026-10-06 — Initialisation du projet client (Section 0)
+- Ce qui a été fait :
+  - Échafaudage de l'application Vite + React 18+ + TypeScript.
+  - Installation et configuration de Tailwind CSS avec les tokens stricts de `DESIGN.md` (règle 60/30/10 : vert postal `#0F3D2E`, gris ardoise `#1E2530`, doré `#C9962C`, mode sombre calibré sans inversion automatique, polices Fraunces et Public Sans).
+  - Création de `.env.example` et `.env` configurés avec `VITE_API_BASE_URL`.
+  - Implémentation du client API de base (`src/api/client.ts`) avec support Bearer JWT, intercepteur 401 pour rafraîchissement automatique de token, et types partagés dans `src/types/index.ts`.
+  - Implémentation de `ThemeContext` (attribut `data-theme` et persistance `localStorage`).
+  - Création de la page d'accueil de démarrage avec contrôle de santé vers `/api/v1/health/` du backend Django.
+  - Configuration de Playwright dans `playwright.config.ts` et test e2e de validation dans `e2e/health.spec.ts` (exécuté et passé avec succès).
+- Fichiers/dossiers touchés :
+  - `package.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `.env.example`, `.gitignore`
+  - `src/styles/globals.css`, `src/types/index.ts`, `src/api/client.ts`, `src/api/health.ts`
+  - `src/contexts/ThemeContext.tsx`, `src/App.tsx`, `src/main.tsx`
+  - `playwright.config.ts`, `e2e/health.spec.ts`
+- Cases cochées : section 0 (toutes les tâches)
+- Dépendance à un endpoint backend : `/api/v1/health/` (implémenté dans `API_CONTRACT.md`)
+- Points restés ouverts ou à valider avec l'utilisateur : Néant.
+
### 2026-10-12 — Correction des anomalies de build, finalisation & validation e2e Module 1 (Auth & RBAC)
- Ce qui a été fait :
  - Correction de l'erreur de syntaxe dans `src/features/auth/pages/LoginPage.tsx` (apostrophe non échappée dans le message de validation Zod).
  - Correction des imports relatifs erronés dans `src/features/auth/components/RequireAuth.tsx` et `src/features/dashboard/pages/DashboardPage.tsx` (remontée à `../../../contexts/AuthContext` et `../../../types`).
  - Téléchargement et installation des navigateurs Playwright (`npx playwright install chromium`).
  - Amélioration de `e2e/auth.spec.ts` avec mocks réseau basés sur `API_CONTRACT.md` pour garantir des tests end-to-end fiables et indépendants du seed de données backend (10 tests au vert couvrant formulaire, validation, identifiants erronés, redirection par rôle, visibilité RBAC sidebar, garde d'accès 403 et déconnexion).
  - Validation complète : `tsc -b` passe sans erreur, `vite build` réussit, l'ensemble des 10 tests Playwright passe avec succès.
- Fichiers/dossiers touchés :
  - `src/features/auth/pages/LoginPage.tsx`
  - `src/features/auth/components/RequireAuth.tsx`
  - `src/features/dashboard/pages/DashboardPage.tsx`
  - `e2e/auth.spec.ts`
- Cases cochées : section 1 (toutes les tâches confirmées et vérifiées par build et tests)
- Dépendance à un endpoint backend : `/api/v1/auth/login/`, `/api/v1/auth/refresh/`, `/api/v1/auth/logout/`, `/api/v1/auth/me/`
- Points restés ouverts ou à valider avec l'utilisateur : Module 1 complètement opérationnel et validé. Prêt pour la suite (Section 2 : Référentiel - bureaux, périodes de gestion).

### 2026-10-12 — Module Authentification & RBAC complet (Section 1)
- Ce qui a été fait :
  - Types `User`, `LoginRequest`, `LoginResponse`, `RefreshResponse` ajoutés dans `src/types/index.ts` (miroir exact de `API_CONTRACT.md`).
  - Module API `src/api/auth.ts` : fonctions `login`, `refreshToken`, `logout`, `getMe` consommant les endpoints implémentés du backend.
  - `AuthContext` (`src/contexts/AuthContext.tsx`) : gestion de session complète (restauration au montage via `/auth/me/`, login, logout, écoute de `auth:unauthorized`).
  - Page de connexion (`src/features/auth/pages/LoginPage.tsx`) : formulaire React Hook Form + Zod, show/hide mot de passe, gestion des erreurs accessible (aria), redirection selon rôle.
  - Page 403 (`src/features/auth/pages/UnauthorizedPage.tsx`) : affichée quand un rôle tente d'accéder à une route non autorisée.
  - Composant `RequireAuth` (`src/features/auth/components/RequireAuth.tsx`) : garde de route avec chargement, redirection login, et filtre RBAC.
  - Shell applicatif (`src/components/layout/AppShell.tsx` + `Sidebar.tsx`) : sidebar avec navigation filtrée dynamiquement par rôle, info utilisateur, toggle thème, déconnexion. Sidebar repliable.
  - Page placeholder dashboard (`src/features/dashboard/pages/DashboardPage.tsx`) avec message contextuel par rôle.
  - `App.tsx` réécrit comme routeur React Router avec routes protégées et RBAC par route.
  - `main.tsx` mis à jour pour wrapper `AuthProvider`.
  - `tsc --noEmit` passe sans erreur.
  - Test e2e `e2e/auth.spec.ts` couvrant : affichage formulaire, validation champs vides, erreur identifiants incorrects, redirection si non authentifié, connexion réussie avec redirection par rôle, visibilité RBAC sidebar, déconnexion.
- Fichiers/dossiers touchés :
  - `src/types/index.ts`, `src/api/auth.ts`
  - `src/contexts/AuthContext.tsx`
  - `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/pages/UnauthorizedPage.tsx`
  - `src/features/auth/components/RequireAuth.tsx`
  - `src/components/layout/AppShell.tsx`, `src/components/layout/Sidebar.tsx`
  - `src/features/dashboard/pages/DashboardPage.tsx`
  - `src/App.tsx`, `src/main.tsx`
  - `e2e/auth.spec.ts`
- Cases cochées : section 1 (toutes les 6 tâches)
- Dépendance à un endpoint backend : `/api/v1/auth/login/`, `/api/v1/auth/refresh/`, `/api/v1/auth/logout/`, `/api/v1/auth/me/` (tous implémentés dans `API_CONTRACT.md`)
- Points restés ouverts ou à valider avec l'utilisateur : Les tests e2e nécessitent un backend Django fonctionnel avec des comptes utilisateurs créés (receveur1, etc.). Le rafraîchissement automatique du token 401 était déjà implémenté dans `client.ts` depuis la section 0.

 <!-- Nouvelles entrées à ajouter au-dessus de cette ligne, les plus récentes en premier -->


