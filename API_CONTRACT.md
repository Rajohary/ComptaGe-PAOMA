# API_CONTRACT.md — Contrat d'interface Client ↔ Serveur

Ce fichier est le **seul point de vérité partagé** entre `client/` et `server/`. Les deux côtés du projet sont développés comme des sous-projets quasi indépendants (chacun a son propre `AGENT.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`), mais ils doivent rester synchronisés sur un seul sujet : **la forme des échanges API**. C'est ce fichier qui joue ce rôle, à la racine du repo, visible des deux côtés.

**Règle impérative pour tout agent (frontend ou backend) :** avant de créer, modifier ou consommer un endpoint, lire ce fichier. Après avoir créé ou modifié un endpoint côté backend, ou after avoir changé la façon dont le frontend consomme un endpoint, mettre à jour ce fichier dans le même tour de travail — jamais en différé. Un contrat qui ne reflète pas la réalité du code est pire qu'une absence de contrat.

---

## 1. Pourquoi ce fichier existe

Front et back sont dans des dossiers séparés, potentiellement travaillés dans des sessions Antigravity distinctes à des moments différents. Sans point de synchronisation explicite, le risque est que :
- le frontend suppose un format de réponse que le backend ne renvoie pas (ou plus),
- le backend renomme un champ sans que le frontend le sache,
- une règle de validation diffère entre les deux côtés (ex. un champ obligatoire en base mais optionnel dans le formulaire React).

Ce fichier n'est pas une documentation OpenAPI générée automatiquement — pour un projet solo de 6 semaines, ce serait une charge disproportionnée à maintenir. C'est un **registre manuel, volontairement simple**, tenu à jour à la main par l'agent qui touche un endpoint.

---

## 2. Conventions générales

- Toutes les routes sont préfixées `/api/v1/`.
- Authentification : JWT (header `Authorization: Bearer <token>`), obtenu via `/api/v1/auth/login/`.
- Format des dates : ISO 8601 (`YYYY-MM-DD` pour les dates seules, `YYYY-MM-DDTHH:MM:SSZ` pour les horodatages).
- Format des montants : nombres décimaux en Ariary (MGA), jamais de chaîne formatée avec séparateurs de milliers — le formatage visuel est une responsabilité du frontend, pas du backend.
- Pagination : tout endpoint de liste retourne `{ "count": int, "next": url|null, "previous": url|null, "results": [...] }` (pagination DRF standard).
- Erreurs : format DRF standard `{ "detail": "message" }` pour les erreurs globales, ou `{ "champ": ["message"] }` pour les erreurs de validation par champ.
- Codes de rôle utilisateur (valeur du champ `role`) : `ADMIN`, `RECEVEUR`, `AGENT_SAISIE`, `INSPECTEUR` — ces valeurs sont figées des deux côtés, ne jamais les traduire ou les renommer localement dans un seul des deux projets.

---

## 3. Registre des endpoints

Ce tableau est à compléter au fil de l'implémentation. Tant qu'un endpoint n'est pas encore implémenté côté backend, il peut être listé ici en état `planifié` pour que le frontend sache à quoi s'attendre et code contre une forme stable dès le départ.

| Endpoint | Méthode | Rôles autorisés | État | Description courte |
|---|---|---|---|---|
| `/api/v1/health/` | GET | Public | implémenté | Contrôle de santé de l'API (status, service, version) |
| `/api/v1/auth/register/` | POST | Admin | implémenté | Création d'un utilisateur, mot de passe haché côté Django |
| `/api/v1/auth/login/` | POST | Public | implémenté | Authentification, retourne access + refresh token + objet user |
| `/api/v1/auth/refresh/` | POST | Public (avec refresh token) | implémenté | Renouvellement du token d'accès |
| `/api/v1/auth/logout/` | POST | Authentifié | implémenté | Déconnexion côté client, réponse 200 |
| `/api/v1/auth/me/` | GET | Authentifié | implémenté | Infos de l'utilisateur courant (dont le rôle) |
| `/api/v1/bureaux/` | GET, POST | Admin (POST), tous (GET) | planifié | Liste / création des bureaux de poste |
| `/api/v1/bureaux/{id}/` | GET, PUT, DELETE | Admin | planifié | Détail / modification / suppression d'un bureau |
| `/api/v1/periodes-gestion/` | GET, POST | Receveur (sur son bureau), Admin | planifié | Ouverture d'une période de gestion |
| `/api/v1/auth/login/` | POST | Public | planifié | Authentification, retourne access + refresh token |
| `/api/v1/auth/refresh/` | POST | Public (avec refresh token) | planifié | Renouvellement du token d'accès |
| `/api/v1/auth/me/` | GET | Authentifié | planifié | Infos de l'utilisateur courant (dont le rôle) |
| `/api/v1/bureaux/` | GET, POST | Admin (POST), tous (GET) | implémenté (voir §4) | Liste / création des bureaux de poste |
| `/api/v1/bureaux/{id}/` | GET, PUT, PATCH, DELETE | Admin (PUT/PATCH/DELETE), tous (GET) | implémenté (voir §4) | Détail / modification / suppression d'un bureau |
| `/api/v1/periodes-gestion/` | GET, POST | Receveur (sur son bureau), Admin | implémenté (voir §4) | Liste / ouverture d'une période de gestion |
| `/api/v1/lignes-comptables/` | GET | Authentifié | implémenté (voir §4) | Recherche instantanée et référentiel du plan comptable (remplace TreeView legacy) |
| `/api/v1/sections-comptables/` | GET | Authentifié | implémenté (voir §4) | Référentiel des sections macro-comptables (A à E) |
| `/api/v1/produits-postaux/` | GET, POST, PUT, DELETE | Admin (écritures), Authentifié (GET) | implémenté (voir §4) | Référentiel des produits postaux et timbres fiscaux |
| `/api/v1/stocks-valeurs/` | GET, POST, PUT, PATCH, DELETE | Receveur (son bureau), Admin | implémenté (voir §4) | Suivi des stocks de valeurs postales (Tableau A G58) |
| `/api/v1/stocks-valeurs/recapitulatif/` | GET | Authentifié | implémenté (voir §4) | Synthèse et totaux financiers d'une période de gestion |
| `/api/v1/mouvements/` | GET, POST | Selon RBAC (voir ARCHITECTURE.md backend) | planifié | Création/consultation des mouvements G58 |
| `/api/v1/mouvements/{id}/rectifier/` | PATCH | Inspecteur | planifié | Rectification d'un mouvement (augmentation/diminution/motif) |
| `/api/v1/audit/ecarts/` | GET | Inspecteur, Admin | planifié | Liste des mouvements en écart (équivalent vue DIF) |
| `/api/v1/situation-comptable/{periode_id}/` | GET | Receveur (son bureau), Admin, Inspecteur | planifié | Situation comptable mensuelle avec report de solde |

**Note pour les deux agents :** quand un endpoint passe de `planifié` à `implémenté`, préciser dans la colonne État la forme exacte de la réponse (ou lier vers un exemple de payload en bas de ce fichier, section 4) — pas juste changer le mot.

---

## 4. Exemples de payloads (à enrichir au fil de l'implémentation)

### GET /api/v1/health/
Réponse 200 :
```json
{
  "status": "healthy",
  "service": "ComptaGeWeb Backend",
  "version": "1.0.0"
}
```

### POST /api/v1/auth/login/
Requête :
```json
{
  "username": "receveur1",
  "password": "StrongPass123!"
}
```

Réponse 200 :
```json
{
  "refresh": "<refresh_token>",
  "access": "<access_token>",
  "user": {
    "id": 1,
    "username": "receveur1",
    "first_name": "",
    "last_name": "",
    "email": "",
    "role": "RECEVEUR",
    "syst_fonc": "",
    "bureau_code": 101
  }
}
```

### POST /api/v1/auth/register/
Requête :
```json
{
  "username": "nouveau01",
  "password": "StrongPass123!",
  "first_name": "Nouveau",
  "last_name": "Compte",
  "email": "nouveau01@comptage.local",
  "role": "AGENT_SAISIE",
  "syst_fonc": "02",
  "bureau_code": 101
}
```

Réponse 201 :
```json
{
  "id": 5,
  "username": "nouveau01",
  "first_name": "Nouveau",
  "last_name": "Compte",
  "email": "nouveau01@comptage.local",
  "role": "AGENT_SAISIE",
  "syst_fonc": "02",
  "bureau_code": 101
}
```

### POST /api/v1/auth/refresh/
Requête :
```json
{
  "refresh": "<refresh_token>"
}
```

Réponse 200 :
```json
{
  "access": "<new_access_token>"
}
```

### POST /api/v1/auth/logout/
Requête :
```json
{}
```

Réponse 200 :
```json
{
  "detail": "Déconnexion effectuée."
}
```

### GET /api/v1/auth/me/
Réponse 200 :
```json
{
  "id": 1,
  "username": "receveur1",
  "first_name": "",
  "last_name": "",
  "email": "",
  "role": "RECEVEUR",
  "syst_fonc": "",
  "bureau_code": 101
}
```

### GET /api/v1/bureaux/
Réponse 200 (liste paginée avec `province_detail` inclus) :
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "province": 1,
      "province_detail": {
        "id": 1,
        "nprovince": 1,
        "nom": "Antananarivo"
      },
      "nbur": 1,
      "codeclasse": 1,
      "ncodique": 10101,
      "nom_bureau": "Antaninarenina",
      "classe": "R1",
      "ccp": "10020",
      "ncf": 1,
      "cf_codik": 10101,
      "created_at": "2026-10-08T15:55:33Z",
      "updated_at": "2026-10-08T15:55:33Z"
    }
  ]
}
```

### POST /api/v1/bureaux/ (Réservé Admin)
Requête :
```json
{
  "province": 1,
  "ncodique": 10101,
  "nom_bureau": "Antaninarenina",
  "classe": "R1",
  "ccp": "10020",
  "nbur": 1,
  "codeclasse": 1,
  "ncf": 1,
  "cf_codik": 10101
}
```
Réponse 201 :
```json
{
  "id": 1,
  "province": 1,
  "province_detail": {
    "id": 1,
    "nprovince": 1,
    "nom": "Antananarivo"
  },
  "nbur": 1,
  "codeclasse": 1,
  "ncodique": 10101,
  "nom_bureau": "Antaninarenina",
  "classe": "R1",
  "ccp": "10020",
  "ncf": 1,
  "cf_codik": 10101,
  "created_at": "2026-10-08T15:55:33Z",
  "updated_at": "2026-10-08T15:55:33Z"
}
```

### GET /api/v1/bureaux/{id}/
Réponse 200 : même structure qu'un élément du tableau ci-dessus.

### PUT / PATCH /api/v1/bureaux/{id}/ (Réservé Admin)
Requête (PATCH) :
```json
{
  "classe": "HC"
}
```
Réponse 200 : objet mis à jour.

### DELETE /api/v1/bureaux/{id}/ (Réservé Admin)
Réponse 204 No Content.

### POST /api/v1/periodes-gestion/ (Ouverture d'une période de gestion — Receveur ou Admin)
Requête :
```json
{
  "bureau": 1,
  "nom_receveur": "Rakoto Jean",
  "date_debut": "2026-06-01",
  "date_fin": "2026-06-30",
  "reserve_numeraire": "500000.00",
  "valeurs_postales": "250000.00",
  "timbres_fiscaux": "100000.00",
  "solde_debiteur_depart": "0.00",
  "solde_crediteur_depart": "0.00"
}
```
*Note : `reserve_numeraire`, `valeurs_postales` et `timbres_fiscaux` sont obligatoires (inventaire d'ouverture).*

Réponse 201 :
```json
{
  "id": 1,
  "bureau": 1,
  "bureau_detail": {
    "id": 1,
    "ncodique": 10101,
    "nom_bureau": "Antaninarenina",
    "classe": "R1"
  },
  "receveur": 2,
  "nom_receveur": "Rakoto Jean",
  "date_debut": "2026-06-01",
  "date_fin": "2026-06-30",
  "reserve_numeraire": "500000.00",
  "valeurs_postales": "250000.00",
  "timbres_fiscaux": "100000.00",
  "solde_debiteur_depart": "0.00",
  "solde_crediteur_depart": "0.00",
  "cloturee": false,
  "date_cloture": null,
  "created_at": "2026-10-08T16:15:00Z",
  "updated_at": "2026-10-08T16:15:00Z"
}
```

### POST /api/v1/periodes-gestion/{id}/cloturer/ (Clôture d'une période — Receveur ou Admin)
Requête : aucun body requis (ou `{}`).

Réponse 200 :
```json
{
  "id": 1,
  "bureau": 1,
  "bureau_detail": {
    "id": 1,
    "ncodique": 10101,
    "nom_bureau": "Antaninarenina",
    "classe": "R1"
  },
  "receveur": 2,
  "nom_receveur": "Rakoto Jean",
  "date_debut": "2026-06-01",
  "date_fin": "2026-06-30",
  "reserve_numeraire": "500000.00",
  "valeurs_postales": "250000.00",
  "timbres_fiscaux": "100000.00",
  "solde_debiteur_depart": "0.00",
  "solde_crediteur_depart": "0.00",
  "cloturee": true,
  "date_cloture": "2026-06-30T17:00:00Z",
  "created_at": "2026-10-08T16:15:00Z",
  "updated_at": "2026-10-08T16:22:00Z"
}
```
*En cas de tentative de re-clôture d'une période déjà clôturée : 400 Bad Request `{ "detail": "Cette période de gestion est déjà clôturée." }`.*

### GET /api/v1/sections-comptables/
Réponse 200 (liste paginée des sections A à E) :
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "A",
      "libelle": "Opérations d'ordre postal et financier",
      "sens": 1,
      "sens_libelle": "Débit",
      "actif": true,
      "ordre": 1
    },
    {
      "id": 2,
      "code": "B",
      "libelle": "Opérations relatives aux correspondances et objets",
      "sens": 2,
      "sens_libelle": "Crédit",
      "actif": true,
      "ordre": 2
    }
  ]
}
```

### GET /api/v1/lignes-comptables/ (Recherche instantanée plan comptable)
Endpoint consommé par le composant frontend de recherche / sélection rapide (remplace le TreeView legacy).
- **Accès :** Tout utilisateur authentifié (`RECEVEUR`, `AGENT_SAISIE`, `INSPECTEUR`, `ADMIN`).
- **Paramètres de requête (query params) :**
  - `search` : recherche textuelle instantanée (insensible à la casse) sur le préfixe de compte (ex: `B101`, `AD`), le libellé (ex: `mandat`, `timbres`), le code de section (`A`), ou le libellé de section.
  - `section` : filtre par code de section (`A`, `B`, `C`, `D`, `E`) ou par identifiant ID de section.
  - `sens` : filtre par sens comptable de la section (`1` = Débit, `2` = Crédit).
  - `parent` : ID de la ligne parente, ou `null` pour récupérer uniquement les lignes racines/groupes.
  - `feuille` : `true` pour ne récupérer que les lignes imputables (lignes terminales n'ayant pas de sous-lignes).
  - `actif` : `true` (par défaut), `false`, ou `all`.

Exemple de requête : `GET /api/v1/lignes-comptables/?search=mandat`

Réponse 200 :
```json
{
  "count": 9,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 22,
      "menu_sub": 200,
      "compte": "B1",
      "libelle": "Sous-section B1 — Émissions et versements mandats",
      "section": 2,
      "section_code": "B",
      "section_libelle": "Opérations relatives aux correspondances et objets",
      "sens": 2,
      "sens_libelle": "Crédit",
      "parent": null,
      "parent_detail": null,
      "actif": true
    },
    {
      "id": 23,
      "menu_sub": 201,
      "compte": "B101",
      "libelle": "Mandats ordinaires émis en numéraire",
      "section": 2,
      "section_code": "B",
      "section_libelle": "Opérations relatives aux correspondances et objets",
      "sens": 2,
      "sens_libelle": "Crédit",
      "parent": 22,
      "parent_detail": {
        "id": 22,
        "menu_sub": 200,
        "compte": "B1",
        "libelle": "Sous-section B1 — Émissions et versements mandats"
      },
      "actif": true
    }
  ]
}
```

### GET /api/v1/produits-postaux/
Réponse 200 (liste paginée des produits postaux) :
```json
{
  "count": 14,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "nom": "Timbre d'affranchissement 500 Ar",
      "categorie": "VP",
      "categorie_libelle": "Valeurs postales (timbres, aérogrammes…)",
      "valeur_faciale": "500.00",
      "actif": true
    }
  ]
}
```

### GET /api/v1/stocks-valeurs/ (Tableau A G58)
Filtres disponibles : `bureau` (id ou ncodique), `periode_gestion` ou `periode` (id), `produit` (id), `categorie` (VP, TF...).

Réponse 200 :
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "bureau": 1,
      "bureau_detail": {
        "id": 1,
        "ncodique": 10101,
        "nom_bureau": "Antaninarenina",
        "classe": "R1"
      },
      "periode_gestion": 1,
      "periode_detail": {
        "id": 1,
        "nom_receveur": "Rakoto Jean",
        "date_debut": "2026-06-01",
        "date_fin": "2026-06-30",
        "cloturee": false
      },
      "produit": 1,
      "produit_detail": {
        "id": 1,
        "nom": "Timbre d'affranchissement 500 Ar",
        "categorie": "VP",
        "categorie_libelle": "Valeurs postales (timbres, aérogrammes…)",
        "valeur_faciale": "500.00",
        "actif": true
      },
      "quantite_initiale": 100,
      "quantite_recue": 50,
      "quantite_vendue": 30,
      "quantite_finale": 120,
      "valeur_initiale": "50000.00",
      "valeur_recue": "25000.00",
      "valeur_vendue": "15000.00",
      "valeur_finale": "60000.00",
      "created_at": "2026-10-14T11:45:00Z",
      "updated_at": "2026-10-14T11:45:00Z"
    }
  ]
}
```

### POST /api/v1/stocks-valeurs/
Requête (les valeurs monétaires et `quantite_finale` sont calculées automatiquement si omises grâce à la `valeur_faciale` du produit) :
```json
{
  "bureau": 1,
  "periode_gestion": 1,
  "produit": 1,
  "quantite_initiale": 100,
  "quantite_recue": 50,
  "quantite_vendue": 30
}
```
*Validations : rejet 400 si la période est clôturée, si la période n'appartient pas au bureau, ou si quantite_vendue > initiale + reçue.*

### GET /api/v1/stocks-valeurs/recapitulatif/
Paramètres : `?periode=<id>&bureau=<id_ou_ncodique>`

Réponse 200 :
```json
{
  "total_valeur_initiale": 50000.0,
  "total_valeur_recue": 25000.0,
  "total_valeur_vendue": 15000.0,
  "total_valeur_finale": 60000.0,
  "total_quantite_initiale": 100,
  "total_quantite_recue": 50,
  "total_quantite_vendue": 30,
  "total_quantite_finale": 120,
  "nb_lignes": 1
}
```

---

## 5. Changements majeurs (journal court)

Si un changement casse la compatibilité (renommage de champ, changement de format, suppression d'un endpoint), le noter ici brièvement avec la date — ça évite qu'un agent travaillant sur l'autre côté du projet découvre la casse par un bug plutôt que par la documentation.

### 2026-10-14 — Module Stock de valeurs postales ajouté (Section 7)
- Endpoints ajoutés :
  - `GET, POST, PUT, DELETE /api/v1/produits-postaux/` (référentiel produits postaux et timbres fiscaux).
  - `GET, POST, PUT, PATCH, DELETE /api/v1/stocks-valeurs/` (suivi des stocks Tableau A G58).
  - `GET /api/v1/stocks-valeurs/recapitulatif/` (totaux agrégés du stock pour une période et un bureau).
- Validations : calcul automatique des totaux/valeurs finales, cohérence avec la période ouverte, blocage des ventes excédentaires.

### 2026-10-14 — Endpoints Plan comptable ajoutés
- Endpoints ajoutés :
  - `GET /api/v1/lignes-comptables/` : recherche instantanée avec filtrage multi-critères (`search`, `section`, `sens`, `parent`, `feuille`, `actif`) et enrichissement hiérarchique (`section_code`, `sens_libelle`, `parent_detail`).
  - `GET /api/v1/sections-comptables/` : référentiel macro-comptable (sections A à E).
- Rôles autorisés : tout utilisateur authentifié.

### 2026-10-09 — Inscription utilisateur ajoutée
- Endpoint ajouté : `POST /api/v1/auth/register/`
- Détails : création d'un utilisateur avec hachage du mot de passe côté Django, accès réservé à `ADMIN`.

<!-- Nouvelles entrées au-dessus de cette ligne -->
