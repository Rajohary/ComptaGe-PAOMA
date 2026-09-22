# DESIGN.md — ComptaGeWeb

Ce document est la référence unique et contraignante pour tout ce qui touche à l'interface visuelle du projet. Il prime sur toute préférence esthétique par défaut d'un framework ou d'une bibliothèque de composants. En cas de doute entre « ce qui est joli par défaut » et « ce qui est écrit ici », ce document gagne toujours.

À consulter en complément de la skill `awesome-design-skills` et `web-design-guidelines` avant toute création ou modification de composant visuel.

---

## 1. Intention et ambiance visuelle

ComptaGeWeb est un outil de gestion comptable pour une administration publique postale. L'ambiance visuelle doit exprimer trois choses simultanément :

1. **La confiance et le sérieux institutionnel** — c'est un logiciel qui manipule de l'argent public, pas un produit grand public. L'utilisateur doit sentir qu'il travaille dans un outil rigoureux, pas dans une app ludique.
2. **La clarté fonctionnelle** — l'utilisateur type (un receveur des postes, pas un développeur) doit toujours savoir où il se trouve, ce qu'il doit faire, et si son action a réussi. L'interface ne doit jamais laisser planer le doute.
3. **La modernité sobre** — c'est un remplacement d'un logiciel Windows XP de 2006. Le contraste doit être net (propre, actuel, respirant) sans pour autant verser dans l'esthétique « startup tech flashy ». Sobriété, pas austérité datée.

Le ton général : **un cabinet comptable moderne et bien organisé**, pas une banque d'affaires, pas une application ludique, pas un tableau de bord crypto.

---

## 2. Système de couleurs (règle 60/30/10)

### 2.1 Palette — mode clair

| Rôle | Usage (%) | Couleur | Valeur hex | Justification |
|---|---|---|---|---|
| **Primaire (60%)** | Fond général, surfaces principales, cartes | Vert postal profond désaturé | `#0F3D2E` (accent fort) / `#F4F7F5` (fond de page, dérivé très clair de la teinte primaire) | Le vert est la couleur historique de Paositra Malagasy — l'ancrage institutionnel est direct et immédiat pour l'utilisateur final. Désaturé et profond pour éviter tout effet « criard ». |
| **Complémentaire / texte (30%)** | Textes, bordures, surfaces secondaires | Gris ardoise | `#1E2530` (texte principal) / `#5B6472` (texte secondaire) / `#D8DDE3` (bordures, séparateurs) | Un gris à dominante bleu-ardoise (pas un gris neutre pur) pour rester cohérent avec la froideur institutionnelle du vert, sans jamais entrer en compétition avec lui. |
| **Accentuation (10%)** | Call-to-action, liens actifs, focus, badges d'état positif | Doré/ocre institutionnel | `#C9962C` | Rappelle la valeur (le timbre, la monnaie, le sceau officiel) sans tomber dans le jaune criard. Réservé strictement aux éléments qui appellent une action ou signalent un état important. |

Couleurs sémantiques (usage fonctionnel, indépendant du 60/30/10, à utiliser avec parcimonie) :
- **Succès / validé** : `#1C7C4E` (vert plus vif que le primaire, réservé aux confirmations)
- **Alerte / écart détecté** : `#B5451B` (brique, jamais un rouge pur agressif)
- **Information neutre** : `#2B6CA3` (bleu discret, pour badges informatifs uniquement)

### 2.2 Palette — mode sombre

Le mode sombre n'est **pas** une simple inversion automatique — les valeurs sont recalibrées pour garder le même équilibre perceptuel 60/30/10 sans jamais produire de noir pur ni de blanc pur (fatigue visuelle, aspect « écran cassé »).

| Rôle | Valeur hex |
|---|---|
| Fond de page (primaire, 60%) | `#101512` |
| Surface de carte / panneau | `#171D1A` |
| Texte principal (complémentaire, 30%) | `#E7EAE8` |
| Texte secondaire | `#9AA5A0` |
| Bordures / séparateurs | `#2A3330` |
| Accentuation (10%) | `#D9AD52` (doré légèrement éclairci pour rester lisible sur fond sombre) |
| Succès | `#3FA873` |
| Alerte | `#D96A3E` |
| Information | `#5A9BD1` |

**Règle impérative** : le vert primaire ne devient jamais un simple assombrissement algorithmique du vert clair — il a sa propre valeur calibrée (`#101512`, pas `#0F3D2E` avec une opacité réduite). Idem pour l'accentuation dorée. Toute génération automatique de mode sombre par inversion de luminosité est interdite.

### 2.3 Implémentation technique

- Les couleurs sont définies comme **variables CSS (custom properties)** dans `client/src/styles/globals.css`, jamais codées en dur dans les composants.
- Nommage sémantique, pas littéral : `--color-surface-primary`, `--color-text-secondary`, `--color-accent`, **pas** `--green-dark`, `--gray-500`.
- Tailwind est configuré pour consommer ces variables via `tailwind.config.ts` (extension du thème), pas via sa palette de couleurs par défaut (`slate`, `emerald`, etc. de Tailwind sont interdits en usage direct dans le code applicatif).
- Le changement de thème (clair/sombre) se fait via un attribut `data-theme` sur `<html>`, piloté par `ThemeContext`, avec persistance du choix utilisateur (stockage local).

---

## 3. Typographie

### 3.1 Interdiction explicite

**Interdit, sans exception** : Inter, Times New Roman, Arial, Helvetica par défaut du navigateur, Roboto par défaut sans justification. Ce sont les polices « invisibles » qui ne racontent rien du projet et signalent une absence de décision de design.

### 3.2 Choix retenu

- **Police de titres et d'interface (headings, boutons, labels de navigation)** : **Fraunces** (serif moderne à fort caractère, variable font). Elle apporte le sérieux et l'autorité institutionnelle attendue, tout en restant contemporaine (contrairement à un serif classique type Georgia).
- **Police de corps de texte et de données (tableaux, formulaires, valeurs chiffrées)** : **Public Sans** (sans-serif humaniste, conçue à l'origine pour des usages gouvernementaux — un choix cohérent avec la nature du projet, lisible à haute densité d'information).
- **Police tabulaire pour les montants** : Public Sans avec `font-variant-numeric: tabular-nums` systématiquement activé sur toute colonne de chiffres (montants, totaux) — impératif pour l'alignement visuel des colonnes comptables. Ne jamais laisser des chiffres proportionnels dans un tableau de montants.

### 3.3 Règles d'usage

- Hiérarchie typographique stricte à 5 niveaux maximum : Titre de page, Titre de section, Sous-titre/label de groupe, Corps de texte, Texte auxiliaire (légendes, aides). Ne pas inventer de niveaux intermédiaires au cas par cas.
- Aucun texte en majuscules intégrales pour des phrases ou labels longs (acceptable uniquement pour des badges courts de 1 à 2 mots, ex. « CLÔTURÉ », « EN ATTENTE »).
- Taille de base : 16px minimum pour tout texte de formulaire ou de donnée à lire attentivement — ce logiciel sera utilisé toute une journée de travail par des receveurs, la fatigue visuelle est un critère réel, pas cosmétique.
- Line-height généreux sur le corps de texte (1.5 minimum) — jamais de texte compressé pour « gagner de la place ».

---

## 4. Mise en page et composants

### 4.1 Principes de layout

- **Layout applicatif classique à trois zones** : barre latérale de navigation (persistante, jamais masquée par défaut sur desktop), en-tête contextuel (fil d'Ariane + actions de la page), zone de contenu principale. C'est un outil de travail quotidien, pas un site vitrine — la prévisibilité de la navigation prime sur toute créativité de mise en page.
- **Densité d'information assumée mais respirante** : les tableaux de saisie comptable contiennent beaucoup de lignes — accepter cette densité (ne pas forcer des cartes aérées façon landing page pour des données tabulaires) tout en gardant un espacement interne cohérent (padding constant, jamais de lignes collées).
- **Une seule colonne de contenu principal par écran de saisie.** Ne pas juxtaposer plusieurs formulaires indépendants côte à côte sur le même écran — un contexte de saisie à la fois, avec navigation claire vers le suivant (section A → B → C...).
- **Feedback d'état systématique** : tout chargement a un état de chargement visible (skeleton ou spinner discret, jamais un écran figé), toute erreur a un message explicite et actionnable, toute réussite a une confirmation visuelle claire (pas seulement un toast qui disparaît en 2 secondes pour une action importante comme une clôture de période).

### 4.2 Composants — comportement attendu

- **Formulaires de saisie comptable** : validation en temps réel champ par champ (pas seulement à la soumission), calculs de totaux réactifs et visibles en permanence (pas relégués en bas de page hors du champ de vision pendant la saisie).
- **Tableaux de données** : en-têtes de colonnes toujours visibles au scroll (sticky header), tri cliquable sur les colonnes pertinentes, alignement à droite systématique pour toute colonne numérique/montant.
- **États vides** : jamais un espace gris vide sans explication (défaut identifié et à corriger explicitement par rapport à l'application legacy, qui affichait une zone grise vide sans aucun message). Tout état vide doit expliquer pourquoi c'est vide et proposer une action si pertinent.
- **Boutons** : hiérarchie visuelle claire entre action primaire (une seule par écran, couleur d'accentuation), actions secondaires (contour ou fond neutre), et actions destructrices (couleur d'alerte, jamais l'accentuation dorée).
- **Badges de statut** (période clôturée/ouverte, écart détecté/résolu) : couleur sémantique + libellé texte systématique. Ne jamais coder une information uniquement par la couleur (accessibilité).

### 4.3 Responsive

- Le cœur d'usage est desktop (poste de travail en bureau de poste), mais l'application doit rester utilisable en tablette pour les inspecteurs en déplacement. Mobile téléphone : consultation seulement (dashboard, lecture), pas de saisie complète de G58 attendue sur petit écran dans le périmètre initial.

---

## 5. Animations et transitions

### 5.1 Philosophie

Les animations servent exclusivement à **clarifier un changement d'état**, jamais à décorer. Une administration financière n'est pas un terrain d'expression créative en matière de mouvement — chaque animation doit répondre à la question « qu'est-ce que ça aide l'utilisateur à comprendre ? ».

### 5.2 Règles

- Durée courte et cohérente : 150-200ms pour les micro-interactions (survol, focus, ouverture de menu), 250-300ms maximum pour les transitions de page ou l'apparition de panneaux.
- Easing : `ease-out` pour les apparitions, `ease-in` pour les disparitions — jamais de rebond (`bounce`), de ressort exagéré ou d'effet ludique.
- Les changements de valeur dans les totaux calculés en temps réel peuvent avoir une transition douce (fondu ou léger changement de couleur momentané) pour signaler visuellement qu'un recalcul vient d'avoir lieu — c'est fonctionnel, pas décoratif.
- Aucune animation d'entrée systématique sur le chargement de page (pas de fade-in général de toute la page, pas d'éléments qui « glissent » un par un à l'ouverture d'un tableau).

---

## 6. Interdictions explicites (anti-patterns)

Ces règles sont non négociables et s'appliquent quel que soit l'avis ponctuel de l'agent ou de l'utilisateur sur un écran donné en cours de conception. Si une de ces règles semble bloquante pour un cas précis, la question doit être posée à l'utilisateur — ne jamais la contourner silencieusement.

1. **Polices génériques interdites** : Inter, Times New Roman, Arial, Helvetica, Roboto par défaut. Voir section 3.
2. **Esthétique néon interdite** : pas de couleurs saturées fluorescentes, pas d'effets de lueur (`glow`/`box-shadow` coloré diffus), pas de dégradés multicolores agressifs. La palette définie en section 2 est fermée.
3. **Superposition d'éléments interdite** : pas d'éléments qui se chevauchent visuellement de façon non intentionnelle (cartes empilées avec ombre façon « pile de papiers » décorative, éléments qui débordent les uns sur les autres pour un effet de profondeur artificiel). La hiérarchie visuelle se fait par la couleur, la taille et l'espacement — pas par la superposition.
4. **Sections « Hero » centrées interdites** : ce n'est pas un site vitrine. Aucun écran de l'application ne doit avoir de grand bloc centré avec titre géant + sous-titre + bouton, façon landing page marketing. Tout écran commence par un contexte de travail (fil d'Ariane, titre de page aligné à gauche, actions).
5. **Métriques arbitraires interdites** : ne jamais afficher de chiffre décoratif non justifié par une donnée réelle (ex. pas de « +99% de satisfaction » ou de compteurs animés cosmétiques). Toute métrique affichée dans un dashboard doit être une donnée réelle et vérifiable issue de la base.
6. **Esthétique « IA » interdite** : pas de dégradés violet/bleu génériques façon « produit IA générique de 2024 », pas d'icônes d'étincelles/sparkles comme ornement, pas de glassmorphism par défaut non justifié. Rien dans l'interface ne doit laisser penser que l'app a été stylée par un thème par défaut de générateur IA.
7. **Pas de composant de bibliothèque UI utilisé sans restyling.** Si une librairie de composants est utilisée en base technique, ses styles par défaut (couleurs, ombres, rayons de bordure) doivent être surchargés pour se conformer à ce document — jamais laissés tels quels « pour aller vite ».

---

## 7. Iconographie

- Une seule bibliothèque d'icônes dans tout le projet (Lucide recommandé — cohérent avec un usage React/Tailwind moderne, trait fin cohérent avec la sobriété institutionnelle voulue).
- Poids de trait cohérent partout, pas de mélange d'icônes outline et filled sans règle claire (filled réservé aux états actifs/sélectionnés uniquement).
- Pas d'emoji dans l'interface applicative (acceptable uniquement dans des contextes très ponctuels validés explicitement par l'utilisateur, jamais par défaut).

---

## 8. Accessibilité (non négociable pour un outil d'administration publique)

- Contraste minimum AA (WCAG 2.1) sur tout texte, dans les deux thèmes clair et sombre — à vérifier explicitement pour la couleur d'accentuation dorée sur fond clair, qui est la plus à risque de la palette.
- Toute action réalisable à la souris doit être réalisable au clavier (navigation formulaire, validation, annulation).
- Les messages d'erreur de formulaire sont associés programmatiquement à leur champ (pas seulement une couleur de bordure rouge).
