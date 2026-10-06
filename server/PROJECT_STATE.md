# PROJECT_STATE.md — État du projet · Backend (server/)

**Ce fichier doit être lu avant toute tâche, sans exception.** Après avoir terminé une tâche : coche la case correspondante `[ ]` → `[x]` ET ajoute une entrée dans le journal en bas de ce fichier (section 9). Ne jamais faire l'un sans l'autre.

Si une tâche touche un endpoint API, vérifie et mets à jour `../API_CONTRACT.md` dans le même tour de travail — c'est une étape intégrée à chaque tâche de ce fichier qui crée ou modifie une route, pas une tâche séparée à faire « plus tard ».

Si une tâche demandée par l'utilisateur ne figure pas ici, l'ajouter dans la section appropriée avant de commencer à coder.

Légende : `[ ]` à faire · `[x]` terminé · `[~]` en cours / partiellement fait (préciser dans le journal pourquoi c'est partiel)

---

## 0. Mise en place du projet

- [ ] Créer `server/` (Django + DRF), structure de dossiers conforme à `ARCHITECTURE.md`
- [ ] Configurer PostgreSQL en local (base de dev) et connexion Django
- [ ] Mettre en place `django-cors-headers` (origine du client React autorisée en dev)
- [ ] Créer `.env.example`
- [ ] Choisir et configurer l'outil de tests unitaires (`pytest-django` ou `TestCase` natif — trancher ici, pas en cours de route)
- [ ] Premier commit : squelette Django fonctionnel (endpoint de healthcheck `/api/v1/health/` qui répond 200)
- [ ] Déclarer l'endpoint de healthcheck dans `../API_CONTRACT.md`

---

## 1. Authentification & RBAC

- [ ] Modèle `User` custom Django avec champ `role` (`ADMIN`, `RECEVEUR`, `AGENT_SAISIE`, `INSPECTEUR`)
- [ ] Endpoints d'authentification JWT (login, refresh, logout, `/me/`)
- [ ] Classes de permission DRF par rôle (`accounts/permissions.py`)
- [ ] Documenter les 4 endpoints d'authentification dans `../API_CONTRACT.md` avec exemples de payloads
- [ ] Test unitaire : un agent de saisie ne peut pas accéder aux données d'un autre bureau
- [ ] Test unitaire : un token expiré est bien rejeté par les endpoints protégés

---

## 2. Référentiel (provinces, bureaux, périodes de gestion)

- [ ] Modèles `Province`, `Bureau` (avec contraintes FK strictes)
- [ ] CRUD Bureau côté API (réservé Admin pour l'écriture)
- [ ] Modèle `PeriodeGestion` (ouverture/clôture, soldes d'ouverture)
- [ ] Endpoint d'ouverture d'une période de gestion (validation de l'inventaire initial obligatoire : numéraire, valeurs postales, timbres fiscaux)
- [ ] Endpoint de clôture d'une période de gestion
- [ ] Documenter ces endpoints dans `../API_CONTRACT.md`
- [ ] Test unitaire : impossible de saisir un mouvement sur une période clôturée
- [ ] Test unitaire : la date de fin de gestion doit être ≥ date de début

---

## 3. Plan comptable (sections A-E)

- [ ] Modélisation `SectionComptable` / `LigneComptable` (hiérarchie section → sous-opération → produit)
- [ ] Script de seed des lignes comptables réelles (à partir du CDC et des captures du formulaire papier — sections A, B avec B1-B4, D en priorité)
- [ ] Endpoint de recherche instantanée dans les lignes comptables (consommé par le composant de recherche frontend qui remplace le TreeView legacy)
- [ ] Documenter cet endpoint dans `../API_CONTRACT.md` (c'est un endpoint critique pour l'UX frontend — soigner la description du format de réponse)

---

## 4. Saisie du Journal G58 — cœur fonctionnel

- [ ] Modèle `Mouvement` (montant, augmentation, diminution, montant_rectifie, motif, FK ligne comptable + période)
- [ ] Logique de validation dans `services.py` : période active, `montant_rectifie` initialisé = `montant` à la création
- [ ] Endpoint de création/modification d'un mouvement
- [ ] Logique de calcul des totaux par sous-section (B1+B2+B3+B4) et total général, dans `services.py`, testée unitairement
- [ ] Test unitaire : `montant_rectifie = montant + augmentation - diminution` est vérifié et rejeté si incohérent
- [ ] Modèle `MouvementEncaisse` + endpoint associé
- [ ] Endpoint « Situation comptable » avec report automatique du solde du mois précédent
- [ ] Test unitaire : le report de solde d'un mois sur l'autre est correct
- [ ] Documenter tous ces endpoints dans `../API_CONTRACT.md`

---

## 5. Audit et détection d'écarts

- [ ] Endpoint listant les mouvements où `montant ≠ montant_rectifie` (équivalent de la vue DIF du système legacy)
- [ ] Endpoint de rectification (obligation de motif, calcul automatique de `montant_rectifie`)
- [ ] Modèle `AuditLogEntry` (historique immuable des modifications sensibles)
- [ ] Documenter ces endpoints dans `../API_CONTRACT.md`
- [ ] Test unitaire : une rectification sans motif est rejetée
- [ ] Test unitaire : seul un inspecteur peut appeler l'endpoint de rectification

---

## 6. Tableaux de bord (endpoints d'agrégation)

- [ ] Endpoint de progression de saisie du mois en cours par bureau (pour dashboard Receveur)
- [ ] Endpoint de liste des écarts filtrable (pour dashboard Inspecteur)
- [ ] Endpoint de vue d'ensemble globale (pour dashboard Admin)
- [ ] Documenter ces endpoints dans `../API_CONTRACT.md`

---

## 7. Stock de valeurs postales

- [ ] Modèle `StockValeurPostale` (produit, valeur faciale, quantités/valeurs initial-reçu-vendu-final)
- [ ] Endpoints de saisie/consultation du stock par bureau et par mois
- [ ] Documenter dans `../API_CONTRACT.md`

---

## 8. Fonctionnalités complémentaires (backlog ouvert — à prioriser au fil de l'eau avec l'utilisateur)

Cette section n'est pas figée : ajouter ici toute nouvelle demande backend (nouveaux endpoints d'états, statistiques, exports...) au fur et à mesure, avant de l'implémenter.

- [ ] Endpoint de génération du bordereau G58 en PDF (mise en page fidèle au formulaire officiel papier)
- [ ] Endpoint d'export Excel des écritures d'une période
- [ ] Endpoint d'historique des périodes de gestion d'un bureau (receveurs successifs, soldes de passation)
- [ ] Endpoint de données pour graphique d'évolution des recettes sur plusieurs mois

---

## 9. Journal des actions (log)

Ajouter une entrée ici après chaque tâche accomplie, même petite. Format :

```
### AAAA-MM-JJ — Titre court de la tâche
- Ce qui a été fait : ...
- Fichiers/dossiers touchés : ...
- Cases cochées : section X, tâche Y
- API_CONTRACT.md mis à jour : oui/non/non applicable
- Points restés ouverts ou à valider avec l'utilisateur : ...
```

<!-- Nouvelles entrées à ajouter au-dessus de cette ligne, les plus récentes en premier -->
