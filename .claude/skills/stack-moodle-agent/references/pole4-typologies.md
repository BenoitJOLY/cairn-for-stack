# PÔLE 4 : Typologies Spécifiques de Questions (Les "Recettes")

## 4.1. Inéquations
- INTERDIT : notation ensembliste `{x | x>3}`.
- OBLIGATOIRE : `and`/`or` (ex `x < x1 or x > x2`), + `and, or` dans `<allowwords>`.
- Génération : racines au hasard → coefficients (jamais l'inverse). Forcer x1 < x2 avant construction logique.
- Anticiper `err_sign` (inverser and/or de la réponse correcte).

## 4.2. Unités
- Isoler l'unité dans `<feedbackvariables>` :
```maxima
stud_si : stack_unit_si_to_si_base(ans_VOTRE_INPUT);
teach_si : VOTRE_VARIABLE_UNIT_ATTENDUE;
v_pure_e : subst(map(lambda([u], u=1), listofvars(stud_si)), stud_si);
v_pure_t : subst(map(lambda([u], u=1), listofvars(teach_si)), teach_si);
eleve_unit : 2 * stud_si / v_pure_e;
teacher_unit : 2 * teach_si / v_pure_t;
```
- Structure PRT : Nœud 0 `UnitsAbsolute` (eleve_unit/teacher_unit) → si Vrai → Nœud 1 `UnitsRelative` (ans_INPUT/VARIABLE_TA).

## 4.3. Parsons Puzzle
- Input type `parsons` (jamais `dragndrop`). `stack_include_contrib("prooflib.mac");` en 1ère ligne.
- Blocs : `[Identifiant, "Texte"]`. `ta` = `proof(...)`. Sans `proof()` → "Failed to connect".
- Évaluation : `parsons_decode`, `proof_flatten`, `elementp`.

## 4.4. Chaînage Logique avec Score Partiel
- INTERDIT : un seul nœud `AlgEquiv` pour une chaîne logique/transformation.
- Pattern Routeur : Nœud 0 = étape 1. Vrai→Nœud 1 (suite). Faux→nœuds diagnostiques.
- Pré-calculer l'étape précédente pour diagnostiquer un décalage (ex f' donné au lieu de f'').
- Feedback de Contradiction : rappeler la valeur validée au nœud N quand le nœud N+1 échoue.

## 4.5. QCM — ⚡ PIÈGES CONTEXTUELS (`ans1` change de nature selon le type d'input)

### A. Checkbox
- `flatten([ans1])` dans `<feedbackvariables>`.
- Score : théorie des ensembles (`setify`, `intersection`, `cardinality`), formule `(nb_bons - nb_mauvais)/total_bons`, bornée par `max(0, ...)`.
- Feedback : boucle `[[foreach item="nom_variable"]]{@item@}[[/foreach]]`, `[[if test="liste # []"]]` pour masquer liste vide.
- Pattern des Oublis : afficher 2 sections (cochées correctes/incorrectes en vert/rouge ; oublis en ambre) via `manques: listify(setdifference(setify(bons), setify(idx_coches)));`.
- Optimisation mapping (>10 items) : `assoc(id, map(lambda([x],[x[1],x[3]]), liste_complete))` — jamais de boucles `for` imbriquées.
- Generalfeedback en liste à puces : générer `<ul><li>` via `simplode` dans `<questionvariables>`, injecter via `{@variable@}`.

### B. Radio & Dropdown (même moteur, seule `<type>` change)
- `ans1` = valeur `[0]` de l'option choisie.
- **Cas 1 — ID sémantique** (`tans: [["convexe", true, "convexe"], ...]`) : `ans1` vaut `"convexe"`.
  - OBLIGATOIRE : test `String` direct (`<sans>ans1</sans>`, `<tans>"convexe"</tans>`).
  - INTERDIT : extraction complexe (`sublist`, `lambda`) dans ce cas.
- **Cas 2 — ID technique** (`tans: [["1", true, "Texte..."], ...]`) : `ans1` vaut `"1"`.
  - Extraction cible : `vid: first(first(sublist(ta, lambda([ex], second(ex)=true))))$`
  - Test `String` (pas `AlgEquiv`) : `<sans>ans1</sans>`, `<tans>vid</tans>`.
  - Centralisation feedback : `fb_texte: assoc(ans1, liste_feedback)$`, utilisé par `<truefeedback>`/`<falsefeedback>` avec habillage CSS conditionnel.

### C. Grille Vrai/Faux (radios multiples)
- Modèle 4 éléments : `["Énoncé", Booléen, "Explication Vrai", "Explication Faux"]`.
- 1 input radio par proposition (`ans1p01`), validations groupées dans `<div style="display:none">[[validation:...]]</div>`.
- Inversion Tans dynamique : `if second(ta[X]) then [[1,true,"Vrai"],[2,false,"Faux"]] else [[1,false,"Vrai"],[2,true,"Faux"]]`.
- `<options>nonotanswered</options>` obligatoire par input.
- Évaluation : `is(ansX = (if second(ta[X]) then 1 else 2))`.

## 4.6. Tableaux de Vérité / Grilles Multiples
- INTERDIT : un PRT par cellule.
- Agréger en liste dans `<feedbackvariables>` (`student_ans : [ans0, ans1, ...];`), comparaison globale `AlgEquiv` liste vs liste.
- Pré-calculer les pièges classiques en tableaux parallèles (`ta_inverse`, `ta_negation`).
- **Précision d'indexation** : `ans1` = ordre d'apparition de la 1ère balise `<input>` dans le XML, PAS son `<name>`. En cas de doute, nommer les variables par leur vrai nom (`student_ans : [cw1_3, cw1_4...]`).

## 4.7. Intégrales et Mesures Géométriques
- Pré-calculer une variable d'erreur de signe (`ta_err_sign: -ta_aire`).
- Nœud sibling testant `ta_err_sign` pour score partiel (ex 25%) + feedback "oubli de la valeur absolue".
- Condition d'affichage (courbe au-dessus/en-dessous) : JAMAIS évaluée en HTML — figée en variable string Maxima (`cond_sup: if g>f then ">" else "<"$`).
- Pré-calculer la "primitive non évaluée" (`ta_err_prim: F(x)$`) pour diagnostiquer un oubli de F(b)-F(a).
- Pré-calculer les erreurs de primitive partielle (terme oublié) pour micro-score (ex 0.25).

## 4.8. Anti-Pattern : test contre `false`
- INTERDIT : `AlgEquiv` avec `<tans>false</tans>` pour détecter une erreur algébrique — une expression valide mais fausse n'est jamais évaluée à `false` par Maxima, la branche Vraie ne se déclenche jamais.
- OBLIGATOIRE : pré-calculer la fausse formule exacte (ex `ta_err_missing_a: fp*x + ev(f, x=a)$`) et tester `AlgEquiv(ans, ta_err_missing_a)`.

## 4.9. Cascade Diagnostique (sans score partiel)
- Contexte : notation binaire, feedback hyper-ciblé sur l'erreur exacte.
- Dictionnaire d'erreurs en variables distinctes (respecter 4.8).
- **Convention lexicale** : erreurs préfixées `err_` + nom sémantique court (`err_trace`, `err_plus`). Réponses correctes préfixées `ta_` ou nom explicite. JAMAIS de noms génériques (`var1`, `calc1`).
- Structure : Nœud 0 = AlgEquiv vs correct (Vrai→max, fin). Sinon Nœud 1 vs err A, etc. Dernier nœud = Fallback générique.
- **ALERT FATAL Terminaison** : dernier nœud Fallback → score 0, `<truenextnode>-1</truenextnode>`, ne teste aucune erreur spécifique.
- INTERDIT : score > 0 dans la branche Fausse d'un nœud intermédiaire.
- Vérification croisée : toute variable `err_` DOIT être appelée en `<tans>` d'un nœud, sinon rejet.
- Variante Cascade Récompensée : micro-scores d'effort (0.25) autorisés sur calculs longs si erreur partielle démontre réussite d'une sous-tâche.

## 4.10. Encadrements / Intervalles de Confiance (TVI, dichotomie)
- Micro-tolérance machine (`tol: 0.001$`) ajoutée aux inégalités strictes.
- Validation en 3 temps : `test_inf`, `test_sup`, `test_amplitude`.
- Malus d'amplitude : `<truescoremode>-</truescoremode>` + `<falsescore>0.25</falsescore>` pour retirer des points sans remise à zéro.

## 4.11. Primitives
- INTERDIT : `AlgEquiv(ans_F, ta_F)` (la constante rend le test impossible).
- OBLIGATOIRE : validation par dérivation — `<sans>diff(ans_F, x)</sans>`, `<tans>f</tans>`, `AlgEquiv`.
- Paradoxe du "+k" : un élève qui oublie `+k` sera validé (mathématiquement correct, k=0).
- INTERDIT : nœud PRT "anti-oubli-de-k" après un nœud de validation par dérivation réussi (code mort, inatteignable).
- Exception (forçage absolu du +k) : abandonner la validation par dérivation, utiliser `SubstEquiv` ou `RegExp` — fragile, à éviter sauf exigence explicite.

## 4.12. Statistiques (Moyenne, Variance, Écart-Type)
- Cascade de la Trinité (Pôle 4.9) testant dans l'ordre : (1) écart-type au lieu de variance, (2) oubli de diviser par n, (3) formule biaisée n-1 au lieu de n.
- Réutiliser les fonctions locales redéfinies (Pôle 2.9) pour calculer les `ta_err_...`.

## 4.13. Déterminant de Matrice 2×2
- Génération via `ri(a,b)` (Pôle 2.9), matrice via `matrix()`.
- Dictionnaire d'erreurs obligatoire :
  1. `err_trace : a11 + a22$` (confusion avec trace)
  2. `err_plus : a11*a22 + a12*a21$` (signe : addition au lieu de soustraction)
  3. `err_oppose : a12*a21 - a11*a22$` (signe totalement inversé)
- Input `numerical`, `forbidfloat=1`, Quartet désactivé (3.2 exception), `AlgEquiv` (3.3 exception).
- Arbre : Nœud 0 correct → Nœud 1 err_trace → Nœud 2 err_plus → Nœud 3 err_oppose → Nœud 4 générique (formule ad-bc).

## 4.14. Réponse Textuelle Multiple avec Tolérance Orthographique (Levenshtein)
- Pipeline de normalisation dans `<feedbackvariables>` (PAS `<questionvariables>`, `ans1` n'existe pas encore) :
  1. `sdowncase(ans1)`
  2. `strim(" ", ...)`
  3. Nettoyage sémantique (`supprimer_articles`)
- Heuristique du Pluriel : algorithmique (détection "s" final sur mot >1 lettre), jamais dictionnaire durcodé. Isoler `plu_seul` (distance 0 sans le s) et `plu_f1` (distance 1 sans le s).
- Routage par paliers strict (évite conflit "miels" ~ "miel" distance globale 1) :
  Nœud 0 vide → Nœud 1 exact (d=0) → Nœud 2 `plu_seul` → Nœud 3 `plu_f1` → Nœud 4 distance globale=1 → Nœud 5 distance=2 → Nœud 6 fallback.
- Feedback enrichi HTML complet généré via `sconcat` dans `<feedbackvariables>`, injecté via `{@fb1@}`.
- Liste de mots acceptés : JAMAIS l'affichage natif Maxima (`[...]`) — boucle `for` + `sconcat` + séparateur `", "`.

## 4.15. Grilles de Mots Croisés (mots exacts)
- Inputs type `string`, Quartet intégralement désactivé.
- PRT minimaliste : 1 seul nœud par mot, test `StringSloppy` contre la variable prof.
- Synchronisation JS : le script ne valide JAMAIS lui-même, il écoute `input` et met à jour le DOM (`textContent`). Validation exclusivement dans les PRTs STACK.
