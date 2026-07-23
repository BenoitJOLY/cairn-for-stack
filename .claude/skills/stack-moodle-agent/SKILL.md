---
name: stack-moodle-questions
description: >
  Génère, corrige, débogue ou fait de la rétro-ingénierie sur des questions STACK pour
  Moodle (Maxima, XML, JSXGraph, Parsons, QCM, inéquations, unités, statistiques, etc.),
  et aide aussi à structurer l'application JS "StackForge" qui génère ce XML. Déclencher
  IMPÉRATIVEMENT dès que l'utilisateur mentionne STACK, Moodle question, PRT,
  questionvariables, CASText2, JSXGraph dans Moodle, Maxima pour une question, un input
  STACK, ou colle un XML de type question stack. Déclencher aussi pour toute demande de
  génération, refonte ou débogage de code XML Moodle, même formulée de façon informelle
  (par exemple "fais-moi une question sur les dérivées", "pourquoi mon PRT renvoie 0",
  "mon graphique JSXGraph ne s'affiche pas dans Moodle"). C'est la référence de
  conformité OBLIGATOIRE : zéro improvisation de syntaxe XML ou de fonction Maxima hors
  de ce qui est documenté ici.
---

# Générateur de Questions STACK Moodle

Ce skill encode un Document de Spécification Technique Unique (DSTU) construit sur des dizaines d'heures de débogage réel (timeouts CAS, crashs JSXGraph, corruption XML, erreurs de typage Maxima). C'est la référence de conformité **obligatoire** : aucune improvisation de balise XML ou de fonction Maxima non documentée ici.

## Règle n°0 : zéro improvisation
Ne jamais inventer une syntaxe XML, une balise Moodle, ou une fonction Maxima absente de ce skill. En cas de besoin non couvert, le signaler explicitement à l'utilisateur plutôt que d'improviser une solution plausible mais non vérifiée.

## Étape 1 — Identifier le type de tâche

| Demande de l'utilisateur | Action |
|---|---|
| Nouvelle question STACK classique (algébrique, numérique, texte, unités, inéquations...) | Partir de **Annexe 1** (`references/annexes-gabarits-answertests.md`), n'éditer QUE `<questiontext>`, `<questionvariables>`, `<specificfeedback>`, `<input>`, `<prt>`/`<node>` |
| Question Parsons Puzzle | Partir de **Annexe 2** du même fichier |
| Question avec JSXGraph (graphique interactif) | Lire aussi `pole5-6-frontend-jsxgraph.md` **et** `jsxgraph-subtleties-oscilloscope.md` avant de coder |
| Maintenance d'un JSXGraph existant | Ne modifier QUE le contenu de `<questiontext>` — jamais `<input>`, `<prt>`, `<questionvariables>` (Pôle 1.1) |
| Débogage d'un XML/PRT/JS existant collé par l'utilisateur | Analyser contre les 6 pôles + Annexe 3 (answertests), identifier la règle violée, corriger en gardant le gabarit intact |
| Rétro-ingénierie ("voici ma solution finale qui marche, extrais les subtilités") | Comparer le code contre les 6 pôles, lister les écarts/règles implicites non documentées, proposer un ajout au DSTU (ne pas modifier les fichiers de référence sans validation utilisateur — proposer le texte à ajouter) |
| Structurer/refactorer l'application JS StackForge (générateur no-code) | Lire `stackforge-app-architecture.md`, appliquer les Lois 1 & 2, ne jamais réécrire `generateStackXML()` |

## Étape 2 — Charger les références pertinentes

Ne pas tout charger systématiquement — cibler selon la typologie identifiée :

- **Toujours** pour une génération/débogage de question : `pole1-3-architecture-maxima-inputs.md` (structure XML, CDATA, Maxima, inputs) et `annexes-gabarits-answertests.md` (gabarit + liste blanche/noire des tests).
- **Si la question correspond à une "recette" du Pôle 4** (QCM, Parsons, unités, inéquations, cascade diagnostique, statistiques, matrice, Levenshtein, mots croisés, primitives, encadrements...) : `pole4-typologies.md`, section correspondante.
- **Si JSXGraph/JS/sandbox STACK-JS/Canvas est impliqué** : `pole5-6-frontend-jsxgraph.md` + `jsxgraph-subtleties-oscilloscope.md`.
- **Si la tâche porte sur l'appli JS elle-même** (pas une question isolée) : `stackforge-app-architecture.md`.

## Étape 3 — Générer

1. Copier le gabarit XML exact de l'Annexe 1 ou 2 (jamais réécrire les balises générales : `<defaultgrade>`, `<penalty>`, `<hidden>`, `<idnumber>`, etc.).
2. Remplir `<questionvariables>` en respectant scrupuleusement le Pôle 2 (terminaison `$`, jamais `;` ; `sconcat()` jamais `concat()` ; une instruction par ligne ; pattern de génération constructive ; conventions `err_`/`ta_`).
3. Choisir le/les `<answertest>` exclusivement dans la Liste Blanche de l'Annexe 3. Ne jamais utiliser un test de la Liste Noire (`Equiv`, `EquivFirst`, `Sausages`, `CasEqual`, `Antidiff`, `Validator`...) — **exception à signaler** : si la question est de type input `equiv` (Pôle 3.5), avertir l'utilisateur de la contradiction interne au DSTU avant de trancher.
4. Appliquer la configuration d'input adaptée (Quartet Algébrique activé/désactivé selon Pôle 3.2, `forbidfloat` selon Pôle 3.1/3.3).
5. Construire le PRT en respectant la hiérarchie `<node>`/`<nodes>` (Pôle 1.2) et la séparation Maxima/HTML des balises (Pôle 1.4).
6. Vérifier la checklist ALERT FATAL avant de livrer (Étape 4).

## Étape 4 — Checklist ALERT FATAL avant de livrer le XML

- [ ] `<stackversion>` jamais vide.
- [ ] 1 seul nœud PRT → pas de `<nodes>` englobante ; plusieurs nœuds → tous dans `<nodes>`.
- [ ] `<specificfeedback>` avec `[[feedback:prt_name]]` présent si un PRT existe.
- [ ] Espace avant `]]>` dans `<specificfeedback>` (jamais dans les crochets `[[...]]`, jamais la séquence `]]]>`).
- [ ] Aucune variable morte (`err_...` ou intermédiaire non appelée en `<tans>` ou en affichage).
- [ ] Chaque `err_...` du dictionnaire d'erreurs est testée dans un nœud PRT.
- [ ] Cascade diagnostique : nœud Fallback final à score 0 et `<truenextnode>-1</truenextnode>`.
- [ ] Aucun test de la Liste Noire (Annexe 3) utilisé sans signalement explicite.
- [ ] Si JSXGraph : inputs/validation JAMAIS à l'intérieur du bloc `[[jsxgraph]]` ; `{#var#}` (pas `{@var@}`) dans le JS ; `create("text",...)` avec une fonction, jamais une chaîne littérale ; `bind_point(inputRef, point)` à 2 arguments avec `input-ref-`.
- [ ] Aucun commentaire HTML `<!-- -->` nulle part dans le texte de question (Pôle 6.6).

## Format de réponse

- Livrer le XML complet dans un bloc de code ```xml```, prêt à l'import Moodle.
- Une note technique courte peut suivre le bloc si nécessaire (règle appliquée, point de vigilance, contradiction DSTU à trancher) — jamais de longue explication non demandée.
- Pour la partie architecture appli JS (StackForge) : livrer les fichiers séparés `.view.js`/`.data.js`/`.controller.js` selon la Loi 1, avec le JSON de données consommé par `generateStackXML()`.

## Fichiers de référence

- `references/pole1-3-architecture-maxima-inputs.md` — Architecture XML, CDATA, Maxima, Inputs
- `references/pole4-typologies.md` — Les "recettes" par type de question
- `references/pole5-6-frontend-jsxgraph.md` — Front-end, sandbox STACK-JS, pont CAS/JS
- `references/annexes-gabarits-answertests.md` — Gabarits XML complets + liste blanche/noire des answertest
- `references/jsxgraph-subtleties-oscilloscope.md` — Pièges JSXGraph avancés + Manifeste Oscilloscope
- `references/stackforge-app-architecture.md` — Moteur XML verrouillé + Lois d'architecture de l'appli JS
