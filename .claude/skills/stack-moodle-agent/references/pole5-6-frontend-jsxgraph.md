# PÔLE 5 : Front-End, Affichage et Interactivité (HTML/JS/CSS)

## 5.1. Intégration HTML dynamique (Tableaux)
- Variable de lignes générée par `sconcat()` (`{@table_rows@}`) → injectée STRICTEMENT dans `<tbody>`.
- INTERDIT FORMEL : générer `<table>`, `<tbody>`, `<thead>` dans la variable Maxima — restent en dur dans `<questiontext>`.
- Chaque instruction des `<questionvariables>` sur sa propre ligne, terminée par `$`. INTERDIT d'empiler (`a:1$ b:2$` sur une ligne).

## 5.2. Spécificités JSXGraph (Oscilloscope)
- `functiongraph` : ajouter `numberPoints: 150` et `doAdvancedPlot: false`.
- INTERDIT (anti-boucle infinie) : `moveTo()`, `setPosition()`, ou modifier `.X()`/`.Y()` dans `bd.update()`.
- `bd.update()` réservé à la mise à jour textuelle (`textContent`). Curseurs : attribut `drag` à la création.
- Injection de variables : syntaxe `{#variable#}` (dièses) dans le bloc JS du `<questiontext>` — JAMAIS `{@variable@}` dans un `<script>`/bloc JS (évaluation au mauvais moment).
- Conteneur du graphe : `width`/`height` explicites en style inline ou classe CSS dédiée (sinon board 0px invisible).

## 5.3. Architecture STACK-JS et Isolation du Sandbox (ALERT FATAL)
- `[[javascript]]...[[/javascript]]` s'exécute dans une iframe sandboxée isolée, PAS le DOM principal Moodle.
- INTERDIT FATAL : `document.getElementById()`/`querySelector()` pour cibler un élément HTML de la question depuis `[[javascript]]` (cherche dans l'iframe vide → `null`).
- OBLIGATOIRE : IDs générés via `[[quid id="mon_element"/]]` (CASText2) pour tout élément Moodle ciblé par le JS.
- OBLIGATOIRE : communication via l'API `stack_js` asynchrone (Promises) :
  - Lecture : `let promise = stack_js.get_content('[[quid id="mon_element"/]]');`
  - Écriture : `stack_js.switch_content('[[quid id="cible"/]]', '<img src="..." />');`
- ALERT FATAL : `@@PLUGINFILE@@` NE FONCTIONNE PAS dans `[[javascript]]` (envoyé en chaîne littérale). Contournement : placer l'URL/Base64 dans un div caché `[[quid]]` HORS du bloc JS, lire via `stack_js.get_content()`.
- INTERDIT : `document.querySelector('[id$="_ans1"]')` pour lier un input — utiliser `stack_js.request_access_to_input('ans1')`.
- Débogage : `console.log()` inutile (logs iframe masqués) — utiliser `stack_js.display_error("message");`.

## 5.4. Interactions Graphiques (Canvas/SVG) et Sécurité CORS des ENT
- ALERT FATAL (blocage CORS iframe) : charger une image via URL `pluginfile.php` dans `new Image()` dans le sandbox → CORS bloque la lecture de pixels, `onerror` sans message, Canvas vide. `crossorigin="anonymous"` aggrave.
- INTERDIT : chargement réseau d'images dans le Canvas via URL dans `[[javascript]]`.
- OBLIGATOIRE (Pattern Base64 d'isolation) : image encodée en Base64 côté édition, stockée dans div caché `[[quid]]`, injectée via Data-URI :
  - Stockage : `<div id="[[quid id="img-data"/]]" style="display:none;">...base64...</div>`
  - Lecture : `let data = await stack_js.get_content('[[quid id="img-data"/]]');`
  - Injection : `img.src = "data:image/jpeg;base64," + data.trim();`
- OBLIGATOIRE : fonction `restore()` relisant le `[[quid]]` au chargement pour reconstruire Canvas/SVG (sinon disparition lors de la soumission AJAX).
- OBLIGATOIRE (verrouillage post-validation) : `MutationObserver` (`childList:true, subtree:true`) surveillant l'apparition des classes `.outcome`/`.feedback` → bascule `isValidated=true` et désactive les EventListeners du Canvas. INTERDIT de se baser sur l'écoute du bouton de soumission Moodle.

## 5.5. Accessibilité (W3C / Normes Moodle)
- Input caché (`display:none`/`opacity:0`) → `aria-hidden="true"` + `tabindex="-1"` obligatoires.
- Interface JS remplaçant un input classique → `role="button"`, `tabindex="0"`, `aria-label` explicite.

## 5.6. Sécurité CASText2 et Injection de Données (Anti-XSS)
- INTERDIT : injecter `{@ans1@}`/`{@ta@}` directement dans des attributs HTML (`style="{@var@}"`, `id="{@var@}"`) ou dans `<script>`.
- OBLIGATOIRE : `[[escape:{@ans1@}]]` pour toute variable contenant du texte non contrôlé injecté en contexte HTML délicat.
- OBLIGATOIRE : double échappement CASText2→JS (`[[escape]]` puis `JSON.stringify()`) si une variable passe vers `[[javascript]]` (ex `var rep = JSON.parse("{@rep_json@}");`).

---

# PÔLE 6 : Architecture JSXGraph et Pont CAS/JavaScript

## 6.1. Isolation Stricte des Balises d'Input
- INTERDIT FATAL : `[[input:nom]]`/`[[validation:nom]]` À L'INTÉRIEUR d'un bloc `[[jsxgraph]]...[[/jsxgraph]]` (le parseur JS lève `SyntaxError: got '<'`).
- OBLIGATOIRE : inputs strictement en dehors du bloc JSXGraph (idéalement juste au-dessus).

## 6.2. Le Piège de l'Injection de Dérivées (Anti-Corruption Math.E)
- ALERT FATAL : notation scientifique Maxima (`1.5849e-5`) — un remplacement naïf de `e` corrompt en `1.5849Math.E-5`.
- ALERT FATAL : opérateur `^` de Maxima injecté tel quel → JS l'interprète comme XOR binaire → `NaN` silencieux.
- OBLIGATOIRE : pour les dérivées de fonctions standard, réécrire nativement en JS (pas d'injection Maxima brute).

## 6.3. Architecture Officielle de Liaison (`input-ref-` et `dispatchEvent`)
- Les versions STACK 2021+ supportent l'attribut `input-ref-` dans `[[jsxgraph]]`.
- INTERDIT : deviner l'ID HTML d'un input (`document.querySelector('input[name*="ans1"]')`) — fragile (iframe srcdoc + préfixage Moodle aléatoire).
- OBLIGATOIRE : `[[jsxgraph input-ref-ans1="refAns1" ...]]` — STACK injecte `refAns1` (le vrai ID).
- OBLIGATOIRE : déclencher manuellement l'événement `change` après modification de `.value` :
```javascript
var inputElement = document.getElementById(refAns1);
inputElement.value = "ma_valeur";
inputElement.dispatchEvent(new Event('change'));
```
- Données complexes (tableaux/objets) : input `string`, `JSON.stringify()` côté JS, `sscanf`/`stackjson_decode` côté PRT.
- Note : l'ancien `stack_jxxg.bind_point("ans1", board, point)` à 3 arguments est OBSOLÈTE (voir jsxgraph-subtleties.md pour la vraie signature à 2 arguments).

## 6.4. Bug de Rendu des Droites Implicites (Droite Fantôme)
- ALERT VISUEL FATAL : `board.create('line', [func_a, func_b, func_c])` (équation cartésienne) peut se dessiner visuellement faux sur certaines versions JSXGraph intégrées (pivote autour d'une coordonnée aberrante) malgré un calcul mathématique juste.
- OBLIGATOIRE : tracé par 2 points physiques (point d'ancrage + point secondaire via le vecteur tangent `(-b, a)`), JAMAIS le tracé implicite pour les éléments mobiles.

## 6.5. Typage de l'Input pour Coordonnées ou Listes (Pattern String/JSON)
- INTERDIT : input `algebraic` pour données structurées (le validateur Maxima refuse `[ ]`/`{ }` JSON).
- OBLIGATOIRE : input `string` + `sscanf` (listes simples `[a,b]`) ou `stackjson_decode` (structures complexes).
- OBLIGATOIRE : vérifier le succès de l'extraction (`if listp(parsed)`) avant utilisation (élève ayant vidé le champ → erreur CAS fatale sinon).

## 6.6. Interdiction Absolue des Commentaires HTML dans CASText2
- INTERDIT FATAL : `<!-- commentaire -->` n'importe où dans le texte de la question — le parseur CASText2 confond `-->` avec une syntaxe invalide (`Expected "comment", "define", "escape" or "if" but "\/" found`), masquant le vrai problème.
- OBLIGATOIRE : uniquement des commentaires JS `// commentaire` dans `[[jsxgraph]]`, ou aucun commentaire.
- ALERT FATAL : vérifier qu'aucun `<!--` n'a été injecté dans les CDATA de feedback lors de copier/coller ou génération IA (`<!--[CDATA[` = corruption fatale à purger).

## 6.7. Débogage Visuel par Cavalier (Pattern isFinite)
- OBLIGATOIRE : toute fonction JS de calcul retournant un nombre pour un graphique DOIT inclure :
```javascript
return (x < 0 || !isFinite(x) || isNaN(x)) ? NaN : x;
```
- Raison : division par zéro aux limites → `Infinity` → JSXGraph trace des traits noirs horizontaux ("effet pinceau").

## 6.8. Création d'Interfaces Utilisateurs (Boutons, Menus)
- INTERDIT (sécurité CSP/HTMLPurifier) : balises HTML brutes (`<button>`, `<div id="...">`) dans le texte de question hors JSXGraph — filtres ENT (ex Elea) les suppriment silencieusement.
- OBLIGATOIRE (Pattern Overlay Absolu) : UI créée entièrement en JS pur (`document.createElement('button')`), attachée au conteneur du graphique (`document.getElementById(divid)`), `position: absolute`.

## 6.9. Piège de la Visibilité par Défaut sur les Éléments Fixes (`fixed:true`)
- ALERT FATAL : dans la version JSXGraph embarquée par STACK, un élément `fixed:true` peut avoir `visProp.visible` évalué à `false` PAR DÉFAUT (contrairement au standard JSXGraph) — sans erreur JS, l'élément existe dans `board.objects` mais ne s'affiche jamais.
- Diagnostic : uniquement via `JXG.boards[boardId].objects[id].visProp.visible` en direct (les textes JSXGraph sont des `<div class="JXGtext">`, pas des `<text>` SVG — `getComputedStyle()` seul ne suffit pas).
- OBLIGATOIRE : tout élément `fixed:true` DOIT recevoir explicitement `visible:true`.
- Note annexe : le hit-testing (clic) est indépendant de la visibilité — un élément invisible peut réagir au clic.

## 6.10. Piège de la Hauteur d'Iframe Fixe (contenu HTML ajouté après le board)
- ALERT FATAL : la hauteur de l'iframe `srcdoc` est fixée par `height` de `[[jsxgraph width="..." height="..."]]`, sans barre de défilement (sandbox). Tout HTML ajouté en sibling après le board et dépassant cette hauteur reste dans le DOM (aucune erreur, CSS correct) mais devient physiquement invisible — vérifiable uniquement via `getBoundingClientRect()`.
- OBLIGATOIRE : si du HTML est ajouté après le board, `height` du tag `[[jsxgraph]]` DOIT inclure une marge pour ce contenu ; recontraindre explicitement `divid` à sa hauteur réelle via `style.height` avant `JXG.JSXGraph.initBoard()`.
