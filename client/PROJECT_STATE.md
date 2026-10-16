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

- [x] Composant `SectionForm` — formulaire de saisie d'une section (A, B, D en priorité)
- [x] Composant `TotauxLive` — calcul et affichage des totaux en temps réel à chaque saisie, sans soumission
- [x] Validation React Hook Form + Zod cohérente avec les contraintes backend
- [x] Écran « Détails de l'encaisse »
- [x] Écran « Situation comptable » avec affichage du report automatique du solde du mois précédent
- [x] Test e2e `saisie-g58.spec.ts` : saisie complète d'une section avec vérification du total affiché en temps réel



---

## 5. Audit et détection d'écarts

- [ ] Écran Inspecteur : liste des écarts (équivalent vue DIF), filtrable par bureau/province/montant
- [ ] Formulaire de rectification (obligation de motif, affichage du calcul automatique de `montant_rectifie`)
- [ ] Test e2e `rbac.spec.ts` : un agent de saisie ne voit pas les actions de rectification réservées à l'inspecteur

---

## 6. Tableaux de bord

- [x] Dashboard Receveur : progression de la saisie du mois en cours par section, montant en caisse actuel
- [x] Dashboard Inspecteur : bureaux avec écarts en attente, triable/filtrable
- [x] Dashboard Admin : vue d'ensemble (nombre de bureaux actifs, périodes en cours)

---

## 7. Stock de valeurs postales

- [x] Écran de saisie/consultation du stock par bureau et par mois


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

### 2026-10-16 — Module 6 : Tableaux de bord (Receveur, Inspecteur, Admin)
- Ce qui a été fait :
  - Création de l'utilitaire de formatage monétaire et date [src/lib/formatters.ts](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/lib/formatters.ts) (`formatAriary`, `formatDate`, `formatDateTime`, `formatPercent`) avec respect strict de `tabular-nums` et des règles typographiques institutionnelles de `DESIGN.md`.
  - Définition complète des types TypeScript dans [src/types/index.ts](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/types/index.ts) (`ReceveurDashboardData`, `InspecteurDashboardData`, `AdminDashboardData`, `EcartsListResponse`, `SectionProgressionItem`, `BureauAvecEcartsItem`, `EcartItem`, etc.) en conformité avec `API_CONTRACT.md`.
  - Implémentation du client API et des hooks TanStack Query dans [src/api/dashboard.ts](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/api/dashboard.ts) (`useReceveurDashboard`, `useInspecteurDashboard`, `useAdminDashboard`, `useEcartsList`).
  - Implémentation du composant [ReceveurDashboard.tsx](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/features/dashboard/components/ReceveurDashboard.tsx) : progression de la saisie par section (A à E, ENC), montant en caisse avec décomposition détaillée (réserve numéraire + entrées - sorties), récapitulatif des flux débit/crédit G58, alerte écarts avec lien direct vers le journal d'écritures.
  - Implémentation du composant [InspecteurDashboard.tsx](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/features/dashboard/components/InspecteurDashboard.tsx) : KPI d'audit national/régional (total écarts en attente, montant cumulé, bureaux audités), tableau interactif des bureaux avec écarts en attente (filtrable par terme de recherche, triable par bureau, montant, statut, ou date), et flux des anomalies récentes (vue DIF).
  - Implémentation du composant [AdminDashboard.tsx](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/features/dashboard/components/AdminDashboard.tsx) : vue d'ensemble nationale (nombre de bureaux actifs/inactifs, répartition géographique par province et classe), périodes de gestion ouvertes/clôturées, répartition des comptes utilisateurs RBAC, flux financiers globaux et journal d'audit des actions critiques.
  - Mise à niveau de la page principale [DashboardPage.tsx](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/src/features/dashboard/pages/DashboardPage.tsx) : affichage contextuel et automatique selon le rôle de l'utilisateur connecté (`RECEVEUR`/`AGENT_SAISIE`, `INSPECTEUR`, `ADMIN`), avec onglets de supervision pour les administrateurs permettant de basculer instantanément entre les vues.
  - Suite de tests end-to-end Playwright [e2e/dashboard.spec.ts](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/client/e2e/dashboard.spec.ts) validant le rendu visuel, la décomposition de caisse, le tri/filtrage du tableau des écarts, et les vues de supervision administrative.
- Fichiers/dossiers touchés :
  - `src/lib/formatters.ts`
  - `src/types/index.ts`
  - `src/api/dashboard.ts`
  - `src/features/dashboard/components/ReceveurDashboard.tsx`
  - `src/features/dashboard/components/InspecteurDashboard.tsx`
  - `src/features/dashboard/components/AdminDashboard.tsx`
  - `src/features/dashboard/pages/DashboardPage.tsx`
  - `e2e/dashboard.spec.ts`
- Cases cochées : Section 6 (3 cases : Dashboard Receveur, Dashboard Inspecteur, Dashboard Admin)
- Dépendance à un endpoint backend : `/api/v1/dashboard/receveur/`, `/api/v1/dashboard/inspecteur/`, `/api/v1/audit/ecarts/`, `/api/v1/dashboard/admin/` (tous implémentés et testés dans le backend)
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-15 — Révision et enrichissement de l'espace Encaisse (Section 4)
- Ce qui a été fait :
  - Enrichissement analytique : ajout du bloc de répartition des flux par rubrique d'encaisse (`TR`: Trésorerie et espèces, `SF`: Stock final, `CR`: Créances) avec calcul immédiat des totaux entrées, sorties, solde net et volume d'écritures.
  - Ergonomie et filtrage instantané : ajout de pastilles de filtrage rapide du sens (`Tous`, `Entrées`, `Sorties`) combinées avec la barre de recherche textuelle.
  - Mode édition en place : prise en charge complète de la modification d'un mouvement d'encaisse (`updateMouvementEncaisse` consommant `PATCH /api/v1/mouvements-encaisse/{id}/`), intégration du bouton modifier dans le tableau et préremplissage automatique dans `EncaisseFormModal`.
  - Tests automatisés : enrichissement de [e2e/encaisse.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/encaisse.spec.ts) (6/6 tests passés couvrant affichage, cartes de synthèse, répartition analytique, modification, pastilles de sens, validation Zod).
  - Validation globale : **41/41 tests Playwright passés au vert**, build Vite opérationnel sans erreur.
- Fichiers/dossiers touchés :
  - `src/api/comptabilite.ts`
  - `src/features/encaisse/components/EncaisseFormModal.tsx`
  - `src/features/encaisse/EncaissePage.tsx`
  - `e2e/encaisse.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : Révision et renforcement de l'espace Encaisse (Section 4).
- Dépendance à un endpoint backend : `/api/v1/mouvements-encaisse/` (`GET`, `POST`, `PATCH`, `DELETE`) et `/api/v1/rubriques-encaisse/` (implémentés).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-15 — Test e2e saisie complète d'une section G58 et TotauxLive (Section 4, Tâche 6)
- Ce qui a été fait :
  - Conception et rédaction du test end-to-end automatisé complet dans [e2e/saisie-g58.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/saisie-g58.spec.ts) :
    - Navigation et bascule sur l'onglet de la section B (Crédit - Opérations mandats).
    - Recherche et sélection dynamique d'une ligne comptable imputable via le modal `LigneComptableSearch` (`B101`).
    - Vérification du calcul en temps réel sans soumission dans le composant `TotauxLive` lors de la saisie progressive touche par touche (`pressSequentially`).
    - Soumission du formulaire d'imputation et vérification de la création de la ligne dans le tableau du Journal G58.
    - Réinitialisation du champ montant et maintien de la somme consolidée enregistrée.
  - Exécution et validation de la suite Playwright complète (6/6 tests saisie G58 passés, 39/39 tests globaux passés au vert).
  - Validation du build de production Vite sans régression (`npm run build`).
- Fichiers/dossiers touchés :
  - `e2e/saisie-g58.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 4, tâche 6 (« Test e2e `saisie-g58.spec.ts` : saisie complète d'une section avec vérification du total affiché en temps réel »)
- Dépendance à un endpoint backend : `/api/v1/mouvements/` et `/api/v1/mouvements/totaux/` (implémentés).
- Points restés ouverts ou à valider avec l'utilisateur : Toutes les tâches de la Section 4 sont désormais achevées et validées. Prêt pour la Section 5 (Audit et détection d'écarts).

### 2026-10-14 — Écran Situation comptable & report automatique (Section 4, Tâche 5)
- Ce qui a été fait :
  - Définition du type TypeScript `SituationComptable` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts) calqué sur le contrat backend.
  - Implémentation du client d'API [src/api/comptabilite.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/comptabilite.ts) (`getSituationComptable(periodeId)`) consommant l'endpoint `/api/v1/situation-comptable/{id}/`.
  - Conception et développement de la page [SituationComptablePage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/pages/SituationComptablePage.tsx) avec :
    - Bannière de traçabilité claire indiquant l'origine du report de solde (automatique depuis la période précédente ou solde initial déclaré).
    - Tableaux comparatifs de la balance mensuelle : Colonne des Débits (Report + Opérations mois = Cumul Débits) et Colonne des Crédits (Report + Opérations mois = Cumul Crédits).
    - Détermination automatique du solde de clôture périodique (débiteur ou créditeur) avec mise en avant visuelle selon la balance.
    - Sélecteurs réactifs de bureau (pour Admin/Inspecteur) et de période avec actualisation immédiate des calculs.
  - Déclaration de la route `/situation-comptable` dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx), entrée de menu dans [Sidebar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Sidebar.tsx) et bouton raccourci dans l'en-tête de [SaisieG58Page.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/pages/SaisieG58Page.tsx).
  - Écriture et validation des tests e2e Playwright dans [e2e/situation-comptable.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/situation-comptable.spec.ts) (3/3 tests passés, 38/38 tests de la suite complète au vert).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/comptabilite.ts`
  - `src/features/saisie-g58/pages/SituationComptablePage.tsx`
  - `src/App.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/features/saisie-g58/pages/SaisieG58Page.tsx`
  - `e2e/situation-comptable.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 4, tâche 5 (« Écran « Situation comptable » avec affichage du report automatique du solde du mois précédent »)
- Dépendance à un endpoint backend : `/api/v1/situation-comptable/{periode_id}/` (implémenté).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-14 — Écran Détails de l'encaisse (Section 4, Tâche 4)
- Ce qui a été fait :
  - Définition des types TypeScript `RubriqueEncaisse`, `MouvementEncaisse`, `MouvementEncaisseFormData`, `MouvementEncaisseSearchParams` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts) conformément à `API_CONTRACT.md`.
  - Implémentation des appels d'API dans [src/api/comptabilite.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/comptabilite.ts) (`getRubriquesEncaisse`, `getMouvementsEncaisse`, `createMouvementEncaisse`, `deleteMouvementEncaisse`) pour consommer les endpoints `/api/v1/rubriques-encaisse/` et `/api/v1/mouvements-encaisse/`.
  - Création du composant modal [EncaisseFormModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/encaisse/components/EncaisseFormModal.tsx) avec validation Zod (sens du flux, montant strictement positif, date confinée à la période active) et gestion des erreurs DRF 400.
  - Implémentation de la page principale [EncaissePage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/encaisse/EncaissePage.tsx) avec :
    - 4 cartes de synthèse financière en temps réel : Réserve initiale de départ, Total Entrées, Total Sorties, et Solde théorique en caisse (`réserve + entrées - sorties`).
    - Filtres combinés par bureau, période de gestion, sens du flux (Entrée / Sortie) et rubrique d'encaisse, complétés d'une barre de recherche instantanée.
    - Tableau des écritures physiques avec badges directionnels, montant coloré et bouton de suppression avec confirmation sécurisée.
    - Verrouillage automatique en lecture seule dès que la période de gestion est clôturée.
  - Branchement de la route `/encaisse` dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx), ajout dans la navigation [Sidebar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Sidebar.tsx) et bouton raccourci dans le bandeau de [SaisieG58Page.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/pages/SaisieG58Page.tsx).
  - Écriture et validation des tests e2e Playwright dans [e2e/encaisse.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/encaisse.spec.ts) (4/4 tests passés, 35/35 tests sur l'ensemble de la suite Playwright).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/comptabilite.ts`
  - `src/features/encaisse/components/EncaisseFormModal.tsx`
  - `src/features/encaisse/EncaissePage.tsx`
  - `src/App.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/features/saisie-g58/pages/SaisieG58Page.tsx`
  - `e2e/encaisse.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 4, tâche 4 (« Écran « Détails de l'encaisse » »)
- Dépendance à un endpoint backend : `/api/v1/rubriques-encaisse/` et `/api/v1/mouvements-encaisse/` (implémentés).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-14 — Validation React Hook Form + Zod & erreurs DRF (Section 4, Tâche 3)
- Ce qui a été fait :
  - Définition d'un schéma de validation Zod dynamique `createMouvementSchema(periode)` dans [SectionForm.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/components/SectionForm.tsx) garantissant :
    - La sélection obligatoire d'une ligne comptable imputable (`ligne_comptable` > 0).
    - La saisie d'un montant strictement positif (`montant` > 0 et format numérique valide).
    - La conformité stricte de la date d'opération avec l'intervalle de la période de gestion active (`date_debut <= date_operation <= date_fin`), alignée avec les contraintes métier du service Django backend.
  - Branchement du mapping des erreurs serveur Django DRF via `applyServerValidationErrors` lors des réponses 400 (ex. tentative d'imputation sur un compte de regroupement, compte inactif, dépassement de plafonds), avec affichage immédiat sous le champ incriminé et gestion des erreurs globales de racine (`errors.root`).
  - Ajout des cas de tests automatisés dans [e2e/saisie-g58.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/saisie-g58.spec.ts) couvrant la validation Zod côté client (montant négatif, date hors période) et l'association des erreurs serveur DRF 400 sur `ligne_comptable` et `montant`.
  - Validation complète de la suite Playwright : 5/5 tests saisie G58 passés, 31/31 tests globaux passés au vert.
- Fichiers/dossiers touchés :
  - `src/features/saisie-g58/components/SectionForm.tsx`
  - `e2e/saisie-g58.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 4, tâche 3 (« Validation React Hook Form + Zod cohérente avec les contraintes backend »)
- Dépendance à un endpoint backend : `/api/v1/mouvements/` (implémenté).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-14 — Composant TotauxLive réactif (Section 4, Tâche 2)
- Ce qui a été fait :
  - Conception et intégration du composant réactif [TotauxLive.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/components/TotauxLive.tsx) dans le flux de saisie du Journal G58.
  - Calcul instantané des totaux cumulés pour la section active à chaque frappe dans le champ montant, sans nécessiter de soumission de formulaire (gain ergonomique majeur par rapport à l'application legacy).
  - Prise en charge des badges contextuels Débit / Crédit selon la section macro-comptable affichée.
  - Affichage consolidé des totaux débits, totaux crédits et solde net calculé avec mise à jour immédiate lors de l'effacement ou de la modification de montants.
  - Test end-to-end automatisé validé dans [e2e/saisie-g58.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/saisie-g58.spec.ts).
- Fichiers/dossiers touchés :
  - `src/features/saisie-g58/components/TotauxLive.tsx`
  - `src/features/saisie-g58/components/SectionForm.tsx`
  - `e2e/saisie-g58.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 4, tâche 2 (« Composant TotauxLive — calcul et affichage des totaux en temps réel à chaque saisie, sans soumission »)
- Dépendance à un endpoint backend : `/api/v1/mouvements/totaux/` (implémenté).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-14 — Composant SectionForm du Journal G58 (Section 4, Tâche 1)
- Ce qui a été fait :
  - Définition des types TypeScript `MouvementG58`, `MouvementG58FormData`, `MouvementSearchParams`, `TotauxG58`, `TotauxSectionItem` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts).
  - Ajout des fonctions d'API dans [src/api/comptabilite.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/comptabilite.ts) (`getMouvements`, `createMouvement`, `updateMouvement`, `deleteMouvement`, `getTotauxG58`) pour consommer les endpoints DRF `/api/v1/mouvements/` et `/api/v1/mouvements/totaux/`.
  - Implémentation du composant réactif [TotauxLive.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/components/TotauxLive.tsx) assurant le calcul en direct à chaque frappe dans le champ montant, avec badges débits/crédits et affichage des soldes nets.
  - Implémentation du composant [SectionForm.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/components/SectionForm.tsx) pour la saisie des opérations journalières par section (A, B, D en priorité) avec recherche escamotable [LigneComptableSearch](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/components/LigneComptableSearch.tsx), tableau des écritures, édition en ligne, suppression avec confirmation et verrouillage en cas de période clôturée.
  - Implémentation de la page principale [SaisieG58Page.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/saisie-g58/pages/SaisieG58Page.tsx) avec navigation par onglets de sections et sélecteur de période de gestion, branchée sur `/saisie` dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx).
  - Rédaction et validation des tests e2e Playwright dans [e2e/saisie-g58.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/saisie-g58.spec.ts) (3/3 passés, 29/29 tests globaux passés).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/comptabilite.ts`
  - `src/features/saisie-g58/components/TotauxLive.tsx`
  - `src/features/saisie-g58/components/SectionForm.tsx`
  - `src/features/saisie-g58/pages/SaisieG58Page.tsx`
  - `src/App.tsx`
  - `e2e/saisie-g58.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 4, tâche 1 (« Composant SectionForm — formulaire de saisie d'une section (A, B, D en priorité) »)
- Dépendance à un endpoint backend : `/api/v1/mouvements/` et `/api/v1/mouvements/totaux/` (implémentés).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

### 2026-10-14 — Écran de suivi du stock de valeurs postales et timbres (Section 7)
- Ce qui a été fait :
  - Définition des types TypeScript `ProduitPostal`, `StockValeur`, `StockValeurFormData`, `StockValeurRecapitulatif`, `StockValeurSearchParams` dans [src/types/index.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/types/index.ts).
  - Création du client API [src/api/stocks.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/api/stocks.ts) pour consommer `/api/v1/produits-postaux/`, `/api/v1/stocks-valeurs/` et `/api/v1/stocks-valeurs/recapitulatif/`.
  - Implémentation du formulaire modal [StockValeurFormModal.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/stock/components/StockValeurFormModal.tsx) avec validation Zod (contrôle de cohérence stock disponible >= quantité vendue, non-négativité), calcul instantané en direct des montants en Ariary et report des erreurs serveur DRF.
  - Implémentation de la page principale [StockValeursPage.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/features/stock/StockValeursPage.tsx) avec sélection du bureau et de la période, cartes de synthèse financière agrégée (existant, approvisionnements, ventes, solde final), table des mouvements physiques et financiers, verrouillage automatique en lecture seule si la période est clôturée, et modale de confirmation de suppression.
  - Branchement de la page sur la route `/stock` dans [src/App.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/App.tsx) et navigation correspondante dans [Sidebar.tsx](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/src/components/layout/Sidebar.tsx).
  - Rédaction et validation des tests e2e Playwright dans [e2e/stock.spec.ts](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/client/e2e/stock.spec.ts) (3/3 tests passés, 26/26 tests sur l'ensemble de la suite).
- Fichiers/dossiers touchés :
  - `src/types/index.ts`
  - `src/api/stocks.ts`
  - `src/features/stock/StockValeursPage.tsx`
  - `src/features/stock/components/StockValeurFormModal.tsx`
  - `src/App.tsx`
  - `e2e/stock.spec.ts`
  - `PROJECT_STATE.md`
- Cases cochées : section 7 (« Écran de saisie/consultation du stock par bureau et par mois »)
- Dépendance à un endpoint backend : `/api/v1/produits-postaux/`, `/api/v1/stocks-valeurs/`, `/api/v1/stocks-valeurs/recapitulatif/` (implémentés).
- Points restés ouverts ou à valider avec l'utilisateur : Néant.

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


