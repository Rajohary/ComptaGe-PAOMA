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
| `/api/v1/bureaux/` | GET, POST | Admin (POST), tous (GET) | implémenté (voir §4) | Liste / création des bureaux de poste |
| `/api/v1/bureaux/{id}/` | GET, PUT, PATCH, DELETE | Admin (PUT/PATCH/DELETE), tous (GET) | implémenté (voir §4) | Détail / modification / suppression d'un bureau |
| `/api/v1/periodes-gestion/` | GET, POST | Receveur (sur son bureau), Admin | implémenté (voir §4) | Liste / ouverture d'une période de gestion |
| `/api/v1/periodes-gestion/{id}/cloturer/` | POST | Receveur (sur son bureau), Admin | implémenté (voir §4) | Clôture officielle d'une période de gestion |
| `/api/v1/dashboard/receveur/` | GET | Receveur (son bureau), Agent saisie (son bureau), Admin, Inspecteur | implémenté (voir §4) | Progression mensuelle G58 par section, totaux et caisse actuelle |
| `/api/v1/dashboard/inspecteur/` | GET | Inspecteur, Admin | implémenté (voir §4) | Vue synthétique des écarts de caisse et bureaux impactés |
| `/api/v1/audit/ecarts/` | GET | Inspecteur, Admin | implémenté (voir §4) | Liste filtrable et paginée des mouvements en anomalie (vue DIF) |
| `/api/v1/dashboard/admin/` | GET | Admin | implémenté (voir §4) | Vue d'ensemble globale du système (territoire, périodes, RBAC, flux, audit) |
| `/api/v1/lignes-comptables/` | GET | Authentifié | planifié | Recherche dans le plan comptable (remplace le TreeView legacy) |
| `/api/v1/mouvements/` | GET, POST | Selon RBAC (voir ARCHITECTURE.md backend) | planifié | Création/consultation des mouvements G58 |
| `/api/v1/mouvements/{id}/rectifier/` | PATCH | Inspecteur | planifié | Rectification d'un mouvement (augmentation/diminution/motif) |
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

### GET /api/v1/dashboard/receveur/ (Tableau de bord Receveur & Agent de saisie)
*Paramètres query optionnels : `bureau` (id ou ncodique, réservé Admin/Inspecteur pour cibler un autre bureau), `periode` (id de période).*
*Règles d'accès : `RECEVEUR` ou `AGENT_SAISIE` limité à son bureau rattaché ; `ADMIN` et `INSPECTEUR` peuvent consulter tout bureau.*

Réponse 200 :
```json
{
  "bureau": {
    "id": 1,
    "ncodique": 10101,
    "nom_bureau": "Antaninarenina",
    "classe": "R1",
    "province_nom": "Antananarivo"
  },
  "periode": {
    "id": 1,
    "nom_receveur": "Rakoto Jean",
    "date_debut": "2026-06-01",
    "date_fin": "2026-06-30",
    "cloturee": false,
    "date_cloture": null
  },
  "has_active_periode": true,
  "message": "Période en cours active.",
  "progression_sections": [
    {
      "section_id": 1,
      "code": "A",
      "libelle": "Opérations de débit",
      "sens": "Débit",
      "sens_code": 1,
      "nb_mouvements": 14,
      "total_montant": "1250000.00",
      "total_rectifie": "1250000.00",
      "lignes_utilisees": 6,
      "lignes_total": 12
    },
    {
      "section_id": 2,
      "code": "B",
      "libelle": "Opérations de crédit",
      "sens": "Crédit",
      "sens_code": 2,
      "nb_mouvements": 8,
      "total_montant": "450000.00",
      "total_rectifie": "470000.00",
      "lignes_utilisees": 4,
      "lignes_total": 10
    }
  ],
  "totaux_mouvements": {
    "nb_mouvements": 22,
    "total_debit": "1250000.00",
    "total_credit": "470000.00",
    "solde_mouvements": "780000.00",
    "nb_ecarts": 1,
    "dernier_mouvement_date": "2026-06-18"
  },
  "encaisse": {
    "reserve_numeraire_depart": "500000.00",
    "valeurs_postales_depart": "250000.00",
    "timbres_fiscaux_depart": "100000.00",
    "total_inventaire_depart": "850000.00",
    "total_entrees_encaisse": "120000.00",
    "total_sorties_encaisse": "40000.00",
    "variation_nette": "80000.00",
    "montant_caisse_actuel": "580000.00"
  }
}
```

### GET /api/v1/dashboard/inspecteur/ (Tableau de bord Inspecteur)
*Règles d'accès : réservé aux profils `INSPECTEUR` et `ADMIN`.*
*Paramètres query optionnels : `bureau`, `province`, `date_min`, `date_max`, `statut` (`non_rectifie`, `rectifie`, `tous`), `search`.*

Réponse 200 :
```json
{
  "kpis": {
    "total_ecarts_count": 5,
    "total_montant_declare": "320000.00",
    "total_montant_rectifie": "345000.00",
    "total_ecart_net": "25000.00",
    "total_ecart_absolu": "35000.00",
    "total_augmentation": "30000.00",
    "total_diminution": "5000.00",
    "nb_bureaux_impactes": 2,
    "nb_non_rectifies": 3,
    "nb_rectifies": 2,
    "bureaux_avec_ecarts": [
      {
        "bureau_id": 1,
        "ncodique": 10101,
        "nom_bureau": "Antaninarenina",
        "province_nom": "Antananarivo",
        "nb_ecarts": 3,
        "total_declare": "200000.00",
        "total_rectifie": "220000.00",
        "ecart_net": "20000.00"
      }
    ]
  },
  "derniers_ecarts": [
    {
      "id": 12,
      "date_operation": "2026-06-15",
      "bureau": {
        "id": 1,
        "ncodique": 10101,
        "nom_bureau": "Antaninarenina",
        "classe": "R1",
        "province_nom": "Antananarivo"
      },
      "periode_gestion_id": 1,
      "ligne_comptable": {
        "id": 5,
        "menu_sub": 102,
        "compte": "AD02",
        "libelle": "Vente de valeurs postales",
        "section_code": "A"
      },
      "montant": "50000.00",
      "augmentation": "10000.00",
      "diminution": "0.00",
      "montant_rectifie": "60000.00",
      "ecart": "10000.00",
      "motif_rectification": "Manquant constaté lors du pointage contradictoire",
      "saisi_par": "receveur1",
      "rectifie_par": "inspecteur1",
      "est_rectifie": true,
      "created_at": "2026-06-15T10:30:00Z",
      "updated_at": "2026-06-16T14:20:00Z"
    }
  ]
}
```

### GET /api/v1/audit/ecarts/ (Vue DIF — Liste filtrable et paginée des écarts)
*Règles d'accès : réservé aux profils `INSPECTEUR` et `ADMIN`.*
*Paramètres query : `bureau`, `province`, `periode`, `date_min`, `date_max`, `statut` (`non_rectifie`, `rectifie`, `tous`), `search`, `ordering` (`-date_operation`, `date_operation`, `-montant`, `montant`), `page`, `page_size`.*

Réponse 200 :
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "kpis": {
    "total_ecarts_count": 5,
    "total_montant_declare": "320000.00",
    "total_montant_rectifie": "345000.00",
    "total_ecart_net": "25000.00",
    "total_ecart_absolu": "35000.00",
    "total_augmentation": "30000.00",
    "total_diminution": "5000.00",
    "nb_bureaux_impactes": 2,
    "nb_non_rectifies": 3,
    "nb_rectifies": 2,
    "bureaux_avec_ecarts": [ ... ]
  },
  "results": [
    {
      "id": 12,
      "date_operation": "2026-06-15",
      "bureau": {
        "id": 1,
        "ncodique": 10101,
        "nom_bureau": "Antaninarenina",
        "classe": "R1",
        "province_nom": "Antananarivo"
      },
      "periode_gestion_id": 1,
      "ligne_comptable": {
        "id": 5,
        "menu_sub": 102,
        "compte": "AD02",
        "libelle": "Vente de valeurs postales",
        "section_code": "A"
      },
      "montant": "50000.00",
      "augmentation": "10000.00",
      "diminution": "0.00",
      "montant_rectifie": "60000.00",
      "ecart": "10000.00",
      "motif_rectification": "Manquant constaté lors du pointage contradictoire",
      "saisi_par": "receveur1",
      "rectifie_par": "inspecteur1",
      "est_rectifie": true,
      "created_at": "2026-06-15T10:30:00Z",
      "updated_at": "2026-06-16T14:20:00Z"
    }
  ]
}
```

### GET /api/v1/dashboard/admin/ (Tableau de bord Administrateur)
*Règles d'accès : réservé aux profils `ADMIN` (et superutilisateurs).*

Réponse 200 :
```json
{
  "territoire": {
    "total_bureaux": 24,
    "total_provinces": 6,
    "bureaux_actifs_count": 18,
    "bureaux_sans_periode_active": 6,
    "repartition_classes": [
      { "classe": "R1", "nb_bureaux": 10 },
      { "classe": "R2", "nb_bureaux": 8 },
      { "classe": "HC", "nb_bureaux": 6 }
    ],
    "repartition_provinces": [
      { "province_id": 1, "nprovince": 1, "province_nom": "Antananarivo", "nb_bureaux": 8 },
      { "province_id": 2, "nprovince": 2, "province_nom": "Toamasina", "nb_bureaux": 5 }
    ]
  },
  "periodes": {
    "total_periodes": 30,
    "periodes_en_cours": 18,
    "periodes_cloturees": 12,
    "taux_cloture_pourcentage": 40.0
  },
  "utilisateurs": {
    "total_utilisateurs": 42,
    "utilisateurs_actifs": 40,
    "repartition_roles": {
      "ADMIN": 3,
      "RECEVEUR": 24,
      "AGENT_SAISIE": 12,
      "INSPECTEUR": 3
    }
  },
  "comptabilite": {
    "total_mouvements_g58": 1420,
    "total_debit": "48500000.00",
    "total_credit": "36200000.00",
    "solde_global": "12300000.00",
    "total_mouvements_encaisse": 540
  },
  "audit": {
    "total_ecarts_detectes": 14,
    "ecarts_en_attente": 4,
    "total_logs_audit": 185,
    "derniers_logs": [
      {
        "id": 185,
        "created_at": "2026-10-15T15:20:00Z",
        "action": "RECTIFICATION",
        "action_label": "Rectification inspecteur",
        "auteur": "inspecteur1",
        "model_name": "Mouvement",
        "object_repr": "Mouvement #42",
        "detail": "Redressement montant +5000 MGA"
      }
    ]
  }
}
```

---

## 5. Changements majeurs (journal court)

Si un changement casse la compatibilité (renommage de champ, changement de format, suppression d'un endpoint), le noter ici brièvement avec la date — ça évite qu'un agent travaillant sur l'autre côté du projet découvre la casse par un bug plutôt que par la documentation.

### 2026-10-15 — Tableaux de bord et vue DIF implémentés (Module 6)
- Endpoints ajoutés et documentés :
  - `GET /api/v1/dashboard/receveur/` : progression mensuelle G58, situation par section et encaisse/caisse actuelle
  - `GET /api/v1/dashboard/inspecteur/` : KPIs de synthèse d'audit, répartition des écarts par bureau
  - `GET /api/v1/audit/ecarts/` : liste filtrable et paginée des mouvements en anomalie (vue DIF du CDC)
  - `GET /api/v1/dashboard/admin/` : vue d'ensemble globale du système (territoire, périodes, RBAC, flux, audit)
- Sécurité : RBAC strict appliqué par endpoint, isolation stricte par bureau pour le rôle RECEVEUR.

### 2026-10-09 — Inscription utilisateur ajoutée
- Endpoint ajouté : `POST /api/v1/auth/register/`
- Détails : création d'un utilisateur avec hachage du mot de passe côté Django, accès réservé à `ADMIN`.

<!-- Nouvelles entrées au-dessus de cette ligne -->
