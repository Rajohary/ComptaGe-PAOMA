# README.md — ComptaGeWeb (à ton attention, Johary)

Ce fichier est pour toi, pas pour Antigravity. Il liste tout ce que tu dois installer et vérifier **avant** de lancer ta première session avec agy sur ce projet.

---

## 1. Où placer ces fichiers

Tu as déjà créé le dossier `ComptaGeWeb` et le dossier `.agents/` avec tes skills. Place les 5 fichiers de ce ZIP directement à la racine de `ComptaGeWeb/` :

```
ComptaGeWeb/
├── .agents/                # déjà présent chez toi
├── AGENT.md                 # à copier ici
├── ARCHITECTURE.md           # à copier ici
├── DESIGN.md                 # à copier ici
├── PROJECT_STATE.md           # à copier ici
└── README.md                  # à copier ici (celui-ci)
```

Copie aussi le CDC du projet (le `.md` ou le `.pdf` qu'on a généré ensemble) quelque part dans le dossier, par exemple `ComptaGeWeb/docs/CDC_ComptaGe.md` — Agy s'y réfère pour la logique métier détaillée.

---

## 2. À installer avant de commencer

Tu es sous **CachyOS** (Arch-based), donc `pacman` et `yay`/`paru` sont tes amis. Voici la checklist :

### 2.1 Outils de base
- [ ] **Git** : `sudo pacman -S git` (probablement déjà présent)
- [ ] **Node.js (LTS, 20+) et npm** : `sudo pacman -S nodejs npm` — vérifie la version avec `node -v` (il faut du 20 ou plus pour Vite récent)
- [ ] **Python 3.12+** : `sudo pacman -S python` — vérifie avec `python --version`
- [ ] **pip** : normalement inclus avec Python, sinon `sudo pacman -S python-pip`

### 2.2 Base de données
- [ ] **PostgreSQL 16** : `sudo pacman -S postgresql`
- [ ] Initialiser le cluster PostgreSQL si ce n'est pas déjà fait :
  ```bash
  sudo -iu postgres initdb -D /var/lib/postgres/data
  sudo systemctl enable --now postgresql
  ```
- [ ] Créer un utilisateur et une base pour le projet :
  ```bash
  sudo -iu postgres psql
  CREATE USER comptage_user WITH PASSWORD 'choisis_un_mot_de_passe';
  CREATE DATABASE comptage_dev OWNER comptage_user;
  \q
  ```
- [ ] Note ces identifiants quelque part — tu en auras besoin pour le fichier `.env` du serveur Django.

### 2.3 Environnement Python (isolation du projet)
- [ ] Une fois que le dossier `server/` existe (Agy le créera), pense à travailler dans un environnement virtuel :
  ```bash
  cd server
  python -m venv venv
  source venv/bin/activate
  ```
- [ ] Ne demande pas à Agy d'installer des paquets Python globalement — toujours dans le venv actif.

### 2.4 Outils déjà installés par toi (rappel, rien à faire)
- `.agents/awesome-design-skills`
- `.agents/grill-me`
- `.agents/caveman`
- `.agents/web-design-guidelines`
- `.agents/playwright-cli`

Ces skills seront utilisées automatiquement par Agy selon les instructions d'`AGENT.md` — tu n'as rien à configurer de plus pour elles.

### 2.5 Playwright (dépendances système)
Playwright a besoin de navigateurs et de dépendances système pour tourner correctement en e2e. Une fois le projet client initialisé par Agy :
```bash
cd client
npx playwright install --with-deps
```
Sur CachyOS/Arch, il est possible que `--with-deps` ne trouve pas tous les paquets automatiquement (c'est pensé pour Debian/Ubuntu à la base) — si ça bloque, dis-le à Agy ou reviens vers moi, on identifiera les paquets manquants manuellement.

---

## 3. Vérifications avant la première session avec Agy

- [ ] `node -v` retourne bien une version 20+
- [ ] `python --version` retourne bien 3.12+
- [ ] `sudo systemctl status postgresql` indique que le service tourne
- [ ] Tu peux te connecter à la base avec `psql -U comptage_user -d comptage_dev -h localhost` (ça te demandera le mot de passe créé plus haut)
- [ ] Le dossier `ComptaGeWeb/` contient bien les 5 fichiers `.md` à la racine + ton dossier `.agents/`

---

## 4. Comment démarrer ta première session avec Antigravity

1. Ouvre `antigravity-cli` dans le dossier `ComptaGeWeb/`.
2. Ta toute première instruction à Agy devrait être quelque chose comme :
   > « Lis AGENT.md, ARCHITECTURE.md, DESIGN.md et PROJECT_STATE.md. Initialise le projet selon la section 0 de PROJECT_STATE.md. »
3. Vérifie qu'Agy coche bien les cases au fur et à mesure et ajoute des entrées de journal dans `PROJECT_STATE.md` — si ce n'est pas le cas, rappelle-lui la règle (elle est pourtant explicite dans `AGENT.md`, section 5).
4. Donne-lui tes identifiants PostgreSQL locaux quand il en aura besoin pour configurer le `.env` de `server/` (ne les mets jamais en dur dans un fichier versionné — vérifie que `.env` est bien dans le `.gitignore` dès la mise en place).

---

## 5. Ce que tu devras probablement fournir à Agy au fil du projet

- Le CDC complet et les captures d'écran de l'application legacy (déjà en ta possession) — utile dès la section 3 de `PROJECT_STATE.md` (seed du plan comptable réel).
- Tes retours sur les choix d'UX du formulaire de saisie G58 (section 4) — c'est la partie la plus critique du projet, prends le temps de vraiment tester ce qu'Agy propose avant de valider.
- Toute nouvelle fonctionnalité que tu identifies en cours de route (états, statistiques, exports) — à faire ajouter directement dans la section 8 de `PROJECT_STATE.md` avant implémentation, pas juste demandée à l'oral et oubliée.

---

## 6. Un conseil pour la suite (mémoire de licence)

Garde une copie datée de `PROJECT_STATE.md` de temps en temps (ex. chaque fin de semaine) — le journal d'actions en bas du fichier deviendra une mine d'or pour rédiger la partie « méthodologie » ou « déroulement du projet » de ton mémoire. C'est littéralement un historique de développement déjà rédigé en français, autant s'en servir.

Bon courage pour les 6 semaines.
