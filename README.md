# README.md — ComptaGeWeb (à ton attention, Johary)

Ce fichier est pour toi, pas pour Antigravity. Il liste tout ce que tu dois installer et vérifier avant de lancer tes sessions avec agy, et explique comment le projet est organisé maintenant qu'il est séparé en deux sous-projets.

---

## 1. Structure du projet

Le repo est organisé en **deux dossiers indépendants** côte à côte, chacun avec sa propre documentation pour Agy, reliés par un seul fichier de contrat d'API à la racine :

```
ComptaGeWeb/
├── .agents/                   # tes skills (déjà en place)
├── README.md                   # ce fichier
├── API_CONTRACT.md              # LE pont entre front et back — lu par les deux côtés
├── client/
│   ├── AGENT.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   └── PROJECT_STATE.md
└── server/
    ├── AGENT.md
    ├── ARCHITECTURE.md
    └── PROJECT_STATE.md
```

Pourquoi cette organisation : `client/` et `server/` sont pensés comme deux sous-projets quasi autonomes — tu peux ouvrir une session Antigravity dans l'un ou l'autre sans que l'agent ait besoin de charger le contexte complet de l'autre côté. Le seul point de vérité partagé obligatoire est `API_CONTRACT.md` : **toute session, côté front ou back, doit le lire avant de toucher à un endpoint**, et le mettre à jour si elle en crée ou modifie un.

Copie aussi le CDC du projet (le PDF qu'on a généré/mis à jour ensemble) à la racine, par exemple dans `ComptaGeWeb/docs/CDC_ComptaGe.pdf` — les deux côtés s'y réfèrent pour la logique métier détaillée.

---

## 2. À installer avant de commencer

Tu es sous **CachyOS** (Arch-based), donc `pacman` et `yay`/`paru` sont tes amis.

### 2.1 Outils de base
- [ ] **Git** : `sudo pacman -S git`
- [ ] **Node.js (LTS, 20+) et npm** : `sudo pacman -S nodejs npm` — vérifie avec `node -v`
- [ ] **Python 3.12+** : `sudo pacman -S python` — vérifie avec `python --version`
- [ ] **pip** : normalement inclus, sinon `sudo pacman -S python-pip`

### 2.2 Base de données
- [ ] **PostgreSQL 16** : `sudo pacman -S postgresql`
- [ ] Initialiser le cluster si besoin :
  ```bash
  sudo -iu postgres initdb -D /var/lib/postgres/data
  sudo systemctl enable --now postgresql
  ```
- [ ] Créer l'utilisateur et la base :
  ```bash
  sudo -iu postgres psql
  CREATE USER comptage_user WITH PASSWORD 'choisis_un_mot_de_passe';
  CREATE DATABASE comptage_dev OWNER comptage_user;
  \q
  ```
- [ ] Note ces identifiants — tu en auras besoin pour `server/.env`.

### 2.3 Environnement Python (isolation du projet)
- [ ] Une fois `server/` initialisé par Agy :
  ```bash
  cd server
  python -m venv venv
  source venv/bin/activate
  ```
- [ ] Ne jamais installer de paquets Python globalement — toujours dans le venv actif.

### 2.4 Outils déjà installés par toi (rappel, rien à faire)
- `.agents/awesome-design-skills`
- `.agents/grill-me`
- `.agents/caveman`
- `.agents/web-design-guidelines`
- `.agents/playwright-cli`
- **Graphify** — outil d'analyse de code installé pour réduire la consommation de tokens dans Antigravity en construisant un graphe de dépendances du code plutôt que de faire relire des fichiers entiers à l'agent à chaque fois. Il est référencé dans `AGENT.md` des deux côtés (`client/` et `server/`) — Agy doit l'utiliser pour explorer une base de code existante avant de la modifier, plutôt que de lire fichier par fichier à l'aveugle.

### 2.5 Playwright (dépendances système)
Une fois `client/` initialisé :
```bash
cd client
npx playwright install --with-deps
```
Sur CachyOS/Arch, `--with-deps` est pensé pour Debian/Ubuntu à la base — si l'installation automatique des dépendances système bloque, reviens vers moi pour qu'on identifie les paquets manquants manuellement.

---

## 3. Vérifications avant la première session avec Agy

- [ ] `node -v` retourne une version 20+
- [ ] `python --version` retourne 3.12+
- [ ] `sudo systemctl status postgresql` indique que le service tourne
- [ ] Connexion réussie avec `psql -U comptage_user -d comptage_dev -h localhost`
- [ ] Le dossier `ComptaGeWeb/` contient bien `.agents/`, `README.md`, `API_CONTRACT.md`, `client/` (4 fichiers .md) et `server/` (3 fichiers .md)

---

## 4. Comment démarrer tes sessions avec Antigravity

Comme front et back sont séparés, tu peux travailler les deux en parallèle (deux fenêtres/sessions Antigravity distinctes) ou en alternance. Dans les deux cas :

1. **Session côté backend**, ouvre `antigravity-cli` dans `ComptaGeWeb/server/` et commence par :
   > « Lis AGENT.md, ARCHITECTURE.md et PROJECT_STATE.md, ainsi que API_CONTRACT.md à la racine du projet. Initialise le projet selon la section 0 de PROJECT_STATE.md. »

2. **Session côté frontend**, ouvre `antigravity-cli` dans `ComptaGeWeb/client/` et commence par :
   > « Lis AGENT.md, ARCHITECTURE.md, DESIGN.md et PROJECT_STATE.md, ainsi que API_CONTRACT.md à la racine du projet. Initialise le projet selon la section 0 de PROJECT_STATE.md. »

3. **Ordre conseillé** : avance toujours un peu en avance côté backend avant le frontend correspondant (créer l'endpoint avant de coder l'appel React qui le consomme), pour que `API_CONTRACT.md` soit à jour avec la réalité au moment où le frontend en a besoin. Ce n'est pas une règle absolue — tu peux aussi stubber un endpoint `planifié` côté front en attendant — mais c'est le flux le plus fluide.

4. Vérifie régulièrement que **les deux** `PROJECT_STATE.md` restent cohérents entre eux : si une tâche backend crée un endpoint qui a une contrepartie frontend prévue, assure-toi qu'elle apparaît bien aussi côté `client/PROJECT_STATE.md`. Les deux fichiers sont volontairement indépendants (pas de numérotation croisée automatique), donc cette cohérence reste une vérification humaine de ta part de temps en temps.

5. Vérifie qu'Agy coche bien les cases et ajoute des entrées de journal dans le `PROJECT_STATE.md` du dossier où tu travailles — si ce n'est pas le cas, rappelle-lui la règle (explicite dans `AGENT.md` de chaque côté).

---

## 5. Ce que tu devras probablement fournir à Agy au fil du projet

- Le CDC complet et les captures d'écran de l'application legacy (déjà en ta possession).
- Tes identifiants PostgreSQL locaux pour configurer `server/.env` (jamais en dur dans un fichier versionné — vérifie que `.env` est dans `.gitignore` dès la mise en place).
- Tes retours sur les choix d'UX du formulaire de saisie G58 — c'est la partie la plus critique du projet.
- Toute nouvelle fonctionnalité identifiée en cours de route (états, statistiques, exports) — à faire ajouter dans la section backlog du `PROJECT_STATE.md` concerné (front, back, ou les deux) avant implémentation.

---

## 6. Un conseil pour la suite (mémoire de licence)

Garde une copie datée des deux `PROJECT_STATE.md` de temps en temps (ex. chaque fin de semaine). Le journal d'actions en bas de chacun deviendra une mine d'or pour rédiger la partie « méthodologie » ou « déroulement du projet » de ton mémoire — et le fait d'avoir deux journaux séparés (front/back) peut même t'aider à documenter la répartition du travail si le jury s'y intéresse.

Bon courage pour les 6 semaines.
