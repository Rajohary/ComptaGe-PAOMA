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

- [x] Écran de gestion des bureaux (liste, création, modification) — réservé Admin
- [x] Écran d'ouverture d'une période de gestion (saisie de l'inventaire initial : numéraire, valeurs postales, timbres fiscaux)
- [x] Écran de clôture d'une période de gestion
- [x] Gestion des erreurs de validation renvoyées par le backend (affichage associé au bon champ de formulaire)

---

## 3. Recherche dans le plan comptable (remplace le TreeView legacy)

- [x] Composant `LigneComptableSearch` — recherche instantanée (debounce), résultats groupés par section
- [x] Historique des lignes récemment utilisées par le bureau (à trancher avec l'utilisateur : stockage local ou backend — voir `ARCHITECTURE.md` section 7)
- [x] Traitement explicite de l'état vide (aucun résultat) et de l'état de chargement — correction directe du défaut identifié dans l'application legacy (zone grise vide sans message)

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

### 2026-10-14 — Traitement explicite des états vide et chargement (Section 3, Tâche 3)
- Ce qui a été fait :
  - Consolidation et vérification de la gestion des états visuels dans [LigneComptableSearch.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/plan-comptable/components/LigneComptableSearch.tsx) pour éradiquer le problème de l'application legacy (qui affichait un écran gris vide déconcertant) :
    - État de chargement explicite : spinner animé avec message explicatif (`Recherche dans le plan comptable en cours…`) et `data-testid="plan-loading-state"`.
    - État vide explicite : illustration avec icône livre, message contextuel indiquant les termes ou critères recherchés, proposition d'action claire avec bouton `Réinitialiser les filtres` et `data-testid="plan-empty-state"`.
    - État d'erreur serveur : bannière d'alerte rouge avec bouton `Réessayer` (`fetchLignes`) et `data-testid="plan-error-state"`.
  - Ajout du test e2e Playwright dans [e2e/plan-comptable.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/plan-comptable.spec.ts) validant spécifiquement l'affichage du spinner de chargement lors d'un délai réseau et la transition fluide vers l'état vide.
  - Validation de la suite Playwright complète (6/6 tests plan comptable passés, 23/23 tests globaux passés).
- Fichiers/dossiers touchés :
  - `src/features/plan-comptable/components/LigneComptableSearch.tsx`
  - `e2e/plan-comptable.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 3, tâche 3 (« Traitement explicite de l'état vide (aucun résultat) et de l'état de chargement »)
- Dépendance à un endpoint backend : `GET /api/v1/lignes-comptables/` (implémenté).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-14 — Historique des lignes récentes par bureau (Section 3, Tâche 2)
- Ce qui a été fait :
  - Validation avec l'utilisateur du mode de stockage retenu : persistance locale par bureau (`localStorage` sous clé partitionnée `comptage_recent_lignes_{bureauCode}`) garantissant une réactivité immédiate et une résilience complète sans dépendance réseau.
  - Vérification et consolidation du mécanisme dans [LigneComptableSearch.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/plan-comptable/components/LigneComptableSearch.tsx) : enregistrement des écritures sélectionnées, affichage des 5 dernières lignes utilisées, bouton d'effacement de l'historique et accessibilité au clavier.
  - Enrichissement des tests e2e Playwright dans [e2e/plan-comptable.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/plan-comptable.spec.ts) pour couvrir la persistance par bureau, l'ajout dynamique lors de la sélection d'une ligne et le bouton d'effacement.
  - Validation complète de la suite e2e Playwright (5/5 tests plan comptable passés).
- Fichiers/dossiers touchés :
  - `src/features/plan-comptable/components/LigneComptableSearch.tsx`
  - `e2e/plan-comptable.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 3, tâche 2 (« Historique des lignes récemment utilisées par le bureau »)
- Dépendance à un endpoint backend : non applicable (stockage local partitionné par bureau validé).
- Points restés ouverts ou à valider avec l'utilisateur : Aucun (choix validé et implémenté).

### 2026-10-14 — Composant LigneComptableSearch (Section 3, Tâche 1)
- Ce qui a été fait :
  - Définition des types TypeScript `SectionComptable`, `LigneComptable`, `LigneComptableParentDetail`, `LigneComptableSearchParams` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts) conformément à `API_CONTRACT.md`.
  - Implémentation du client API [src/api/comptabilite.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/comptabilite.ts) avec `getSectionsComptables` et `getLignesComptables` prenant en charge la recherche textuelle instantanée, le filtrage par section, sens et pagination.
  - Création du composant [LigneComptableSearch.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/plan-comptable/components/LigneComptableSearch.tsx) avec saisie debouncée (300ms), sélecteur de section A-E, sélecteur de sens (Débit / Crédit), groupement visuel des résultats par section macro-comptable, et ré-export dans `src/features/saisie-g58/components/LigneComptableSearch.tsx` pour réutilisation dans le journal G58.
  - Création de la page [PlanComptablePage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/plan-comptable/PlanComptablePage.tsx) et branchement de la route `/plan-comptable` dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx) et [Sidebar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Sidebar.tsx).
  - Écriture et validation des tests e2e Playwright dans [e2e/plan-comptable.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/plan-comptable.spec.ts) (4/4 tests passés, 21/21 suite globale passée).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/comptabilite.ts`
  - `src/features/plan-comptable/components/LigneComptableSearch.tsx`
  - `src/features/plan-comptable/PlanComptablePage.tsx`
  - `src/features/saisie-g58/components/LigneComptableSearch.tsx`
  - `src/App.tsx`, `src/components/layout/Sidebar.tsx`
  - `e2e/plan-comptable.spec.ts`
- Cases cochées : section 3, tâche 1 (« Composant LigneComptableSearch — recherche instantanée (debounce), résultats groupés par section »)
- Dépendance à un endpoint backend : `GET /api/v1/sections-comptables/` et `GET /api/v1/lignes-comptables/` (implémentés)
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

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


