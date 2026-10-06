# Graph Report - client  (2026-10-06)

## Corpus Check
- Corpus is ~5,183 words - fits in a single context window. You may not need a graph.

## Summary
- 13 nodes · 11 edges · 4 communities (1 shown, 3 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 10,138 input · 2,228 output

## Community Hubs (Navigation)
- Project Architecture & Documentation
- G58 Accounting Entry Workflow
- Design System & Styling
- Authentication Context

## God Nodes (most connected - your core abstractions)
1. `TotauxLive` - 2 edges
2. `Journal G58` - 2 edges
3. `API Client` - 1 edges
4. `LigneComptableSearch` - 1 edges
5. `Global Styles` - 1 edges
6. `Saisie G58 E2E Test` - 1 edges
7. `Graphify Skill` - 1 edges
8. `AuthContext` - 0 edges

## Surprising Connections (you probably didn't know these)
- `LigneComptableSearch` --conceptually_related_to--> `Journal G58`  [EXTRACTED]
  client/src/features/saisie-g58/components/LigneComptableSearch.tsx → client/AGENT.md
- `TotauxLive` --conceptually_related_to--> `Journal G58`  [EXTRACTED]
  client/src/features/saisie-g58/components/TotauxLive.tsx → client/AGENT.md
- `Saisie G58 E2E Test` --calls--> `TotauxLive`  [INFERRED]
  client/e2e/saisie-g58.spec.ts → client/src/features/saisie-g58/components/TotauxLive.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **G58 Saisie Core Flow** — src_features_saisie_g58_lignecomptablesearch, src_features_saisie_g58_totauxlive, client_e2e_saisie_g58_spec, concept_g58_journal [EXTRACTED 0.95]
- **Frontend Governance Documents** — client_agent_md, client_architecture_md, client_design_md, client_project_state_md [EXTRACTED 1.00]

## Communities (4 total, 3 thin omitted)

### Community 1 - "G58 Accounting Entry Workflow"
Cohesion: 0.50
Nodes (4): Saisie G58 E2E Test, Journal G58, LigneComptableSearch, TotauxLive

## Knowledge Gaps
- **6 isolated node(s):** `API Client`, `LigneComptableSearch`, `AuthContext`, `Global Styles`, `Saisie G58 E2E Test` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 7 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `API Client`, `LigneComptableSearch`, `AuthContext` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._