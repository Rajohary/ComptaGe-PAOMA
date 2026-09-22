# Glossaire métier — ComptaGeWeb / Paositra Malagasy

> Document de référence pour comprendre le vocabulaire métier utilisé dans le projet **ComptaGeWeb**, notamment autour de la gestion comptable des bureaux de poste et du journal **G58**.
>
> **Important :** les définitions ci-dessous sont adaptées au contexte décrit dans le cahier des charges (CDC) du projet. Elles ne doivent pas être interprétées comme des définitions comptables générales lorsque le CDC donne une règle spécifique.

---

## 1. Receveur

Le **receveur** est le responsable légal et comptable d'un bureau de poste.

Dans ComptaGe, il est notamment responsable de :

- gérer la période de gestion de son bureau ;
- ouvrir et clôturer une période de gestion ;
- saisir ou faire contrôler les inventaires de départ ;
- suivre les mouvements comptables du bureau ;
- valider la fin de mois et la clôture de la gestion.

L'ouverture d'une période de gestion concerne un bureau existant et nécessite notamment les informations d'inventaire de départ : espèces, valeurs postales et timbres fiscaux.

### Exemple

Le receveur du bureau `B001` ouvre la période de gestion du mois. Il doit enregistrer les valeurs présentes au début de cette période avant de commencer le suivi des opérations.

---

## 2. Bureau

Le **bureau** désigne le bureau de poste auquel sont rattachées les opérations comptables.

Dans le système, chaque mouvement comptable est associé à un bureau à l'aide de son **code codique**.

Le bureau est donc une notion essentielle pour :

- rattacher les opérations au bon lieu ;
- déterminer la période de gestion concernée ;
- contrôler les droits des utilisateurs ;
- produire les états comptables d'un bureau.

### Exemple

Une opération effectuée au bureau ayant le code `B001` doit être enregistrée avec la référence de ce bureau.

---

## 3. Période de gestion

La **période de gestion** représente l'intervalle pendant lequel un receveur gère comptablement un bureau.

Elle possède notamment :

- une date de début ;
- une date de fin ;
- un receveur responsable ;
- un bureau concerné ;
- un état indiquant si la gestion est encore ouverte ou clôturée ;
- les valeurs initiales servant de base à la gestion.

Dans le CDC, une période est considérée comme :

- `coupure = 0` → période en cours ;
- `coupure = 1` → période clôturée.

Une opération comptable doit être rattachée à une période de gestion active et non clôturée.

### Exemple

Si une période va du 1er septembre au 30 septembre, une opération du 15 septembre peut y être rattachée si la période est encore ouverte.

---

## 4. G58

Le **G58** est le **journal/bordereau comptable** central du projet ComptaGe.

Il sert à enregistrer les opérations comptables quotidiennes d'un bureau de poste sous forme de **débits et de crédits**.

Dans le système, les opérations du G58 sont notamment rattachées à :

- un bureau ;
- une période de gestion ;
- un produit ou service postal ;
- un sens comptable : débit ou crédit ;
- une date ;
- un montant.

Le G58 constitue donc l'un des éléments principaux à comprendre avant de développer le projet.

### Exemple

Un agent enregistre une opération liée à un produit postal. Le système doit conserver le bureau, la période de gestion, le sens de l'opération et son montant afin que l'opération puisse être retrouvée dans les états G58.

---

## 5. Débit

Dans ComptaGe, le **débit** correspond à l'un des deux sens possibles d'une écriture comptable.

Le CDC identifie le sens avec :

- `1 = Débit`
- `2 = Crédit`

Le débit n'est donc pas simplement un texte affiché à l'utilisateur : c'est une information utilisée pour classer et calculer les mouvements comptables.

### Exemple

Une opération enregistrée avec `idSens = 1` est considérée comme une opération au **débit**.

---

## 6. Crédit

Le **crédit** est l'autre sens possible d'une écriture comptable dans le G58.

Dans le modèle décrit par le CDC :

- `1 = Débit`
- `2 = Crédit`

Les débits et les crédits sont ensuite utilisés dans les calculs et les états comptables.

### Exemple

Une opération enregistrée avec `idSens = 2` est considérée comme une opération au **crédit**.

---

## 7. Encaisse

L'**encaisse** représente les flux et les éléments physiques ou monétaires suivis par le bureau.

Dans le projet, le suivi de l'encaisse concerne notamment :

- les billets et pièces / trésorerie ;
- les stocks de timbres ;
- certaines valeurs postales ;
- les avances ou créances selon les catégories prévues par le système.

Le CDC décrit un journal spécifique des mouvements d'encaisse et de coffre.

Une règle importante est le contrôle de cohérence entre les mouvements comptables et la variation d'encaisse constatée.

### Exemple

Si les opérations enregistrées indiquent une variation d'argent qui ne correspond pas à l'encaisse réellement constatée, le système doit permettre de détecter cet écart pour contrôle.

---

## 8. Redressement

Un **redressement** est une correction comptable effectuée après contrôle lorsqu'une opération initialement enregistrée doit être ajustée.

Dans ComptaGe, le redressement est associé au travail de l'**inspecteur/auditeur**.

Lorsqu'un redressement est appliqué, le motif doit être renseigné afin d'expliquer pourquoi la valeur initiale est modifiée.

Le CDC cite notamment comme exemples de motifs :

- erreur de saisie au guichet ;
- manquant de caisse ;
- fausse déclaration.

### Exemple

Un mouvement a été déclaré à `100 000 MGA`, mais le contrôle montre qu'il doit être corrigé à `95 000 MGA`. L'inspecteur peut appliquer une diminution de `5 000 MGA` et enregistrer le motif du redressement.

---

## 9. Montant

Le **montant** (`Montant`) est la valeur initialement déclarée pour une opération comptable.

Dans le modèle du projet, il correspond au **montant nominal de l'opération**, exprimé en Ariary (MGA).

Il faut distinguer :

- `Montant` → valeur initialement déclarée ;
- `MontantRectif` → valeur finale après contrôle/rectification.

### Exemple

Une opération est saisie pour :

`Montant = 100 000 MGA`

Cette valeur reste le montant initial déclaré, même si l'opération est ensuite corrigée.

---

## 10. Montant rectifié

Le **MontantRectif** est le montant final retenu après contrôle ou audit.

Lors de la création d'une opération, le CDC indique que :

`MontantRectif = Montant`

Si aucun redressement n'est effectué, les deux valeurs restent donc identiques.

Lorsqu'une correction est effectuée, le montant rectifié devient différent du montant initial.

La règle fondamentale du projet est :

```text
MontantRectif = Montant + Augmentation - Diminution
```

### Exemple

Montant initial :

```text
Montant = 100 000 MGA
```

L'audit constate une diminution de :

```text
Diminution = 5 000 MGA
```

Alors :

```text
MontantRectif = 100 000 + 0 - 5 000
              = 95 000 MGA
```

---

## 11. Augmentation

L'**augmentation** représente un ajustement positif appliqué au montant initial lors d'un redressement.

Elle sert donc à augmenter la valeur comptable finalement retenue.

Dans le CDC, l'augmentation est initialisée à `0` lors de la création d'une opération.

### Formule

```text
MontantRectif = Montant + Augmentation - Diminution
```

### Exemple

```text
Montant = 100 000 MGA
Augmentation = 10 000 MGA
Diminution = 0
```

Donc :

```text
MontantRectif = 100 000 + 10 000 - 0
              = 110 000 MGA
```

L'augmentation est une correction **à la hausse**.

---

## 12. Diminution

La **diminution** représente un ajustement négatif appliqué au montant initial lors d'un redressement.

Dans le CDC, elle est initialisée à `0` lors de la création d'une opération.

### Exemple

```text
Montant = 100 000 MGA
Augmentation = 0
Diminution = 15 000 MGA
```

Donc :

```text
MontantRectif = 100 000 + 0 - 15 000
              = 85 000 MGA
```

La diminution est donc une correction **à la baisse**.

> Remarque : le CDC utilise le champ `Dimunition` (avec cette orthographe) dans le modèle de données. Dans le code, il faut respecter le nom réellement défini dans l'architecture et le modèle de données du projet.

---

## 13. Audit

L'**audit** correspond au contrôle des écritures comptables afin de détecter les anomalies ou les écarts.

Dans ComptaGe, l'audit est principalement associé à l'**inspecteur/auditeur comptable**.

Le système dispose notamment d'une vue appelée **DIF** qui permet d'identifier les écritures pour lesquelles :

```text
Montant != MontantRectif
```

Ces écritures correspondent aux opérations ayant fait l'objet d'une différence après contrôle.

L'auditeur peut alors :

1. consulter les écritures présentant un écart ;
2. analyser l'opération ;
3. déterminer la correction nécessaire ;
4. renseigner une augmentation ou une diminution ;
5. renseigner le montant rectifié ;
6. saisir le motif du redressement.

### Exemple

Une opération présente :

```text
Montant       = 200 000 MGA
MontantRectif = 190 000 MGA
```

Le système détecte une différence de `10 000 MGA`.

L'auditeur doit alors examiner l'opération et documenter la correction conformément aux règles métier.

---

# 14. Comment tous ces concepts sont liés

Le plus important pour comprendre le projet est de ne pas apprendre ces mots séparément.

Le fonctionnement peut être résumé ainsi :

```text
BUREAU
   │
   └── géré par un RECEVEUR
          │
          └── ouvre une PÉRIODE DE GESTION
                    │
                    └── enregistre les opérations
                              │
                              └── G58
                                  │
                                  ├── Débit
                                  ├── Crédit
                                  └── Montant
                                        │
                                        ▼
                                  Contrôle / AUDIT
                                        │
                                        ▼
                                  Écart éventuel
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                    AUGMENTATION                  DIMINUTION
                          │                           │
                          └─────────────┬─────────────┘
                                        ▼
                                MONTANT RECTIFIÉ
                                        │
                                        ▼
                                  REDRESSEMENT
```

---

# 15. Exemple complet

Imaginons un bureau de poste géré par un receveur.

### Étape 1 — Bureau

Le bureau `B001` est le bureau concerné.

### Étape 2 — Période de gestion

Le receveur ouvre une période de gestion.

```text
Bureau : B001
Début  : 01/09
Fin    : 30/09
État   : En cours
```

### Étape 3 — Opération G58

Un agent saisit une opération :

```text
Sens    : Débit
Montant : 100 000 MGA
```

À la création :

```text
Montant       = 100 000
Augmentation  = 0
Diminution    = 0
MontantRectif = 100 000
```

### Étape 4 — Audit

L'inspecteur contrôle l'opération et constate une erreur de `5 000 MGA`.

Il décide d'une diminution :

```text
Diminution = 5 000 MGA
```

### Étape 5 — Calcul

Le système applique :

```text
MontantRectif = Montant + Augmentation - Diminution
```

Donc :

```text
MontantRectif = 100 000 + 0 - 5 000
              = 95 000 MGA
```

### Étape 6 — Motif

L'inspecteur doit enregistrer le motif du redressement.

Par exemple :

```text
Motif : Erreur de saisie au guichet
```

Le système peut alors conserver à la fois :

```text
Montant initial : 100 000 MGA
Montant rectifié:  95 000 MGA
Écart            :   5 000 MGA
Motif            : Erreur de saisie au guichet
```

Cela permet de garder la trace de la correction et de faciliter le contrôle.

---

# 16. Les relations à retenir pour le développement

Pour développer ComptaGeWeb, retenez surtout ces relations :

| Concept | Rôle dans le système |
|---|---|
| **Bureau** | Lieu comptable auquel les opérations sont rattachées |
| **Receveur** | Responsable du bureau et de sa gestion comptable |
| **Période de gestion** | Intervalle pendant lequel le bureau est géré comptablement |
| **G58** | Journal/bordereau des opérations comptables |
| **Débit** | Un des deux sens d'une écriture |
| **Crédit** | L'autre sens d'une écriture |
| **Encaisse** | Suivi des flux et valeurs physiques/monétaires |
| **Montant** | Valeur initialement déclarée |
| **Augmentation** | Correction positive |
| **Diminution** | Correction négative |
| **Montant rectifié** | Valeur finale après contrôle |
| **Redressement** | Action de correction d'une écriture |
| **Audit** | Contrôle permettant notamment de détecter et traiter les écarts |

---

# 17. Règles métier importantes pour les développeurs

Voici les règles du CDC qui sont particulièrement importantes lors du développement :

### Règle 1 — Une opération appartient à une période de gestion

Une opération G58 doit être rattachée à une période de gestion active et non clôturée.

### Règle 2 — Le montant rectifié commence avec le montant initial

À la création :

```text
MontantRectif = Montant
```

### Règle 3 — Augmentation et diminution commencent à zéro

À la création :

```text
Augmentation = 0
Diminution    = 0
```

### Règle 4 — Le montant rectifié suit une formule précise

```text
MontantRectif = Montant + Augmentation - Diminution
```

### Règle 5 — Un écart doit être détectable

Une opération est considérée comme présentant une différence lorsque :

```text
Montant != MontantRectif
```

La vue DIF sert notamment à faire ressortir ces écritures.

### Règle 6 — Un redressement doit être justifié

Lorsqu'un inspecteur applique un redressement, le **motif** doit être renseigné.

### Règle 7 — La clôture bloque les nouvelles saisies

Une période clôturée ne doit plus accepter les saisies ordinaires prévues avant clôture.

---

# 18. Questions à poser au responsable métier

Le CDC définit la structure générale, mais certains détails doivent être confirmés avec les responsables métier de Paositra Malagasy avant de les transformer en règles techniques.

Par exemple :

- Quelle est exactement la signification métier de chaque rubrique G58 ?
- Comment les sections A, B, C, D et E sont-elles utilisées dans la pratique ?
- Quels produits/services appartiennent à chaque rubrique ?
- Comment le contrôle de l'encaisse est-il effectué concrètement ?
- Qui peut effectuer chaque type de correction ?
- Que se passe-t-il lorsqu'un montant est corrigé après clôture ?
- Quels états G58 doivent être imprimés ou exportés ?
- Quel est le processus réel de validation d'une période ?
- Quelles règles diffèrent entre un bureau, une province et la direction centrale ?

**Principe important : ne pas inventer ces règles dans le code.** Lorsqu'une règle métier n'est pas explicitement définie dans le CDC ou dans une procédure validée par Paositra Malagasy, elle doit être confirmée avant son implémentation.

---

## Source principale

Ce glossaire est basé sur le **Cahier des Charges de ComptaGe (CDC_ComptaGe.pdf)** fourni pour le projet, notamment les sections décrivant les profils métier, la période de gestion, le journal G58, les mouvements d'encaisse, l'audit et les champs `Montant`, `Augmentation`, `Dimunition` et `MontantRectif`.

