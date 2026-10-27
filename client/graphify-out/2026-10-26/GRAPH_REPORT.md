# Graph Report - client  (2026-10-26)

## Corpus Check
- 96 files · ~84,987 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 720 nodes · 1651 edges · 27 communities (25 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c1d2f7eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuditEcartsPage.tsx
- package.json
- react
- comptabilite.ts
- Running Custom Playwright Code
- Cookies
- DESIGN.md — ComptaGeWeb · Frontend (client/)
- Browser Automation with playwright-cli
- 3. Heal
- Rules
- Browser Session Management
- compilerOptions
- Tracing
- compilerOptions
- Flat Design System Skill (Antigravity)
- 9. Journal des actions (log)
- index.ts
- @playwright/test
- AGENT.md — ComptaGeWeb · Frontend (client/)
- .oxlintrc.json
- flat/DESIGN.md
- React + TypeScript + Vite
- tsconfig.json
- ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)
- apiClient
- StockValeurFormModal.tsx

## God Nodes (most connected - your core abstractions)
1. `apiClient()` - 49 edges
2. `Button()` - 40 edges
3. `react` - 38 edges
4. `lucide-react` - 32 edges
5. `9. Journal des actions (log)` - 28 edges
6. `useAuth()` - 25 edges
7. `getBureaux()` - 22 edges
8. `LigneComptableSearch()` - 22 edges
9. `formatAriary()` - 20 edges
10. `Input` - 19 edges

## Surprising Connections (you probably didn't know these)
- `2026-10-21 — Module 5 : Audit et détection d'écarts (Vue DIF, Rectification UC-04, RBAC)` --references--> `RequireAuth()`  [INFERRED]
  PROJECT_STATE.md → src/features/auth/components/RequireAuth.tsx
- `2026-10-26 — Révision de la section Traçabilité & Vigilance Réglementaire (Vue Réseau Admin)` --references--> `AdminDashboard()`  [INFERRED]
  PROJECT_STATE.md → src/features/dashboard/components/AdminDashboard.tsx
- `7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet)` --references--> `LigneComptableSearch()`  [INFERRED]
  ARCHITECTURE.md → src/features/plan-comptable/components/LigneComptableSearch.tsx
- `5.2 Règles` --references--> `TotauxLive()`  [INFERRED]
  DESIGN.md → src/features/saisie-g58/components/TotauxLive.tsx
- `2026-10-26 — Bouton d'export Excel des écritures d'une période (Journal G58)` --references--> `triggerBlobDownload()`  [INFERRED]
  PROJECT_STATE.md → src/lib/download.ts

## Import Cycles
- None detected.

## Communities (27 total, 2 thin omitted)

### Community 0 - "AuditEcartsPage.tsx"
Cohesion: 0.12
Nodes (33): 2026-10-16 — Module 6 : Tableaux de bord (Receveur, Inspecteur, Admin), EcartsSearchParams, getEcarts(), rectifierMouvement(), getAdminDashboard(), getEcartsList(), getInspecteurDashboard(), getReceveurDashboard() (+25 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, axios, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form, react-router-dom (+36 more)

### Community 2 - "react"
Cohesion: 0.07
Nodes (50): 2026-10-12 — Module Authentification & RBAC complet (Section 1), 2026-10-26 — Sélecteur de bureau sur le tableau de bord Admin et vue bureau détaillée (Section 6), lucide-react, react, react-dom, react-router-dom, @tanstack/react-query, getMe() (+42 more)

### Community 3 - "comptabilite.ts"
Cohesion: 0.08
Nodes (59): 3. Principes d'organisation, 2026-10-14 — Composant LigneComptableSearch (Section 3, Tâche 1), 2026-10-15 — Test e2e saisie complète d'une section G58 et TotauxLive (Section 4, Tâche 6), 2026-10-22 — Module 3 : Gestion complète du Plan Comptable (Création, Modification, RBAC Admin), 3. Recherche et gestion du plan comptable (remplace le TreeView legacy), 4. Saisie du Journal G58 — cœur fonctionnel, @hookform/resolvers, react-hook-form (+51 more)

### Community 4 - "Running Custom Playwright Code"
Cohesion: 0.04
Nodes (40): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests, Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits (+32 more)

### Community 5 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 6 - "DESIGN.md — ComptaGeWeb · Frontend (client/)"
Cohesion: 0.06
Nodes (30): 1. Intention et ambiance visuelle, 2.1 Palette — mode clair, 2.2 Palette — mode sombre, 2.3 Implémentation technique, 2. Système de couleurs (règle 60/30/10), 3.1 Interdiction explicite, 3.2 Choix retenu, 3.3 Règles d'usage (+22 more)

### Community 7 - "Browser Automation with playwright-cli"
Cohesion: 0.07
Nodes (27): Attaching screenshots and videos to pull requests, Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Emulation, Example: Debugging with DevTools (+19 more)

### Community 8 - "3. Heal"
Cohesion: 0.09
Nodes (23): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, 2.1 Inputs, 2.2 Generate one scenario (+15 more)

### Community 9 - "Rules"
Cohesion: 0.09
Nodes (20): caveman, Example output, How to invoke, See also, What it does, 1. Answer first, 2. Kill ceremony, 3. Short word (+12 more)

### Community 10 - "Browser Session Management"
Cohesion: 0.10
Nodes (20): 1. Name Browser Sessions Semantically, 2. Always Clean Up, 3. Delete Stale Browser Data, A/B Testing Sessions, Attach by channel name, Attach via browser extension, Attach via CDP endpoint, Attaching to a Running Browser (+12 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "Tracing"
Cohesion: 0.12
Nodes (16): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+8 more)

### Community 13 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 14 - "Flat Design System Skill (Antigravity)"
Cohesion: 0.13
Nodes (14): Accessibility, Brand, Component Rule Expectations, Example Constraint Language, Expected Behavior, Flat Design System Skill (Antigravity), Guideline Authoring Workflow, Mission (+6 more)

### Community 15 - "9. Journal des actions (log)"
Cohesion: 0.08
Nodes (23): 0. Mise en place du projet, 1. Authentification & RBAC, 2026-10-12 — Correction des anomalies de build, finalisation & validation e2e Module 1 (Auth & RBAC), 2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4), 2026-10-12 — Écran de clôture d'une période de gestion (Section 2, Tâche 3), 2026-10-14 — Composant TotauxLive réactif (Section 4, Tâche 2), 2026-10-14 — Historique des lignes récentes par bureau (Section 3, Tâche 2), 2026-10-14 — Traitement explicite des états vide et chargement (Section 3, Tâche 3) (+15 more)

### Community 16 - "index.ts"
Cohesion: 0.11
Nodes (34): 2026-10-14 — Composant SectionForm du Journal G58 (Section 4, Tâche 1), 2026-10-14 — Écran Détails de l'encaisse (Section 4, Tâche 4), 2026-10-15 — Révision et enrichissement de l'espace Encaisse (Section 4), 2026-10-26 — Écran d'historique des périodes de gestion d'un bureau (receveurs successifs, soldes de passation), createMouvementEncaisse(), deleteMouvementEncaisse(), getMouvementsEncaisse(), getRubriquesEncaisse() (+26 more)

### Community 17 - "@playwright/test"
Cohesion: 0.04
Nodes (32): ADMIN_USER, RECEVEUR_USER, ADMIN_USER, INSPECTEUR_USER, MOCK_ADMIN_DASHBOARD, MOCK_INSPECTEUR_DASHBOARD, MOCK_RECEVEUR_DASHBOARD, RECEVEUR_USER (+24 more)

### Community 19 - "AGENT.md — ComptaGeWeb · Frontend (client/)"
Cohesion: 0.25
Nodes (7): 1. Qu'est-ce que ComptaGeWeb ?, 2. Documents de référence — à lire selon le contexte, 3. Compétences (skills) disponibles — dans `../.agents/`, 4. Stack technique (résumé — détails complets dans ARCHITECTURE.md), 5. Règles de fonctionnement impératives, 6. Ce que ce frontend n'est PAS, AGENT.md — ComptaGeWeb · Frontend (client/)

### Community 20 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 21 - "flat/DESIGN.md"
Cohesion: 0.50
Nodes (3): Colors, Overview, Style Foundations

### Community 22 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 28 - "ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)"
Cohesion: 0.25
Nodes (7): 1. Stack, 2. Structure des dossiers, 4. Consommation de l'API backend, 5. Environnement et variables, 6. Tests, 7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet), ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)

### Community 29 - "apiClient"
Cohesion: 0.13
Nodes (41): 2026-10-12 — Écran d'ouverture d'une période de gestion (Section 2, Tâche 2), 2026-10-12 — Écran de gestion des bureaux (Section 2, Tâche 1), 2026-10-26 — Amélioration ergonomique : Recherche rapide et assistée de période (Saisie G58), apiClient(), ApiClientError, failedQueue, processQueue(), RequestOptions (+33 more)

### Community 30 - "StockValeurFormModal.tsx"
Cohesion: 0.21
Nodes (19): 2026-10-14 — Écran de suivi du stock de valeurs postales et timbres (Section 7), createStockValeur(), deleteStockValeur(), getProduitsPostaux(), getStockRecapitulatif(), getStocksValeurs(), updateStockValeur(), baseStockValeurSchema (+11 more)

## Knowledge Gaps
- **365 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `RECEVEUR_USER` (+360 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 379 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `@playwright/test` to `package.json`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _365 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuditEcartsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11538461538461539 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `AuditEcartsPage.tsx`, `package.json`, `comptabilite.ts`, `index.ts`, `apiClient`, `StockValeurFormModal.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Why does `TotauxLive()` connect `comptabilite.ts` to `AuditEcartsPage.tsx`, `DESIGN.md — ComptaGeWeb · Frontend (client/)`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07370600414078675 - nodes in this community are weakly interconnected._