# PROJECT_STATE.md — État du projet ComptaGeWeb

**Ce fichier doit être lu avant toute tâche, sans exception.** Après avoir terminé une tâche : coche la case correspondante `[ ]` → `[x]` ET ajoute une entrée dans le journal en bas de ce fichier (section 9). Ne jamais faire l'un sans l'autre.

Si une tâche demandée par l'utilisateur ne figure pas ici, l'ajouter dans la section appropriée avant de commencer à coder.

Légende : `[ ]` à faire · `[x]` terminé · `[~]` en cours / partiellement fait (préciser dans le journal pourquoi c'est partiel)

---

## 0. Mise en place du projet

- [ ] Initialiser le dépôt Git à la racine de `ComptaGeWeb/`
- [ ] Créer `client/` (Vite + React + TypeScript)
- [ ] Créer `server/` (Django + DRF), structure de dossiers conforme à `ARCHITECTURE.md`
- [ ] Configurer PostgreSQL en local (base de dev) et connexion Django
- [ ] Configurer Tailwind avec les tokens de couleur/typo définis dans `DESIGN.md`
- [ ] Mettre en place `django-cors-headers` pour autoriser les appels du client en dev
- [ ] Créer les fichiers `.env.example` (client et server)
- [ ] Configurer Playwright dans `client/e2e/`
- [ ] Premier commit : squelette de projet fonctionnel (« Hello World » des deux côtés, appel API de test réussi)

---

## 1. Authentification & RBAC

- [ ] Modèle `User` custom Django avec champ `role` (Admin, Receveur, AgentSaisie, Inspecteur)
- [ ] Endpoints d'authentification JWT (login, refresh, logout)
- [ ] Classes de permission DRF par rôle (`accounts/permissions.py`)
- [ ] Page de connexion React (formulaire, gestion des erreurs, redirection selon rôle)
- [ ] `AuthContext` React (utilisateur courant, rôle, token, déconnexion)
- [ ] Navigation (sidebar) qui s'adapte dynamiquement au rôle connecté
- [ ] Test e2e : connexion réussie/échouée, redirection correcte selon rôle
- [ ] Test unitaire backend : un agent de saisie ne peut pas accéder aux données d'un autre bureau

---

## 2. Référentiel (provinces, bureaux, périodes de gestion)

- [ ] Modèles `Province`, `Bureau` (avec contraintes FK strictes)
- [ ] CRUD Bureau côté API (réservé Admin)
- [ ] Écran de gestion des bureaux côté client (liste, création, modification)
- [ ] Modèle `PeriodeGestion` (ouverture/clôture, soldes d'ouverture)
- [ ] Écran d'ouverture d'une période de gestion (saisie de l'inventaire initial : numéraire, valeurs postales, timbres fiscaux)
- [ ] Écran de clôture d'une période de gestion
- [ ] Test unitaire backend : impossible de saisir un mouvement sur une période clôturée

---

## 3. Plan comptable (sections A-E)

- [ ] Modélisation `SectionComptable` / `LigneComptable` (hiérarchie section → sous-opération → produit)
- [ ] Script de seed des lignes comptables réelles (à partir du CDC et des captures du formulaire papier — sections A, B avec B1-B4, D en priorité)
- [ ] Endpoint de recherche instantanée dans les lignes comptables (remplace le TreeView legacy)
- [ ] Composant React `LigneComptableSearch` (recherche + suggestions + lignes récentes du bureau)

---

## 4. Saisie du Journal G58 — cœur fonctionnel

- [ ] Modèle `Mouvement` (montant, augmentation, diminution, montant_rectifie, motif, FK ligne comptable + période)
- [ ] Endpoint de création/modification d'un mouvement, avec validation des règles métier (période active, montant_rectifie initialisé = montant à la création)
- [ ] Composant `SectionForm` — formulaire de saisie d'une section (A, B, D en priorité)
- [ ] Composant `TotauxLive` — calcul et affichage des totaux en temps réel à chaque saisie
- [ ] Logique de calcul des totaux par sous-section (B1+B2+B3+B4) et total général, testée unitairement côté backend
- [ ] Test e2e : saisie complète d'une section avec vérification du total affiché
- [ ] Modèle `MouvementEncaisse` + écran « Détails de l'encaisse »
- [ ] Écran « Situation comptable » avec report automatique du solde du mois précédent
- [ ] Test unitaire backend : le report de solde d'un mois sur l'autre est correct

---

## 5. Audit et détection d'écarts

- [ ] Vue/endpoint listant les mouvements où `montant ≠ montant_rectifie` (équivalent de la vue DIF du système legacy)
- [ ] Écran Inspecteur : liste des écarts, filtrable par bureau/province/montant
- [ ] Formulaire de rectification (obligation de motif, calcul automatique de `montant_rectifie`)
- [ ] Test unitaire backend : `montant_rectifie = montant + augmentation - diminution` est vérifié et rejeté si incohérent

---

## 6. Tableaux de bord

- [ ] Dashboard Receveur : progression de la saisie du mois en cours par section, montant en caisse actuel
- [ ] Dashboard Inspecteur : bureaux avec écarts en attente, triable/filtrable
- [ ] Dashboard Admin : vue d'ensemble (nombre de bureaux actifs, périodes en cours)

---

## 7. Stock de valeurs postales

- [ ] Modèle `StockValeurPostale` (produit, valeur faciale, quantités/valeurs initial-reçu-vendu-final)
- [ ] Écran de saisie/consultation du stock par bureau et par mois

---

## 8. Fonctionnalités complémentaires (backlog ouvert — à prioriser au fil de l'eau avec l'utilisateur)

Cette section n'est pas figée : ajouter ici toute nouvelle demande (états, statistiques, exports...) au fur et à mesure, avec une brève description, avant de l'implémenter.

- [ ] Génération du bordereau G58 en PDF (mise en page fidèle au formulaire officiel papier)
- [ ] Export Excel des écritures d'une période
- [ ] Historique des périodes de gestion d'un bureau (receveurs successifs, soldes de passation)
- [ ] Graphique d'évolution des recettes d'un bureau sur plusieurs mois
- [ ] Notifications de rappel avant date limite de clôture mensuelle

---

## 9. Journal des actions (log)

Ajouter une entrée ici après chaque tâche accomplie, même petite. Format :

```
### AAAA-MM-JJ — Titre court de la tâche
- Ce qui a été fait : ...
- Fichiers/dossiers touchés : ...
- Cases cochées : section X, tâche Y
- Points restés ouverts ou à valider avec l'utilisateur : ...
```

<!-- Nouvelles entrées à ajouter au-dessus de cette ligne, les plus récentes en premier -->
