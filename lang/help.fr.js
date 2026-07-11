/* ════════════════════════════════════════════════════════════════
   HÉSTACK — CONTENU D'AIDE : FRANÇAIS
   Données seulement (aucune logique). Pour ajouter une langue d'aide,
   copier ce fichier (ex. help.en.js), traduire les textes, et terminer
   par : window.HELP_LANG.en = HELP_CONTENT;
   ════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
function _hSection(title, html){ return `<h4 class="help-h">${title}</h4>${html}`; }
function _hList(items){ return '<ul class="help-ul">'+items.map(i=>`<li>${i}</li>`).join('')+'</ul>'; }

// Rappel commun affiché en bas de chaque aide (éléments partagés par tous les modules).
const _HELP_COMMON = `
  <div class="help-common">
    <strong>Rappels communs à tous les modules</strong>
    ${_hList([
      'Bouton <b><svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Éditeur</b> : ouvre l\'éditeur riche (gras, couleurs, listes, images, sons, tableaux, liens).',
      'Pour insérer une formule, cliquez sur <b>∑ LaTeX</b> dans l\'éditeur. En syntaxe brute : <code>$ ... $</code> en ligne, <code>$$ ... $$</code> centré (ex&nbsp;: <code>$\\frac{1}{2}$</code>).',
      '<b><svg class="hs-ico"><use href="#ico-tool-ai"></use></svg> Prompt IA</b> (quand présent) : génère un texte à copier dans une IA pour produire automatiquement le contenu de la question.',
      '<b><svg class="hs-ico"><use href="#ico-file-import"></use></svg> / <svg class="hs-ico"><use href="#ico-file-export"></use></svg> JSON</b> (quand présents) : importer ou exporter la configuration de la question pour la réutiliser.'
    ])}
  </div>`;

const HELP_CONTENT = {

  // ───────────────────────────────────────── CASES À COCHER
  checkbox: {
    title: '<svg class="hs-ico"><use href="#ico-type-checkbox"></use></svg> Cases à cocher — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>QCM à <b>réponses multiples</b> : l\'élève peut cocher plusieurs cases. La note est <b>partielle automatique</b> (chaque bonne/mauvaise case compte).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : la consigne (ex. « Cochez toutes les propositions exactes »).',
        '<b>Nombre total de propositions</b> : combien de cases seront visibles par l\'élève.',
        '<b>Nb bonnes réponses</b> : <i>Fixe</i> (toujours le même nombre de vraies) ou <i>Aléatoire</i>.',
        'Ajoutez vos propositions avec <b>✅ + VRAI</b> et <b>❌ + FAUX</b>. Pour chacune : un <b>Intitulé</b> (le texte affiché) et un <b>Feedback</b> (explication).'
      ])) +
      _hSection('Astuces / pièges', _hList([
        'Mettez <b>plus de propositions</b> dans les listes que le nombre affiché : le système en tire au hasard à chaque tentative → chaque élève voit une variante.',
        'Vérifiez l\'avertissement orange : il signale un pool insuffisant pour le tirage demandé.',
        'L\'intitulé accepte le LaTeX (<code>$...$</code>) et la mise en forme.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BOUTON RADIO
  radio: {
    title: '<svg class="hs-ico"><use href="#ico-type-radio"></use></svg> Bouton radio — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>QCM à <b>réponse unique</b> : une seule bonne réponse, présentée sous forme de boutons radio.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : la consigne.',
        '<b>Nb total de boutons affichés</b> : 1 bonne réponse + des distracteurs.',
        'Remplissez le <b>Pool VRAIS</b> (bonnes réponses) et le <b>Pool FAUX</b> (distracteurs).'
      ])) +
      _hSection('Fonctionnement du tirage', _hList([
        '1 bonne réponse est tirée <b>au hasard</b> du pool VRAI.',
        'Les autres boutons sont des distracteurs tirés du pool FAUX.',
        'Il faut au minimum <b>1 VRAI</b> et <b>(nb affichés − 1) FAUX</b>.'
      ])) +
      _hSection('Astuce',
        '<p>Plusieurs bonnes réponses possibles dans le pool VRAI ? Le système en choisit une par tentative : idéal pour varier les questions.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MENU DÉROULANT
  dropdown: {
    title: '<svg class="hs-ico"><use href="#ico-type-dropdown"></use></svg> Menu déroulant — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Identique au bouton radio (une seule bonne réponse), mais présenté sous forme de <b>liste déroulante</b>. Pratique pour insérer une réponse au milieu d\'une phrase.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> + <b>Nb de propositions affichées</b>.',
        '<b>Pool VRAIS</b> : la/les bonne(s) réponse(s). <b>Pool FAUX</b> : les distracteurs.',
        'Minimum requis : 1 VRAI et (nb total − 1) FAUX.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ALGÉBRIQUE
  algebraic: {
    title: '<svg class="hs-ico"><use href="#ico-type-algebraic"></use></svg> Algébrique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève saisit une <b>expression mathématique</b>. STACK vérifie l\'équivalence algébrique (ex. <code>2*x+y</code> = <code>y+2*x</code>), pas l\'écriture exacte.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Variables</b> : listez celles utilisées, séparées par des virgules (ex. <code>x, y</code>).',
        '<b>Réponse attendue</b> : la formule correcte. Le bouton <b><svg class="hs-ico"><use href="#ico-tool-keyboard"></use></svg> Aide à la saisie</b> ouvre un clavier pour l\'écrire sans erreur.',
        'Onglet <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Aide élève</b> : cochez les consignes à afficher (point décimal, puissances de 10…) et le clavier virtuel.',
        'Onglet <b>💡 Solution</b> : rédigez la correction détaillée.'
      ])) +
      _hSection('Syntaxe à respecter', _hList([
        'Multiplication explicite : écrivez <code>2*x</code>, jamais <code>2x</code> (sinon « 2x » est lu comme une seule variable).',
        'Puissances avec <code>^</code> (ex. <code>x^2</code>), décimales avec un point (ex. <code>1.5</code>).',
        'Puissances de 10 : <code>1e6</code> ou <code>10^6</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUMÉRIQUE
  numerical: {
    title: '<svg class="hs-ico"><use href="#ico-type-numeric"></use></svg> Arithmétique (Numérique) — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève saisit une <b>valeur numérique</b>. STACK compare à une valeur cible avec une tolérance.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Valeur cible</b> : la bonne réponse (point pour les décimales).',
        '<b>Arrondi auto</b> : si « Oui », fixez le nombre de <b>chiffres significatifs</b> conservés.',
        '<b>Type de tolérance</b> : <i>Relative</i> (% de la valeur) ou <i>Absolue</i> (écart fixe).',
        '<b>Marge d\'erreur</b> : ex. <code>0.05</code> = 5 % en relatif.',
        '<b>Float autorisé</b> : accepter ou non les nombres à virgule.'
      ])) +
      _hSection('Astuce',
        '<p>Pour une mesure physique, préférez la tolérance <b>relative</b> (ex. 2 %) afin d\'accepter les arrondis raisonnables.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── UNITÉ
  units: {
    title: '<svg class="hs-ico"><use href="#ico-type-units"></use></svg> Unité — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève doit donner une <b>valeur ET son unité</b> (ex. <code>9.81 m/s^2</code>). STACK vérifie le nombre (tolérance relative) et l\'unité physique.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Valeur numérique</b> + <b>Unité Maxima</b> (syntaxe : <code>m/s^2</code>, <code>N</code>, <code>Pa</code>, <code>J/(kg*K)</code>…).',
        '<b>Tolérance relative</b> (ex. 0.05 = 5 %) et <b>chiffres significatifs minimum</b>.',
        'Onglet <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Aide élève</b> : affichez la liste des unités usuelles et les règles d\'écriture.'
      ])) +
      _hSection('Écriture des unités', _hList([
        'Reliez nombre et unité par <code>*</code> côté élève (ex. <code>10*m</code>).',
        'Unités composées : <code>J/(kg*K)</code> ou <code>J*kg^(-1)*K^(-1)</code>.',
        'Usuelles : <code>m, kg, g, N, J, W, Pa, V, A, Ohm, s, h, K, degC</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STRING
  string: {
    title: '<svg class="hs-ico"><use href="#ico-type-string"></use></svg> Réponse textuelle (String) — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève tape un <b>mot ou une courte expression</b> (ex. « Newton »). La comparaison est textuelle.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Réponse attendue</b> : le texte exact correct.',
        '<b>Taille de la case</b> : largeur du champ de saisie.',
        '<b>Tolérance</b> : <i>StringSloppy</i> (ignore majuscules/espaces — recommandé) ou <i>String</i> (exactitude absolue).',
        'Option <b><svg class="hs-ico"><use href="#ico-tool-palette"></use></svg> Aide à la saisie</b> : ajoutez des palettes de boutons (fractions, opérateurs, lettres grecques…) pour aider l\'élève.'
      ])) +
      _hSection('Piège',
        '<p>Le mode strict refuse la moindre différence de casse ou d\'accent. En cas de doute, utilisez <b>StringSloppy</b>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATCH (RELIER)
  match: {
    title: '<svg class="hs-ico"><use href="#ico-type-match"></use></svg> Relier (Matching) — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève relie les éléments de la <b>colonne A</b> à ceux de la <b>colonne B</b>.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : la consigne.',
        'Ajoutez les éléments des deux colonnes avec <b>+ Ajouter</b> (chaque élément accepte texte, LaTeX, image).',
        'Dans <b>« Créer les liaisons attendues »</b> : cliquez un élément à <b>gauche</b> puis son correspondant à <b>droite</b> pour créer la paire correcte.',
        'Les liaisons créées apparaissent en bas ; « <svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Effacer tout » réinitialise.'
      ])) +
      _hSection('Bon à savoir',
        '<p>L\'affichage interactif (lignes à tracer) n\'apparaît que dans Moodle, lors de la tentative de l\'élève.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MOTS CROISÉS
  crossword: {
    title: '<svg class="hs-ico"><use href="#ico-type-crossword"></use></svg> Mots croisés — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Génère une grille de mots croisés à partir d\'une liste de <b>mots + définitions</b>.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Mots à utiliser</b> : laissez vide pour tout prendre, ou indiquez un nombre pour tirer un sous-ensemble au hasard.',
        'Ajoutez chaque entrée avec <b>+ Ajouter un mot</b> : le <b>Mot</b> (la réponse) et sa <b>Définition</b> (l\'indice).',
        'Cliquez <b>Générer la grille</b> pour vérifier l\'agencement avant de valider.'
      ])) +
      _hSection('Astuces', _hList([
        'Privilégiez des mots qui partagent des lettres : la grille sera plus compacte.',
        'Évitez espaces et caractères spéciaux dans les mots.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DOI
  doi: {
    title: '<svg class="hs-ico"><use href="#ico-type-doi"></use></svg> Diagramme Objet-Interaction — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève identifie les objets en interaction avec un <b>objet d\'étude central</b> (système physique).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Objet d\'étude</b> : le système au centre (ex. « Skieur »).',
        '<b>Objets et Interactions</b> : ajoutez chaque objet extérieur et le type d\'interaction attendu.',
        '<b>Zones bleues vides (en trop)</b> : ajoute des emplacements leurres pour ne pas donner le nombre exact d\'interactions.',
        'L\'aperçu (canvas) montre le schéma tel qu\'il sera généré.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ÉQUATION CHIMIQUE
  chemical: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemistry"></use></svg> Équation chimique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève écrit/équilibre une <b>équation chimique</b>. Le système vérifie l\'équilibrage.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> (facultatif) : la consigne.',
        'Saisissez l\'équation modèle dans l\'éditeur. Barre d\'outils : <b>indice</b> (x₂), <b>exposant</b> (xⁿ), flèches <b>→</b>, <b>⇌</b>, <b>↔</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Actualiser l\'aperçu</b> pour visualiser le rendu.',
        '<b>Type de réaction</b> et <b>groupe fonctionnel attendu</b> précisent la correction.'
      ])) +
      _hSection('Astuce',
        '<p>Indiquez les coefficients (ex. <code>2 O₂</code>) : l\'équilibrage en dépend.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── CHIMIE TOPOLOGIQUE
  chemical_topo: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemical_topo"></use></svg> Chimie topologique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Réactions avec <b>structures topologiques</b> (notation SMILES ou formule). Permet un dessin de molécules.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : la consigne.',
        '<b>Équation</b> : tapez en SMILES/formule, ou cliquez <b><svg class="hs-ico"><use href="#ico-tool-structure"></use></svg> Dessiner (JSME)</b> pour la construire visuellement.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Actualiser</b> affiche l\'aperçu de la réaction.'
      ])) +
      _hSection('Scoring PRT (avancé)', _hList([
        'Le barème se répartit entre plusieurs critères : flèche (PRT1), atomes (N0), charges (N1), formules (N2), coefficients (N4).',
        'La somme <b>PRT1 + N0 + N1 + N2 + N4 doit faire 100 %</b> (les nœuds 3 et 5 sont des secours).',
        'Le bandeau affiche « Somme = 100 % » quand la répartition est correcte.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUCLÉAIRE
  nuclear: {
    title: '<svg class="hs-ico"><use href="#ico-type-nuclear"></use></svg> Réactions nucléaires — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève complète/écrit une <b>réaction nucléaire</b> avec la notation des isotopes.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : la consigne.',
        'Construisez la réaction avec la barre d\'outils : <b>isotope</b> <code>{}^{A}_{Z}X</code>, opérateurs <b>+</b> et <b>→</b>, particules <b>α</b>, <b>β⁻</b>, <b>β⁺</b>, <b>γ</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Aperçu</b> pour vérifier le rendu, <b><svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Vider</b> pour recommencer.'
      ])) +
      _hSection('Astuce',
        '<p>Vérifiez la conservation : la somme des nombres de masse (A) et des numéros atomiques (Z) doit être identique de chaque côté de la flèche.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── COMPOSITION LIBRE
  composition: {
    title: '<svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Composition libre — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Question à <b>réponse rédigée libre</b> (texte, formules, mise en forme). <b>Non corrigée automatiquement</b> : c\'est le professeur qui note dans Moodle.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : la question posée (images, LaTeX, tableaux possibles).',
        '<b>Sur combien de points</b> : informe l\'élève du poids de la question.',
        '<b>Taille de l\'éditeur élève</b> : selon la longueur de réponse attendue.',
        '<b>Message sous l\'éditeur</b> : consigne affichée à l\'élève.'
      ])) +
      _hSection('Rappel',
        '<p>STACK n\'évalue pas cette question : prévoyez la correction manuelle.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INÉQUATIONS
  inequation: {
    title: '<svg class="hs-ico"><use href="#ico-type-inequation"></use></svg> Inéquations — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève résout une <b>inéquation</b> (linéaire, trinôme du 2nd degré ou valeur absolue) et saisit l\'<b>ensemble-solution</b> en notation d\'intervalle STACK. AlgEquiv vérifie l\'équivalence.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un exemple courant.',
        '<b>Type</b> : linéaire <code>ax+b ▷ 0</code>, trinôme <code>ax²+bx+c ▷ 0</code>, valeur absolue <code>|ax+b| ▷ c</code>.',
        '<b>Opérateur</b> : >, ≥, &lt;, ≤.',
        '<b>Coefficients a, b, c</b> selon le type choisi.',
        '<b>Ensemble-solution</b> : auto-calculé dans la plupart des cas ; corrigez si l\'aperçu est insuffisant.',
        '<b>Consigne</b> : via « ✏️ Éditeur ».',
        '<b>Feedback</b> correct / incorrect.'
      ])) +
      _hSection('Notation STACK des intervalles', _hList([
        '<code>oo(a,b)</code> = ]a ; b[ (ouvert des deux côtés).',
        '<code>oc(a,b)</code> = ]a ; b] (fermé à droite).',
        '<code>co(a,b)</code> = [a ; b[ (fermé à gauche).',
        '<code>cc(a,b)</code> = [a ; b] (fermé des deux côtés).',
        '<code>union(A,B)</code> = A ∪ B (pour deux intervalles disjoints).',
        '<code>inf</code> = +∞, <code>-inf</code> = −∞.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── THERMODYNAMIQUE
  thermo: {
    title: '<svg class="hs-ico"><use href="#ico-type-thermo"></use></svg> Thermodynamique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Calculs de <b>thermodynamique</b> : loi des gaz parfaits <b>PV = nRT</b>, chaleur sensible <b>Q = m·cp·ΔT</b>, loi de Mariotte et loi de Charles. Réponse numérique vérifiée à 1 % (NumRelative).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un scénario type.',
        '<b>Type de question</b> : calcul de P, V, T ou n (gaz parfaits), Q (chaleur), V₂ (Mariotte ou Charles).',
        '<b>Paramètres gaz</b> : P (en Pa), V (en m³), n (en mol), T (en <b>Kelvin</b>).',
        '<b>Paramètres chaleur</b> : m (kg), cp (J/kg/K), ΔT (K).',
        '<b>L\'aperçu</b> calcule automatiquement le résultat attendu avec R = 8.314 J/(mol·K).',
        '<b>Consigne</b> : via « ✏️ Éditeur ».'
      ])) +
      _hSection('Constante et unités', _hList([
        '<b>R = 8.314 J/(mol·K)</b> codé en dur.',
        'P en Pa (1 atm ≈ 101 325 Pa), V en m³ (22,4 L = 0,0224 m³), T en K (0 °C = 273,15 K).',
        'Tolérance 1 % : arrondis raisonnables acceptés.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BASE N
  basen: {
    title: '<svg class="hs-ico"><use href="#ico-type-basen"></use></svg> Conversion Base N — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève <b>convertit un nombre</b> entre différentes bases (binaire, octal, décimal, hexadécimal). STACK vérifie l\'égalité algébrique de la réponse.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un exemple courant pour remplir les champs automatiquement.',
        '<b>Type de question</b> : conversion directe, valeur d\'un bit, représentation en base cible.',
        '<b>Nombre source</b> + <b>base source</b> (ex : 1010 en base 2).',
        '<b>Base cible</b> : la base vers laquelle l\'élève doit convertir.',
        '<b>L\'aperçu</b> calcule automatiquement la réponse correcte.'
      ])) +
      _hSection('Astuce',
        '<p>Hexadécimal : les lettres A–F représentent 10–15. Vérifiez que l\'élève sait qu\'il peut répondre en notation décimale ou héxa selon la question.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── CIRCUITS ÉLECTRIQUES
  circuit: {
    title: '<svg class="hs-ico"><use href="#ico-type-circuit"></use></svg> Circuits électriques — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Lois des circuits électriques : <b>loi d\'Ohm</b>, associations <b>série / parallèle</b>, intensité, puissance. La réponse numérique est vérifiée par STACK (NumRelative, 1 %).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un scénario de circuit type.',
        '<b>Type de question</b> : loi d\'Ohm, résistance série/parallèle, intensité, puissance…',
        '<b>Paramètres</b> : saisissez U (V), I (A), R (Ω), P (W) selon le scénario.',
        '<b>L\'aperçu</b> affiche la formule et le résultat attendu.',
        '<b>Consigne</b> (facultatif) : personnalisez l\'énoncé via l\'éditeur.'
      ])) +
      _hSection('Astuce',
        '<p>La tolérance est de 1 % : un calcul arrêté à 2 décimales est accepté.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── LOGIQUE BOOLÉENNE
  logique: {
    title: '<svg class="hs-ico"><use href="#ico-type-logique"></use></svg> Logique booléenne — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur les <b>tables de vérité</b>, la <b>simplification</b> d\'expressions et les <b>équivalences logiques</b>. STACK utilise PropLogic pour la vérification.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un opérateur ou une loi type (De Morgan, XOR…).',
        '<b>Type de question</b> : table de vérité (une cellule), simplification, équivalence.',
        '<b>Expression booléenne</b> : notation <code>A and B</code>, <code>not A</code>, <code>A xor B</code>, <code>A implies B</code>.',
        '<b>L\'aperçu</b> affiche la table de vérité complète et la valeur attendue.'
      ])) +
      _hSection('Astuce',
        '<p>Pour une question de table : choisissez une ligne précise de la table (valuation A=1, B=0 par exemple). La réponse est alors 0 ou 1.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── NOMBRES COMPLEXES
  complexe: {
    title: '<svg class="hs-ico"><use href="#ico-type-complexe"></use></svg> Nombres complexes — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur la <b>forme algébrique</b>, le <b>module</b>, l\'<b>argument</b> et le <b>conjugué</b> d\'un nombre complexe. STACK vérifie l\'équivalence algébrique.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez une opération type.',
        '<b>Parties réelle (a) et imaginaire (b)</b> du nombre z = a + bi.',
        '<b>Type de question</b> : forme algébrique, module, argument, conjugué, somme/produit.',
        '<b>L\'aperçu</b> affiche la réponse en syntaxe Maxima.'
      ])) +
      _hSection('Syntaxe Maxima', _hList([
        '<code>%i</code> représente i (unité imaginaire).',
        '<code>abs(z)</code> donne le module, <code>carg(z)</code> l\'argument.',
        'Argument en fraction de π : <code>%pi/4</code>, <code>3*%pi/4</code>…'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CALCUL DIFFÉRENTIEL
  calcul: {
    title: '<svg class="hs-ico"><use href="#ico-type-calcul"></use></svg> Calcul différentiel et intégral — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur les <b>dérivées</b>, <b>primitives</b> et <b>intégrales définies</b>. STACK utilise <code>Diff</code> (dérivée) ou <code>Antidiff</code> (primitive) ou <code>AlgEquiv</code> (valeur numérique).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez une fonction type (polynôme, sin, exp, ln…).',
        '<b>Type de question</b> : dérivée, primitive, intégrale définie, valeur numérique.',
        '<b>Fonction f(x)</b> : syntaxe Maxima — ex : <code>x^3+2*x</code>, <code>sin(x)</code>, <code>exp(x)</code>.',
        '<b>Bornes a, b</b> : pour l\'intégrale définie ∫[a,b] f(x) dx.',
        '<b>L\'aperçu</b> montre la réponse calculée côté professeur.'
      ])) +
      _hSection('Syntaxe Maxima', _hList([
        'Dérivée : <code>diff(f,x)</code>, Primitive : <code>integrate(f,x)</code>.',
        'Intégrale définie : <code>integrate(f,x,a,b)</code>.',
        'Logarithme naturel : <code>log(x)</code> (pas ln).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STATISTIQUES
  statistiques: {
    title: '<svg class="hs-ico"><use href="#ico-type-statistiques"></use></svg> Statistiques — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Calculs statistiques sur une série : <b>moyenne</b>, <b>médiane</b>, <b>variance</b>, <b>écart-type</b>, <b>quartiles</b>, <b>étendue</b>. STACK vérifie la valeur numérique (AlgEquiv).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un jeu de données type.',
        '<b>Type de question</b> : moyenne, médiane, variance, écart-type, Q1, Q3, étendue, moyenne pondérée.',
        '<b>Données</b> : liste de valeurs séparées par des virgules (ex : <code>3, 7, 2, 9, 5</code>).',
        '<b>Effectifs</b> : pour la moyenne pondérée (même nombre de valeurs que les données).',
        '<b>L\'aperçu</b> calcule la réponse attendue.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATRICES
  matrices: {
    title: '<svg class="hs-ico"><use href="#ico-type-matrices"></use></svg> Matrices — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Calculs d\'<b>algèbre linéaire</b> : produit de matrices, déterminant, transposée, trace. STACK accepte la notation <code>matrix([a,b],[c,d])</code>.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez une opération (produit, déterminant…).',
        '<b>Type de question</b> : produit A×B, déterminant, transposée, trace, inverse.',
        '<b>Taille</b> : 2×2 ou 3×3.',
        '<b>Coefficients des matrices A et B</b> : saisissez chaque entrée.',
        '<b>L\'aperçu</b> calcule et affiche la matrice résultat en syntaxe Maxima.'
      ])) +
      _hSection('Syntaxe réponse élève',
        '<p>L\'élève saisit : <code>matrix([1,2],[3,4])</code> pour une matrice 2×2.<br>Le mot-clé <code>matrix</code> est autorisé dans STACK (<code>allowwords</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GÉOMÉTRIE
  geometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-geometrie"></use></svg> Géométrie analytique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions de <b>géométrie 2D / 3D</b> : distance, milieu, norme de vecteur, produit scalaire, colinéarité. STACK vérifie par AlgEquiv (accepte <code>sqrt(n)</code>).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un exemple (distance AB, milieu, vecteur AB…).',
        '<b>Type de question</b> : distance, milieu, norme, produit scalaire, colinéarité, 3D.',
        '<b>Coordonnées</b> des points A, B, C (champs x, y, z selon la dimension).',
        '<b>L\'aperçu</b> affiche la valeur exacte en syntaxe Maxima.'
      ])) +
      _hSection('Astuce',
        '<p>Les distances sont exprimées avec <code>sqrt(n)</code> quand non entières. AlgEquiv reconnaît <code>sqrt(25)=5</code>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── SUITES
  suites: {
    title: '<svg class="hs-ico"><use href="#ico-type-suites"></use></svg> Suites numériques — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur les <b>suites arithmétiques</b> et <b>géométriques</b> : terme général, somme des n premiers termes, limite. STACK vérifie par AlgEquiv.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez une suite type.',
        '<b>Type de question</b> : terme u(n), somme S(n), limite, nature de la suite.',
        '<b>u₀ (premier terme)</b> et <b>r ou d (raison/différence)</b>.',
        '<b>Rang n</b> pour les termes et sommes (entier ≥ 0).',
        '<b>L\'aperçu</b> calcule et affiche la réponse attendue.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── PROBABILITÉS
  probabilites: {
    title: '<svg class="hs-ico"><use href="#ico-type-probabilites"></use></svg> Probabilités — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions de <b>probabilités</b> : combinaisons, loi binomiale (P(X=k), E(X), Var(X)), probabilité conditionnelle, union. STACK vérifie par AlgEquiv.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un scénario probabiliste.',
        '<b>Type de question</b> : C(n,k), P(X=k), E(X), Var(X), P(A|B), P(A∪B).',
        '<b>Paramètres</b> : n, k (entiers) et p (probabilité, 0–1) selon la loi.',
        '<b>Probabilités P(A), P(B), P(A∩B)</b> pour les événements composés.',
        '<b>L\'aperçu</b> calcule la réponse exacte (fraction si possible).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── TRIGONOMÉTRIE
  trigonometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-trigonometrie"></use></svg> Trigonométrie — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur les <b>valeurs exactes</b> (sin, cos, tan), les <b>identités trigonométriques</b> et la résolution d\'<b>équations</b>. STACK force les réponses exactes (<code>forbidfloat</code>).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un angle type (π/6, π/4, π/3, π/2…).',
        '<b>Type de question</b> : valeur exacte de sin/cos/tan, identité, équation trig.',
        '<b>Angle θ</b> : en syntaxe Maxima — ex : <code>%pi/6</code>, <code>%pi/4</code>, <code>2*%pi/3</code>.',
        '<b>L\'aperçu</b> affiche la valeur exacte et sa correspondance Maxima.'
      ])) +
      _hSection('Astuce',
        '<p>Les flottants sont <b>interdits</b> : l\'élève doit répondre en fractions ou radicaux (<code>sqrt(3)/2</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── POLYNÔMES
  polynomes: {
    title: '<svg class="hs-ico"><use href="#ico-type-polynomes"></use></svg> Polynômes du 2nd degré — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur le <b>trinôme ax²+bx+c</b> : discriminant, racines, formules de Viète, nombre de racines réelles. STACK vérifie par AlgEquiv.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un trinôme type.',
        '<b>Type de question</b> : discriminant Δ, racines x₁/x₂, somme x₁+x₂, produit x₁×x₂, nb de racines.',
        '<b>Coefficients a, b, c</b> du trinôme (entiers ou décimaux).',
        '<b>L\'aperçu</b> calcule Δ et les racines en temps réel.'
      ])) +
      _hSection('Formules de Viète',
        '<p>x₁+x₂ = −b/a et x₁×x₂ = c/a (sans calculer les racines explicitement).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── LIMITES
  limites: {
    title: '<svg class="hs-ico"><use href="#ico-type-limites"></use></svg> Limites de fonctions — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Questions sur les <b>limites</b> : à l\'infini, en un point, formes indéterminées. STACK vérifie par AlgEquiv. <b>La réponse attendue est saisie manuellement</b> par l\'enseignant.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez une fonction et un point type.',
        '<b>Type de limite</b> : x→+∞, x→−∞, x→a (fini), x→a⁺.',
        '<b>Expression f(x)</b> : syntaxe Maxima — ex : <code>(x^2-1)/(x-1)</code>, <code>sin(x)/x</code>.',
        '<b>Réponse attendue</b> : saisir explicitement (<code>inf</code>, <code>-inf</code>, <code>2</code>, <code>%pi</code>…).',
        '<b>L\'aperçu</b> affiche la formule sans calculer automatiquement.'
      ])) +
      _hSection('Valeurs spéciales Maxima', _hList([
        '<code>inf</code> → +∞, <code>minf</code> → −∞.',
        '<code>%pi</code> → π, <code>1/2</code> → ½.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── PHYSIQUE
  physique: {
    title: '<svg class="hs-ico"><use href="#ico-type-physique"></use></svg> Physique — Mécanique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Calculs de <b>mécanique classique</b> : MRUA, chute libre, énergie cinétique/potentielle, conservation de l\'énergie mécanique, 2ème loi de Newton. Réponse numérique vérifiée avec tolérance 1 % (NumRelative).</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Préréglage</b> : choisissez un scénario physique type.',
        '<b>Type de question</b> : v(t), x(t), hauteur h, temps t, Ec = ½mv², Ep = mgh, v finale (Em conservée), F = ma.',
        '<b>Paramètres cinématiques</b> : v₀ (m/s), a (m/s²), t (s).',
        '<b>Paramètres mécaniques</b> : m (kg), h ou v (m ou m/s).',
        '<b>L\'aperçu</b> affiche la formule et le résultat numérique.'
      ])) +
      _hSection('Astuce',
        '<p>g = 9.81 m/s² est codé en dur. Pour les exercices de chute libre, seuls t et h sont pertinents ; les champs non utilisés sont masqués automatiquement.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── OSCILLOSCOPE
  oscilloscope: {
    title: '<svg class="hs-ico"><use href="#ico-type-oscilloscope"></use></svg> Oscilloscope — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>Simulation d\'<b>oscilloscope interactif</b> : l\'élève règle la base de temps (Δt, violet) et la sensibilité verticale (ΔV, rouge) avec des curseurs, puis mesure une grandeur physique (période, fréquence, constante de temps RC, retard…) sur l\'oscillogramme.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Type de mesure</b> : Période/Fréquence, Charge RC, Décharge RC, ou Retard entre 2 voies (ultrasons).',
        '<b>Mode pédagogique</b> : <b>Guidé</b> détaille chaque étape (unité, valeur, pièges de confusion) ; <b>Autonome</b> vérifie chaque grandeur avec un feedback générique ; <b>Expert</b> ne donne aucun indice, seul le résultat compte. Ce réglage ne change pas la difficulté de l\'oscillogramme, seulement le niveau de détail des feedbacks.',
        'Selon le type choisi, des paramètres spécifiques apparaissent : forme du signal et fréquence (fixe ou aléatoire) pour Période/Fréquence ; E et τ pour Charge/Décharge RC ; fréquences porteuse/salve et Δt min-max pour Retard.',
        '<b>Réglages initiaux de l\'oscillo</b> (base de temps SH, sensibilité SV) : cochez <b>Auto</b> pour un calibrage automatique cohérent avec le signal, ou décochez pour choisir manuellement une valeur de la liste.'
      ])) +
      _hSection('Astuce',
        '<p>Le mode Guidé est recommandé pour une première utilisation en classe : il signale explicitement les pièges de confusion (ex. confondre demi-période et période). Passez en Expert pour une évaluation sommative.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INTERFÉRENCES-DIFFRACTION
  diffraction: {
    title: '<svg class="hs-ico"><use href="#ico-type-diffraction"></use></svg> Interférences-Diffraction — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève observe une <b>figure de diffraction/interférences</b> (fente simple, fente double, trous de Young, trou circulaire, trou carré) et en déduit une grandeur physique (largeur de fente, longueur d\'onde…) à partir de mesures sur la figure.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Type</b> : forme de l\'ouverture (fente simple, fente double, trous de Young, trou circulaire, trou carré).',
        '<b>Mode</b> : <b>Écran</b> (l\'élève mesure directement sur la figure projetée) ou <b>Capteur</b> (figure accompagnée d\'une courbe d\'intensité lumineuse).',
        '<b>Paramètres aléatoires (a, D, b)</b> : cochez pour un tirage aléatoire à chaque question, ou décochez pour fixer manuellement la largeur de fente a, la distance à l\'écran D, l\'écartement des trous b et la longueur d\'onde λ.',
        '<b>Tolérance relative (%)</b> : marge d\'erreur acceptée sur la réponse numérique (ex. 10 % accepte 632 nm pour une valeur attendue de 635 nm).',
        '<b>Consigne</b> : rédigez la question posée à l\'élève, ex. « Mesurez la distance avec le réticule et déduisez λ ».'
      ])) +
      _hSection('Astuce',
        '<p>Le champ Écartement b n\'apparaît que pour les figures à deux ouvertures (fente double, trous de Young) — il est masqué automatiquement pour fente simple/trou circulaire/trou carré.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ORDONNANCEMENT
  ord: {
    title: '<svg class="hs-ico"><use href="#ico-type-ord"></use></svg> Ordonnancement — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève <b>remet des éléments dans le bon ordre</b> par glisser-déposer (bloc Parsons de STACK). Idéal pour les algorithmes, chronologies, étapes de raisonnement ou séquences de code.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Énoncé</b> : rédigez la consigne (HTML/LaTeX accepté).',
        '<b>＋ Ajouter un élément</b> : chaque ligne est un élément de la séquence à ordonner. L\'ordre de saisie est l\'ordre correct.',
        '<b>Éléments réutilisables (clone)</b> : cochez si un même élément peut apparaître plusieurs fois dans la réponse.',
        'Les éléments sont présentés à l\'élève dans un <b>ordre mélangé aléatoirement</b> par STACK.'
      ])) +
      _hSection('Astuce',
        '<p>Rédigez chaque élément de manière autonome et non ambiguë. Évitez les formulations "ensuite…" ou "puis…" qui révèlent l\'ordre.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── IMAGE CLIQUABLE
  imgclick: {
    title: '<svg class="hs-ico"><use href="#ico-type-imgclick"></use></svg> Sélection sur image — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève <b>clique sur la bonne zone d\'une image</b> (schéma SVT, carte géographique, diagramme physique…). La zone de réponse reste <b>invisible</b> pour l\'élève.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>URL de l\'image</b> : lien direct vers l\'image (doit être accessible depuis Moodle).',
        '<b>Largeur / Hauteur</b> : dimensions d\'affichage en pixels (l\'image est redimensionnée).',
        '<b>Instruction</b> : consigne affichée à l\'élève, ex. « Cliquez sur le ventricule gauche ».',
        '<b>Zone correcte — Cercle</b> : X centre, Y centre, Rayon (tous en % de la largeur/hauteur).',
        '<b>Zone correcte — Rectangle</b> : X gauche, Y haut, X droite, Y bas (en %).',
        '<b>Libellé de zone</b> : texte utilisé dans le feedback, ex. « ventricule gauche ».'
      ])) +
      _hSection('Coordonnées en %',
        '<p>0 % = bord gauche (ou haut), 100 % = bord droit (ou bas). Un cercle centré au milieu avec rayon 10 % : X=50, Y=50, R=10.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── LECTURE GRAPHIQUE
  glr: {
    title: '<svg class="hs-ico"><use href="#ico-type-glr"></use></svg> Lecture graphique — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève <b>clique sur la courbe au point x demandé</b> pour lire la valeur f(x₀). La courbe est tracée dynamiquement avec JSXGraph dans STACK.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Fonction f(x)</b> : syntaxe Maxima, ex. <code>sin(x)</code>, <code>x^2-1</code>, <code>2*x+1</code>.',
        '<b>Fenêtre</b> : x min/max et y min/max définissent la vue du graphique.',
        '<b>x₀</b> : abscisse du point à lire (doit être dans la fenêtre x).',
        '<b>Tolérance</b> : marge d\'erreur acceptable en pixels sur l\'axe y.',
        '<b>Largeur / Hauteur</b> : dimensions du graphique en pixels (défaut 500 × 400).',
        '<b>Consigne</b> : rédiger la question, ex. « Cliquez sur la courbe en x = 2 ».'
      ])) +
      _hSection('Astuce',
        '<p>Choisissez une tolérance cohérente avec la précision attendue. Une valeur de 0.5 correspond à ½ unité sur l\'axe y — augmentez-la pour les fonctions à forte pente.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GLISSER-DÉPOSER JSXGRAPH
  jxgdrop: {
    title: '<svg class="hs-ico"><use href="#ico-type-jxgdrop"></use></svg> Glisser-Déposer JSXGraph — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève <b>glisse des étiquettes (propositions) sur une image</b> pour les déposer dans des zones définies (schéma légendé, carte, montage expérimental…). Héstack génère automatiquement le code JSXGraph responsive et la correction.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Image de fond</b> : chargez une image (PNG/JPG) — elle sert de support visuel aux zones et propositions.',
        '<b>Propositions</b> : cliquez <b>＋ Ajouter une proposition</b> pour chaque étiquette que l\'élève pourra déposer.',
        '<b>Zones de dépôt</b> : outils <b>Cercle</b>/<b>Rectangle</b> pour poser une zone sur l\'image (clic sur l\'image), <b>Sélectionner</b> pour ajuster une zone existante (centre/rayon ou position/dimensions dans le panneau à droite).',
        'Pour chaque zone sélectionnée, cochez dans <b>Réponses acceptées</b> la ou les propositions considérées comme correctes pour cette zone.',
        '<b>Zones de dépôts visibles</b> : décochez pour masquer le contour des zones à l\'élève (zone invisible, plus difficile) — les zones restent actives pour la correction, seul l\'affichage change.'
      ])) +
      _hSection('Astuce',
        '<p>Une même proposition peut être acceptée dans plusieurs zones si la question l\'exige. Testez le dépôt/glisser dans l\'aperçu avant d\'exporter — la validation se fige après dépôt, comme dans un vrai test Moodle.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── RVB / CMJN
  rvbcmj: {
    title: '<svg class="hs-ico"><use href="#ico-type-rvbcmj"></use></svg> RVB / CMJN — Aide',
    body:
      _hSection('À quoi ça sert',
        '<p>L\'élève <b>identifie la couleur d\'un objet</b> en observant son image à travers différents <b>filtres colorés</b> (Rouge-Vert-Bleu ou Cyan-Magenta-Jaune). Utilisé en optique physique et arts plastiques.</p>') +
      _hSection('Comment remplir', _hList([
        '<b>Type de filtres</b> : RVB (synthèse additive) ou CMJ (synthèse soustractive).',
        '<b>Rendu N&B</b> : affiche l\'image en niveaux de gris avant filtrage (plus réaliste).',
        '<b>Image de l\'objet</b> : importez une image PNG/JPG — elle sera encodée en Base64 dans le XML.',
        '<b>Couleur correcte</b> : sélectionnez la couleur réelle de l\'objet (Rouge, Vert, Bleu, Jaune, Cyan, Magenta, Blanc, Noir).',
        '<b>Prévisualiser les filtres</b> : vérifiez l\'apparence de l\'image à travers chaque filtre avant d\'exporter.'
      ])) +
      _hSection('Principe pédagogique',
        '<p>En RVB : un filtre rouge laisse passer uniquement la composante rouge — un objet vert apparaîtra sombre à travers un filtre rouge. En CMJ : un filtre cyan absorbe le rouge, laissant passer vert et bleu.</p>') + _HELP_COMMON
  }
};

  window.HELP_LANG = window.HELP_LANG || {};
  window.HELP_LANG.fr = HELP_CONTENT;
})();
