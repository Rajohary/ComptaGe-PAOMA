# AGENT.md — ComptaGeWeb · Frontend (client/)

Ce fichier est le point d'entrée obligatoire pour tout agent (Antigravity / Agy) travaillant dans ce dossier `client/`. Lis-le en entier avant toute action, à chaque nouvelle tâche.

Ce dossier contient **uniquement le frontend**. Le backend (Django) vit dans `../server/`, dans un dossier séparé avec sa propre documentation — ne modifie jamais de fichier dans `../server/` depuis une session ouverte ici. Le seul fichier partagé entre les deux côtés est `../API_CONTRACT.md`, à la racine du repo.

---

## 1. Qu'est-ce que ComptaGeWeb ?

ComptaGeWeb est la réécriture web moderne d'une application de bureau vieillissante (Windows XP / VB6, dite « ComptaGe ») utilisée par **Paositra Malagasy** (la société nationale des postes de Madagascar) pour gérer la comptabilité mensuelle de ses bureaux de poste.

Le cœur du système est le **Journal G58** : un bordereau comptable mensuel où chaque bureau de poste (géré par un « receveur ») déclare ses recettes et dépenses selon une nomenclature stricte (sections A à E), suit son encaisse (numéraire, valeurs postales, timbres fiscaux), et où un inspecteur peut détecter et corriger des écarts entre montants déclarés et montants vérifiés.

Ce projet est réalisé dans le cadre d'un **mémoire de fin de licence**, par un développeur travaillant seul, sur une durée de 6 semaines. Un des arguments centraux du mémoire est la comparaison avant/après avec l'application legacy — en particulier le remplacement de son unique mode de navigation (un TreeView géant et peu ergonomique) par une saisie moderne, rapide, avec retour visuel en temps réel. **La qualité UX de ce frontend n'est donc pas un détail cosmétique : c'est une partie du propos du mémoire.**

---

## 2. Documents de référence — à lire selon le contexte

| Fichier | Quand le lire |
|---|---|
| `PROJECT_STATE.md` (ce dossier) | **Toujours, avant toute tâche.** Liste de tâches vivante du frontend. Coche les cases terminées et ajoute un log en bas après chaque tâche accomplie. |
| `ARCHITECTURE.md` (ce dossier) | Avant de créer un composant, une feature, un hook, ou de prendre une décision structurelle. |
| `DESIGN.md` (ce dossier) | Avant d'écrire ou de modifier tout ce qui touche à l'interface : composants, CSS/Tailwind, mise en page, couleurs, typographie, animations. Document contraignant, pas une suggestion. |
| `../API_CONTRACT.md` | **Avant de consommer tout endpoint.** C'est le contrat partagé avec le backend. Si un endpoint y est listé comme `planifié` et pas encore `implémenté`, ne pas halluciner sa forme — soit attendre, soit coder contre une forme stub documentée et le signaler à l'utilisateur. |

Le dossier `server/` et son contenu ne sont jamais à lire ni modifier depuis une session de travail dans `client/`, sauf si l'utilisateur le demande explicitement.

Le CDC original du projet et les captures d'écran de l'application legacy (fournis séparément par l'utilisateur, probablement dans `../docs/`) font foi pour la logique métier réelle et pour les défauts UX précis à corriger. Vérifie leur présence avant de faire des hypothèses sur un champ ou un comportement attendu.

---

## 3. Compétences (skills) disponibles — dans `../.agents/`

- **`awesome-design-skills`** : à consulter systématiquement avant toute création ou modification d'interface, en complément de `DESIGN.md`. Sert à éviter les patterns visuels génériques.
- **`web-design-guidelines`** : bonnes pratiques web (accessibilité, responsive, sémantique HTML) — à respecter pour tout composant.
- **`grill-me`** : utilise cette skill pour challenger tes propres décisions avant de les considérer comme définitives, en particulier sur les choix UX qui semblent arbitraires ou trop rapides.
- **`caveman`** : utilise cette skill quand une tâche te semble ambiguë ou sous-spécifiée, pour revenir à une formulation simple du problème avant de coder.
- **`playwright-cli`** : à utiliser pour écrire et exécuter les tests end-to-end. Chaque fonctionnalité de saisie critique (formulaire G58, calculs, RBAC) doit avoir un test e2e associé avant d'être considérée comme terminée.
- **`Graphify`** (installé par l'utilisateur pour l'IDE Antigravity) : outil d'analyse de code qui construit un graphe de dépendances/relations du code existant, pensé pour réduire la consommation de tokens par rapport à une lecture fichier par fichier. **Utilise-le systématiquement avant de modifier une feature existante** (comprendre les dépendances entre composants, hooks et appels API d'une feature avant d'y toucher) plutôt que de relire chaque fichier intégralement.

---

## 4. Stack technique (résumé — détails complets dans ARCHITECTURE.md)

- **Framework** : React 18+ avec Vite, TypeScript
- **Routing** : React Router
- **Appels API** : TanStack Query (React Query)
- **Style** : Tailwind CSS, configuré selon les tokens définis dans `DESIGN.md` (jamais la palette par défaut de Tailwind)
- **État global léger** : Zustand (ou Context API si suffisant)
- **Formulaires** : React Hook Form + Zod
- **Tests e2e** : Playwright, dans `client/e2e/`
- **Ce frontend consomme exclusivement l'API Django de `../server/`**, documentée dans `../API_CONTRACT.md`.

---

## 5. Règles de fonctionnement impératives

1. **Ne jamais commencer une tâche sans avoir lu `PROJECT_STATE.md` en premier.** Si une tâche demandée n'y figure pas, l'ajouter avant de commencer à coder.
2. **Après chaque tâche terminée** : cocher la case correspondante dans `PROJECT_STATE.md` ET ajouter une entrée de log en bas du fichier. Ne jamais sauter cette étape.
3. **Avant de consommer un endpoint, vérifier sa forme exacte dans `../API_CONTRACT.md`.** Ne jamais halluciner un format de réponse par ressemblance avec une autre API vue ailleurs.
4. **Respecter strictement `DESIGN.md`.** Ne pas introduire de police, de couleur ou de motif visuel hors de ce qui y est défini, même « temporairement » ou « pour tester ».
5. **RBAC côté UI reflète le RBAC backend, sans jamais s'y substituer.** Masquer un bouton ou une page selon le rôle est une aide UX, pas une mesure de sécurité — ne jamais supposer qu'une restriction visuelle suffit, le backend reste la source de vérité.
6. **Le remplacement du TreeView legacy est une priorité technique et UX, pas un détail.** Traiter la recherche de lignes comptables et le calcul de totaux en temps réel avec le même soin que la correction des défauts identifiés dans les captures d'écran de l'application existante (zones vides sans message, absence de feedback de calcul).
7. **Tester avant de déclarer terminé.** Une fonctionnalité de saisie critique n'est « faite » que si un test e2e Playwright existe et passe.

---

## 6. Ce que ce frontend n'est PAS

- Ce n'est pas une reproduction pixel-perfect de l'application Windows XP existante — c'est une modernisation. L'UX doit être supérieure, pas identique.
- Ce n'est pas un site vitrine ou un produit grand public — voir `DESIGN.md` pour les anti-patterns explicitement interdits (sections Hero centrées, esthétique IA générique, etc.) qui n'ont pas leur place dans un outil de travail institutionnel quotidien.
- Ce n'est pas un projet qui doit couvrir 100 % du CDC dès le départ. Un cœur de saisie solide (sections A, B, D du G58) bien fait vaut mieux qu'une couverture totale bâclée.
