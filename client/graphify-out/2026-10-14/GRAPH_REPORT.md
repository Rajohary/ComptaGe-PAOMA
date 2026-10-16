# Graph Report - client  (2026-10-14)

## Corpus Check
- 78 files · ~55,047 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 605 nodes · 1145 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8b8d5cf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiClient
- package.json
- App.tsx
- index.ts
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
- EncaisseFormModal.tsx
- @playwright/test
- AGENT.md — ComptaGeWeb · Frontend (client/)
- .oxlintrc.json
- flat/DESIGN.md
- React + TypeScript + Vite
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `apiClient()` - 33 edges
2. `react` - 27 edges
3. `Button()` - 24 edges
4. `lucide-react` - 22 edges
5. `compilerOptions` - 18 edges
6. `useAuth()` - 17 edges
7. `Browser Automation with playwright-cli` - 16 edges
8. `App()` - 15 edges
9. `PeriodeGestion` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `5.2 Règles` --references--> `TotauxLive()`  [INFERRED]
  DESIGN.md → src/features/saisie-g58/components/TotauxLive.tsx
- `2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4)` --references--> `applyServerValidationErrors()`  [INFERRED]
  PROJECT_STATE.md → src/lib/formErrors.ts
- `2026-10-14 — Validation React Hook Form + Zod & erreurs DRF (Section 4, Tâche 3)` --references--> `applyServerValidationErrors()`  [INFERRED]
  PROJECT_STATE.md → src/lib/formErrors.ts
- `2026-10-14 — Composant LigneComptableSearch (Section 3, Tâche 1)` --references--> `getSectionsComptables()`  [INFERRED]
  PROJECT_STATE.md → src/api/comptabilite.ts
- `3. Principes d'organisation` --references--> `Button()`  [INFERRED]
  ARCHITECTURE.md → src/components/ui/Button.tsx

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "apiClient"
Cohesion: 0.09
Nodes (54): 2026-10-12 — Écran d'ouverture d'une période de gestion (Section 2, Tâche 2), 2026-10-12 — Écran de gestion des bureaux (Section 2, Tâche 1), 2026-10-14 — Écran de suivi du stock de valeurs postales et timbres (Section 7), apiClient(), ApiClientError, failedQueue, processQueue(), RequestOptions (+46 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (45): dependencies, axios, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form, react-router-dom (+37 more)

### Community 2 - "App.tsx"
Cohesion: 0.08
Nodes (43): 2026-10-12 — Module Authentification & RBAC complet (Section 1), lucide-react, react, react-dom, react-router-dom, getMe(), login(), logout() (+35 more)

### Community 3 - "index.ts"
Cohesion: 0.08
Nodes (49): 1. Stack, 2. Structure des dossiers, 3. Principes d'organisation, 4. Consommation de l'API backend, 5. Environnement et variables, 6. Tests, 7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet), ARCHITECTURE.md — ComptaGeWeb · Frontend (client/) (+41 more)

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
Cohesion: 0.12
Nodes (16): 0. Mise en place du projet, 1. Authentification & RBAC, 2026-10-12 — Correction des anomalies de build, finalisation & validation e2e Module 1 (Auth & RBAC), 2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4), 2026-10-12 — Écran de clôture d'une période de gestion (Section 2, Tâche 3), 2026-10-14 — Composant TotauxLive réactif (Section 4, Tâche 2), 2026-10-14 — Historique des lignes récentes par bureau (Section 3, Tâche 2), 2026-10-14 — Traitement explicite des états vide et chargement (Section 3, Tâche 3) (+8 more)

### Community 16 - "EncaisseFormModal.tsx"
Cohesion: 0.16
Nodes (21): @hookform/resolvers, react-hook-form, zod, Input, InputProps, Select, SelectProps, BureauFormInput (+13 more)

### Community 17 - "@playwright/test"
Cohesion: 0.08
Nodes (17): ADMIN_USER, RECEVEUR_USER, MOCK_BUREAUX, MOCK_PERIODES, MOCK_RUBRIQUES, MOCK_LIGNES, MOCK_SECTIONS, MOCK_LIGNES (+9 more)

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

## Knowledge Gaps
- **335 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `RECEVEUR_USER` (+330 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 348 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TotauxLive()` connect `index.ts` to `DESIGN.md — ComptaGeWeb · Frontend (client/)`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _335 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiClient` be split into smaller, more focused modules?**
  _Cohesion score 0.09324009324009325 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App.tsx` to `apiClient`, `package.json`, `index.ts`, `EncaisseFormModal.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Why does `5.2 Règles` connect `DESIGN.md — ComptaGeWeb · Frontend (client/)` to `index.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08469945355191257 - nodes in this community are weakly interconnected._