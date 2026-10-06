# ARCHITECTURE.md — ComptaGeWeb · Backend (server/)

Ce document décrit la structure technique complète du backend. Toute création de fichier, dossier ou module doit s'y conformer. Pour l'architecture du frontend, voir `../client/ARCHITECTURE.md` (dossier séparé, ne pas confondre). Pour le contrat d'API entre les deux, voir `../API_CONTRACT.md`.

---

## 1. Stack

- Python 3.12+
- Django 5.x
- Django REST Framework (DRF) pour l'API JSON — aucun rendu de template HTML côté utilisateur final
- PostgreSQL 16 (accès via le Django ORM natif — aucun ORM tiers)
- `djangorestframework-simplejwt` pour l'authentification JWT
- `django-cors-headers` pour autoriser les appels depuis le client React en dev (origine définie dans `.env`, cohérente avec `VITE_API_BASE_URL` côté client)
- `pytest-django` pour les tests unitaires (ou `TestCase` natif de Django si plus simple à maintenir seul)

---

## 2. Structure des dossiers

```
server/
├── AGENT.md
├── ARCHITECTURE.md
├── PROJECT_STATE.md
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── config/                     # Projet Django (settings, urls racine, wsgi/asgi)
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py                 # Inclut les urls.py de chaque app sous /api/v1/
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/                # Utilisateurs, rôles, authentification
│   │   ├── models.py            # User (custom AbstractUser + champ role)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── permissions.py       # Classes DRF de permission par rôle
│   │   ├── urls.py
│   │   └── tests/
│   ├── referentiel/              # Provinces, bureaux, périodes de gestion
│   │   ├── models.py            # Province, Bureau, PeriodeGestion
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── comptabilite/              # Cœur du G58 : plan comptable, mouvements, sections A-E
│   │   ├── models.py             # SectionComptable, LigneComptable, Mouvement, MouvementEncaisse
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py          # Logique métier : calcul des totaux, report de solde, etc.
│   │   ├── urls.py
│   │   └── tests/
│   ├── audit/                    # Détection d'écarts, redressement, historique
│   │   ├── models.py             # (équivalent vue DIF, AuditLog)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests/
│   └── stock/                    # Stock de valeurs postales (Tableau A du formulaire papier)
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       └── tests/
└── scripts/
    └── seed_data.py              # Données de démo (bureaux, produits, comptes de test)
```

---

## 3. Principes d'organisation

- **Un module Django (`apps/xxx`) = un domaine métier**, pas une simple table. Ne pas créer une app par table.
- **La logique métier (calculs, règles de validation complexes) vit dans `services.py`**, pas dans les vues ni dans les serializers. Les vues DRF orchestrent, elles ne calculent pas.
- **Toutes les contraintes d'intégrité au niveau base de données** (ForeignKey avec `on_delete` explicite, `unique_together`, `CheckConstraint`). C'est une réponse directe à un défaut identifié dans le CDC du système legacy (section « Absence de Contraintes d'Intégrité Référentielle au Niveau SQL ») — ne jamais s'appuyer uniquement sur une validation applicative pour l'intégrité référentielle.
- **RBAC via des classes de permission DRF dédiées** dans `accounts/permissions.py` (ex. `IsReceveurOfBureau`, `IsInspecteur`, `IsAdmin`), appliquées explicitement sur chaque vue. Ne jamais laisser une vue sans classe de permission déclarée.
- **Avant de modifier une app existante, utilise Graphify** pour comprendre les dépendances entre ses modèles, vues et serializers plutôt que de relire chaque fichier intégralement — voir `AGENT.md` section 3.

---

## 4. Modèles clés (guide, à affiner avec l'utilisateur au fil du projet)

- `User` (custom, hérite de `AbstractUser`) — champ `role` avec les valeurs `ADMIN`, `RECEVEUR`, `AGENT_SAISIE`, `INSPECTEUR` (valeurs figées, cohérentes avec `../API_CONTRACT.md`)
- `Province`, `Bureau` (FK vers `Province`, champs `ncodique`, `classe`, `centre_financier`, cohérents avec `TblProvince`/`TblBureau` du CDC)
- `PeriodeGestion` (FK vers `Bureau`, `receveur`, dates début/fin, soldes d'ouverture, `cloturee: bool` — équivalent de `tblGestionBur`)
- `SectionComptable` (A à E, Débit et Crédit) et `LigneComptable` (plan comptable détaillé, hiérarchique : section → sous-opération B1-B4 → produit — équivalent `tblMenuParent`/`tblMenuSub`)
- `Mouvement` (FK vers `PeriodeGestion`, `LigneComptable`, `montant`, `augmentation`, `diminution`, `montant_rectifie`, `motif_rectification`, horodatage, `saisi_par` — équivalent `tblMvt`)
- `MouvementEncaisse` (suivi de trésorerie/coffre — équivalent `tblMvtEncaisse`)
- `StockValeurPostale` (bureau, produit philatélique, valeur faciale, quantités/valeurs stock initial/reçu/vendu/final)
- `AuditLogEntry` (table d'audit immuable — réponse directe à la zone d'ombre « Piste d'Audit et Traçabilité Réglementaire » du CDC : historise chaque modification/suppression/rectification avec horodatage et auteur)

Le dictionnaire de données complet du CDC original (tables `Products`, `Categories`, `Arborescence`, `UserTable`, `UserModule`, `tblClasse`, `tblClassProduct`, `tblEncaisse`, `tblEncaisseParent`, `tblDesignationSitCompte`, vues `ReqSum`/`VIEW1`/`bur`/`product`/`MVT`/`DIF`) sert de base de référence mais n'est pas à reproduire telle quelle : nommage, normalisation et découpage en apps doivent suivre les principes de ce document, pas la structure legacy (dénormalisée, sans FK).

---

## 5. API

- REST, versionnée dès le départ : `/api/v1/...`
- Authentification JWT (access + refresh token), pas de session Django classique côté API
- Chaque endpoint sensible (saisie, rectification, clôture de période) valide le rôle ET le rattachement au bureau concerné (un receveur ne doit jamais pouvoir modifier les données d'un autre bureau, même en connaissant l'ID)
- **Toute la forme exacte des endpoints (payloads, codes retour, pagination) est documentée dans `../API_CONTRACT.md`, pas ici.** Ce fichier décrit l'architecture interne du code, pas le contrat externe.

---

## 6. Base de données

- PostgreSQL 16, une seule base pour dev et prod (schémas différents si besoin de séparation)
- Migrations Django (`manage.py makemigrations` / `migrate`) — jamais de modification manuelle de schéma en base
- Index sur les colonnes de date et de clé étrangère utilisées en filtre fréquent (`bureau_id`, `periode_gestion_id`, `date_operation`) — anticipe la volumétrie réelle mentionnée dans le CDC (plus d'1,38 million de mouvements en production sur le système legacy)
- Contraintes `NOT NULL` explicites sur tout champ obligatoire métier (ne pas laisser Django accepter `null=True` par défaut sur un champ comptable)

---

## 7. Environnement et variables

- `.env` non versionné, `.env.example` versionné et tenu à jour
- Variables minimales : `DATABASE_URL`, `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` (doit inclure l'origine du client Vite en dev, généralement `http://localhost:5173`)

---

## 8. Tests

- Un fichier de tests par app Django (`apps/xxx/tests/`), couvrant en priorité les fonctions de `services.py` (calculs, règles de clôture, RBAC) — pas seulement les CRUD basiques
- Un test unitaire doit exister avant qu'une tâche de `PROJECT_STATE.md` touchant à une règle métier critique soit cochée comme terminée
- Cas de test prioritaires : report du solde d'un mois sur l'autre, blocage de saisie sur période clôturée, calcul correct de `montant_rectifie = montant + augmentation - diminution`, isolation stricte d'un receveur à son propre bureau

---

## 9. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet)

- Détail exact des sections C et E (Mouvements de fonds, Régularisation) — périmètre volontairement moins prioritaire dans les 6 semaines.
- Détail des tableaux annexes (consignations, créances, avances aux facteurs) — non couverts dans le MVP initial.
- Mécanisme exact de génération du bordereau G58 en PDF (WeasyPrint côté Django est un candidat naturel, à valider avec l'utilisateur le moment venu).
- Choix définitif entre `pytest-django` et `TestCase` natif — à trancher dès la mise en place initiale (section 0 de `PROJECT_STATE.md`), pas en cours de route.
