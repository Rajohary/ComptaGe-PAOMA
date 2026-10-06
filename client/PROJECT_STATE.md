# PROJECT_STATE.md — État du projet · Frontend (client/)

**Ce fichier doit être lu avant toute tâche, sans exception.** Après avoir terminé une tâche : coche la case correspondante `[ ]` → `[x]` ET ajoute une entrée dans le journal en bas de ce fichier (section 9). Ne jamais faire l'un sans l'autre.

Avant de consommer un endpoint, vérifie sa forme dans `../API_CONTRACT.md`. Si tu dois t'appuyer sur un endpoint encore `planifié` côté backend, note-le explicitement dans le journal (section 9) plutôt que de supposer silencieusement sa forme.

Si une tâche demandée par l'utilisateur ne figure pas ici, l'ajouter dans la section appropriée avant de commencer à coder.

Légende : `[ ]` à faire · `[x]` terminé · `[~]` en cours / partiellement fait (préciser dans le journal pourquoi c'est partiel)

---

## 0. Mise en place du projet

- [ ] Créer `client/` (Vite + React + TypeScript)
- [ ] Configurer Tailwind avec les tokens de couleur/typo définis dans `DESIGN.md`
- [ ] Créer `.env.example` (avec `VITE_API_BASE_URL`)
- [ ] Mettre en place le client API de base (`src/api/client.ts`) avec gestion du token JWT
- [ ] Configurer Playwright dans `client/e2e/`
- [ ] Premier commit : squelette de projet fonctionnel (appel réussi vers l'endpoint `/api/v1/health/` du backend)

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

<!-- Nouvelles entrées à ajouter au-dessus de cette ligne, les plus récentes en premier -->
