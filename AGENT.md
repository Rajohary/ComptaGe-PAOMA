# AGENT.md — ComptaGeWeb

Ce fichier est le point d'entrée obligatoire pour tout agent (Antigravity / Agy) travaillant sur ce projet. Lis-le en entier avant toute action, à chaque nouvelle tâche, même si tu penses déjà connaître le contexte.

---

## 1. Qu'est-ce que ComptaGeWeb ?

ComptaGeWeb est la réécriture web moderne d'une application de bureau vieillissante (Windows XP / VB6, dite « ComptaGe ») utilisée par **Paositra Malagasy** (la société nationale des postes de Madagascar) pour gérer la comptabilité mensuelle de ses bureaux de poste.

Le cœur du système est le **Journal G58** : un bordereau comptable mensuel où chaque bureau de poste (géré par un « receveur ») déclare ses recettes et dépenses selon une nomenclature stricte (sections A à E), suit son encaisse (numéraire, valeurs postales, timbres fiscaux), et où un inspecteur peut détecter et corriger des écarts entre montants déclarés et montants vérifiés.

Ce projet est réalisé dans le cadre d'un **mémoire de fin de licence**, par un développeur travaillant seul, sur une durée de 6 semaines. La priorité absolue est donc : un cœur fonctionnel solide, bien architecturé, avec une vraie valeur ajoutée UX par rapport à l'existant — pas une couverture à 100 % de chaque champ du système legacy.

L'utilisateur ajoutera des fonctionnalités complémentaires au fil de l'eau (états, statistiques, exports, etc.) — reste donc attentif aux mises à jour de `PROJECT_STATE.md` plutôt que de considérer le périmètre comme figé.

---

## 2. Documents de référence — à lire selon le contexte

Ne charge pas tout systématiquement : lis le document pertinent selon la tâche en cours.

| Fichier | Quand le lire |
|---|---|
| `PROJECT_STATE.md` | **Toujours, avant toute tâche.** C'est la liste de tâches vivante du projet. Coche les cases terminées et ajoute un log en bas après chaque tâche accomplie. |
| `ARCHITECTURE.md` | Avant de créer un fichier, un dossier, un module, un modèle Django, un composant React, ou de prendre une décision structurelle. |
| `DESIGN.md` | Avant d'écrire ou de modifier tout ce qui touche à l'interface : composants React, CSS/Tailwind, mise en page, couleurs, typographie, animations. |
| `README.md` | Ne devrait pas avoir besoin d'être modifié par toi — c'est destiné à l'humain. Ne le lis que si on te demande d'y ajouter une instruction de setup. |

Le CDC original du projet (`CDC_ComptaGe.md` ou `.pdf`, fourni séparément par l'utilisateur) et les captures d'écran de l'application legacy font foi pour la logique métier réelle (nomenclature des sections A/B/C/D/E, calculs, formulaires) quand elles sont disponibles dans le dossier du projet. Vérifie leur présence dans le repo avant de faire des hypothèses sur un champ ou une règle métier que tu ne comprends pas.

---

## 3. Compétences (skills) disponibles — dans `.agents/`

Le dossier `.agents/` contient des skills installées pour ce projet. Utilise-les activement, ne les ignore pas :

- **`awesome-design-skills`** : à consulter systématiquement avant toute création ou modification d'interface, en complément de `DESIGN.md`. Sert à éviter les patterns visuels génériques.
- **`web-design-guidelines`** : bonnes pratiques web (accessibilité, responsive, sémantique HTML) — à respecter pour tout composant React.
- **`grill-me`** : utilise cette skill pour challenger tes propres décisions avant de les considérer comme définitives, en particulier sur les choix d'architecture ou de design qui semblent arbitraires ou trop rapides.
- **`caveman`** : utilise cette skill quand une tâche te semble ambiguë ou sous-spécifiée, pour revenir à une formulation simple du problème avant de coder.
- **`playwright-cli`** : à utiliser pour écrire et exécuter les tests end-to-end. Chaque fonctionnalité de saisie critique (formulaire G58, calculs, RBAC) doit avoir un test e2e associé avant d'être considérée comme terminée.

Si une skill semble pertinente pour une tâche donnée mais que tu hésites à l'utiliser, utilise-la quand même — le coût d'une vérification supplémentaire est toujours inférieur au coût d'une régression métier ou visuelle dans ce projet.

---

## 4. Stack technique (résumé — détails complets dans ARCHITECTURE.md)

- **Frontend** : React (Vite), dans `/client`
- **Backend** : Python + Django + Django REST Framework, dans `/server`
- **Base de données** : PostgreSQL, via le Django ORM natif (pas de Prisma, pas d'ORM tiers)
- **Tests** : Playwright pour l'e2e (`/client` ou dossier `/e2e` dédié — voir ARCHITECTURE.md), tests unitaires Django (`TestCase` / `pytest-django`) pour la logique métier critique (calculs de totaux, rectifications, RBAC)
- **Structure** : monorepo — un seul dépôt Git, `/client` et `/server` à la racine

---

## 5. Règles de fonctionnement impératives

1. **Ne jamais commencer une tâche sans avoir lu `PROJECT_STATE.md` en premier.** Si une tâche demandée par l'utilisateur ne s'y trouve pas, l'ajouter avant de commencer à coder.
2. **Après chaque tâche terminée** : cocher la case correspondante dans `PROJECT_STATE.md` ET ajouter une entrée de log en bas du fichier (date, ce qui a été fait, fichiers touchés). Ne jamais sauter cette étape, même pour une tâche « petite ».
3. **La logique métier prime sur l'esthétique, mais l'esthétique n'est jamais négligeable.** Ce projet est un mémoire de licence : la qualité perçue de l'UI compte autant que la justesse des calculs pour l'évaluation.
4. **Ne jamais inventer une règle métier.** Si un calcul, un champ ou un comportement n'est pas clair (ex. : que représente exactement « B2 Tsinjo Lavitra », comment se comporte la clôture d'une période), pose la question à l'utilisateur plutôt que de supposer. Une hypothèse fausse sur la comptabilité est plus coûteuse à corriger qu'une question posée à temps.
5. **RBAC dès le départ.** Ne pas construire de fonctionnalité de saisie ou de consultation sans réfléchir immédiatement à quel(s) rôle(s) y a accès (Admin, Receveur, Agent de saisie, Inspecteur — voir ARCHITECTURE.md pour le détail des permissions).
6. **Respecter strictement DESIGN.md.** Ne pas introduire de police, de couleur ou de motif visuel hors de ce qui y est défini, même « temporairement » ou « pour tester ».
7. **Tester avant de déclarer terminé.** Une fonctionnalité de saisie ou de calcul n'est « faite » que si un test (unitaire Django et/ou e2e Playwright) existe et passe.

---

## 6. Ce que ce projet n'est PAS

- Ce n'est pas une reproduction pixel-perfect de l'application Windows XP existante — c'est une modernisation. L'UX doit être supérieure, pas identique.
- Ce n'est pas un projet qui doit couvrir 100 % du CDC original dès le départ. Un cœur solide (sections A, B, D du G58 en priorité) bien fait vaut mieux qu'une couverture totale bâclée.
- Ce n'est pas un projet solo au sens “aucune structure” — même seul, l'utilisateur attend une rigueur de projet d'équipe (documentation, tests, conventions) parce que c'est noté dans le cadre d'un mémoire.
