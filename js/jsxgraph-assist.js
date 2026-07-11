// ── JSXGRAPH ASSISTANT ────────────────────────────────────────
//  Génère un prompt IA structuré pour créer un bloc JSXGraph STACK.
//  Insère le code retourné par l'IA dans l'éditeur riche.

function openJsxGraphModal() {
  _jxgRefreshPoolChips();
  document.getElementById('jxg-desc').value = '';
  document.getElementById('jxg-prompt-out').value = '';
  document.getElementById('jxg-code-in').value = '';
  document.getElementById('jxg-mode-display').checked = true;
  document.getElementById('jxg-w').value = '600';
  document.getElementById('jxg-h').value = '400';
  document.getElementById('jxg-xmin').value = '-1';
  document.getElementById('jxg-xmax').value = '10';
  document.getElementById('jxg-ymin').value = '-1';
  document.getElementById('jxg-ymax').value = '10';
  document.getElementById('jxg-opt-axis').checked = true;
  document.getElementById('jxg-opt-grid').checked = false;
  document.getElementById('jxg-opt-ortho').checked = false;
  document.getElementById('jxg-opt-nav').checked = false;
  document.getElementById('jxg-opt-pan').checked = false;
  document.getElementById('jxg-step-x').value = '';
  document.getElementById('jxg-step-y').value = '';
  document.getElementById('jxg-opt-reticule').checked = false;
  const modal = document.getElementById('jsxgraphModal');
  modal.style.display = 'flex';
  FocusTrap.trap(modal, closeJsxGraphModal);
  setTimeout(function(){ document.getElementById('jxg-desc').focus(); }, 50);
}

function closeJsxGraphModal() {
  document.getElementById('jsxgraphModal').style.display = 'none';
  FocusTrap.release();
}

function _jxgRefreshPoolChips() {
  const wrap = document.getElementById('jxg-pool-chips');
  if (!wrap) return;
  const names = (typeof getPoolVarNames === 'function') ? getPoolVarNames() : [];
  if (!names.length) {
    wrap.innerHTML = '<span class="jxg-no-pool">' + I18N.t('jxg.no_pool') + '</span>';
    return;
  }
  wrap.innerHTML = names.map(function(n) {
    return '<button class="jxg-pool-chip" type="button" '
      + 'onclick="jxgInsertPoolVar(\'' + n + '\')" title="{#' + n + '#}">' + n + '</button>';
  }).join('');
}

function jxgInsertPoolVar(name) {
  const ta = document.getElementById('jxg-desc');
  const pos = ta.selectionStart;
  const ins = '{#' + name + '#}';
  ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = pos + ins.length;
  ta.focus();
}

function _jxgVal(id, fallback) {
  var el = document.getElementById(id);
  return el ? el.value : fallback;
}
function _jxgChk(id) {
  var el = document.getElementById(id);
  return el ? el.checked : false;
}

function jxgGeneratePrompt() {
  var isInteractive = document.getElementById('jxg-mode-interactive').checked;
  var w = (_jxgVal('jxg-w', '600')) + 'px';
  var h = (_jxgVal('jxg-h', '400')) + 'px';
  var desc = document.getElementById('jxg-desc').value.trim();
  var names = (typeof getPoolVarNames === 'function') ? getPoolVarNames() : [];

  // Bounding box
  var xmin = _jxgVal('jxg-xmin', '-1');
  var xmax = _jxgVal('jxg-xmax', '10');
  var ymin = _jxgVal('jxg-ymin', '-1');
  var ymax = _jxgVal('jxg-ymax', '10');
  var bb = '[' + xmin + ', ' + ymax + ', ' + xmax + ', ' + ymin + ']';

  // Options cochées
  var optAxis  = _jxgChk('jxg-opt-axis');
  var optGrid  = _jxgChk('jxg-opt-grid');
  var optOrtho = _jxgChk('jxg-opt-ortho');
  var optNav   = _jxgChk('jxg-opt-nav');
  var optPan       = _jxgChk('jxg-opt-pan');
  var optReticule  = _jxgChk('jxg-opt-reticule');

  // Pas des axes
  var stepX = _jxgVal('jxg-step-x', '').trim();
  var stepY = _jxgVal('jxg-step-y', '').trim();

  // Construction de la config initBoard
  var boardLines = [];
  boardLines.push('    boundingbox: ' + bb + ',');
  boardLines.push('    axis: ' + (optAxis ? 'true' : 'false') + ',');
  boardLines.push('    grid: ' + (optGrid ? 'true' : 'false') + ',');
  if (optOrtho) boardLines.push('    keepAspectRatio: true,');
  boardLines.push('    showCopyright: false,');
  boardLines.push('    showNavigation: ' + (optNav ? 'true' : 'false') + ',');
  if (!optPan) boardLines.push('    pan: { enabled: false },');

  // Pas des axes (defaultAxes)
  var ticksLines = [];
  if (stepX) ticksLines.push('        x: { ticks: { ticksDistance: ' + stepX + ', insertTicks: false } }');
  if (stepY) ticksLines.push('        y: { ticks: { ticksDistance: ' + stepY + ', insertTicks: false } }');
  if (ticksLines.length) {
    boardLines.push('    defaultAxes: {');
    boardLines.push(ticksLines.join(',\n'));
    boardLines.push('    },');
  }

  var boardConfig = boardLines.join('\n');

  var varBlock = names.length
    ? names.map(function(n) {
        return '  ' + n + '  →  injecter avec {#' + n + '#} (valeur brute)';
      }).join('\n')
    : '  (aucune variable définie dans le pool pour ce questionnaire)';

  var varInit = names.slice(0, 6).map(function(n) {
    return 'var ' + n + ' = {#' + n + '#};';
  }).join('\n');

  var modeRule = isInteractive
    ? '5. Ce graphique est INTERACTIF : utiliser l\'API stack_jxg.bind_point pour lier\n'
    + '   les déplacements de points à des variables de réponse. Exemple :\n'
    + '   stack_jxg.bind_point(board, ans1, point);'
    : '5. Ce graphique est en AFFICHAGE SEUL (non interactif) :\n'
    + '   tous les objets JSXGraph DOIVENT avoir {fixed:true, highlight:false}.';

  var optSummary = [
    optAxis  ? 'axes visibles' : 'pas d\'axes',
    optGrid  ? 'quadrillage' : 'pas de quadrillage',
    optOrtho ? 'ORTHONORMÉ (keepAspectRatio:true)' : '',
    optNav   ? 'navigation activée' : 'navigation cachée',
    optPan   ? 'pan souris activé' : 'pan désactivé',
    stepX        ? 'pas X=' + stepX : '',
    stepY        ? 'pas Y=' + stepY : '',
    optReticule  ? 'RÉTICULE (crosshair + coordonnées)' : ''
  ].filter(Boolean).join(', ');

  // Snippet réticule à inclure tel quel dans le squelette
  var reticuleSnippet = optReticule
    ? '/* --- réticule : lignes croisées + coordonnées au survol --- */\n'
    + '(function() {\n'
    + '    var _rv = board.create(\'line\',\n'
    + '        [board.create(\'point\',[0,-1e4],{visible:false}),\n'
    + '         board.create(\'point\',[0, 1e4],{visible:false})],\n'
    + '        {strokeColor:\'#888\',strokeWidth:1,dash:2,highlight:false,fixed:true});\n'
    + '    var _rh = board.create(\'line\',\n'
    + '        [board.create(\'point\',[-1e4,0],{visible:false}),\n'
    + '         board.create(\'point\',[ 1e4,0],{visible:false})],\n'
    + '        {strokeColor:\'#888\',strokeWidth:1,dash:2,highlight:false,fixed:true});\n'
    + '    var _rt = board.create(\'text\',[0,0,\'\'],\n'
    + '        {fixed:true,highlight:false,fontSize:11,strokeColor:\'#555\'});\n'
    + '    board.on(\'mousemove\', function(e) {\n'
    + '        var c = board.getUsrCoordsOfMouse(e);\n'
    + '        var x = c[0], y = c[1];\n'
    + '        _rv.point1.setPosition(JXG.COORDS_BY_USER,[x,-1e4]);\n'
    + '        _rv.point2.setPosition(JXG.COORDS_BY_USER,[x, 1e4]);\n'
    + '        _rh.point1.setPosition(JXG.COORDS_BY_USER,[-1e4,y]);\n'
    + '        _rh.point2.setPosition(JXG.COORDS_BY_USER,[ 1e4,y]);\n'
    + '        _rt.setPosition(JXG.COORDS_BY_USER,[x+0.15,y+0.15]);\n'
    + '        _rt.setText(\'(\'+x.toFixed(2)+\', \'+y.toFixed(2)+\')\');\n'
    + '        board.update();\n'
    + '    });\n'
    + '})();\n'
    : '';

  var prompt =
'Tu génères un bloc JSXGraph pour une question STACK/Moodle.\n'
+ '\n'
+ '━━ RÈGLES STRICTES (structure STACK — PAS du JSXGraph classique) ━━\n'
+ '1. Délimiteurs STACK uniquement — à l\'intérieur de <questiontext> :\n'
+ '   [[jsxgraph width="' + w + '" height="' + h + '"]] ... [[/jsxgraph]]\n'
+ '   → INTERDITS : <div id="box">, <script src="jsxgraphcore.js">.\n'
+ '     STACK charge lui-même la bibliothèque et fournit le conteneur.\n'
+ '2. Premier argument de initBoard = la VARIABLE divid (fournie par STACK) :\n'
+ '   ✓ JXG.JSXGraph.initBoard(divid, {…})    ← CORRECT\n'
+ '   ✗ JXG.JSXGraph.initBoard(\'box\', {…})   ← INTERDIT (id en dur)\n'
+ '3. Injection des variables Maxima dans le JS avec {# #} (DIÈSE), jamais {@ @} :\n'
+ '   - Nombre ou liste Maxima  →  var a = {#a#};\n'
+ '     (une liste Maxima [x,y,z] devient un tableau JS [x,y,z])\n'
+ '   - Chaîne de caractères    →  var c = \'{#couleur#}\';\n'
+ '   {@ @} sert à afficher du LaTeX dans le texte — ne l\'utilise PAS en JS.\n'
+ '4. Encadre le dessin de board.suspendUpdate() / board.unsuspendUpdate().\n'
+ modeRule + '\n'
+ '\n'
+ '━━ CONFIGURATION DU REPÈRE (à respecter exactement) ━━\n'
+ 'Fenêtre : x de ' + xmin + ' à ' + xmax + ', y de ' + ymin + ' à ' + ymax + '\n'
+ 'Options : ' + optSummary + '\n'
+ '\n'
+ '━━ VARIABLES MAXIMA DISPONIBLES ━━\n'
+ varBlock + '\n'
+ '\n'
+ '━━ SQUELETTE DE RÉFÉRENCE (utiliser cette config exacte pour initBoard) ━━\n'
+ '[[jsxgraph width="' + w + '" height="' + h + '"]]\n'
+ 'var board = JXG.JSXGraph.initBoard(divid, {\n'
+ boardConfig + '\n'
+ '});\n'
+ 'board.suspendUpdate();\n'
+ (varInit ? varInit + '\n' : '')
+ '/* --- tracé ici --- */\n'
+ (reticuleSnippet ? reticuleSnippet : '')
+ 'board.unsuspendUpdate();\n'
+ '[[/jsxgraph]]\n'
+ '\n'
+ '━━ DEMANDE ━━\n'
+ (desc || '(aucune description fournie)') + '\n'
+ '\n'
+ 'Génère UNIQUEMENT le bloc [[jsxgraph]]…[[/jsxgraph]] complet, prêt à coller dans STACK.\n'
+ 'Pas de markdown, pas d\'explication, pas de balise ```.';

  var out = document.getElementById('jxg-prompt-out');
  out.value = prompt;
  out.scrollTop = 0;
}

function jxgCopyPrompt() {
  const ta = document.getElementById('jxg-prompt-out');
  if (!ta.value.trim()) { toast(I18N.t('jxg.generate_first')); return; }
  navigator.clipboard.writeText(ta.value).then(function() {
    toast(I18N.t('jxg.copied_prompt'));
  });
}

function jxgInsertCode() {
  const code = document.getElementById('jxg-code-in').value.trim();
  if (!code) { toast(I18N.t('jxg.paste_first')); return; }
  const html = '<div class="jxg-inserted-block" contenteditable="false">'
    + '<span class="jxg-block-label">📊 JSXGraph</span>'
    + '<pre class="jxg-block-pre">' + htmlEsc(code) + '</pre>'
    + '</div><p><br></p>';
  closeJsxGraphModal();
  const tgt = (typeof _verifZoneActive !== 'undefined' && _verifZoneActive) || richEditor();
  restoreRichSelection(tgt);
  document.execCommand('insertHTML', false, html);
  if (typeof _verifZoneActive !== 'undefined') _verifZoneActive = null;
}
