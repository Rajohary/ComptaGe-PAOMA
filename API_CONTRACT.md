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
| `/api/v1/lignes-comptables/` | GET | Authentifié | planifié | Recherche dans le plan comptable (remplace le TreeView legacy) |
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

```
<!-- Exemple de structure à suivre :

### POST /api/v1/mouvements/
Requête :
{
  "ligne_comptable": 42,
  "periode_gestion": 7,
  "montant": 134353.80,
  "date_operation": "2026-06-15"
}

Réponse 201 :
{
  "id": 1023,
  "ligne_comptable": 42,
  "periode_gestion": 7,
  "montant": "134353.80",
  "montant_rectifie": "134353.80",
  "augmentation": "0.00",
  "diminution": "0.00",
  "date_operation": "2026-06-15",
  "saisi_par": "receveur_tananbava"
}
-->
```

---

## 5. Changements majeurs (journal court)

Si un changement casse la compatibilité (renommage de champ, changement de format, suppression d'un endpoint), le noter ici brièvement avec la date — ça évite qu'un agent travaillant sur l'autre côté du projet découvre la casse par un bug plutôt que par la documentation.

### 2026-10-09 — Inscription utilisateur ajoutée
- Endpoint ajouté : `POST /api/v1/auth/register/`
- Détails : création d'un utilisateur avec hachage du mot de passe côté Django, accès réservé à `ADMIN`.

<!-- Nouvelles entrées au-dessus de cette ligne -->
