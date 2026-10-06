# ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)

Ce document décrit la structure technique complète du frontend. Toute création de fichier, dossier ou composant doit s'y conformer. Pour l'architecture du backend, voir `../server/ARCHITECTURE.md` (dossier séparé, ne pas confondre). Pour le contrat d'API entre les deux, voir `../API_CONTRACT.md`.

---

## 1. Stack

- React 18+ avec Vite, TypeScript
- React Router pour la navigation
- TanStack Query (React Query) pour la gestion des appels API, du cache et des états de chargement
- Tailwind CSS (configuré selon `DESIGN.md` — tokens de couleur et typographie custom, pas les valeurs par défaut de Tailwind)
- Zustand (ou Context API si le besoin reste simple) pour l'état global léger (utilisateur connecté, rôle, bureau sélectionné)
- React Hook Form + Zod pour les formulaires de saisie (validation stricte, cohérente avec les contraintes backend documentées dans `../API_CONTRACT.md`)

---

## 2. Structure des dossiers

```
client/
├── AGENT.md
├── ARCHITECTURE.md
├── DESIGN.md
├── PROJECT_STATE.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── .env.example
├── .gitignore
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
    │   ├── client.ts              # Instance fetch/axios de base, gestion du token JWT
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
    ├── types/                      # Types TypeScript partagés (reflètent les formats décrits dans ../API_CONTRACT.md)
    └── contexts/                   # AuthContext, ThemeContext (clair/sombre)
```

---

## 3. Principes d'organisation

- **Architecture par feature, pas par type de fichier.** Ne pas créer un dossier `pages/` global contenant toutes les pages de l'app — chaque feature contient ses propres pages, composants et hooks.
- **`components/ui/` ne contient que des composants sans connaissance métier** (un `Button` ne sait pas ce qu'est un « mouvement comptable »). Toute logique métier vit dans `features/`.
- **`types/` doit rester le miroir fidèle de `../API_CONTRACT.md`.** Quand un type divergerait de ce que le backend renvoie réellement, c'est `API_CONTRACT.md` qu'il faut vérifier/corriger en premier (avec le backend si besoin), pas rafistoler le type côté client en silence.
- **Le remplacement du TreeView legacy (`LigneComptableSearch`) est un composant central du projet** — traiter son ergonomie (recherche instantanée, résultats groupés par section, historique des lignes récemment utilisées) comme une priorité technique, pas un détail cosmétique.
- **Le calcul des totaux (`TotauxLive`) doit être réactif à chaque saisie**, sans nécessiter de soumission de formulaire — c'est un des points de valeur ajoutée majeurs par rapport à l'existant, à ne pas traiter superficiellement.
- **Mode clair/sombre géré via un `ThemeContext` + variables CSS**, jamais via des classes Tailwind dupliquées `dark:` semées partout sans système (voir `DESIGN.md` pour le détail des tokens).
- **Avant de modifier une feature existante, utilise Graphify** pour comprendre les dépendances entre ses composants, hooks et appels API plutôt que de relire chaque fichier intégralement — voir `AGENT.md` section 3.

---

## 4. Consommation de l'API backend

- Toute la logique d'appel réseau passe par `src/api/` — jamais de `fetch`/`axios` directement dans un composant ou une page.
- Le client API de base (`src/api/client.ts`) gère l'ajout automatique du header `Authorization: Bearer <token>` et le rafraîchissement du token en cas d'expiration (401).
- Les hooks React Query par domaine (`useBureaux`, `useMouvements`, etc.) encapsulent la forme exacte décrite dans `../API_CONTRACT.md` — un composant ne doit jamais connaître l'URL brute d'un endpoint, seulement appeler le hook correspondant.
- **Si un endpoint nécessaire n'existe pas encore côté backend** (statut `planifié` dans `../API_CONTRACT.md`), ne pas improviser sa forme : soit attendre son implémentation, soit créer un hook avec des données mockées clairement indiquées comme telles (`// TODO: mock en attendant /api/v1/xxx/`), jamais une supposition silencieuse qui sera difficile à retrouver plus tard.

---

## 5. Environnement et variables

- `.env` non versionné, `.env.example` versionné et tenu à jour
- Variable minimale : `VITE_API_BASE_URL` (doit correspondre à l'origine du serveur Django en dev, généralement `http://localhost:8000`)

---

## 6. Tests

- Playwright dans `client/e2e/`, au minimum un scénario par flux critique :
  - `auth.spec.ts` : connexion réussie/échouée, redirection selon rôle
  - `saisie-g58.spec.ts` : saisie complète d'une section G58 avec vérification des totaux calculés en temps réel
  - `rbac.spec.ts` : un agent de saisie ne voit pas les actions réservées à l'inspecteur, un inspecteur peut rectifier avec motif obligatoire
- Un test e2e doit exister avant qu'une tâche de `PROJECT_STATE.md` touchant à un flux de saisie critique soit cochée comme terminée.

---

## 7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet)

- Détail exact de l'ergonomie de `LigneComptableSearch` (recherche en live avec debounce ? résultats groupés comment ? historique des lignes récentes stocké où — localStorage ou backend ?) — à préciser avant l'implémentation de la section 4 de `PROJECT_STATE.md`.
- Détail des visualisations de `dashboard/` (quel type de graphique pour l'évolution des recettes multi-mois, quelle librairie — à trancher au moment venu, pas en amont).
- Stratégie de gestion des formulaires longs (sauvegarde de brouillon automatique en cours de saisie ? à discuter si le besoin se confirme à l'usage).
