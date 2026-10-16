# Graph Report - client  (2026-10-15)

## Corpus Check
- 80 files · ~59,308 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 618 nodes · 1191 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8b8d5cf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StockValeurFormModal.tsx
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
- apiClient
- @playwright/test
- AGENT.md — ComptaGeWeb · Frontend (client/)
- .oxlintrc.json
- flat/DESIGN.md
- React + TypeScript + Vite
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `apiClient()` - 33 edges
2. `react` - 28 edges
3. `Button()` - 26 edges
4. `lucide-react` - 23 edges
5. `useAuth()` - 19 edges
6. `compilerOptions` - 18 edges
7. `9. Journal des actions (log)` - 18 edges
8. `App()` - 16 edges
9. `PeriodeGestion` - 16 edges
10. `Browser Automation with playwright-cli` - 16 edges

## Surprising Connections (you probably didn't know these)
- `5.2 Règles` --references--> `TotauxLive()`  [INFERRED]
  DESIGN.md → src/features/saisie-g58/components/TotauxLive.tsx
- `2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4)` --references--> `applyServerValidationErrors()`  [INFERRED]
  PROJECT_STATE.md → src/lib/formErrors.ts
- `2026-10-14 — Validation React Hook Form + Zod & erreurs DRF (Section 4, Tâche 3)` --references--> `applyServerValidationErrors()`  [INFERRED]
  PROJECT_STATE.md → src/lib/formErrors.ts
- `2026-10-15 — Révision et enrichissement de l'espace Encaisse (Section 4)` --references--> `updateMouvementEncaisse()`  [INFERRED]
  PROJECT_STATE.md → src/api/comptabilite.ts
- `3. Principes d'organisation` --references--> `Button()`  [INFERRED]
  ARCHITECTURE.md → src/components/ui/Button.tsx

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "StockValeurFormModal.tsx"
Cohesion: 0.13
Nodes (30): @hookform/resolvers, react-hook-form, zod, Button(), ButtonProps, Input, InputProps, Select (+22 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, axios, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form, react-router-dom (+36 more)

### Community 2 - "App.tsx"
Cohesion: 0.08
Nodes (45): 2026-10-12 — Module Authentification & RBAC complet (Section 1), lucide-react, react, react-dom, react-router-dom, getMe(), login(), logout() (+37 more)

### Community 3 - "index.ts"
Cohesion: 0.12
Nodes (40): 2026-10-14 — Composant LigneComptableSearch (Section 3, Tâche 1), 2026-10-14 — Composant SectionForm du Journal G58 (Section 4, Tâche 1), 2026-10-14 — Écran Détails de l'encaisse (Section 4, Tâche 4), createMouvement(), createMouvementEncaisse(), deleteMouvement(), deleteMouvementEncaisse(), getLignesComptables() (+32 more)

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
Cohesion: 0.07
Nodes (32): 1. Stack, 2. Structure des dossiers, 3. Principes d'organisation, 4. Consommation de l'API backend, 5. Environnement et variables, 6. Tests, 7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet), ARCHITECTURE.md — ComptaGeWeb · Frontend (client/) (+24 more)

### Community 16 - "apiClient"
Cohesion: 0.11
Nodes (44): 2026-10-12 — Écran d'ouverture d'une période de gestion (Section 2, Tâche 2), 2026-10-12 — Écran de gestion des bureaux (Section 2, Tâche 1), 2026-10-14 — Écran de suivi du stock de valeurs postales et timbres (Section 7), axios, apiClient(), ApiClientError, failedQueue, processQueue() (+36 more)

### Community 17 - "@playwright/test"
Cohesion: 0.06
Nodes (21): ADMIN_USER, RECEVEUR_USER, MOCK_BUREAUX, MOCK_PERIODES, MOCK_RUBRIQUES, MOCK_LIGNES, MOCK_SECTIONS, MOCK_LIGNES (+13 more)

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
- **339 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `RECEVEUR_USER` (+334 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 352 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `StockValeurFormModal.tsx`, `package.json`, `index.ts`, `apiClient`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _339 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `StockValeurFormModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1337126600284495 - nodes in this community are weakly interconnected._
- **Why does `TotauxLive()` connect `9. Journal des actions (log)` to `App.tsx`, `index.ts`, `DESIGN.md — ComptaGeWeb · Frontend (client/)`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `@playwright/test` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08028846153846154 - nodes in this community are weakly interconnected._