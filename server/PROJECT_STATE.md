# PROJECT_STATE.md — État du projet · Backend (server/)

**Ce fichier doit être lu avant toute tâche, sans exception.** Après avoir terminé une tâche : coche la case correspondante `[ ]` → `[x]` ET ajoute une entrée dans le journal en bas de ce fichier (section 9). Ne jamais faire l'un sans l'autre.

Si une tâche touche un endpoint API, vérifie et mets à jour `../API_CONTRACT.md` dans le même tour de travail — c'est une étape intégrée à chaque tâche de ce fichier qui crée ou modifie une route, pas une tâche séparée à faire « plus tard ».

Si une tâche demandée par l'utilisateur ne figure pas ici, l'ajouter dans la section appropriée avant de commencer à coder.

Légende : `[ ]` à faire · `[x]` terminé · `[~]` en cours / partiellement fait (préciser dans le journal pourquoi c'est partiel)

---

## 0. Mise en place du projet

- [x] Créer `server/` (Django + DRF), structure de dossiers conforme à `ARCHITECTURE.md`
- [x] Configurer PostgreSQL en local (base de dev `comptage_dev`, user `comptage_user`) et connexion Django
- [x] Mettre en place `django-cors-headers` (origine du client React autorisée en dev)
- [x] Créer `.env.example`
- [x] Choisir et configurer l'outil de tests unitaires (`pytest-django` configuré avec pytest.ini)
- [x] Squelette Django fonctionnel (endpoint de healthcheck `/api/v1/health/` qui répond 200)
- [x] Déclarer l'endpoint de healthcheck dans `../API_CONTRACT.md`

---

## 1. Authentification & RBAC

- [x] Modèle `User` custom Django avec champ `role` (`ADMIN`, `RECEVEUR`, `AGENT_SAISIE`, `INSPECTEUR`)
- [x] Endpoint d'inscription `User` avec hash du mot de passe via Django (`/api/v1/auth/register/`)
- [x] Endpoints d'authentification JWT (login, refresh, logout, `/me/`)
- [x] Classes de permission DRF par rôle (`accounts/permissions.py`)
- [x] Documenter les 4 endpoints d'authentification dans `../API_CONTRACT.md` avec exemples de payloads
- [x] Test unitaire : un agent de saisie ne peut pas accéder aux données d'un autre bureau
- [ ] Test unitaire : un token expiré est bien rejeté par les endpoints protégés

---

## 2. Référentiel (provinces, bureaux, périodes de gestion)

- [x] Modèles `Province`, `Bureau` (avec contraintes FK strictes)
- [x] CRUD Bureau côté API (réservé Admin pour l'écriture)
- [x] Modèle `PeriodeGestion` (ouverture/clôture, soldes d'ouverture)
- [x] Endpoint d'ouverture d'une période de gestion (validation de l'inventaire initial obligatoire : numéraire, valeurs postales, timbres fiscaux)
- [x] Endpoint de clôture d'une période de gestion
- [x] Documenter ces endpoints dans `../API_CONTRACT.md`
- [x] Test unitaire : impossible de saisir un mouvement sur une période clôturée
- [x] Test unitaire : la date de fin de gestion doit être ≥ date de début

---

## 3. Plan comptable (sections A-E)

- [x] Modélisation `SectionComptable` / `LigneComptable` (hiérarchie section → sous-opération → produit)
- [x] Script de seed des lignes comptables réelles (à partir du CDC et des captures du formulaire papier — sections A, B avec B1-B4, D en priorité)
- [x] Endpoint de recherche instantanée dans les lignes comptables (consommé par le composant de recherche frontend qui remplace le TreeView legacy)
- [x] Documenter cet endpoint dans `../API_CONTRACT.md` (c'est un endpoint critique pour l'UX frontend — soigner la description du format de réponse)

---

## 4. Saisie du Journal G58 — cœur fonctionnel

- [x] Modèle `Mouvement` (montant, augmentation, diminution, montant_rectifie, motif, FK ligne comptable + période)
- [x] Logique de validation dans `services.py` : période active, `montant_rectifie` initialisé = `montant` à la création
- [x] Endpoint de création/modification d'un mouvement
- [x] Logique de calcul des totaux par sous-section (B1+B2+B3+B4) et total général, dans `services.py`, testée unitairement
- [x] Test unitaire : `montant_rectifie = montant + augmentation - diminution` est vérifié et rejeté si incohérent
- [x] Modèle `MouvementEncaisse` + endpoint associé
- [x] Endpoint « Situation comptable » avec report automatique du solde du mois précédent
- [x] Test unitaire : le report de solde d'un mois sur l'autre est correct
- [x] Documenter tous ces endpoints dans `../API_CONTRACT.md`

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

- [x] Modèle `StockValeurPostale` (produit, valeur faciale, quantités/valeurs initial-reçu-vendu-final)
- [x] Endpoints de saisie/consultation du stock par bureau et par mois
- [x] Documenter dans `../API_CONTRACT.md`

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

### 2026-10-14 — Endpoint Situation comptable avec report automatique du solde (Section 4, Tâches 7, 8 & 9)
- Ce qui a été fait :
  - **Logique métier** [`apps/comptabilite/services.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/services.py) :
    - `get_periode_precedente` : détection dynamique de la période clôturée ou active immédiatement antérieure pour le même bureau.
    - `calcul_situation_comptable` : report automatique des soldes débiteur et créditeur de fin du mois précédent en soldes de report du mois courant (ou utilisation des soldes de départ déclarés à l'ouverture si premier exercice), agrégation des mouvements de la période courante, calcul du cumul débits/crédits et dégagement du solde de clôture (débiteur ou créditeur).
  - **Endpoint & Vues** ([`apps/comptabilite/views.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/views.py), [`apps/comptabilite/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/urls.py)) :
    - `GET /api/v1/situation-comptable/{periode_id}/` (`SituationComptableView`).
    - Contrôle RBAC : accès autorisé pour `ADMIN` et `INSPECTEUR` sur tous bureaux, et pour `RECEVEUR` restreint à son propre bureau (`bureau_code == periode.bureau.ncodique`).
  - **Tests unitaires** ([`apps/comptabilite/tests/test_api_mouvements.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_api_mouvements.py)) :
    - `SituationComptableAPITestCase` : test de report de solde automatique de M-1 vers M avec calcul arithmétique de la balance et test d'étanchéité RBAC (rejet HTTP 403 pour un receveur tentant de consulter un autre bureau).
  - **Documentation** ([`../API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md)) : endpoint passé à implémenté avec schéma JSON d'exemple et entrée au journal des modifications.
- Fichiers/dossiers touchés : `apps/comptabilite/services.py`, `apps/comptabilite/views.py`, `apps/comptabilite/urls.py`, `apps/comptabilite/tests/test_api_mouvements.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 4, tâches `Endpoint « Situation comptable » avec report automatique du solde du mois précédent`, `Test unitaire : le report de solde d'un mois sur l'autre est correct` et `Documenter tous ces endpoints dans ../API_CONTRACT.md`.
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : **Section 4 entièrement terminée (100%) !** Prêt pour la Section 5 : Audit et détection d'écarts.

### 2026-10-14 — Modèle MouvementEncaisse et endpoint associé (Section 4, Tâche 6)
- Ce qui a été fait :
  - **Seed des rubriques d'encaisse** : mise à jour de [`seed_plan_comptable.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/management/commands/seed_plan_comptable.py) pour initialiser les tables `RubriqueEncaisseParent` (`ENCAISSE ET VALEURS`, `DEBIT/CREDIT`) et `RubriqueEncaisse` (`TR` Trésorerie, `SF` Stock final timbres, `CR` Créances...).
  - **Serializers DRF** ([`apps/comptabilite/serializers.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/serializers.py)) :
    - `RubriqueEncaisseParentSerializer` & `RubriqueEncaisseSerializer` pour le référentiel.
    - `MouvementEncaisseSerializer` : sérialisation avec `rubrique_detail`, libellé textuel du flux (`sens_libelle` Entrée/Sortie), affectation automatique de l'agent connecté (`saisi_par`), et contrôles de date et de période active.
  - **Vues & Routage** ([`apps/comptabilite/views.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/views.py), [`apps/comptabilite/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/urls.py)) :
    - `RubriqueEncaisseViewSet` (`ReadOnlyModelViewSet`) : consultation du référentiel (`GET /api/v1/rubriques-encaisse/`).
    - `MouvementEncaisseViewSet` (`ModelViewSet`) : CRUD complet (`/api/v1/mouvements-encaisse/`), filtrable par période, bureau, date, sens (1=Entrée, 2=Sortie), et rubrique. Suppression sécurisée interdisant la suppression sur période clôturée.
  - **Tests unitaires** : `MouvementEncaisseAPITestCase` ajouté dans [`apps/comptabilite/tests/test_api_mouvements.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_api_mouvements.py) (création d'un flux d'encaisse, listing filtré, rejet d'écriture sur période clôturée). Exécution et validation des tests.
  - **Documentation** : [`../API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) mis à jour avec les endpoints `/api/v1/rubriques-encaisse/` et `/api/v1/mouvements-encaisse/`.
- Fichiers/dossiers touchés : `apps/comptabilite/management/commands/seed_plan_comptable.py`, `apps/comptabilite/serializers.py`, `apps/comptabilite/views.py`, `apps/comptabilite/urls.py`, `apps/comptabilite/tests/test_api_mouvements.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 4, tâche `Modèle MouvementEncaisse + endpoint associé`.
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : Prochaine tâche : `Endpoint « Situation comptable » avec report automatique du solde du mois précédent`.

### 2026-10-14 — Test unitaire équation montant_rectifie (Section 4, Tâche 5)
- Ce qui a été fait :
  - **Enforcement au niveau Modèle ORM** : intégration des méthodes `clean()` et `save()` dans [`apps/comptabilite/models.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/models.py#L319-L347) pour verrouiller l'équation comptable :
    - `montant_rectifie == montant + augmentation - diminution`
    - Rejet immédiat par `ValidationError` (`montant_rectifie`) en cas d'incohérence arithmétique.
    - Rejet par `ValidationError` (`diminution`) si la diminution est supérieure au montant disponible (`montant + augmentation`).
  - **Tests unitaires dédiés** :
    - Ajout de `test_montant_rectifie_incoherent_rejected` dans [`apps/comptabilite/tests/test_models.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_models.py).
    - Validation du rejet d'un montant rectifié incohérent, du rejet d'une diminution excessive et de l'acceptation d'un mouvement cohérent.
    - Exécution et passage réussi de la suite complète de tests (9 tests passés).
- Fichiers/dossiers touchés : `apps/comptabilite/models.py`, `apps/comptabilite/tests/test_models.py`, `PROJECT_STATE.md`.
- Cases cochées : section 4, tâche `Test unitaire : montant_rectifie = montant + augmentation - diminution est vérifié et rejeté si incohérent`.
- API_CONTRACT.md mis à jour : non applicable (contrainte d'intégrité ORM / tests).
- Points restés ouverts ou à valider avec l'utilisateur : Prochaine tâche : `Modèle MouvementEncaisse + endpoint associé`.

### 2026-10-14 — Calcul des totaux par sous-section et total général (Section 4, Tâche 4)
- Ce qui a été fait :
  - **Fonction métier** [`calcul_totaux_periode`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/services.py#L194-L278) dans `apps/comptabilite/services.py` :
    - Calcul agrégé des montants déclarés et rectifiés par section comptable (A, B, C, D, E).
    - Calcul spécifique des montants des 4 sous-sections de la section B (`B1` Émissions/versements mandats, `B2` Paiements mandats, `B3` CCP & épargne, `B4` Tiers).
    - Calcul du total général Débit, total général Crédit et solde net de la période (`total_general_debit - total_general_credit`).
    - Possibilité de filtrer sur une journée donnée via le paramètre optionnel `date_operation`.
  - **Endpoint API** : action `@action(detail=False) totaux` dans `MouvementViewSet` accessible via `GET /api/v1/mouvements/totaux/?periode=<id>&date=<YYYY-MM-DD>`.
  - **Tests unitaires** : ajout de `test_calcul_totaux_periode` dans [`apps/comptabilite/tests/test_services.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_services.py) validant les totaux de sections, le détail B1/B2, le solde net et le filtrage journalier (test exécuté et passé avec succès).
  - **Documentation** : [`../API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) mis à jour avec le registre et la réponse JSON type de `/api/v1/mouvements/totaux/`.
- Fichiers/dossiers touchés : `apps/comptabilite/services.py`, `apps/comptabilite/views.py`, `apps/comptabilite/tests/test_services.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 4, tâche `Logique de calcul des totaux par sous-section (B1+B2+B3+B4) et total général, dans services.py, testée unitairement`.
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : Prochaine tâche : `Test unitaire : montant_rectifie = montant + augmentation - diminution est vérifié et rejeté si incohérent`.

### 2026-10-14 — Endpoint de création/modification d'un mouvement (Section 4, Tâche 3)
- Ce qui a été fait :
  - **Serializers** ([`apps/comptabilite/serializers.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/serializers.py)) :
    - Création de `MouvementSerializer` avec enrichissement relationnel (`ligne_detail`, `saisi_par_username`, `rectifie_par_username`, `a_ecart`).
    - Délégation des validations et de la création/mise à jour au module métier `services.py`.
  - **Permissions RBAC** ([`apps/comptabilite/permissions.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/permissions.py)) :
    - `IsSaisieAllowed` : lecture pour tous les authentifiés, création et modification autorisées pour `ADMIN`, `RECEVEUR` et `AGENT_SAISIE` avec isolation stricte au bureau de rattachement.
  - **Vues & Routage** ([`apps/comptabilite/views.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/views.py), [`apps/comptabilite/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/urls.py)) :
    - `MouvementViewSet` : CRUD complet avec filtrage par période, bureau, date, section, sens et compte.
    - `perform_destroy` : protection interdisant la suppression d'une écriture sur une période déjà clôturée.
  - **Tests unitaires** : création et passage réussi de [`apps/comptabilite/tests/test_api_mouvements.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_api_mouvements.py) (4 tests passés : création avec initialisation stricte, filtres de liste, modification avant audit, rejet de suppression sur période clôturée).
  - **Documentation** : [`../API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) mis à jour avec les endpoints `GET, POST /api/v1/mouvements/` et `PATCH, PUT, DELETE /api/v1/mouvements/{id}/`.
- Fichiers/dossiers touchés : `apps/comptabilite/serializers.py`, `apps/comptabilite/permissions.py`, `apps/comptabilite/views.py`, `apps/comptabilite/urls.py`, `apps/comptabilite/tests/test_api_mouvements.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 4, tâche `Endpoint de création/modification d'un mouvement`.
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : Prochaine tâche : `Logique de calcul des totaux par sous-section (B1+B2+B3+B4) et total général, dans services.py, testée unitairement`.

### 2026-10-14 — Logique de validation dans services.py (Section 4, Tâche 2)
- Ce qui a été fait :
  - Création du module métier [`apps/comptabilite/services.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/services.py) :
    - `valider_periode_active` : blocage strict des opérations si la période de gestion est clôturée.
    - `valider_date_operation` : vérification que la date d'opération est comprise entre la date de début et de fin de la période.
    - `valider_ligne_comptable` : contrôle d'activation de la ligne et interdiction d'imputation directe sur des lignes de regroupement (seules les lignes feuilles sont autorisées).
    - `verifier_coherence_montants` : validation de l'équation comptable `montant_rectifie = montant + augmentation - diminution`.
    - `creer_mouvement` : initialisation transactionnelle stricte d'un mouvement avec `montant_rectifie = montant`, `augmentation = 0`, `diminution = 0`, `motif_rectification = ""` et `rectifie_par = None`.
    - `modifier_mouvement` : modification par l'opérateur avec maintien de la cohérence comptable.
  - Rédaction et exécution de la suite de tests unitaires [`apps/comptabilite/tests/test_services.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_services.py) (5 tests passés avec succès).
- Fichiers/dossiers touchés : `apps/comptabilite/services.py`, `apps/comptabilite/tests/test_services.py`, `PROJECT_STATE.md`.
- Cases cochées : section 4, tâche `Logique de validation dans services.py : période active, montant_rectifie initialisé = montant à la création`.
- API_CONTRACT.md mis à jour : non applicable (services métier internes, pas d'endpoint créé à cette étape).
- Points restés ouverts ou à valider avec l'utilisateur : Prochaine tâche : `Endpoint de création/modification d'un mouvement`.

### 2026-10-14 — Modèle Mouvement (Section 4, Tâche 1)
- Ce qui a été fait :
  - Validation et vérification de la modélisation du modèle [`Mouvement`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/models.py#L209-L325) dans `apps/comptabilite/models.py` :
    - Relations `periode_gestion` (`referentiel.PeriodeGestion`), `ligne_comptable` (`LigneComptable`), traçabilité `saisi_par` et `rectifie_par` (`accounts.User`).
    - Champs monétaires `montant`, `augmentation`, `diminution`, `montant_rectifie`, motif de rectification et méthode métier `a_ecart()`.
    - Indexation optimisée pour les requêtes par période et date, par ligne, et pour la détection d'écarts (`vue DIF`).
  - Ajout des tests unitaires dédiés dans [`apps/comptabilite/tests/test_models.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_models.py) validant l'instanciation, la méthode `a_ecart()` et la représentation textuelle.
- Fichiers/dossiers touchés : `apps/comptabilite/tests/test_models.py`, `PROJECT_STATE.md`.
- Cases cochées : section 4, tâche `Modèle Mouvement (montant, augmentation, diminution, montant_rectifie, motif, FK ligne comptable + période)`.
- API_CONTRACT.md mis à jour : non applicable (modèle ORM et tests, pas d'endpoint créé à cette étape).
- Points restés ouverts ou à valider avec l'utilisateur : Prochaine tâche de la section 4 : `Logique de validation dans services.py : période active, montant_rectifie initialisé = montant à la création`.

### 2026-10-14 — Module Stock de valeurs postales (Section 7)
- Ce qui a été fait :
  - **Modélisation & Référentiel** : validation des modèles [`ProduitPostal`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/models.py#L20-L70) et [`StockValeurPostale`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/models.py#L71-L172) (Tableau A G58).
  - **Script de seed** : création de [`apps/stock/management/commands/seed_produits_postaux.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/management/commands/seed_produits_postaux.py) initialisant de façon idempotente 14 produits postaux (timbres d'affranchissement usuels de 100 à 5000 Ar, timbres fiscaux de 1000 à 10000 Ar, aérogrammes...).
  - **Serializers DRF & Logique métier** ([`apps/stock/serializers.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/serializers.py)) :
    - Calcul automatique de la quantité finale (`quantite_finale = quantite_initiale + quantite_recue - quantite_vendue`).
    - Calcul automatique des valeurs monétaires en fonction de la valeur faciale du produit.
    - Contrôles d'intégrité métier : refus si période clôturée, refus si la période n'appartient pas au bureau indiqué, refus si la quantité vendue dépasse le stock disponible.
  - **Vues & Endpoints** ([`apps/stock/views.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/views.py)) :
    - `ProduitPostalViewSet` : CRUD/consultation des produits postaux.
    - `StockValeurPostaleViewSet` : saisie et consultation du stock, filtrable par bureau, période, produit ou catégorie.
    - Action `@action(detail=False) recapitulatif` : totaux agrégés du Tableau A (valeur initiale, reçue, vendue, finale et quantités) pour une période et un bureau.
  - **Permissions RBAC** ([`apps/stock/permissions.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/permissions.py)) : lecture pour tous les authentifiés, écriture réservée à l'ADMIN et au RECEVEUR du bureau.
  - **Routage** : [`apps/stock/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/urls.py) inclus dans [`config/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/config/urls.py).
  - **Tests unitaires** : [`apps/stock/tests/test_api_stock.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/stock/tests/test_api_stock.py) (5 tests passés avec succès couvrant création, calculs automatiques, rejet de survente, rejet sur période clôturée et récapitulatif agrégé).
  - **Documentation** : [`../API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) mis à jour avec les nouveaux endpoints et payloads d'exemple.
- Fichiers/dossiers touchés : `apps/stock/`, `config/urls.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 7 (les 3 cases).
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : Section 7 terminée.

### 2026-10-14 — Endpoint de recherche instantanée dans les lignes comptables (Section 3, Tâches 3 & 4)
- Ce qui a été fait :
  - Création des serializers [`apps/comptabilite/serializers.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/serializers.py) :
    - `SectionComptableSerializer` : exposition des champs code, libelle, sens, sens_libelle, ordre, actif.
    - `LigneComptableSerializer` : enrichissement relationnel avec `section_code`, `section_libelle`, `sens`, `sens_libelle` et `parent_detail` imbriqué (code, compte, libellé).
  - Création des vues DRF dans [`apps/comptabilite/views.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/views.py) :
    - `LigneComptableViewSet` (`ReadOnlyModelViewSet`) : endpoint `GET /api/v1/lignes-comptables/` optimisé via `select_related("section", "parent")`.
    - Recherche instantanée textuelle insensible à la casse sur `compte`, `libelle`, `section__code`, `section__libelle` via le paramètre `?search=`.
    - Filtrage multi-critères : `section` (code ou id), `sens` (1=Débit, 2=Crédit), `parent` (id ou `null`), `feuille=true` (uniquement les lignes imputables n'ayant pas de sous-lignes), et `actif` (par défaut `true`).
    - `SectionComptableViewSet` (`ReadOnlyModelViewSet`) : endpoint `GET /api/v1/sections-comptables/` pour lister le référentiel des sections A à E.
  - Configuration du routage dans [`apps/comptabilite/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/urls.py) et intégration dans [`config/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/config/urls.py).
  - Rédaction et exécution de la suite de tests unitaires [`apps/comptabilite/tests/test_api_plan_comptable.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_api_plan_comptable.py) (6 tests passés avec succès : contrôle RBAC/401, recherche instantanée par libellé et par compte, enrichissement parent_detail, filtrage par sens comptable et filtre feuille).
  - Documentation exhaustive dans [`../API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) (registre mis à jour, paramètres d'URL, payloads JSON d'exemple pour le frontend).
- Fichiers/dossiers touchés : `apps/comptabilite/serializers.py`, `apps/comptabilite/views.py`, `apps/comptabilite/urls.py`, `config/urls.py`, `apps/comptabilite/tests/test_api_plan_comptable.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 3, tâches `Endpoint de recherche instantanée dans les lignes comptables` et `Documenter cet endpoint dans ../API_CONTRACT.md`.
- API_CONTRACT.md mis à jour : oui (tableau §3, exemples payloads §4, journal §5).
- Points restés ouverts ou à valider avec l'utilisateur : Section 3 entièrement complétée ! Prochaine étape : Section 4 (Saisie du Journal G58 — cœur fonctionnel : calculs automatiques, création/consultation des mouvements, alerte écart DIF).

### 2026-10-14 — Script de seed des lignes comptables réelles (Section 3, Tâche 2)
- Ce qui a été fait :
  - Création de la commande de gestion Django [`apps/comptabilite/management/commands/seed_plan_comptable.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/management/commands/seed_plan_comptable.py) exécutable via `python manage.py seed_plan_comptable [--reset]`.
  - Insertion idempotente et transactionnelle des sections et lignes comptables réelles conformes au CDC ComptaGe et au Journal G58 :
    - **5 Sections principales** : Section A (Opérations d'ordre postal et financier, Débit), Section B (Correspondances et objets, Crédit), Section C (Mouvements de fonds et trésorerie, Débit), Section D (Dépenses budgétaires et rémunérations, Crédit), Section E (Régularisations et opérations d'ordre).
    - **Hiérarchie Section B** : création des 4 sous-opérations intermédiaires (`B1` Émissions/versements mandats, `B2` Paiements mandats, `B3` Chèques postaux CCP et épargne, `B4` Services pour compte de tiers) et de leurs lignes de produits feuilles respectives.
    - **45 lignes comptables réelles créées** avec préfixes de compte (`AD01`-`AD10`, `B101`-`B105`, `B201`-`B204`, `B301`-`B304`, `B401`-`B404`, `CD01`-`CD04`, `DD01`-`DD06`, `ED01`-`ED04`) et codes d'imputation uniques `menu_sub`.
  - Exécution réussie de la commande et validation de son idempotence (exécutions répétées sans duplication).
  - Validation de la cohabitation des tests unitaires `test_models.py` avec les données pré-chargées.
- Fichiers/dossiers touchés : `apps/comptabilite/management/`, `apps/comptabilite/management/commands/seed_plan_comptable.py`, `PROJECT_STATE.md`.
- Cases cochées : section 3, tâche `Script de seed des lignes comptables réelles (à partir du CDC et des captures du formulaire papier — sections A, B avec B1-B4, D en priorité)`.
- API_CONTRACT.md mis à jour : non applicable (commande de seed CLI, pas d'endpoint).
- Points restés ouverts ou à valider avec l'utilisateur : Prêt pour la tâche suivante : `Endpoint de recherche instantanée dans les lignes comptables` et sa documentation dans `API_CONTRACT.md`.

### 2026-10-14 — Modélisation SectionComptable / LigneComptable (Section 3, Tâche 1)
- Ce qui a été fait :
  - Validation et finalisation des modèles [`SectionComptable`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/models.py#L25-L73) et [`LigneComptable`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/models.py#L74-L132) dans `apps/comptabilite/models.py` :
    - `SectionComptable` : code unique (A, B, C, D, E), libelle, sens comptable (`Sens.DEBIT`, `Sens.CREDIT`, `Sens.NON_APPLICABLE`), statut actif et ordre d'affichage.
    - `LigneComptable` : FK vers `SectionComptable`, FK récursive optionnelle `parent` pour la hiérarchie à sous-niveaux (ex. sous-opérations B1 à B4), code `menu_sub` unique (code produit d'imputation), préfixe `compte` (ex: AD, BD, CD) et libellé de rubrique.
    - Contraintes d'intégrité relationnelle strictes (`on_delete=models.PROTECT`) interdisant la suppression orpheline d'une section ou d'une ligne parente.
  - Application effective de la migration `0001_initial` de l'application `comptabilite` sur la base PostgreSQL locale.
  - Rédaction et exécution complète de la suite de tests unitaires [`apps/comptabilite/tests/test_models.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_models.py) (7/7 tests passés au vert : création, unicité du code, hiérarchie section -> sous-opération -> produit, unicité de `menu_sub`, et protection contre les suppressions en cascade).
- Fichiers/dossiers touchés : `apps/comptabilite/models.py`, `apps/comptabilite/tests/test_models.py`, `PROJECT_STATE.md`.
- Cases cochées : section 3, tâche `Modélisation SectionComptable / LigneComptable (hiérarchie section → sous-opération → produit)`.
- API_CONTRACT.md mis à jour : non applicable (étape de modélisation ORM pure, aucun endpoint exposé).
- Points restés ouverts ou à valider avec l'utilisateur : Prêt pour la tâche suivante de la section 3 : `Script de seed des lignes comptables réelles (sections A, B avec B1-B4, D en priorité)`.

### 2026-10-08 — Test unitaire : interdiction de mouvement sur période clôturée (Section 2 finalisée)
- Ce qui a été fait :
  - Ajout de la méthode de garde métier [`verifier_active()`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/models.py#L236-L248) sur le modèle `PeriodeGestion`, levant une `ValidationError` explicite si `cloturee=True`.
  - Implémentation du test unitaire `test_impossible_saisir_mouvement_sur_periode_cloturee` dans [`apps/referentiel/tests/test_models.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/tests/test_models.py#L128-L163) garantissant que toute tentative d'écriture / opération sur une période clôturée est rejetée.
  - Exécution réussie des 15 tests unitaires du module `referentiel` (modèles, permissions RBAC, ouverture avec inventaire, clôture, contraintes d'intégrité).
- Fichiers/dossiers touchés : `apps/referentiel/models.py`, `apps/referentiel/tests/test_models.py`, `PROJECT_STATE.md`.
- Cases cochées : section 2, tâche `Test unitaire : impossible de saisir un mouvement sur une période clôturée` (100% de la Section 2 complétée).
- API_CONTRACT.md mis à jour : non applicable (déjà à jour).
- Points restés ouverts ou à valider avec l'utilisateur : **Section 2 intégralement terminée.** Prêt pour la Section 3 (Plan comptable - sections A-E).

### 2026-10-08 — Endpoint de clôture d'une période de gestion (Section 2)
- Ce qui a été fait :
  - Implémentation de l'action personnalisée DRF `@action(detail=True, methods=["post"], url_path="cloturer")` dans [`PeriodeGestionViewSet`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/views.py#L60-L86) :
    - Route accessible sous `POST /api/v1/periodes-gestion/{id}/cloturer/`.
    - Vérification d'état : rejet avec `400 Bad Request` si la période est déjà clôturée.
    - Passage à l'état clôturé (`cloturee=True`, équivalent coupure = 1) et enregistrement automatique de la date et de l'heure effectives (`date_cloture = timezone.now()`).
    - Restriction d'accès stricte via `IsReceveurOrAdmin` (seul un Receveur ou un Admin peut clôturer).
  - Écriture des tests unitaires dédiés dans [`apps/referentiel/tests/test_api_periode.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/tests/test_api_periode.py) validant le passage à 200, l'interdiction de double clôture (400), et le rejet des profils non habilités (403).
  - Mise à jour d'[API_CONTRACT.md](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) pour documenter la route et son payload retour.
- Fichiers/dossiers touchés : `apps/referentiel/views.py`, `apps/referentiel/tests/test_api_periode.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 2, tâches `Endpoint de clôture d'une période de gestion` et `Documenter ces endpoints dans ../API_CONTRACT.md`.
- API_CONTRACT.md mis à jour : oui (`/api/v1/periodes-gestion/{id}/cloturer/` documenté).
- Points restés ouverts ou à valider avec l'utilisateur : Attente de validation avant d'entamer la tâche suivante ("Test unitaire : impossible de saisir un mouvement sur une période clôturée").

### 2026-10-08 — Endpoint d'ouverture d'une période de gestion avec inventaire initial obligatoire (Section 2)
- Ce qui a été fait :
  - Création de la classe de permission [`IsReceveurOrAdmin`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/permissions.py#L23-L41) dans `apps/referentiel/permissions.py` (lecture ouverte aux utilisateurs connectés, création/ouverture restreinte aux profils `RECEVEUR` et `ADMIN`).
  - Implémentation du serializer [`PeriodeGestionSerializer`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/serializers.py#L40-L107) avec validations strictes :
    - Inventaire initial obligatoire (`reserve_numeraire`, `valeurs_postales`, `timbres_fiscaux` requis et >= 0).
    - Cohérence temporelle (`date_fin >= date_debut`).
    - Unicité de la période active (interdiction formelle d'ouvrir une seconde période pour un même bureau tant que la précédente n'est pas clôturée).
  - Création du ViewSet [`PeriodeGestionViewSet`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/views.py#L35-L58) et enregistrement de l'endpoint `/api/v1/periodes-gestion/` dans le routeur DRF.
  - Écriture de la suite de tests unitaires [`apps/referentiel/tests/test_api_periode.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/tests/test_api_periode.py) validant l'ouverture nominale, le rejet en cas d'omission d'inventaire initial, le rejet RBAC des agents de saisie, et le rejet de double période ouverte.
  - Mise à jour d'[API_CONTRACT.md](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) avec description de `/api/v1/periodes-gestion/` et exemple complet de payload.
- Fichiers/dossiers touchés : `apps/referentiel/permissions.py`, `apps/referentiel/serializers.py`, `apps/referentiel/views.py`, `apps/referentiel/urls.py`, `apps/referentiel/tests/test_api_periode.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 2, tâche `Endpoint d'ouverture d'une période de gestion (validation de l'inventaire initial obligatoire : numéraire, valeurs postales, timbres fiscaux)`.
- API_CONTRACT.md mis à jour : oui (`/api/v1/periodes-gestion/` documenté avec exemple de requête/réponse).
- Points restés ouverts ou à valider avec l'utilisateur : Attente de validation avant d'entamer l'endpoint de clôture d'une période de gestion.

### 2026-10-08 — Modèle PeriodeGestion (ouverture/clôture, soldes d'ouverture) (Section 2)
- Ce qui a été fait :
  - Création du modèle [`PeriodeGestion`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/models.py#L112-L241) correspondant à `tblGestionBur` du CDC :
    - Clé étrangère stricte vers `Bureau` (`on_delete=models.PROTECT`).
    - Clé étrangère optionnelle vers `User` (`receveur`) et champ textuel `nom_receveur`.
    - Plage temporelle (`date_debut`, `date_fin`) avec contrainte SQL CheckConstraint (`date_fin >= date_debut`) et validation Django (`clean()`).
    - Soldes et inventaire d'ouverture en Ariary (MGA) : `reserve_numeraire`, `valeurs_postales`, `timbres_fiscaux`, `solde_debiteur_depart`, `solde_crediteur_depart` (avec validateurs `MinValueValidator(0)`).
    - État de gestion : indicateur booléen `cloturee` (coupure : False = en cours, True = clôturé) et horodatage `date_cloture`.
    - Indexation composite B-Tree sur `(bureau, cloturee)` et `(date_debut, date_fin)`.
  - Génération de la migration `0002_periodegestion` et application sur PostgreSQL (`comptage_dev`).
  - Écriture des tests unitaires validant l'intégrité, le rejet si `date_fin < date_debut`, les valeurs par défaut et l'interdiction de suppression du bureau rattaché.
- Fichiers/dossiers touchés : `apps/referentiel/models.py`, `apps/referentiel/migrations/0002_periodegestion.py`, `apps/referentiel/tests/test_models.py`, `PROJECT_STATE.md`.
- Cases cochées : section 2, tâches `Modèle PeriodeGestion (ouverture/clôture, soldes d'ouverture)` et `Test unitaire : la date de fin de gestion doit être ≥ date de début`.
- API_CONTRACT.md mis à jour : non applicable (pas d'endpoint créé/modifié pour cette tâche de modélisation pure).
- Points restés ouverts ou à valider avec l'utilisateur : Attente de validation avant de passer à l'endpoint d'ouverture d'une période de gestion.

### 2026-10-08 — CRUD Bureau côté API (réservé Admin pour l'écriture) (Section 2)
- Ce qui a été fait :
  - Création de la classe de permission [`IsAdminUserOrReadOnly`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/permissions.py#L4-L20) autorisant la lecture publique / authentifiée, et restreignant l'écriture (`POST`, `PUT`, `PATCH`, `DELETE`) aux utilisateurs ayant le rôle `ADMIN` (ou `is_staff` / `is_superuser`).
  - Création des serializers [`ProvinceSerializer`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/serializers.py#L5-L10) et [`BureauSerializer`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/serializers.py#L13-L37) avec détail imbriqué de la province en lecture (`province_detail`).
  - Création des ViewSets [`ProvinceViewSet`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/views.py#L7-L16) et [`BureauViewSet`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/views.py#L19-L33) avec filtres de recherche et ordonnancement.
  - Configuration du routeur DRF dans [`apps/referentiel/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/urls.py) et inclusion sous `/api/v1/` dans [`config/urls.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/config/urls.py#L14).
  - Écriture des tests unitaires complets du flux CRUD et du RBAC dans [`apps/referentiel/tests/test_api_bureau.py`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/tests/test_api_bureau.py).
  - Mise à jour et documentation complète dans [`API_CONTRACT.md`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/API_CONTRACT.md) avec exemples complets de requêtes/réponses.
- Fichiers/dossiers touchés : `apps/referentiel/permissions.py`, `apps/referentiel/serializers.py`, `apps/referentiel/views.py`, `apps/referentiel/urls.py`, `apps/referentiel/tests/test_api_bureau.py`, `apps/referentiel/tests/test_models.py`, `config/urls.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 2, tâche `CRUD Bureau côté API (réservé Admin pour l'écriture)`.
- API_CONTRACT.md mis à jour : oui (`/api/v1/bureaux/` et `/api/v1/bureaux/{id}/` passés à `implémenté` avec payloads d'exemple).
- Points restés ouverts ou à valider avec l'utilisateur : Attente de validation avant de poursuivre vers la tâche suivante (`Modèle PeriodeGestion`).

### 2026-10-08 — Modèles Province et Bureau avec contraintes FK strictes (Section 2)
- Ce qui a été fait :
  - Création de l'application Django `apps/referentiel` avec `ReferentielConfig` et déclaration dans `INSTALLED_APPS`.
  - Implémentation du modèle [`Province`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/models.py#L9-L33) (numéro de province unique, nom unique).
  - Implémentation du modèle [`Bureau`](file:///home/johari/Stage/PAOSITRA%20MALAGASY/ComptaGe-PAOMA/server/apps/referentiel/models.py#L36-L105) avec clé étrangère stricte vers `Province` (`on_delete=models.PROTECT`), unicité de `ncodique`, indexation B-Tree (`ncodique`, `province`), et attributs métier (`classe`, `ccp`, `ncf`, `cf_codik`).
  - Génération de la migration `0001_initial` et application réussie sur PostgreSQL (`comptage_dev`).
  - Écriture des tests unitaires validant l'intégrité relationnelle, l'unicité et le blocage de suppression en cascade.
- Fichiers/dossiers touchés : `apps/referentiel/`, `config/settings/base.py`, `PROJECT_STATE.md`.
- Cases cochées : section 2, première tâche (`Modèles Province, Bureau`).
- API_CONTRACT.md mis à jour : non applicable (pas d'endpoint créé/modifié lors de cette tâche de modélisation pure).
- Points restés ouverts ou à valider avec l'utilisateur : Attente de validation avant de poursuivre avec la tâche suivante ("CRUD Bureau côté API").

### 2026-10-06 — Initialisation du projet et squelette backend (Section 0)
- Ce qui a été fait :
  - Création de l'arborescence complète de `server/` (config/settings modulaire, apps: accounts, referentiel, comptabilite, audit, stock, scripts).
  - Installation de l'ensemble des dépendances (Django 5.1, DRF 3.17, SimpleJWT 5.5, django-cors-headers, psycopg 3.3, dj-database-url, python-dotenv, pytest, pytest-django).
  - Création de `requirements.txt`, `.env.example`, `.env`, `.gitignore` et `pytest.ini`.
  - Configuration de base Django avec support CORS pour le client Vite (http://localhost:5173).
  - Implémentation de l'endpoint de healthcheck `/api/v1/health/` retournant 200 avec status, service et version.
  - Écriture et passage du test unitaire pytest (`tests/test_healthcheck.py`).
  - Déclaration et documentation de `/api/v1/health/` avec exemple de payload dans `../API_CONTRACT.md`.
- Fichiers/dossiers touchés : `requirements.txt`, `.env.example`, `.env`, `.gitignore`, `pytest.ini`, `manage.py`, `config/`, `apps/`, `tests/test_healthcheck.py`, `PROJECT_STATE.md`, `../API_CONTRACT.md`.
- Cases cochées : section 0 (100% complétée).
- API_CONTRACT.md mis à jour : oui (/api/v1/health/ ajouté dans le registre et les exemples).
- Points restés ouverts ou à valider avec l'utilisateur : Base PostgreSQL locale connectée et validée (`comptage_dev`, utilisateur `comptage_user`). Prêt pour la section 1 (Authentification & RBAC).

### 2026-10-08 — Module authentification et RBAC
- Ce qui a été fait :
  - Création de l'app `apps.accounts` avec un `User` custom basé sur `AbstractUser` et les rôles `ADMIN`, `RECEVEUR`, `AGENT_SAISIE`, `INSPECTEUR`.
  - Ajout des endpoints JWT `/api/v1/auth/login/`, `/api/v1/auth/refresh/`, `/api/v1/auth/logout/` et `/api/v1/auth/me/`.
  - Mise en place des permissions `IsAdmin`, `IsReceveur`, `IsAgentSaisie`, `IsInspecteur` et d'un helper de rattachement au bureau `IsSameBureau`.
  - Ajout d'une migration initiale pour le modèle utilisateur.
  - Écriture de tests pour le flux login / me / logout et pour les permissions par rôle / bureau.
- Fichiers/dossiers touchés : `server/apps/accounts/`, `server/config/settings/base.py`, `server/config/urls.py`, `server/PROJECT_STATE.md`.
- Cases cochées : section 1, tâches 1 à 4.
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : la règle métier exacte de blacklist/révocation au logout n'est pas encore branchée côté serveur ; la déconnexion est pour l'instant gérée côté client en supprimant les jetons.

### 2026-10-09 — Endpoint d'inscription utilisateur
- Ce qui a été fait :
  - Ajout de l'endpoint `POST /api/v1/auth/register/` pour créer un utilisateur avec hachage du mot de passe via `User.objects.create_user()`.
  - Protection de l'inscription par le rôle `ADMIN`.
  - Ajout d'un test vérifiant la création d'un compte, le hachage du mot de passe et le refus pour un appel non authentifié.
- Fichiers/dossiers touchés : `server/apps/accounts/serializers.py`, `server/apps/accounts/views.py`, `server/apps/accounts/urls.py`, `server/apps/accounts/tests/test_auth.py`, `API_CONTRACT.md`, `server/PROJECT_STATE.md`.
- Cases cochées : section 1, tâche ajoutée inscription utilisateur.
- API_CONTRACT.md mis à jour : oui.
- Points restés ouverts ou à valider avec l'utilisateur : rien de bloquant ; l'inscription est volontairement réservée à l'admin pour rester cohérente avec le RBAC du projet.

<!-- Nouvelles entrées à ajouter au-dessus de cette ligne, les plus récentes en premier -->

### 2026-10-13 — Création de tous les modèles Django (apps comptabilite, audit, stock)
- Ce qui a été fait :
  - Création des apps Django `apps.comptabilite`, `apps.audit` et `apps.stock` via `manage.py startapp`.
  - **`apps/comptabilite/models.py`** : 6 modèles conformes au CDC § 2 et ARCHITECTURE.md :
    - [`SectionComptable`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/models.py) → `tblMenuParent` / `tblClasse` (code, libelle, sens Débit/Crédit, actif, ordre)
    - [`LigneComptable`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/models.py) → `tblMenuSub` (menu_sub, compte, libelle, FK Section + FK parent hiérarchique pour B1-B4)
    - [`RubriqueEncaisseParent`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/models.py) → `tblEncaisseParent`
    - [`RubriqueEncaisse`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/models.py) → `tblEncaisse` (TR, SF, CR…)
    - [`Mouvement`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/models.py) → `tblMvt` (montant, augmentation, diminution, montant_rectifie, motif_rectification, saisi_par, rectifie_par, date_operation)
    - [`MouvementEncaisse`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/models.py) → `tblMvtEncaisse` (sens, montant, date, saisi_par)
  - **`apps/audit/models.py`** : 1 modèle :
    - [`AuditLogEntry`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/models.py) — table immuable (append-only) répondant à CDC § 6.2 (auteur, action, objet, detail JSON, created_at)
  - **`apps/stock/models.py`** : 2 modèles :
    - [`ProduitPostal`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/stock/models.py) → `Products` / `Categories` simplifié (TextChoices VP, TF, MA, IF, CO, AU)
    - [`StockValeurPostale`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/stock/models.py) → Tableau A G58 (quantite/valeur initial-reçu-vendu-final, UniqueConstraint bureau+periode+produit)
  - Enregistrement dans `INSTALLED_APPS` (base.py).
  - `manage.py check` → 0 erreur.
  - `makemigrations comptabilite audit stock` → 3 migrations `0001_initial` générées.
  - `manage.py migrate` → toutes appliquées sur PostgreSQL (`comptage_dev`).
- Fichiers/dossiers touchés :
  - `apps/comptabilite/` (créé), `apps/audit/` (créé), `apps/stock/` (créé)
  - `config/settings/base.py` (INSTALLED_APPS mis à jour)
  - `PROJECT_STATE.md`
- Cases cochées : aucune case de PROJECT_STATE.md directement (Section 3-7 restent `[ ]` — cette entrée prépare le terrain pour la Section 3).
- API_CONTRACT.md mis à jour : non applicable (modèles uniquement, pas d'endpoint).
- Points restés ouverts ou à valider : Prêt pour Section 3 (SectionComptable + LigneComptable seed + endpoint de recherche), puis Section 4 (vues/serializers Mouvement).

