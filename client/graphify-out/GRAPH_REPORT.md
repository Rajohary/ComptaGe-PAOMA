# Graph Report - client  (2026-10-13)

## Corpus Check
- 62 files · ~37,900 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 506 nodes · 767 edges · 25 communities (23 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6358884`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- package.json
- App.tsx
- AuthContext.tsx
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
- PROJECT_STATE.md — État du projet · Frontend (client/)
- dependencies
- Video Recording
- ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)
- AGENT.md — ComptaGeWeb · Frontend (client/)
- .oxlintrc.json
- flat/DESIGN.md
- React + TypeScript + Vite
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `apiClient()` - 20 edges
2. `react` - 18 edges
3. `compilerOptions` - 18 edges
4. `Browser Automation with playwright-cli` - 16 edges
5. `compilerOptions` - 15 edges
6. `Flat Design System Skill (Antigravity)` - 14 edges
7. `lucide-react` - 13 edges
8. `Running Custom Playwright Code` - 13 edges
9. `Button()` - 12 edges
10. `Commands` - 12 edges

## Surprising Connections (you probably didn't know these)
- `3. Principes d'organisation` --references--> `Button()`  [INFERRED]
  ARCHITECTURE.md → src/components/ui/Button.tsx
- `2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4)` --references--> `applyServerValidationErrors()`  [INFERRED]
  PROJECT_STATE.md → src/lib/formErrors.ts
- `2026-10-12 — Module Authentification & RBAC complet (Section 1)` --references--> `RequireAuth()`  [INFERRED]
  PROJECT_STATE.md → src/features/auth/components/RequireAuth.tsx
- `2026-10-12 — Module Authentification & RBAC complet (Section 1)` --references--> `login()`  [INFERRED]
  PROJECT_STATE.md → src/api/auth.ts
- `2026-10-12 — Module Authentification & RBAC complet (Section 1)` --references--> `refreshToken()`  [INFERRED]
  PROJECT_STATE.md → src/api/auth.ts

## Import Cycles
- None detected.

## Communities (25 total, 2 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.09
Nodes (55): 2026-10-12 — Écran d'ouverture d'une période de gestion (Section 2, Tâche 2), 2026-10-12 — Écran de gestion des bureaux (Section 2, Tâche 1), @hookform/resolvers, lucide-react, react, react-hook-form, zod, apiClient() (+47 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (37): ADMIN_USER, RECEVEUR_USER, devDependencies, autoprefixer, oxlint, @playwright/test, postcss, tailwindcss (+29 more)

### Community 2 - "App.tsx"
Cohesion: 0.11
Nodes (25): react-dom, react-router-dom, App(), PlaceholderPage(), AppLayout(), AppShell(), NAV_ITEMS, NavItem (+17 more)

### Community 3 - "AuthContext.tsx"
Cohesion: 0.34
Nodes (12): 2026-10-12 — Module Authentification & RBAC complet (Section 1), getMe(), login(), logout(), refreshToken(), AuthContext, AuthContextType, AuthProvider() (+4 more)

### Community 4 - "Running Custom Playwright Code"
Cohesion: 0.06
Nodes (30): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests, Attaching Screenshots and Videos to Pull Requests, From a local session, From CI, Limits (+22 more)

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

### Community 15 - "PROJECT_STATE.md — État du projet · Frontend (client/)"
Cohesion: 0.13
Nodes (14): 0. Mise en place du projet, 1. Authentification & RBAC, 2026-10-12 — Correction des anomalies de build, finalisation & validation e2e Module 1 (Auth & RBAC), 2026-10-12 — Gestion des erreurs de validation renvoyées par le backend (Section 2, Tâche 4), 2026-10-12 — Écran de clôture d'une période de gestion (Section 2, Tâche 3), 2. Référentiel (provinces, bureaux, périodes de gestion), 3. Recherche dans le plan comptable (remplace le TreeView legacy), 4. Saisie du Journal G58 — cœur fonctionnel (+6 more)

### Community 16 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, axios, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form, react-router-dom (+3 more)

### Community 17 - "Video Recording"
Cohesion: 0.20
Nodes (10): 1. Use Descriptive Filenames, 2. Record entire hero scripts., 3. Attach the recording to the pull request, Basic Recording, Best Practices, Cursor, Target Highlight and Click Point, Limitations, Overlay API Summary (+2 more)

### Community 18 - "ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)"
Cohesion: 0.22
Nodes (8): 1. Stack, 2. Structure des dossiers, 3. Principes d'organisation, 4. Consommation de l'API backend, 5. Environnement et variables, 6. Tests, 7. Ce qui reste ouvert (à trancher avec l'utilisateur au fil du projet), ARCHITECTURE.md — ComptaGeWeb · Frontend (client/)

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
- **311 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `RECEVEUR_USER` (+306 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 324 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `index.ts` to `package.json`, `App.tsx`, `AuthContext.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _311 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08772635814889336 - nodes in this community are weakly interconnected._
- **Why does `Browser Automation with playwright-cli` connect `Browser Automation with playwright-cli` to `Running Custom Playwright Code`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11379800853485064 - nodes in this community are weakly interconnected._
- **Should `Running Custom Playwright Code` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._