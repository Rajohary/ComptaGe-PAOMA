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

- [ ] Page de connexion (formulaire, gestion des erreurs, redirection selon rôle)
- [ ] `AuthContext` (utilisateur courant, rôle, token, déconnexion), dans `src/contexts/`
- [ ] Hooks `src/api/auth.ts` consommant les endpoints décrits dans `../API_CONTRACT.md`
- [ ] Navigation (sidebar) qui s'adapte dynamiquement au rôle connecté (voir `DESIGN.md` section 4 pour le comportement attendu)
- [ ] Rafraîchissement automatique du token en cas d'expiration (401)
- [ ] Test e2e `auth.spec.ts` : connexion réussie/échouée, redirection correcte selon rôle

---

## 2. Référentiel (provinces, bureaux, périodes de gestion)

- [x] Écran de gestion des bureaux (liste, création, modification) — réservé Admin
- [x] Écran d'ouverture d'une période de gestion (saisie de l'inventaire initial : numéraire, valeurs postales, timbres fiscaux)
- [x] Écran de clôture d'une période de gestion
- [x] Gestion des erreurs de validation renvoyées par le backend (affichage associé au bon champ de formulaire)

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

### 2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4)
- Ce qui a été fait :
  - Création de l'utilitaire générique [src/lib/formErrors.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/lib/formErrors.ts) (`applyServerValidationErrors`) pour mapper automatiquement les réponses DRF (`{ field: ["message", ...] }`) vers React Hook Form (`setError`), en évitant les erreurs orphelines et en distinguant les erreurs de champ des erreurs globales `detail`.
  - Intégration de cette fonction dans les formulaires du référentiel : [BureauFormModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/bureaux/components/BureauFormModal.tsx) et [PeriodeGestionFormModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/periodes-gestion/components/PeriodeGestionFormModal.tsx).
  - Liaison programmatique et accessible des messages d'erreur aux champs correspondants via `aria-describedby` et `aria-invalid` dans [Input.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/ui/Input.tsx) et [Select.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/ui/Select.tsx).
  - Ajout et exécution des tests e2e Playwright dédiés dans [e2e/bureaux.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/bureaux.spec.ts) et [e2e/periodes-gestion.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/periodes-gestion.spec.ts) vérifiant que les erreurs 400 DRF (ex. unicité codique, cohérence dates, montants négatifs) apparaissent sous leurs champs respectifs.
- Fichiers/dossiers touchés :
  - `src/lib/formErrors.ts`
  - `src/features/bureaux/components/BureauFormModal.tsx`
  - `src/features/periodes-gestion/components/PeriodeGestionFormModal.tsx`
  - `e2e/bureaux.spec.ts`, `e2e/periodes-gestion.spec.ts`
- Cases cochées : section 2, tâche 4 (« Gestion des erreurs de validation renvoyées par le backend (affichage associé au bon champ de formulaire) »)
- Dépendance à un endpoint backend : implémenté (format DRF standard documenté dans `API_CONTRACT.md`)
- Points restés ouverts ou à valider avec l'utilisateur : Néant.


### 2026-10-12 — Écran de clôture d'une période de gestion (Section 2, Tâche 3)
- Ce qui a été fait :
  - Création du composant modal [ClotureModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/periodes-gestion/components/ClotureModal.tsx) présentant un avertissement institutionnel clair, le récapitulatif complet de la période (bureau, dates, receveur, montants initiaux en Ariary), la confirmation sécurisée et l'affichage des erreurs serveur.
  - Intégration du bouton d'action « Clôturer » dans la table des périodes sur [PeriodesGestionPage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/periodes-gestion/PeriodesGestionPage.tsx) (visible uniquement pour les périodes encore ouvertes « En cours », badge « Verrouillée » pour les périodes déjà clôturées).
  - Branchement de l'appel API `POST /api/v1/periodes-gestion/{id}/cloturer/` et rafraîchissement réactif de la liste.
  - Test e2e Playwright dans [e2e/periodes-gestion.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/periodes-gestion.spec.ts) validant l'ouverture de la boîte de dialogue de clôture, le récapitulatif solennel et la confirmation réussie de la clôture (8/8 tests passés au vert).
- Fichiers/dossiers touchés :
  - `src/features/periodes-gestion/components/ClotureModal.tsx`
  - `src/features/periodes-gestion/PeriodesGestionPage.tsx`
  - `e2e/periodes-gestion.spec.ts`
- Cases cochées : section 2, tâche 3 (« Écran de clôture d'une période de gestion »)
- Dépendance à un endpoint backend : `/api/v1/periodes-gestion/{id}/cloturer/` (implémenté dans `API_CONTRACT.md`)
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-12 — Écran d'ouverture d'une période de gestion (Section 2, Tâche 2)
- Ce qui a été fait :
  - Définition des types TypeScript `PeriodeGestion` et `PeriodeGestionFormData` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts).
  - Ajout des fonctions API `getPeriodesGestion`, `createPeriodeGestion` et `cloturerPeriodeGestion` dans [src/api/referentiel.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/referentiel.ts) pour consommer `/api/v1/periodes-gestion/`.
  - Implémentation du formulaire modal [PeriodeGestionFormModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/periodes-gestion/components/PeriodeGestionFormModal.tsx) avec saisie de l'inventaire initial obligatoire (numéraire, valeurs postales, timbres fiscaux), validation Zod (montants positifs ou nuls, cohérence date fin >= date début), calcul instantané et affichage dynamique du total de l'inventaire initial, et mapping des erreurs serveur.
  - Implémentation de la page [PeriodesGestionPage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/periodes-gestion/PeriodesGestionPage.tsx) avec listing des périodes, indicateurs d'inventaire initial, statut (en cours / clôturée), recherche filtrante instantanée et modale d'ouverture.
  - Intégration de la navigation dans [Sidebar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Sidebar.tsx) et de la route `/periodes-gestion` dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx).
  - Rédaction et exécution du test e2e Playwright dans [e2e/periodes-gestion.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/periodes-gestion.spec.ts) (vérification du listing, du calcul live du total d'inventaire initial et de la soumission du formulaire).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/referentiel.ts`
  - `src/features/periodes-gestion/PeriodesGestionPage.tsx`, `src/features/periodes-gestion/components/PeriodeGestionFormModal.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/App.tsx`
  - `e2e/periodes-gestion.spec.ts`
- Cases cochées : section 2, tâche 2 (« Écran d'ouverture d'une période de gestion (saisie de l'inventaire initial : numéraire, valeurs postales, timbres fiscaux) »)
- Dépendance à un endpoint backend : `/api/v1/periodes-gestion/` (implémenté dans `API_CONTRACT.md`)
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-12 — Écran de gestion des bureaux (Section 2, Tâche 1)
- Ce qui a été fait :
  - Définition des types TypeScript `Province`, `Bureau`, `BureauFormData`, `PaginatedResponse` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts).
  - Création des fonctions API dans [src/api/referentiel.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/referentiel.ts) pour consommer `/api/v1/bureaux/` (GET, POST, PATCH, DELETE) et `/api/v1/provinces/` (GET).
  - Création des composants d'interface réutilisables selon `DESIGN.md` : [Button.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/ui/Button.tsx), [Input.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/ui/Input.tsx), [Select.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/ui/Select.tsx), [Modal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/ui/Modal.tsx).
  - Création du layout applicatif avec navigation persistante [Sidebar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Sidebar.tsx), [Topbar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Topbar.tsx) et [AppLayout.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/AppLayout.tsx).
  - Implémentation du formulaire modal [BureauFormModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/bureaux/components/BureauFormModal.tsx) avec React Hook Form et validation Zod, ainsi que le mapping des erreurs API du backend sur les champs.
  - Implémentation complète de [BureauxPage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/bureaux/BureauxPage.tsx) avec liste des bureaux, recherche avec debounce, modal de création/édition, modal de confirmation de suppression, et états de chargement / erreur / vide explicites.
  - Configuration du routage dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx) avec redirection vers `/bureaux`.
  - Ajout et exécution avec succès du test e2e Playwright dans [e2e/bureaux.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/bureaux.spec.ts).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/referentiel.ts`
  - `src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Modal.tsx`
  - `src/components/layout/Sidebar.tsx`, `Topbar.tsx`, `AppLayout.tsx`
  - `src/features/bureaux/BureauxPage.tsx`, `src/features/bureaux/components/BureauFormModal.tsx`
  - `src/features/dashboard/HealthPage.tsx`
  - `src/App.tsx`
  - `e2e/bureaux.spec.ts`, `e2e/health.spec.ts`
- Cases cochées : section 2, tâche 1 (« Écran de gestion des bureaux (liste, création, modification) — réservé Admin »)
- Dépendance à un endpoint backend : `/api/v1/bureaux/` et `/api/v1/provinces/` (implémentés)
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

 
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
 <!-- Nouvelles entrées à ajouter au-dessus de cette ligne, les plus récentes en premier -->

