// ── JSXGRAPH ASSISTANT ────────────────────────────────────────
//  Génère un prompt IA structuré pour créer un bloc JSXGraph STACK.
//  Insère le code retourné par l'IA dans l'éditeur riche.

function openJsxGraphModal() {
  _jxgRefreshPoolChips();
  document.getElementById('jxg-desc').value = '';
  document.getElementById('jxg-prompt-out').value = '';
  document.getElementById('jxg-code-in').value = '';
  var prev = document.getElementById('jxg-live-preview');
  if (prev) { prev.style.display = 'none'; prev.innerHTML = ''; }
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
        return I18N.t('jxg.prompt_var_line', {n: n});
      }).join('\n')
    : I18N.t('jxg.prompt_no_vars');

  var varInit = names.slice(0, 6).map(function(n) {
    return 'var ' + n + ' = 1; // POOLVAR: ' + n;
  }).join('\n');

  var modeRule = isInteractive
    ? I18N.t('jxg.prompt_rule5_interactive')
    : I18N.t('jxg.prompt_rule5_display');

  var optSummary = [
    optAxis  ? I18N.t('jxg.opt_axes_on') : I18N.t('jxg.opt_axes_off'),
    optGrid  ? I18N.t('jxg.opt_grid_on') : I18N.t('jxg.opt_grid_off'),
    optOrtho ? I18N.t('jxg.opt_ortho_on') : '',
    optNav   ? I18N.t('jxg.opt_nav_on') : I18N.t('jxg.opt_nav_off'),
    optPan   ? I18N.t('jxg.opt_pan_on') : I18N.t('jxg.opt_pan_off'),
    stepX        ? I18N.t('jxg.opt_stepx', {v: stepX}) : '',
    stepY        ? I18N.t('jxg.opt_stepy', {v: stepY}) : '',
    optReticule  ? I18N.t('jxg.opt_reticule_on') : ''
  ].filter(Boolean).join(', ');

  // Snippet réticule à inclure tel quel dans le squelette
  var reticuleSnippet = optReticule
    ? I18N.t('jxg.prompt_reticule_comment') + '\n'
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
I18N.t('jxg.prompt_intro') + '\n'
+ '\n'
+ I18N.t('jxg.prompt_rules_header') + '\n'
+ I18N.t('jxg.prompt_rule1', {w: w, h: h}) + '\n'
+ I18N.t('jxg.prompt_rule2') + '\n'
+ I18N.t('jxg.prompt_rule3') + '\n'
+ I18N.t('jxg.prompt_rule4') + '\n'
+ modeRule + '\n'
+ '\n'
+ I18N.t('jxg.prompt_config_header') + '\n'
+ I18N.t('jxg.prompt_window', {xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax}) + '\n'
+ I18N.t('jxg.prompt_options', {opts: optSummary}) + '\n'
+ '\n'
+ I18N.t('jxg.prompt_vars_header') + '\n'
+ varBlock + '\n'
+ '\n'
+ I18N.t('jxg.prompt_skeleton_header') + '\n'
+ '<div id="box" style="width:' + w + ';height:' + h + ';"></div>\n'
+ '<script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>\n'
+ '<script>\n'
+ 'var board = JXG.JSXGraph.initBoard(\'box\', {\n'
+ boardConfig + '\n'
+ '});\n'
+ 'board.suspendUpdate();\n'
+ (varInit ? varInit + '\n' : '')
+ I18N.t('jxg.prompt_draw_here') + '\n'
+ (reticuleSnippet ? reticuleSnippet : '')
+ 'board.unsuspendUpdate();\n'
+ '</script>\n'
+ '\n'
+ I18N.t('jxg.prompt_request_header') + '\n'
+ (desc || I18N.t('jxg.prompt_no_desc')) + '\n'
+ '\n'
+ I18N.t('jxg.prompt_footer');

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

// ── Conversion JSXGraph classique → STACK ────────────────────
// Le code collé par l'utilisateur est du JSXGraph "classique" (généré par une
// IA généraliste qui ne connaît pas la syntaxe STACK). Ces helpers l'analysent
// mécaniquement (regex) pour produire un bloc [[jsxgraph]] valide : ils ne
// comprennent pas le dessin, ils ne font que renommer/encadrer.

function _jxgExtractBoardId(code) {
  var m = /JXG\.JSXGraph\.initBoard\(\s*['"]([^'"]+)['"]/.exec(code);
  return m ? m[1] : null;
}

function _jxgFindBoardVarName(js) {
  var m = /(?:var|let|const)\s+(\w+)\s*=\s*JXG\.JSXGraph\.initBoard/.exec(js);
  return m ? m[1] : null;
}

// Le prompt demande à l'IA d'entourer sa réponse d'un bloc markdown ```
// (pour que les interfaces de chat l'affichent en texte au lieu de l'exécuter) —
// on retire ce fencing avant analyse s'il a été collé tel quel.
function _jxgStripMdFences(code) {
  var s = String(code || '').trim();
  s = s.replace(/^```[^\n]*\n?/, '');
  s = s.replace(/\n?```\s*$/, '');
  return s.trim();
}

// Si l'utilisateur colle une page complète (div + <script src=jsxgraphcore.js>
// + <script>…</script>), n'en garde que le JS des <script> SANS attribut src
// (le loader de la bibliothèque est ignoré). S'il n'y a aucune balise <script>,
// on suppose que le champ ne contient déjà que du JS brut.
function _jxgExtractJs(code) {
  code = _jxgStripMdFences(code);
  var re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  var m, found = false, parts = [];
  while ((m = re.exec(code))) {
    found = true;
    if (/\bsrc\s*=/i.test(m[1] || '')) continue;
    parts.push(m[2]);
  }
  return (found ? parts.join('\n') : code).trim();
}

// Construit un document HTML autonome pour l'aperçu live (iframe sandboxée).
// Les jetons {#nom#} (injection Maxima, invalides en JS brut) sont neutralisés
// par une valeur factice — uniquement pour l'aperçu, jamais pour la conversion.
function _jxgBuildPreviewHTML(code, w, h) {
  var js = _jxgExtractJs(code).replace(/\{#\s*([A-Za-z_]\w*)\s*#\}/g, '1');
  var boardId = _jxgExtractBoardId(js) || 'box';
  var wPx = parseInt(w, 10) || 600;
  var hPx = parseInt(h, 10) || 400;
  var idJson = JSON.stringify(boardId);
  return '<!doctype html><html><head><meta charset="utf-8">'
    + '<link rel="stylesheet" href="lib/jsxgraph/jsxgraph.css">'
    + '<style>html,body{margin:0;padding:0;}#' + boardId + '{width:' + wPx + 'px;height:' + hPx + 'px;}</style>'
    + '</head><body>'
    + '<div id="' + boardId + '"></div>'
    + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
    + '<script>(function(){ try { ' + js + ' } catch(e) { '
    + 'var el = document.getElementById(' + idJson + '); '
    + 'if (el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; '
    + 'console.error(e); } })();<\/script>'
    + '</body></html>';
}

function jxgPreviewCode() {
  var code = document.getElementById('jxg-code-in').value.trim();
  if (!code) { toast(I18N.t('jxg.preview_first')); return; }
  var html = _jxgBuildPreviewHTML(code, _jxgVal('jxg-w', '600'), _jxgVal('jxg-h', '400'));
  var wrap = document.getElementById('jxg-live-preview');
  if (wrap) wrap.style.display = 'block';
  mountPreviewIframeScripted('jxg-live-preview', html);
}

// Filtre mécanique : JSXGraph classique → bloc [[jsxgraph]] STACK.
// - id littéral de initBoard (et ses autres occurrences) → variable divid
// - "var x = val; // POOLVAR: x" → "var x = {#x#};"
// - encadrement suspendUpdate/unsuspendUpdate si absent
function jxgConvertClassicToStack(code) {
  var w = _jxgVal('jxg-w', '600');
  var h = _jxgVal('jxg-h', '400');
  var js = _jxgExtractJs(code);

  var boardId = _jxgExtractBoardId(js);
  if (boardId) {
    var escId = boardId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    js = js.replace(new RegExp("(JXG\\.JSXGraph\\.initBoard\\(\\s*)['\"]" + escId + "['\"]"), '$1divid');
    js = js.replace(new RegExp("(['\"])" + escId + "\\1", 'g'), 'divid');
  }

  js = js.replace(/var\s+(\w+)\s*=\s*[^;]+;(\s*\/\/\s*POOLVAR:\s*\1\b[^\n]*)/g, 'var $1 = {#$1#};');

  if (js.indexOf('suspendUpdate') === -1) {
    var boardVar = _jxgFindBoardVarName(js);
    if (boardVar) {
      js = js.replace(/(JXG\.JSXGraph\.initBoard\([\s\S]*?\)\s*;)/, '$1\n' + boardVar + '.suspendUpdate();');
      js = js.replace(/\s*$/, '') + '\n' + boardVar + '.unsuspendUpdate();';
    }
  }

  return '[[jsxgraph width="' + w + 'px" height="' + h + 'px"]]\n' + js.trim() + '\n[[/jsxgraph]]';
}

// Un <script> n'est jamais entity-échappé par le sérialiseur HTML (contrairement
// à du texte dans un <div>/<pre>) : c'est ce qui permet au code (avec ses < > &)
// de survivre intact à l'aller-retour .innerHTML fait par confirmRich(). Le
// wrapper visuel (badge) est jeté ici ; le code brut est réinjecté tel quel.
function _jxgUnwrapBlocks(html) {
  if (!html || html.indexOf('jxg-inserted-block') === -1) return html;
  return html.replace(/<div class="jxg-inserted-wrap"[^>]*>[\s\S]*?<script[^>]*class="jxg-inserted-block"[^>]*>([\s\S]*?)<\/script>[\s\S]*?<\/div>/gi, function(m, code) {
    return code.replace(/<\\\/script/gi, '</script');
  });
}

function jxgInsertCode() {
  const code = document.getElementById('jxg-code-in').value.trim();
  if (!code) { toast(I18N.t('jxg.paste_first')); return; }
  const stackCode = jxgConvertClassicToStack(code).replace(/<\/script/gi, '<\\/script');
  const html = '<div class="jxg-inserted-wrap" contenteditable="false">'
    + '<span class="jxg-block-badge">📊 JSXGraph (converti STACK)</span>'
    + '<script type="text/plain" class="jxg-inserted-block">' + stackCode + '</script>'
    + '</div><p><br></p>';
  closeJsxGraphModal();
  const tgt = (typeof _verifZoneActive !== 'undefined' && _verifZoneActive) || richEditor();
  restoreRichSelection(tgt);
  document.execCommand('insertHTML', false, html);
  if (typeof _verifZoneActive !== 'undefined') _verifZoneActive = null;
}
