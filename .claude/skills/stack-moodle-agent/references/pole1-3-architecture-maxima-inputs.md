# PÔLE 1 : Architecture Générale et Intégrité XML

## 1.1. Structure des couches et Isolation
Trois couches indépendantes : `<questionvariables>` (Maxima), `<input>`/`<prt>` (Notation), `<questiontext>` (Vue).
- **CONTEXTE MAINTENANCE (JSXGraph/Oscilloscope)** : le code généré NE DOIT PAS inclure `<input>`, `<prt>`, ou `<questionvariables>`. Seul le contenu de `<questiontext>` est modifié.
- **CONTEXTE CRÉATION/REFONTE** : XML complet et valide.
  - INTERDIT : syntaxe inline `{@variable@}` pour créer une zone de saisie.
  - OBLIGATOIRE : `[[input:nom]]` et `[[validation:nom]]`.

## 1.2. Hiérarchie des balises
- `<input>` et `<prt>` doivent être enfants directs de `<question>` (jamais `<inputs>`/`<prts>` englobantes).
- `<stackversion>` obligatoire et **JAMAIS vide** (ex: `<text>2024092500</text>`) — ALERT FATAL sinon.
- INTERDIT : balises d'ancienne génération (`<responseprocessors>`, `<ansTestOptions>` vide).
- **ALERT FATAL Structure PRT (`<nodes>`)** :
  - 1 seul nœud → `<node>` enfant direct de `<prt>` (PAS de `<nodes>` englobante, sinon "The PRT [nom] is malformed").
  - Plusieurs nœuds → tous regroupés dans une unique `<nodes>` parente.
- `<specificfeedback>` avec `[[feedback:nom_prt]]` **OBLIGATOIRE** dès qu'il y a un PRT (sinon score/feedback invisiblement inactifs). Respecte la règle CDATA du 1.3.

## 1.3. Règle Universelle d'Encapsulation CDATA
- Tous les blocs de code (Maxima, HTML, JS) dans `<text>` DOIVENT être en `<![CDATA[ ... ]]>`.
- ALERT FATAL : `<`, `>`, `<=`, `>=`, `&` sans CDATA → `XML_ERR_NAME_REQUIRED`.
- **ALERT FATAL Anti-corruption PRT** : dans `<specificfeedback>`, il faut un espace après la balise Moodle de feedback mais AVANT la fermeture du CDATA.
  - ❌ `<![CDATA[[[feedback:prt1]] ]]>` avec espace DANS les crochets → "Mismatched tag"
  - ❌ `<![CDATA[[[feedback:prt1]]]>` (séquence `]]]>`) → corruption silencieuse
  - ✅ `<![CDATA[[[feedback:prt1]] ]]>` (espace ENTRE la balise et la fermeture CDATA)
- **ALERT FATAL Générateurs WYSIWYG** (TinyMCE, Angular/React) : purger `data-path-to-node`, `ng-content`, `cls-xxx` ; convertir `&lt;`/`&gt;` en CDATA brut.

## 1.4. Séparation stricte des Contextes d'Évaluation (piège des '@')
- **Contexte 1 — Évaluateur Maxima** (`<sans>`, `<tans>`, `<truescore>`, `<falsescore>`, `<truepenalty>`, `<feedbackvariables>`) : code Maxima pur.
  - INTERDIT FATAL : `{@variable@}` ici (ex: `<truescore>{@note_finale@}</truescore>` → score nul).
  - OBLIGATOIRE : nom brut, ex `<truescore><![CDATA[note_finale]]></truescore>`.
- **Contexte 2 — Rendu HTML/Moodle** (`<truefeedback>`, `<falsefeedback>`, `<questiontext>`, `<generalfeedback>`) : parsé par les filtres Moodle.
  - OBLIGATOIRE : `{@variable@}` ici, ex `<text><![CDATA[{@fb_html@}]]></text>`.

---

# PÔLE 2 : Syntaxe Maxima et Calculs (Moteur CAS)

## 2.1. Anti-Timeout & Anti-Fonctions Obscures
- INTERDIT : `integer_to_binary` et fonctions de conversion de base non garanties (timeout CAS).
- INTERDIT : fonctions d'affichage non standards (`nonsimplification`, `dispform` complexe).
- OBLIGATOIRE : conversions de base via opérateurs de base (`mod`, `floor`, `concat`).
- ALERT LOGS : chaque instruction dans `<questionvariables>` termine par `$`, JAMAIS `;` (le `;` pollue les logs Moodle).

## 2.2. Séparation Affichage (HTML) vs Calcul
- INTERDIT : forcer l'affichage dans `<questionvariables>` (jamais `'` pour figer, jamais `texput` sur expression composée).
- INTERDIT (obfuscation) : `sconcat(ascii(77), ...)` pour des strings — utiliser directement `ta_mot: "MILIEU"$`.
- OBLIGATOIRE : objets purs en variables (`za: 3+%i$`), affichage HTML/LaTeX dans `<questiontext>` (`\( z_A = ({@za@}) \)`).
- OBLIGATOIRE (ré-encapsulation MathJax) : variable string LaTeX injectée dans `<th>/<td>/<span>` → l'envelopper `\( \)` dans le HTML.
- OBLIGATOIRE (signes) : ne jamais laisser `+ -` se concaténer (`2x + -3y`) → `if` Maxima dans `sconcat` pour remplacer par `- `.
- **Pattern de Découplage Parallèle** (quand `{@var@}` rend mal, ex `Rightarrow` au lieu de `\to`) :
  - Tableau d'affichage LaTeX brut : `disp_pair : ["P \\to Q", "\\neg P \\lor Q"]$`
  - Tableau parallèle d'évaluation CAS : `eval_pair : [P implies Q, not(P) or Q]$`
  - Un seul index `idx` tiré, appliqué aux deux tableaux.
  - Déréférencement Vue : `{@nom_tableau[index]@}`.
  - Booléens vers HTML : jamais concaténer `true`/`false` bruts → `if var_bool then 1 else 0`.
  - Échappement LaTeX : antislash doublé `\\neg` dans le Maxima pour que Moodle reçoive `\neg`.

## 2.3. Génération Constructive (Anti-Cas Impossibles)
- INTERDIT : tirer des coefficients au hasard en espérant des racines entières/réelles.
- OBLIGATOIRE : tirer les racines d'abord, construire l'expression autour (`expr: k*(x-racine1)*(x-racine2)`).
- OBLIGATOIRE (TVI/dichotomie) : tirer la solution cible α en décimal propre, calculer les constantes à l'envers pour forcer f(α)=0.

## 2.4. Ensembles Maxima `{}` pour tuples non ordonnés
- OBLIGATOIRE : notation `{}` (pas `[]`) pour réponses où l'ordre n'importe pas (`ta_ab: {a,b}$`) + `syntaxhint` assorti.
- OBLIGATOIRE (porte OU multi-réponses) : `ta: {rep1, rep2}$` — `AlgEquiv` valide si ça matche n'importe quel élément.

## 2.5. Forçage de Propriété par Restreint Aléatoire
- INTERDIT : laisser le hasard générer un contre-exemple à une propriété attendue.
- OBLIGATOIRE : restreindre le tirage (`k: rand([1,2,3])$` pour garantir k>0).

## 2.6. Garantir la Distinction Aléatoire (boucle while)
- OBLIGATOIRE pour 2 éléments distincts : `a: rand([...])$ b: rand([...])$ while a=b do b: rand([...])$`
- ALERT TIMEOUT : pool ≥ 6 éléments pour tirer 2 distincts.

## 2.7. Forçage de simplification pour l'Affichage
- `ta_eval` (calcul brut, utilisé UNIQUEMENT dans `<tans>`) vs `ta_disp: ev(ta_eval, simp)$` (affichage uniquement).
- INTERDIT : `ev(...,simp)`/`ratsimp()` sur la variable d'évaluation si forme développée acceptée.
- INTERDIT : variables mortes non utilisées dans PRT ou affichage.
- **Pattern "Squelette de Calcul"** : pré-calculer chaque sous-étape (`p1`, `S1`, ...) pour double usage : construire la variable finale ET les injecter individuellement dans `<generalfeedback>` via `{@p1@}`.

## 2.8. Décimales et Formatage Statistique
- OBLIGATOIRE : `rand(10^n)/10^n` pour n décimales exactes.
- OBLIGATOIRE : `simplode(liste, " ; ")` pour affichage FR d'une série statistique (pas de virgules Maxima natives).

## 2.9. Redéfinition Locale de Fonctions (Anti-dépendance externe)
- INTERDIT : `load("fichier.mac")` si réécrivable simplement.
- OBLIGATOIRE : redéfinir localement avec `:=` (ex: `mean(L) := apply("+", L)/length(L)$`).
- OBLIGATOIRE : `ri(a,b) := a + rand(b-a+1)$` pour tirage inclusif [a,b].
- OBLIGATOIRE : `rnz(a,b) := block([v], v: ri(a,b), if v=0 then rnz(a,b) else v)$` pour exclure 0 (jamais de `while` en aval).
- OBLIGATOIRE (Levenshtein) : redéfinir localement, en O(n) mémoire (deux listes 1D `prev`/`curr`, JAMAIS matrice 2D complète).
- OBLIGATOIRE : garde-fou de longueur (`if slength(s)>30 then return(100)`) anti-timeout.
- OBLIGATOIRE : `stack_validate(chaine, type_attendu)` avant tout `ev(expr, student_string)`, ou tests de chaîne exclusivement (String/StringSloppy).

---

# PÔLE 3 : Règles d'Inputs et de Validation (Saisie élève)

## 3.1. Cohérence sémantique
- `<forbidfloat>0</forbidfloat>` si le résultat peut être décimal.
- `<forbidfloat>1</forbidfloat>` OBLIGATOIRE si le résultat est garanti entier pur.
- RegExp : `<tans>` encapsulé en guillemets doubles (ex: `"^[01]+$"`).
- Constante symbolique (ex `+ k`) dans `<tans>` → l'ajouter dans `<allowwords>` de l'input (sinon "Variable inconnue").

## 3.2. Configuration "Quartet" Algébrique
- **Transformation stricte d'expression** (développer/factoriser/réduire) → Quartet ACTIVÉ :
  `<insertstars>0</insertstars>`, `<checkanswertype>1</checkanswertype>`, `<mustverify>1</mustverify>`, `<showvalidation>2</showvalidation>`.
- **EXCEPTION — objets non-algébriques ou finis** (ensemble, matrice, nombre final) → Quartet DÉSACTIVÉ :
  `insertstars=0`, `checkanswertype=0`, `mustverify=0`, `showvalidation=0`.

## 3.3. Configuration Numérique (Tolérance)
- Décimal avec tolérance : type `numerical`, `<forbidfloat>0</forbidfloat>`.
- INTERDIT : `AlgEquiv` sur des flottants → utiliser `NumRelative`/`NumAbsolute` + `<testoptions>` (ex `0.01`).
- **EXCEPTION — entier strict dans un champ numérique** : si `ta` est garanti entier (via `ri(a,b)`) malgré `forbidfloat=0` → utiliser `AlgEquiv` (pas `NumRelative`, qui accepterait `14.99` pour `15`).
- **Midpoint pour l'arrondi** : `<testoptions>` = moitié de la précision demandée (ex `0.005` ou `0.015` pour 10⁻²), jamais la tolérance stricte.
- Arrondi côté prof : `ta: round(float(expr*100)/100)$`.
- **Forçage flottant dans le Tans** : si `ta` peut tomber sur un entier (ex variance=0) et `forbidfloat=0` → caster `<tans>1.0*ta_var</tans>` ou `float()` (sinon `2.0` rejeté si `ta=2`).
- **EXCEPTION — Validation d'Encadrement** (borne, pas valeur cible) : `<feedbackvariables>` avec prédicat booléen (`test: ans_inf<=alpha and alpha-ans_inf<=0.01$`), nœud PRT `AlgEquiv` contre `true`.

## 3.4. Configuration "Texte Brut" (type `string`)
- Quartet intégralement DÉSACTIVÉ.
- Cast de sécurité si traitement de chaîne : `if stringp(var)=false then var:string(var)$`.
- Mot exact → test `String` (casse/espaces comptent) ou `StringSloppy` (recommandé mots croisés).
- INTERDIT : `AlgEquiv` sur un `string` (erreur fatale CAS ou comparaison aléatoire).
- Isolation d'évaluation : feedback via `{@fb_html@}` (couche HTML) mais score via nom brut `note_finale` (couche Maxima).

## 3.5. Rendu DOM des Inputs et Type "Equiv"
- `[[input:ans1]]` génère toujours un `<span>` englobant → casse le `display:flex`. OBLIGATOIRE : `<cssclasses>` plutôt que d'englober dans des divs flex.
- Type `equiv` (logique 3 états Vrai/Faux/Je ne sais pas) : `ta` avec `true`/`false`/`unknown` natifs Maxima ; PRT test `Equiv` (⚠️ voir Annexe 3 — ce test est en LISTE NOIRE hors de ce contexte précis) avec `<testoptions>unknown</testoptions>`.
