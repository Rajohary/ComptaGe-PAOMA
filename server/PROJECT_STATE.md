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
- [ ] Script de seed des lignes comptables réelles (à partir du CDC et des captures du formulaire papier — sections A, B avec B1-B4, D en priorité)
- [ ] Endpoint de recherche instantanée dans les lignes comptables (consommé par le composant de recherche frontend qui remplace le TreeView legacy)
- [ ] Documenter cet endpoint dans `../API_CONTRACT.md` (c'est un endpoint critique pour l'UX frontend — soigner la description du format de réponse)

---

## 4. Saisie du Journal G58 — cœur fonctionnel

- [x] Modèle `Mouvement` (montant, augmentation, diminution, montant_rectifie, motif, FK ligne comptable + période)
- [ ] Logique de validation dans `services.py` : période active, `montant_rectifie` initialisé = `montant` à la création
- [ ] Endpoint de création/modification d'un mouvement
- [ ] Logique de calcul des totaux par sous-section (B1+B2+B3+B4) et total général, dans `services.py`, testée unitairement
- [ ] Test unitaire : `montant_rectifie = montant + augmentation - diminution` est vérifié et rejeté si incohérent
- [~] Modèle `MouvementEncaisse` + endpoint associé (modèle créé — endpoint restant)
- [ ] Endpoint « Situation comptable » avec report automatique du solde du mois précédent
- [ ] Test unitaire : le report de solde d'un mois sur l'autre est correct
- [ ] Documenter tous ces endpoints dans `../API_CONTRACT.md`

---

## 5. Audit et détection d'écarts

- [ ] Endpoint listant les mouvements où `montant ≠ montant_rectifie` (équivalent de la vue DIF du système legacy)
- [ ] Endpoint de rectification (obligation de motif, calcul automatique de `montant_rectifie`)
- [x] Modèle `AuditLogEntry` (historique immuable des modifications sensibles)
- [ ] Documenter ces endpoints dans `../API_CONTRACT.md`
- [ ] Test unitaire : une rectification sans motif est rejetée
- [ ] Test unitaire : seul un inspecteur peut appeler l'endpoint de rectification

---

## 6. Tableaux de bord (endpoints d'agrégation)

- [x] Endpoint de progression de saisie du mois en cours par bureau (pour dashboard Receveur)
- [x] Endpoint de liste des écarts filtrable (pour dashboard Inspecteur)
- [x] Endpoint de vue d'ensemble globale (pour dashboard Admin)
- [x] Documenter ces endpoints dans `../API_CONTRACT.md`

---

## 7. Stock de valeurs postales

- [x] Modèle `StockValeurPostale` (produit, valeur faciale, quantités/valeurs initial-reçu-vendu-final)
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

### 2026-10-15 — Module 6 : Tableaux de bord (endpoints d'agrégation) et vue DIF
- Ce qui a été fait :
  - **Dashboard Receveur (`apps/comptabilite/`)** :
    - Implémentation du service [`get_progression_saisie_receveur()`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/services.py) dans `apps/comptabilite/services.py` : calcul de la progression par section comptable (A à E, ENC), totaux des débits/crédits, solde net de la période, détection des écritures en écart, et suivi en temps réel de l'encaisse physique (`reserve_numeraire + entrees - sorties`).
    - Serializers dédiés dans [`apps/comptabilite/serializers.py`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/serializers.py).
    - Vue API [`ReceveurDashboardView`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/views.py) sous `GET /api/v1/dashboard/receveur/` avec vérification stricte du rattachement au bureau (un receveur ou agent ne peut pas consulter un autre bureau).
    - Suite de tests unitaires et d'API dans [`apps/comptabilite/tests/test_dashboard_receveur.py`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/comptabilite/tests/test_dashboard_receveur.py) (6 tests au vert : nominal, isolation inter-bureau, accès agent, accès admin, rejet 401, bureau sans période).
  - **Dashboard Inspecteur & Vue DIF (`apps/audit/`)** :
    - Implémentation du service d'anomalies et KPIs [`get_ecarts_queryset()`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/services.py) et [`calculate_ecarts_kpis()`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/services.py) dans `apps/audit/services.py` (critère : `montant != montant_rectifie` ou `augmentation > 0` ou `diminution > 0`).
    - Serializers détaillés dans [`apps/audit/serializers.py`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/serializers.py) incluant bureau, période, ligne, montant déclaré, rectifié, écart net, motif et agent/inspecteur.
    - Deux vues complémentaires protégées par `IsInspecteurOrAdmin` :
      - [`EcartsListView`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/views.py) sous `GET /api/v1/audit/ecarts/` (équivalent vue DIF du CDC) avec pagination DRF et filtres avancés (`bureau`, `province`, `periode`, `date_min`, `date_max`, `statut`, `search`, `ordering`).
      - [`InspecteurDashboardView`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/views.py) sous `GET /api/v1/dashboard/inspecteur/` avec KPIs globaux, synthèse des bureaux impactés et 10 dernières anomalies.
    - Tests unitaires et d'API dans [`apps/audit/tests/test_dashboard_inspecteur.py`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/audit/tests/test_dashboard_inspecteur.py) (filtrage, calculs KPIs, RBAC restrictif).
  - **Dashboard Admin (`apps/referentiel/`)** :
    - Implémentation du service [`get_admin_dashboard_overview()`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/referentiel/services.py) dans `apps/referentiel/services.py` agrégeant la vue macroscopique : réseau postal (bureaux actifs/inactifs, répartition classes et provinces), périodes de gestion (ouvertes/clôturées, taux de clôture), utilisateurs par rôle RBAC, volumétrie comptable globale (mouvements G58, débits, crédits, encaisse) et alertes d'audit.
    - Serializers et vue [`AdminDashboardView`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/referentiel/views.py) sous `GET /api/v1/dashboard/admin/`, réservée au rôle `ADMIN`.
    - Tests d'API complets dans [`apps/referentiel/tests/test_api_dashboard_admin.py`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/apps/referentiel/tests/test_api_dashboard_admin.py) (vue nominale, blocage RBAC des receveurs et auditeurs).
  - **Routage et contrat d'API** :
    - Inclusion des routes dans [`config/urls.py`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/server/config/urls.py).
    - Documentation exhaustive dans [`../API_CONTRACT.md`](file:///c:/Users/Kiksa/Documents/GitHub/ComptaGe-PAOMA/API_CONTRACT.md) avec exemples complets de requêtes et payloads JSON.
  - **Exécution des tests** : 31/31 tests passés au vert (`pytest` et `manage.py test`).
- Fichiers/dossiers touchés :
  - `server/apps/accounts/permissions.py`
  - `server/apps/comptabilite/services.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_dashboard_receveur.py`
  - `server/apps/audit/services.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_dashboard_inspecteur.py`
  - `server/apps/referentiel/services.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_api_dashboard_admin.py`
  - `server/config/urls.py`
  - `API_CONTRACT.md`
  - `server/PROJECT_STATE.md`
- Cases cochées : section 6 (100% complétée : 4/4 cases cochées).
- API_CONTRACT.md mis à jour : oui (endpoints `/api/v1/dashboard/receveur/`, `/api/v1/dashboard/inspecteur/`, `/api/v1/audit/ecarts/` et `/api/v1/dashboard/admin/` documentés avec exemples complets).
- Points restés ouverts ou à valider avec l'utilisateur : Néant, les 3 dashboards répondent aux spécifications d'agrégation et de sécurité RBAC. Prêt pour les sections 3/4.

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

