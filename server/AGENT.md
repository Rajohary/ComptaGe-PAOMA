# AGENT.md — ComptaGeWeb · Backend (server/)

Ce fichier est le point d'entrée obligatoire pour tout agent travaillant dans ce dossier `server/`. Lis-le en entier avant toute action, à chaque nouvelle tâche.

Ce dossier contient **uniquement le backend**. Le frontend (React) vit dans `../client/`, dans un dossier séparé avec sa propre documentation — ne modifie jamais de fichier dans `../client/` depuis une session ouverte ici. Le seul fichier partagé entre les deux côtés est `../API_CONTRACT.md`, à la racine du repo.

---

## 1. Qu'est-ce que ComptaGeWeb ?

ComptaGeWeb est la réécriture web moderne d'une application de bureau vieillissante (Windows XP / VB6, dite « ComptaGe ») utilisée par **Paositra Malagasy** (la société nationale des postes de Madagascar) pour gérer la comptabilité mensuelle de ses bureaux de poste.

Le cœur du système est le **Journal G58** : un bordereau comptable mensuel où chaque bureau de poste (géré par un « receveur ») déclare ses recettes et dépenses selon une nomenclature stricte (sections A à E), suit son encaisse (numéraire, valeurs postales, timbres fiscaux), et où un inspecteur peut détecter et corriger des écarts entre montants déclarés et montants vérifiés.

Ce projet est réalisé dans le cadre d'un **mémoire de fin de licence**, par un développeur travaillant seul, sur une durée de 6 semaines. La priorité absolue est un backend solide, bien architecturé, avec une vraie fiabilité des données (contraintes strictes, RBAC rigoureux) — pas une couverture exhaustive de chaque champ du système legacy dès le départ.

---

## 2. Documents de référence — à lire selon le contexte

| Fichier | Quand le lire |
|---|---|
| `PROJECT_STATE.md` (ce dossier) | **Toujours, avant toute tâche.** Liste de tâches vivante du backend. Coche les cases terminées et ajoute un log en bas après chaque tâche accomplie. |
| `ARCHITECTURE.md` (ce dossier) | Avant de créer une app Django, un modèle, une vue, un serializer, ou de prendre une décision structurelle. |
| `../API_CONTRACT.md` | **Avant de créer ou modifier tout endpoint.** C'est le contrat partagé avec le frontend — le lire avant, le mettre à jour après, dans le même tour de travail. Ne jamais laisser ce fichier désynchronisé de la réalité du code. |
| Le CDC du projet (PDF/MD fourni par l'utilisateur, probablement dans `../docs/`) | Pour toute règle métier comptable précise (calculs, structure du plan comptable, RBAC détaillé). Vérifie sa présence dans le repo avant de faire une hypothèse sur une règle que tu ne comprends pas. |

Le dossier `client/` et son contenu ne sont jamais à lire ni modifier depuis une session de travail dans `server/`, sauf si l'utilisateur le demande explicitement.

---

## 3. Compétences (skills) disponibles — dans `../.agents/`

- **`grill-me`** : utilise cette skill pour challenger tes propres décisions avant de les considérer comme définitives, en particulier sur les choix de modélisation de données ou de règles métier qui semblent arbitraires ou trop rapides.
- **`caveman`** : utilise cette skill quand une tâche te semble ambiguë ou sous-spécifiée, pour revenir à une formulation simple du problème avant de coder.
- **`playwright-cli`** : non utilisée directement côté backend (c'est un outil de test e2e frontend), mais sache qu'elle existe côté `client/` — un endpoint backend que tu casses peut faire échouer un test Playwright côté front, donc traite `../API_CONTRACT.md` comme un filet de sécurité à ne jamais ignorer.
- **`Graphify`** (installé par l'utilisateur pour l'IDE Antigravity) : outil d'analyse de code qui construit un graphe de dépendances/relations du code existant, pensé pour réduire la consommation de tokens par rapport à une lecture fichier par fichier. **Utilise-le systématiquement avant de modifier une app Django existante** (comprendre les dépendances entre modèles, vues et serializers d'une app avant d'y toucher) plutôt que de relire l'intégralité des fichiers un par un. Particulièrement utile ici vu le nombre de modèles interconnectés par des ForeignKey (voir `ARCHITECTURE.md`).

`awesome-design-skills` et `web-design-guidelines` sont des skills frontend, non pertinentes côté backend — ne les invoque pas ici.

---

## 4. Stack technique (résumé — détails complets dans ARCHITECTURE.md)

- **Framework** : Python 3.12+, Django 5.x, Django REST Framework (DRF)
- **Base de données** : PostgreSQL 16, via le Django ORM natif (aucun ORM tiers — pas de Prisma, pas de SQLAlchemy)
- **Authentification** : JWT via `djangorestframework-simplejwt`
- **Tests** : tests unitaires Django (`TestCase` ou `pytest-django`) sur la logique métier critique
- **Ce backend est consommé exclusivement par le frontend React de `../client/`** — pas de rendu de templates Django côté utilisateur final, DRF expose uniquement du JSON.

---

## 5. Règles de fonctionnement impératives

1. **Ne jamais commencer une tâche sans avoir lu `PROJECT_STATE.md` en premier.** Si une tâche demandée n'y figure pas, l'ajouter avant de commencer à coder.
2. **Après chaque tâche terminée** : cocher la case correspondante dans `PROJECT_STATE.md` ET ajouter une entrée de log en bas du fichier (date, ce qui a été fait, fichiers touchés). Ne jamais sauter cette étape.
3. **Toute création ou modification d'endpoint doit être répercutée dans `../API_CONTRACT.md` dans le même tour de travail.** C'est la règle la plus importante de ce dossier — le frontend en dépend directement et ne peut pas deviner un changement non documenté.
4. **Ne jamais inventer une règle métier.** Si un calcul, un champ ou un comportement comptable n'est pas clair, pose la question à l'utilisateur plutôt que de supposer.
5. **Toutes les contraintes d'intégrité au niveau base de données**, pas seulement au niveau applicatif (ForeignKey avec `on_delete` explicite, `unique_together`, `CheckConstraint` quand pertinent). C'est une réponse directe à un défaut majeur identifié dans le système legacy (absence totale de FK, source de risques d'incohérence documentée dans le CDC).
6. **RBAC strict et explicite sur chaque vue.** Une vue DRF sans classe de permission déclarée explicitement est une erreur, jamais un oubli acceptable « à corriger plus tard ».
7. **Tester avant de déclarer terminé.** Une fonctionnalité métier (calcul, règle de clôture, rectification) n'est « faite » que si un test unitaire existe et passe.

---

## 6. Ce que ce backend n'est PAS

- Ce n'est pas une API généraliste prête à servir n'importe quel client — elle est pensée en contrat direct avec le frontend React de `../client/`, documenté dans `../API_CONTRACT.md`.
- Ce n'est pas un projet qui doit couvrir 100 % du CDC dès le départ. Un cœur solide (sections A, B, D du G58 en priorité, RBAC strict, intégrité référentielle complète) vaut mieux qu'une couverture totale bâclée.
- Ce n'est pas un projet où la validation se fait uniquement côté frontend — toute règle métier critique doit être vérifiée aussi côté backend, qui reste la source de vérité en cas de divergence.
