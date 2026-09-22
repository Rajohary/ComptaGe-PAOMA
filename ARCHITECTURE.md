# ARCHITECTURE.md — ComptaGeWeb

Ce document décrit la structure technique complète du projet. Toute création de fichier, dossier ou module doit s'y conformer. Si une décision structurelle n'y est pas couverte, l'ajouter à ce fichier après validation par l'utilisateur — ne pas improviser silencieusement une structure parallèle.

---

## 1. Vue d'ensemble

```
ComptaGeWeb/
├── .agents/                    # Skills Antigravity (déjà installées, ne pas modifier)
├── AGENT.md
├── ARCHITECTURE.md
├── DESIGN.md
├── PROJECT_STATE.md
├── README.md
├── .gitignore
├── client/                     # Frontend React
└── server/                     # Backend Django
```

Monorepo à racine unique. Pas de tooling monorepo (Turborepo, Nx) — la coordination entre `client` et `server` se fait manuellement via les scripts documentés dans `README.md`.

---

## 2. Backend — `/server`

### 2.1 Stack

- Python 3.12+
- Django 5.x
- Django REST Framework (DRF) pour l'API JSON
- PostgreSQL 16 (accès via le Django ORM natif — aucun ORM tiers)
- `djangorestframework-simplejwt` pour l'authentification JWT
- `django-cors-headers` pour autoriser les appels depuis le client React en dev
- `pytest-django` pour les tests unitaires (ou `TestCase` de Django si plus simple à maintenir seul)

### 2.2 Structure des dossiers

```
server/
├── manage.py
├── requirements.txt
├── .env.example
├── config/                     # Projet Django (settings, urls racine, wsgi/asgi)
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/                # Utilisateurs, rôles, authentification
│   │   ├── models.py            # User (custom), Role
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
│   │   ├── models.py             # (vue DIF, historique de rectification)
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
    └── seed_data.py              # Script de données de démo (bureaux, produits, comptes de test)
```

### 2.3 Principes d'organisation backend

- **Un module Django (`apps/xxx`) = un domaine métier**, pas une simple table. Ne pas créer une app par table.
- **La logique métier (calculs, règles de validation complexes) vit dans `services.py`**, pas dans les vues ni dans les serializers. Les vues DRF orchestrent, elles ne calculent pas.
- **Toutes les contraintes d'intégrité doivent être au niveau base de données** (ForeignKey avec `on_delete` explicite, `unique_together`, `CheckConstraint` quand pertinent) — c'est une réponse directe à un défaut identifié dans le système legacy (absence totale de FK). Ne jamais s'appuyer uniquement sur une validation côté application pour l'intégrité référentielle.
- **RBAC via des classes de permission DRF dédiées** dans `accounts/permissions.py` (ex. `IsReceveurOfBureau`, `IsInspecteur`, `IsAdmin`), appliquées explicitement sur chaque vue. Ne jamais laisser une vue sans classe de permission déclarée.

### 2.4 Modèles clés (guide, pas gravé dans le marbre — affiner avec l'utilisateur)

- `User` (custom, hérite de `AbstractUser`) — avec un champ `role`
- `Province`, `Bureau` (avec FK vers `Province`, champs `ncodique`, `classe`, `centre_financier`)
- `PeriodeGestion` (FK vers `Bureau`, `receveur`, dates début/fin, soldes d'ouverture, `cloturee: bool`)
- `SectionComptable` (A, B, C, D, E — Débit et Crédit) et `LigneComptable` (le plan comptable détaillé, hiérarchique : section → sous-opération B1-B4 → produit)
- `Mouvement` (FK vers `PeriodeGestion`, `LigneComptable`, `montant`, `augmentation`, `diminution`, `montant_rectifie`, `motif_rectification`, horodatage, `saisi_par`)
- `MouvementEncaisse` (suivi de trésorerie/coffre)
- `StockValeurPostale` (bureau, produit philatélique, valeur faciale, quantités et valeurs stock initial/reçu/vendu/final)
- `AuditLogEntry` (si repris de l'idée d'audit trail — table d'historique immuable des modifications sensibles)

### 2.5 API

- REST, versionnée dès le départ : `/api/v1/...`
- Authentification JWT (access + refresh token), pas de session Django classique côté API
- Chaque endpoint sensible (saisie, rectification, clôture de période) doit valider le rôle ET le rattachement au bureau concerné (un receveur ne doit jamais pouvoir modifier les données d'un autre bureau, même en connaissant l'ID)

---

## 3. Frontend — `/client`

### 3.1 Stack

- React 18+ avec Vite
- React Router pour la navigation
- TanStack Query (React Query) pour la gestion des appels API, du cache et des états de chargement
- Tailwind CSS (configuré selon `DESIGN.md` — tokens de couleur et typographie custom, pas les valeurs par défaut de Tailwind)
- Zustand (ou Context API si le besoin reste simple) pour l'état global léger (utilisateur connecté, rôle, bureau sélectionné)
- React Hook Form + Zod pour les formulaires de saisie (validation stricte, cohérente avec les contraintes backend)

### 3.2 Structure des dossiers

```
client/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── .env.example
├── index.html
├── e2e/                          # Tests Playwright
│   ├── auth.spec.ts
│   ├── saisie-g58.spec.ts
│   └── rbac.spec.ts
├── playwright.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   └── globals.css           # Tokens de couleur/typo issus de DESIGN.md
    ├── api/                       # Client API + hooks React Query par domaine
    │   ├── client.ts
    │   ├── auth.ts
    │   ├── referentiel.ts
    │   ├── comptabilite.ts
    │   └── audit.ts
    ├── components/
    │   ├── ui/                    # Composants primitifs réutilisables (Button, Input, Select, Table, Card...)
    │   └── layout/                # Shell applicatif (Sidebar, Topbar, PageHeader)
    ├── features/                  # Un dossier par domaine fonctionnel
    │   ├── auth/
    │   ├── bureaux/
    │   ├── saisie-g58/            # Le cœur : formulaire de saisie par section A-E
    │   │   ├── components/
    │   │   │   ├── SectionForm.tsx
    │   │   │   ├── LigneComptableSearch.tsx   # Remplace le TreeView legacy
    │   │   │   └── TotauxLive.tsx             # Calcul de totaux en temps réel
    │   │   ├── hooks/
    │   │   └── pages/
    │   ├── audit/                 # Vue DIF, redressement
    │   ├── dashboard/              # Tableaux de bord par rôle
    │   └── stock/
    ├── hooks/                      # Hooks partagés transverses
    ├── lib/                        # Fonctions utilitaires pures
    ├── types/                      # Types TypeScript partagés (miroir des serializers DRF)
    └── contexts/                   # AuthContext, ThemeContext (clair/sombre)
```

### 3.3 Principes d'organisation frontend

- **Architecture par feature, pas par type de fichier.** Ne pas créer un dossier `pages/` global contenant toutes les pages de l'app — chaque feature contient ses propres pages, composants et hooks.
- **`components/ui/` ne contient que des composants sans connaissance métier** (un `Button` ne sait pas ce qu'est un « mouvement comptable »). Toute logique métier vit dans `features/`.
- **Le remplacement du TreeView legacy (`LigneComptableSearch`) est un composant central du projet** — traiter son ergonomie (recherche instantanée, résultats groupés par section, historique des lignes récemment utilisées) comme une priorité technique, pas un détail cosmétique.
- **Le calcul des totaux (`TotauxLive`) doit être réactif à chaque saisie**, sans nécessiter de soumission de formulaire — c'est un des points de valeur ajoutée majeurs par rapport à l'existant, à ne pas traiter superficiellement.
- **Mode clair/sombre géré via un `ThemeContext` + variables CSS**, jamais via des classes Tailwind dupliquées `dark:` semées partout sans système (voir DESIGN.md pour le détail des tokens).

---

## 4. Base de données

- PostgreSQL 16, une seule base pour dev et prod (schémas différents si besoin de séparation, mais pas de multi-DB pour ce projet)
- Migrations Django (`manage.py makemigrations` / `migrate`) — jamais de modification manuelle de schéma en base
- Toutes les tables temporelles/financières indexées sur les colonnes de date et de clé étrangère utilisées en filtre fréquent (`bureau_id`, `periode_gestion_id`, `date_operation`)
- Contraintes `NOT NULL` explicites sur tout champ obligatoire métier (ne pas laisser Django accepter `null=True` par défaut sur un champ comptable)

---

## 5. Environnements et variables

- `.env` non versionné, `.env.example` versionné et tenu à jour dans `client/` et `server/`
- Variables backend minimales : `DATABASE_URL`, `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
- Variables frontend minimales : `VITE_API_BASE_URL`

---

## 6. Tests

- **Backend** : un fichier de tests par app Django (`apps/xxx/tests/`), couvrant en priorité les fonctions de `services.py` (calculs, règles de clôture, RBAC) — pas seulement les CRUD basiques.
- **Frontend/e2e** : Playwright dans `client/e2e/`, au minimum un scénario par flux critique : connexion + RBAC, saisie complète d'une section G58 avec vérification des totaux calculés, rectification par un inspecteur.
- Un test doit exister avant qu'une tâche de `PROJECT_STATE.md` touchant à une règle métier ou un flux critique soit cochée comme terminée.

---

## 7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet)

- Détail exact des sections C et E (Mouvements de fonds, Régularisation) — périmètre volontairement moins prioritaire dans les 6 semaines, structure à confirmer avant implémentation.
- Détail des Tableaux B/C/D/E annexes (consignations, créances, avances) — non couverts dans le MVP initial, à ajouter comme évolution.
- Mécanisme exact de génération du bordereau G58 en PDF (bibliothèque à choisir le moment venu : WeasyPrint côté Django est un candidat naturel vu qu'il tourne en Python).
