// ── PRT MANAGER v3 — arbre interactif avec drag & drop ──────────────

var _prtQid = null, _prtNodes = [], _prtMeta = {}, _prtSelectedNode = -1;
var _prtInlineMode = false; // true = body transplanted inline, skip modal close
var _prtPos = [];          // [{cx,cy}] positions actuelles (mutables)
var _prtNameToIdx = {};    // name → array index
var _prtDrag      = null;  // état de drag (simple ou multi)
var _prtRubber    = null;  // sélection par zone {x0,y0,x1,y1} coords SVG
var _prtSelection = [];    // indices sélectionnés pour déplacement groupe
var _prtZoom      = 1.0;   // niveau de zoom SVG

var PRT_R    = 28;
var PRT_SLOT = 120;
var PRT_ROW  = 130;
var PRT_PAD  = 52;

// ── DESCRIPTIONS DES TESTS ──────────────────────────────────────────
// Valeurs = clés i18n (résolues à l'affichage via I18N.t pour suivre la langue active).
var PRT_AT_HELP_KEYS = {
  'AlgEquiv':    'prt.help_algequiv',
  'EqualComAss': 'prt.help_equalcomass',
  'CasEquiv':    'prt.help_casequiv',
  'SubstEquiv':  'prt.help_substequiv',
  'ExpandEquiv': 'prt.help_expandequiv',
  'FacForm':     'prt.help_facform',
  'SameType':    'prt.help_sametype',
  'Equiv':       'prt.help_equiv',
  'LowestTerms': 'prt.help_lowestterms',
  'Diff':        'prt.help_diff',
  'Int':         'prt.help_int',
  'String':      'prt.help_string',
  'StringSloppy':'prt.help_stringsloppy',
  'RegExp':      'prt.help_regexp',
  'NumAbsolute': 'prt.help_numabsolute',
  'NumRelative': 'prt.help_numrelative',
  'NumSigFigs':  'prt.help_numsigfigs',
  'UnitsAbsolute':'prt.help_unitsabsolute',
  'UnitsRelative':'prt.help_unitsrelative',
  'UnitsSigFigs': 'prt.help_unitssigfigs',
  'GT':          'prt.help_gt',
  'GTE':         'prt.help_gte',
  'Sets':        'prt.help_sets',
};
var PRT_ANSWER_TESTS = Object.keys(PRT_AT_HELP_KEYS);

// ── PARSE XML ────────────────────────────────────────────────────────
function parsePrtXml(xmlStr) {
  if (!xmlStr) return null;
  var doc;
  try { doc = (new DOMParser()).parseFromString('<root>'+xmlStr.trim()+'</root>', 'text/xml'); }
  catch(e) { return null; }
  var prt = doc.querySelector('prt');
  if (!prt) return null;
  function gt(el,sel,fb){ var f=el.querySelector(sel); return f?(f.textContent||(fb===undefined?'':fb)):(fb===undefined?'':fb); }
  var meta = {
    name: gt(prt,':scope > name'), value: gt(prt,':scope > value','1'),
    autosimplify: gt(prt,':scope > autosimplify','1'),
    feedbackstyle: gt(prt,':scope > feedbackstyle','2'),
    feedbackvariables: gt(prt,'feedbackvariables > text',''),
  };
  var nodes = [];
  prt.querySelectorAll('node').forEach(function(n){
    var tfb=n.querySelector('truefeedback text'), ffb=n.querySelector('falsefeedback text');
    nodes.push({ name:gt(n,':scope > name'), description:gt(n,'description'),
      answertest:gt(n,'answertest','AlgEquiv'), sans:gt(n,'sans'), tans:gt(n,'tans'),
      testoptions:gt(n,'testoptions'), quiet:gt(n,'quiet','0'),
      truescoremode:gt(n,'truescoremode','='), truescore:gt(n,'truescore','1'),
      truepenalty:gt(n,'truepenalty',''), truenextnode:gt(n,'truenextnode','-1'),
      trueanswernote:gt(n,'trueanswernote',''), truefeedback:tfb?tfb.textContent:'',
      falsescoremode:gt(n,'falsescoremode','='), falsescore:gt(n,'falsescore','0'),
      falsepenalty:gt(n,'falsepenalty',''), falsenextnode:gt(n,'falsenextnode','-1'),
      falseanswernote:gt(n,'falseanswernote',''), falsefeedback:ffb?ffb.textContent:'',
    });
  });
  return { meta, nodes };
}

// ── BUILD XML ────────────────────────────────────────────────────────
function buildPrtXml(meta, nodes) {
  function cd(s){return (s||'').replace(/]]>/g,']]]]><![CDATA[>');}
  var x = '    <prt>\n';
  x += '      <name>'+meta.name+'</name>\n<value>'+meta.value+'</value>\n';
  x += '      <autosimplify>'+meta.autosimplify+'</autosimplify>\n';
  x += '      <feedbackstyle>'+meta.feedbackstyle+'</feedbackstyle>\n';
  x += '      <feedbackvariables>\n        <text><![CDATA['+cd(meta.feedbackvariables)+']]></text>\n      </feedbackvariables>\n';
  nodes.forEach(function(n){
    x+='      <node>\n<name>'+n.name+'</name>\n<description>'+(n.description||'')+'</description>\n';
    x+='<answertest>'+n.answertest+'</answertest>\n<sans>'+n.sans+'</sans>\n<tans>'+n.tans+'</tans>\n';
    x+='<testoptions>'+(n.testoptions||'')+'</testoptions>\n<quiet>'+(n.quiet||'0')+'</quiet>\n';
    x+='<truescoremode>'+n.truescoremode+'</truescoremode>\n<truescore>'+n.truescore+'</truescore>\n';
    x+='<truepenalty>'+(n.truepenalty||'')+'</truepenalty>\n<truenextnode>'+n.truenextnode+'</truenextnode>\n';
    x+='<trueanswernote>'+n.trueanswernote+'</trueanswernote>\n';
    x+='<truefeedback format="html">\n  <text><![CDATA['+cd(n.truefeedback)+']]></text>\n</truefeedback>\n';
    x+='<falsescoremode>'+n.falsescoremode+'</falsescoremode>\n<falsescore>'+n.falsescore+'</falsescore>\n';
    x+='<falsepenalty>'+(n.falsepenalty||'')+'</falsepenalty>\n<falsenextnode>'+n.falsenextnode+'</falsenextnode>\n';
    x+='<falseanswernote>'+n.falseanswernote+'</falseanswernote>\n';
    x+='<falsefeedback format="html">\n  <text><![CDATA['+cd(n.falsefeedback)+']]></text>\n</falsefeedback>\n';
    x+='      </node>\n';
  });
  return x + '    </prt>';
}

// ── OPEN / CLOSE ─────────────────────────────────────────────────────
function openPrtManager(qid) {
  var q = questions[qid];
  if (!q || (!q.prtXML && !q.prt)) { if(typeof toast==='function') toast(I18N.t('prt.toast_save_first')); return; }
  // Types migrés (ex: Base N) exposent déjà q.prt en JSON (meta+nodes) : on l'utilise
  // directement, sans repasser par un parsing XML fragile. Fallback XML pour les
  // types pas encore migrés.
  var parsed = q.prt ? { meta: q.prt.meta, nodes: q.prt.nodes } : parsePrtXml(q.prtXML);
  if (!parsed) { if(typeof toast==='function') toast(I18N.t('prt.toast_xml_unreadable')); return; }
  _prtQid = qid; _prtMeta = Object.assign({}, parsed.meta);
  _prtNodes = parsed.nodes.map(function(n){ return Object.assign({},n); });
  _prtSelectedNode = -1; _prtPos = []; _prtDrag = null; _prtZoom = 1.0;
  document.getElementById('prt-mngr-title').textContent = I18N.t('prt.mngr_title', {qid: qid, type: (q.type)||''});
  document.getElementById('prt-manager-modal').style.display = 'flex';
  if (typeof FocusTrap !== 'undefined') FocusTrap.trap(document.getElementById('prt-manager-modal'), closePrtManager);
  _prtInitLayout();
  renderPrtSvg();
  renderNodeEditorPlaceholder();
  var _fbvIn=document.getElementById('prt-fbvars-input');
  if(_fbvIn) _fbvIn.value=_prtMeta.feedbackvariables||'';
  _prtUpdateZoomLabel();
  /* Zoom à la molette */
  var wrap = document.getElementById('prt-tree-svg-wrap');
  if (wrap) {
    wrap.removeEventListener('wheel', _prtOnWheel);
    wrap.addEventListener('wheel', _prtOnWheel, {passive: false});
  }
}

function closePrtManager(_skipValidation) {
  // Sécurité demandée : on ne ferme pas silencieusement un arbre cassé
  // (nœud orphelin ou boucle infinie) — sauf si on vient déjà de valider
  // via savePrtManager() (qui appelle closePrtManager(true) pour éviter
  // de redemander deux fois la même confirmation).
  if (!_skipValidation && _prtNodes.length) {
    var g = _prtValidateGraph();
    if (!g.ok) {
      var gmsg = _prtGraphErrorMsg(g);
      if (!confirm('⚠️ '+gmsg+'\n\n'+I18N.t('prt.confirm_close_anyway'))) return;
    }
  }
  document.removeEventListener('mousemove', _prtOnDragMove);
  document.removeEventListener('mouseup',   _prtOnDragEnd);
  document.removeEventListener('mousemove', _prtRubberMove);
  document.removeEventListener('mouseup',   _prtRubberEnd);
  document.removeEventListener('mousemove', _prtResizeMove);
  document.removeEventListener('mouseup',   _prtResizeEnd);
  var wrap = document.getElementById('prt-tree-svg-wrap');
  if (wrap) wrap.removeEventListener('wheel', _prtOnWheel);
  document.getElementById('prt-manager-modal').style.display = 'none';
  if (typeof FocusTrap !== 'undefined') FocusTrap.release();
  _prtHideTooltip();
  _prtQid=null; _prtNodes=[]; _prtMeta={}; _prtSelectedNode=-1;
  _prtPos=[]; _prtDrag=null; _prtRubber=null; _prtSelection=[];
}

// ── LAYOUT ───────────────────────────────────────────────────────────
function _prtInitLayout() {
  var nameToIdx = {};
  _prtNodes.forEach(function(n,i){ nameToIdx[n.name]=i; });
  _prtNameToIdx = nameToIdx;

  var N = _prtNodes.length;
  if (!N) { _prtPos = []; return; }

  // 1. Longest-path depth assignment (N passes = handles any DAG)
  //    Each node gets depth = longest path from root to it.
  //    This ensures shared children appear below ALL their parents.
  var dep = new Array(N).fill(-1);
  dep[0] = 0;
  for (var pass = 0; pass < N; pass++) {
    _prtNodes.forEach(function(n, i) {
      if (dep[i] < 0) return;
      [n.truenextnode, n.falsenextnode].forEach(function(nx) {
        var ni = nameToIdx[String(nx)];
        if (ni !== undefined && dep[ni] < dep[i] + 1) dep[ni] = dep[i] + 1;
      });
    });
  }
  _prtNodes.forEach(function(n, i) { if (dep[i] < 0) dep[i] = 0; });

  var maxDep = Math.max.apply(null, dep);

  // 2. Group by depth
  var levels = [];
  for (var d = 0; d <= maxDep; d++) levels.push([]);
  _prtNodes.forEach(function(n, i) { levels[dep[i]].push(i); });

  // 3. Sort each level by bary-center of parents to minimise crossing arrows.
  //    True branch gets slight left bias (-0.25), false branch slight right bias (+0.25).
  var xSlot = new Array(N).fill(0);
  levels.forEach(function(level, d) {
    if (d === 0) { level.forEach(function(i, j) { xSlot[i] = j; }); return; }
    var scored = level.map(function(i) {
      var pxs = [];
      _prtNodes.forEach(function(pn, pi) {
        if (dep[pi] !== d - 1) return;
        var tn = nameToIdx[String(pn.truenextnode)];
        var fn = nameToIdx[String(pn.falsenextnode)];
        if (tn === i) pxs.push(xSlot[pi] - 0.25);
        if (fn === i) pxs.push(xSlot[pi] + 0.25);
      });
      return { i: i, s: pxs.length ? pxs.reduce(function(a,b){return a+b;},0)/pxs.length : 999 };
    });
    scored.sort(function(a, b) { return a.s - b.s; });
    scored.forEach(function(item, j) { xSlot[item.i] = j; });
  });

  // 4. Dynamic slot width: fit the widest level within available screen width.
  var maxW = Math.max.apply(null, levels.map(function(l) { return l.length; }));
  var availW = Math.max(400, window.innerWidth - 450); // tree panel ≈ screen - editor - scrollbar
  // Min 90 keeps FIN indicators of adjacent nodes non-overlapping
  var SLOT = Math.max(90, Math.min(PRT_SLOT, Math.floor((availW - 2 * PRT_PAD) / Math.max(maxW, 1))));

  // 5. Pixel positions: arbre centré horizontalement dans availW.
  var treeW = (maxW - 1) * SLOT;
  var leftOff = Math.max(PRT_PAD + PRT_R, Math.round((availW - treeW) / 2));
  _prtPos = new Array(N).fill(null);
  levels.forEach(function(level, d) {
    var cnt = level.length;
    var off = (treeW - (cnt - 1) * SLOT) / 2; // centre ce niveau dans treeW
    level.forEach(function(nodeIdx) {
      _prtPos[nodeIdx] = {
        cx: leftOff + off + xSlot[nodeIdx] * SLOT,
        cy: PRT_PAD + d * PRT_ROW + PRT_R
      };
    });
  });
}

function _ni(name) {
  if(name==='-1'||name===-1||name===undefined) return -1;
  var i=_prtNameToIdx[String(name)];
  return (i!==undefined)?i:-1;
}

// ── SVG RENDERING ────────────────────────────────────────────────────
function renderPrtSvg() {
  var wrap = document.getElementById('prt-tree-svg-wrap');
  if (!wrap) return;
  if (!_prtNodes.length) { wrap.innerHTML='<p class="prt-tree-empty">'+I18N.t('prt.tree_empty')+'</p>'; return; }

  var bounds = _prtBounds();
  var svgW = bounds.maxX + PRT_PAD + 60;
  var svgH = bounds.maxY + PRT_ROW  + PRT_PAD + 20;

  var parts = ['<defs>',
    '<filter id="prt-sel-glow" x="-40%" y="-40%" width="180%" height="180%">',
    '<feGaussianBlur stdDeviation="4" result="blur"/>',
    '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>',
    '</filter>',
    '<filter id="prt-node-shadow" x="-20%" y="-20%" width="140%" height="140%">',
    '<feDropShadow dx="1" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>',
    '</filter>',
    '<marker id="prt-arr-t" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">',
    '<polygon points="0 0,9 3.5,0 7" fill="#16a34a"/></marker>',
    '<marker id="prt-arr-f" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">',
    '<polygon points="0 0,9 3.5,0 7" fill="#dc2626"/></marker>',
    '</defs>'];

  // Arrows layer (sous les nœuds)
  _prtNodes.forEach(function(n,i){
    parts.push(_renderArrowHtml(n,i,'t'));
    parts.push(_renderArrowHtml(n,i,'f'));
  });
  // Nodes layer
  _prtNodes.forEach(function(n,i){ parts.push(_renderNodeHtml(n,i)); });

  wrap.innerHTML = '<svg id="prt-svg"'
    +' viewBox="0 0 '+svgW+' '+svgH+'"'
    +' width="'+Math.round(svgW*_prtZoom)+'" height="'+Math.round(svgH*_prtZoom)+'"'
    +' xmlns="http://www.w3.org/2000/svg">'+parts.join('')+'</svg>';

  // Bind node events (stopPropagation prevents SVG pan from firing on node clicks)
  _prtNodes.forEach(function(n,i){
    var g=document.getElementById('prt-node-'+i);
    if(!g) return;
    g.addEventListener('mousedown', function(e){ _prtStartDrag(e,i); });
    g.addEventListener('mouseenter', function(e){ _prtShowTooltip(e,i); });
    g.addEventListener('mouseleave', _prtHideTooltip);
  });

  // Bind rubber-band sur le fond SVG (les nœuds font stopPropagation donc ça ne part pas sur les nœuds)
  var svg = document.getElementById('prt-svg');
  if (svg) svg.addEventListener('mousedown', _prtRubberStart);

  _prtUpdateScoreBanner();
}

function _prtAtAbbr(at) {
  return (at||'')
    .replace('AlgEquiv','AlgEq').replace('EqualComAss','EqCA').replace('ExpandEquiv','ExpEq')
    .replace('NumAbsolute','NumAbs').replace('NumRelative','NumRel').replace('NumSigFigs','NumSF')
    .replace('UnitsAbsolute','UnitAbs').replace('UnitsRelative','UnitRel').replace('UnitsSigFigs','UnitSF')
    .replace('LowestTerms','LowT').replace('StringSloppy','StrSlp').replace('SubstEquiv','SubEq');
}

function _fmtScore(sMode, score) {
  var n = parseFloat(score);
  return sMode + (isNaN(n) ? (score||'0') : +n.toFixed(4));
}

function _renderNodeHtml(n, i) {
  var p = _prtPos[i];
  var sel = (i === _prtSelectedNode);
  var isRoot = (i === 0);
  var fill   = sel ? '#1e3a8a' : '#1d4ed8';
  var stroke = sel ? '#93c5fd' : (isRoot ? '#fbbf24' : '#e2e8f0');
  var sw     = sel ? 4 : (isRoot ? 3 : 2);
  var filt   = sel ? ' filter="url(#prt-sel-glow)"' : ' filter="url(#prt-node-shadow)"';
  var atShort = _prtAtAbbr(n.answertest||'AlgEquiv');

  return '<g id="prt-node-'+i+'" transform="translate('+p.cx+','+p.cy+')" style="cursor:grab" data-idx="'+i+'">'
    + '<circle r="'+PRT_R+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"'+filt+'/>'
    + '<text text-anchor="middle" y="-5" font-size="14" font-weight="800" fill="white"'
    +   ' font-family="\'Courier New\',monospace" pointer-events="none">'+_hesc(n.name)+'</text>'
    + '<text text-anchor="middle" y="11" font-size="7.5" fill="rgba(255,255,255,0.78)" pointer-events="none">'+_hesc(atShort)+'</text>'
  + '</g>';
}

function _renderArrowHtml(n, i, br) {
  var isTrue   = br==='t';
  var color    = isTrue ? '#16a34a' : '#dc2626';
  var arrId    = isTrue ? 'prt-arr-t' : 'prt-arr-f';
  var dash     = isTrue ? '' : ' stroke-dasharray="8 4"';
  var nextName = isTrue ? n.truenextnode  : n.falsenextnode;
  var sMode    = isTrue ? n.truescoremode : n.falsescoremode;
  var score    = isTrue ? n.truescore     : n.falsescore;
  var label    = _fmtScore(sMode, score);
  var u        = isTrue ? 0.32 : 0.68;   /* labels décalés sur la courbe */

  var p  = _prtPos[i];
  var xp = _exitPt(p, isTrue);
  var ex = xp.x, ey = xp.y;

  var ni = _ni(nextName);
  var pathD, lx, ly, endHtml = '';

  if (ni >= 0) {
    var ept = _getEntryPt(ni, i, br);
    var tx = ept.x, ty = ept.y;
    pathD = _bezier(ex, ey, xp.dx, xp.dy, tx, ty, ept.angDeg);
    lx = ex + (tx - ex) * u;
    ly = ey + (ty - ey) * u;
  } else {
    var ep = _endPos(ex, ey, xp.dx, xp.dy);
    pathD = _bezier(ex, ey, xp.dx, xp.dy, ep.x, ep.y - 14);
    lx = ex + (ep.x - ex) * u;
    ly = ey + (ep.y - 14 - ey) * u;
    /* Badge FIN rectangulaire */
    endHtml =
      '<rect id="prt-endc-'+i+'-'+br+'" x="'+(ep.x-18)+'" y="'+(ep.y-12)+'" width="36" height="22" rx="6"'
      +' fill="'+color+'" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>'
      +'<text id="prt-endt-'+i+'-'+br+'" x="'+ep.x+'" y="'+(ep.y+1)+'" text-anchor="middle" dominant-baseline="middle"'
      +' font-size="9.5" fill="white" font-weight="800" pointer-events="none">'+I18N.t('prt.end_label')+'</text>';
  }

  /* Fond sombre derrière le label pour lisibilité */
  var lw = Math.max(28, label.length * 6.5 + 10);
  return '<path id="prt-arr-'+i+'-'+br+'" d="'+pathD+'" stroke="'+color+'" stroke-width="2.5" fill="none" marker-end="url(#'+arrId+')" opacity="0.92"'+dash+'/>'
    + '<rect id="prt-labr-'+i+'-'+br+'" x="'+(lx-lw/2).toFixed(1)+'" y="'+(ly-8).toFixed(1)+'" width="'+lw+'" height="16" rx="4" fill="rgba(10,12,26,0.78)" pointer-events="none"/>'
    + '<text id="prt-lab-'+i+'-'+br+'" x="'+lx.toFixed(1)+'" y="'+(ly+1).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle"'
    +' font-size="10" font-weight="700" fill="'+color+'" pointer-events="none">'+label+'</text>'
    + endHtml;
}

// ── ARROW UPDATES (live pendant drag) ────────────────────────────────
function _prtUpdateArrows(movedIdx) {
  _prtUpdateNodeArrows(movedIdx);
  _prtNodes.forEach(function(n,i){
    if(i===movedIdx) return;
    if(_ni(n.truenextnode)===movedIdx || _ni(n.falsenextnode)===movedIdx) _prtUpdateNodeArrows(i);
  });
  _prtResizeSvg();
}

function _prtUpdateNodeArrows(i) {
  var n=_prtNodes[i], p=_prtPos[i];
  ['t','f'].forEach(function(br){
    var isTrue=br==='t';
    var nextName = isTrue?n.truenextnode:n.falsenextnode;
    var u = isTrue ? 0.32 : 0.68;
    var xp = _exitPt(p, isTrue);
    var ex = xp.x, ey = xp.y;
    var ni = _ni(nextName);
    var pathEl = document.getElementById('prt-arr-'+i+'-'+br);
    var labrEl = document.getElementById('prt-labr-'+i+'-'+br);
    var labEl  = document.getElementById('prt-lab-'+i+'-'+br);
    var endcEl = document.getElementById('prt-endc-'+i+'-'+br);
    var endtEl = document.getElementById('prt-endt-'+i+'-'+br);

    function _setLabel(lx, ly) {
      if(labEl)  { labEl.setAttribute('x',lx.toFixed(1)); labEl.setAttribute('y',(ly+1).toFixed(1)); }
      if(labrEl) {
        var lw = Math.max(28, ((labEl&&labEl.textContent)||'').length * 6.5 + 10);
        labrEl.setAttribute('x',(lx-lw/2).toFixed(1)); labrEl.setAttribute('y',(ly-8).toFixed(1));
        labrEl.setAttribute('width',lw);
      }
    }

    if(ni>=0){
      var ept=_getEntryPt(ni,i,br), tx=ept.x, ty=ept.y;
      if(pathEl) pathEl.setAttribute('d', _bezier(ex,ey,xp.dx,xp.dy,tx,ty,ept.angDeg));
      _setLabel(ex+(tx-ex)*u, ey+(ty-ey)*u);
      if(endcEl) endcEl.setAttribute('display','none');
      if(endtEl) endtEl.setAttribute('display','none');
    } else {
      var ep=_endPos(ex,ey,xp.dx,xp.dy);
      if(pathEl) pathEl.setAttribute('d', _bezier(ex,ey,xp.dx,xp.dy,ep.x,ep.y-14));
      _setLabel(ex+(ep.x-ex)*u, ey+(ep.y-14-ey)*u);
      if(endcEl) { endcEl.setAttribute('display',''); endcEl.setAttribute('x',(ep.x-18)); endcEl.setAttribute('y',(ep.y-12)); }
      if(endtEl) { endtEl.setAttribute('display',''); endtEl.setAttribute('x',ep.x); endtEl.setAttribute('y',(ep.y+1)); }
    }
  });
}

function _prtResizeSvg() {
  var svg=document.getElementById('prt-svg'); if(!svg) return;
  var bounds=_prtBounds();
  var w=Math.max(bounds.maxX+PRT_PAD+60, 300);
  var h=Math.max(bounds.maxY+PRT_ROW+PRT_PAD+20, 200);
  svg.setAttribute('viewBox','0 0 '+w+' '+h);
  svg.setAttribute('width', Math.round(w*_prtZoom));
  svg.setAttribute('height',Math.round(h*_prtZoom));
}

// ── ZOOM ─────────────────────────────────────────────────────────────
function _prtApplyZoom() {
  _prtResizeSvg();
  _prtUpdateZoomLabel();
}
function prtZoomIn()    { _prtZoom = Math.min(4.0, parseFloat((_prtZoom*1.25).toFixed(2))); _prtApplyZoom(); }
function prtZoomOut()   { _prtZoom = Math.max(0.2, parseFloat((_prtZoom*0.8).toFixed(2)));  _prtApplyZoom(); }
function prtZoomReset() { _prtZoom = 1.0; _prtApplyZoom(); }
function _prtUpdateZoomLabel() {
  var el = document.getElementById('prt-zoom-label');
  if (el) el.textContent = Math.round(_prtZoom*100)+'%';
}
function _prtOnWheel(e) {
  e.preventDefault();
  var factor = e.deltaY < 0 ? 1.1 : 0.909;
  _prtZoom = Math.max(0.2, Math.min(4.0, parseFloat((_prtZoom*factor).toFixed(3))));
  _prtApplyZoom();
}

function _prtBounds() {
  var maxX=0, maxY=0;
  _prtNodes.forEach(function(n,i){
    var p=_prtPos[i]; if(!p) return;
    maxX=Math.max(maxX, p.cx+PRT_R);
    maxY=Math.max(maxY, p.cy+PRT_R);
    // END indicators
    ['truenextnode','falsenextnode'].forEach(function(k,j){
      if(n[k]==='-1'){
        var isTrue=(j===0);
        var xp=_exitPt(p, isTrue);
        var ep=_endPos(xp.x, xp.y, xp.dx, xp.dy);
        maxX=Math.max(maxX, ep.x+16); maxY=Math.max(maxY, ep.y+16);
      }
    });
  });
  return {maxX, maxY};
}

// ── DRAG (simple ou multi-nœuds) ─────────────────────────────────────
function _prtStartDrag(e, idx) {
  if (e.button !== 0) return;
  e.preventDefault(); e.stopPropagation();
  _prtHideTooltip();
  var svg = document.getElementById('prt-svg');
  var sp  = _svgPt(svg, e.clientX, e.clientY);
  var inSel = _prtSelection.indexOf(idx) >= 0;
  var isMulti = inSel && _prtSelection.length > 1;
  if (isMulti) {
    // Mémorise la position d'origine de chaque nœud sélectionné
    var orig = {};
    _prtSelection.forEach(function(i){ orig[i]={cx:_prtPos[i].cx, cy:_prtPos[i].cy}; });
    _prtDrag = {multi:true, idx:idx, sx:sp.x, sy:sp.y, orig:orig, moved:false};
  } else {
    _prtDrag = {multi:false, idx:idx, sx:sp.x, sy:sp.y, ox:_prtPos[idx].cx, oy:_prtPos[idx].cy, moved:false};
  }
  document.addEventListener('mousemove', _prtOnDragMove);
  document.addEventListener('mouseup',   _prtOnDragEnd);
}

function _prtOnDragMove(e) {
  if (!_prtDrag) return;
  e.preventDefault();
  var svg = document.getElementById('prt-svg'); if (!svg) return;
  var sp  = _svgPt(svg, e.clientX, e.clientY);
  var dx  = sp.x - _prtDrag.sx, dy = sp.y - _prtDrag.sy;
  if (!_prtDrag.moved && Math.abs(dx)<4 && Math.abs(dy)<4) return;
  _prtDrag.moved = true;
  svg.classList.add('prt-panning');

  if (_prtDrag.multi) {
    // Déplace tous les nœuds sélectionnés
    _prtSelection.forEach(function(i) {
      var o = _prtDrag.orig[i];
      var nx = Math.max(PRT_R+4, o.cx+dx), ny = Math.max(PRT_R+4, o.cy+dy);
      _prtPos[i] = {cx:nx, cy:ny};
      var g = document.getElementById('prt-node-'+i);
      if (g) g.setAttribute('transform','translate('+nx+','+ny+')');
    });
    // Met à jour les flèches des nœuds déplacés ET de leurs voisins
    var moved = _prtSelection;
    _prtNodes.forEach(function(n,i){
      if (moved.indexOf(i)>=0 || moved.indexOf(_ni(n.truenextnode))>=0 || moved.indexOf(_ni(n.falsenextnode))>=0)
        _prtUpdateNodeArrows(i);
    });
    _prtResizeSvg();
  } else {
    var newCx = Math.max(PRT_R+4, _prtDrag.ox+dx);
    var newCy = Math.max(PRT_R+4, _prtDrag.oy+dy);
    _prtPos[_prtDrag.idx] = {cx:newCx, cy:newCy};
    var g = document.getElementById('prt-node-'+_prtDrag.idx);
    if (g) g.setAttribute('transform','translate('+newCx+','+newCy+')');
    _prtUpdateArrows(_prtDrag.idx);
  }
}

function _prtOnDragEnd(e) {
  document.removeEventListener('mousemove', _prtOnDragMove);
  document.removeEventListener('mouseup',   _prtOnDragEnd);
  var moved   = _prtDrag && _prtDrag.moved;
  var idx     = _prtDrag ? _prtDrag.idx : -1;
  var wasMulti = _prtDrag && _prtDrag.multi;
  _prtDrag = null;
  var svg = document.getElementById('prt-svg');
  if (svg) svg.classList.remove('prt-panning');
  if (!moved && idx >= 0) {
    // Simple clic : ouvre l'éditeur et remet la sélection sur ce nœud seul
    if (!wasMulti) _prtClearSelection();
    prtSelectNode(idx);
  }
}

function _svgPt(svg, cx, cy) {
  var pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// ── SÉLECTION PAR ZONE (RUBBER-BAND) ────────────────────────────────
function _prtRubberStart(e) {
  if (e.button !== 0 || _prtDrag) return;
  e.preventDefault();
  _prtHideTooltip();
  _prtClearSelection();
  var svg = document.getElementById('prt-svg');
  var sp  = _svgPt(svg, e.clientX, e.clientY);
  _prtRubber = {x0:sp.x, y0:sp.y, x1:sp.x, y1:sp.y};
  // Crée le rectangle de sélection
  var rr = document.createElementNS('http://www.w3.org/2000/svg','rect');
  rr.setAttribute('id','prt-rubber-rect');
  rr.setAttribute('fill','rgba(59,130,246,0.08)');
  rr.setAttribute('stroke','#3b82f6');
  rr.setAttribute('stroke-width','1.5');
  rr.setAttribute('stroke-dasharray','5 3');
  rr.setAttribute('pointer-events','none');
  rr.setAttribute('display','none');
  svg.appendChild(rr);
  document.addEventListener('mousemove', _prtRubberMove);
  document.addEventListener('mouseup',   _prtRubberEnd);
}

function _prtRubberMove(e) {
  if (!_prtRubber) return;
  var svg = document.getElementById('prt-svg');
  var sp  = _svgPt(svg, e.clientX, e.clientY);
  _prtRubber.x1 = sp.x; _prtRubber.y1 = sp.y;
  var rr = document.getElementById('prt-rubber-rect'); if (!rr) return;
  var x=Math.min(_prtRubber.x0,_prtRubber.x1), y=Math.min(_prtRubber.y0,_prtRubber.y1);
  var w=Math.abs(_prtRubber.x1-_prtRubber.x0), h=Math.abs(_prtRubber.y1-_prtRubber.y0);
  rr.setAttribute('x',x); rr.setAttribute('y',y);
  rr.setAttribute('width',w); rr.setAttribute('height',h);
  rr.setAttribute('display',(w>3||h>3)?'':'none');
  // Prévisualise en temps réel les nœuds qui seront sélectionnés
  _prtNodes.forEach(function(n,i){
    var p=_prtPos[i]; if(!p) return;
    var inside = p.cx>=x && p.cx<=x+w && p.cy>=y && p.cy<=y+h;
    _prtNodeSetMultiSel(i, inside);
  });
}

function _prtRubberEnd(e) {
  document.removeEventListener('mousemove', _prtRubberMove);
  document.removeEventListener('mouseup',   _prtRubberEnd);
  var rr = document.getElementById('prt-rubber-rect'); if(rr) rr.remove();
  if (!_prtRubber) return;
  var x0=Math.min(_prtRubber.x0,_prtRubber.x1), y0=Math.min(_prtRubber.y0,_prtRubber.y1);
  var x1=Math.max(_prtRubber.x0,_prtRubber.x1), y1=Math.max(_prtRubber.y0,_prtRubber.y1);
  _prtRubber = null;
  if ((x1-x0)<5 && (y1-y0)<5) { _prtClearSelection(); return; } // simple clic vide
  var sel = [];
  _prtNodes.forEach(function(n,i){
    var p=_prtPos[i];
    if (p && p.cx>=x0 && p.cx<=x1 && p.cy>=y0 && p.cy<=y1) sel.push(i);
  });
  _prtSetSelection(sel);
}

// ── GESTION SÉLECTION MULTI ──────────────────────────────────────────
function _prtClearSelection() {
  _prtSelection.forEach(function(i){ _prtNodeSetMultiSel(i,false); });
  _prtSelection = [];
}

function _prtSetSelection(arr) {
  // Remet d'abord le style normal sur les anciens
  _prtSelection.forEach(function(i){ _prtNodeSetMultiSel(i,false); });
  _prtSelection = arr;
  _prtSelection.forEach(function(i){ _prtNodeSetMultiSel(i,true); });
}

function _prtNodeSetMultiSel(i, on) {
  if (i === _prtSelectedNode) return; // l'éditeur garde sa propre couleur
  var c = document.querySelector('#prt-node-'+i+' circle');
  if (!c) return;
  if (on) {
    c.setAttribute('stroke','#f59e0b');
    c.setAttribute('stroke-width','3.5');
    c.removeAttribute('filter');
  } else {
    c.setAttribute('stroke','rgba(255,255,255,0.35)');
    c.setAttribute('stroke-width','2');
    c.removeAttribute('filter');
  }
}

// ── TOOLTIP ──────────────────────────────────────────────────────────
function _prtShowTooltip(e, idx) {
  if (_prtDrag || _prtRubber) return;
  var n=_prtNodes[idx];
  var tip=document.getElementById('prt-tooltip'); if(!tip) return;
  var trueNext=n.truenextnode==='-1'?I18N.t('prt.end_label'):'N'+n.truenextnode;
  var falseNext=n.falsenextnode==='-1'?I18N.t('prt.end_label'):'N'+n.falsenextnode;
  var desc=n.description?('<div class="prt-tip-desc">'+_hesc(n.description)+'</div>'):'';
  tip.innerHTML=
    '<div class="prt-tip-name">'+I18N.t('prt.node_label', {name: _hesc(n.name)})+'</div>'+desc+
    '<div class="prt-tip-test">'+_hesc(n.answertest)+'</div>'+
    '<div class="prt-tip-io"><code>'+_hesc(n.sans)+'</code><span> ↔ </span><code>'+_hesc(n.tans)+'</code></div>'+
    '<div class="prt-tip-br prt-tip-t">✓ '+_hesc(n.truescoremode+n.truescore)+' → '+trueNext+'</div>'+
    '<div class="prt-tip-br prt-tip-f">✗ '+_hesc(n.falsescoremode+n.falsescore)+' → '+falseNext+'</div>';
  tip.style.display='block';
  var x=e.clientX+16, y=e.clientY+14;
  if(x+230>window.innerWidth)  x=e.clientX-240;
  if(y+160>window.innerHeight) y=e.clientY-170;
  tip.style.left=x+'px'; tip.style.top=y+'px';
}
function _prtHideTooltip() {
  var tip=document.getElementById('prt-tooltip'); if(tip) tip.style.display='none';
}

// ── NODE SELECTION ───────────────────────────────────────────────────
function prtSelectNode(idx) {
  // Restitue le style précédent (multi-sel ou normal) sur l'ancien nœud éditeur
  if (_prtSelectedNode >= 0) {
    var inSel = _prtSelection.indexOf(_prtSelectedNode) >= 0;
    var oc = document.querySelector('#prt-node-'+_prtSelectedNode+' circle');
    if (oc) {
      oc.setAttribute('fill','#1d4ed8');
      oc.setAttribute('stroke', inSel ? '#f59e0b' : 'rgba(255,255,255,0.35)');
      oc.setAttribute('stroke-width', inSel ? '3.5' : '2');
      oc.removeAttribute('filter');
    }
  }
  _prtSelectedNode = idx;
  var nc = document.querySelector('#prt-node-'+idx+' circle');
  if (nc) {
    nc.setAttribute('fill','#1e3a8a');
    nc.setAttribute('stroke','#93c5fd');
    nc.setAttribute('stroke-width','4');
    nc.setAttribute('filter','url(#prt-sel-glow)');
  }
  renderNodeEditor(idx);
}

function renderNodeEditorPlaceholder() {
  document.getElementById('prt-node-details').innerHTML=
    '<div class="prt-ne-placeholder">'+I18N.t('prt.ne_placeholder')+'</div>';
}

// ── NODE EDITOR ──────────────────────────────────────────────────────
function renderNodeEditor(idx) {
  var n=_prtNodes[idx]; if(!n) return;
  var panel=document.getElementById('prt-node-details');
  function nextOpts(cur){
    var o='<option value="-1"'+(cur==='-1'||cur===-1?' selected':'')+'>'+I18N.t('prt.opt_end')+'</option>';
    _prtNodes.forEach(function(nn,i){ if(i!==idx){var s=(String(cur)===String(nn.name))?' selected':'';o+='<option value="'+nn.name+'"'+s+'>N'+nn.name+'</option>';} });
    return o;
  }
  function smOpts(cur){ return ['=','+','-'].map(function(m){return '<option value="'+m+'"'+(cur===m?' selected':'')+'>'+m+'</option>';}).join(''); }
  var atOpts=PRT_ANSWER_TESTS.map(function(t){ return '<option value="'+t+'"'+(n.answertest===t?' selected':'')+'>'+t+'</option>'; }).join('');

  panel.innerHTML=
    '<div class="prt-ne-head">'+I18N.t('prt.node_label', {name: _hesc(n.name)})+
      '<button class="prt-ne-del-btn" onclick="prtDeleteNode('+idx+')" title="'+I18N.t('common.supprimer')+'">🗑</button>'+
    '</div>'+

    '<div class="prt-ne-section">'+I18N.t('prt.section_identification')+'</div>'+
    '<label class="prt-ne-lbl" for="pne-desc">'+I18N.t('prt.lbl_description')+'</label>'+
    '<input class="prt-ne-inp" id="pne-desc" value="'+_hesc(n.description)+'">'+

    '<div class="prt-ne-section">'+I18N.t('prt.section_test')+'</div>'+
    '<div style="display:flex;gap:6px;align-items:center;">'+
      '<select class="prt-ne-sel" id="pne-at" aria-label="'+I18N.t('prt.section_test')+'" onchange="prtUpdateAtHelp()" style="flex:1">'+atOpts+'</select>'+
      '<button class="prt-help-btn" onclick="prtToggleAtHelp()">?</button>'+
    '</div>'+
    '<div id="pne-at-help" class="prt-at-help" style="display:none"></div>'+
    '<div class="prt-ne-row2" style="margin-top:5px">'+
      '<div><label class="prt-ne-lbl" for="pne-sans">'+I18N.t('prt.lbl_sans')+'</label><input class="prt-ne-inp mono" id="pne-sans" value="'+_hesc(n.sans)+'"></div>'+
      '<div><label class="prt-ne-lbl" for="pne-tans">'+I18N.t('prt.lbl_tans')+'</label><input class="prt-ne-inp mono" id="pne-tans" value="'+_hesc(n.tans)+'"></div>'+
    '</div>'+
    '<label class="prt-ne-lbl">'+I18N.t('prt.lbl_options')+'</label>'+
    '<input class="prt-ne-inp mono" id="pne-opts" value="'+_hesc(n.testoptions)+'" placeholder="'+I18N.t('prt.ph_leave_empty')+'">'+

    '<div class="prt-ne-section prt-ne-true-section">'+I18N.t('prt.section_true')+'</div>'+
    '<div class="prt-ne-row3">'+
      '<div><label class="prt-ne-lbl" for="pne-tsm">'+I18N.t('prt.lbl_mode')+'</label><select class="prt-ne-sel" id="pne-tsm">'+smOpts(n.truescoremode)+'</select></div>'+
      '<div><label class="prt-ne-lbl" for="pne-ts">'+I18N.t('prt.lbl_score')+'</label><input class="prt-ne-inp" id="pne-ts" type="text" placeholder="'+I18N.t('prt.ph_score')+'" value="'+n.truescore+'"></div>'+
      '<div><label class="prt-ne-lbl" for="pne-tnn">'+I18N.t('prt.lbl_suivant')+'</label><select class="prt-ne-sel" id="pne-tnn">'+nextOpts(n.truenextnode)+'</select></div>'+
    '</div>'+
    '<label class="prt-ne-lbl" for="pne-tan">'+I18N.t('prt.lbl_note_true')+'</label>'+
    '<input class="prt-ne-inp mono" id="pne-tan" value="'+_hesc(n.trueanswernote)+'">'+
    '<label class="prt-ne-lbl">'+I18N.t('prt.lbl_feedback_true')+'</label>'+
    _fbTplRow('pne-tfb')+
    '<div class="rich-preview prt-rich-prev" id="prev-pne-tfb" tabindex="0" role="button" onclick="prtOpenRich(\'pne-tfb\')" data-ph="'+I18N.t('prt.ph_write_click')+'"></div>'+
    '<textarea id="pne-tfb" style="display:none"></textarea>'+

    '<div class="prt-ne-section prt-ne-false-section">'+I18N.t('prt.section_false')+'</div>'+
    '<div class="prt-ne-row3">'+
      '<div><label class="prt-ne-lbl" for="pne-fsm">'+I18N.t('prt.lbl_mode')+'</label><select class="prt-ne-sel" id="pne-fsm">'+smOpts(n.falsescoremode)+'</select></div>'+
      '<div><label class="prt-ne-lbl" for="pne-fs">'+I18N.t('prt.lbl_score')+'</label><input class="prt-ne-inp" id="pne-fs" type="text" placeholder="'+I18N.t('prt.ph_score')+'" value="'+n.falsescore+'"></div>'+
      '<div><label class="prt-ne-lbl" for="pne-fnn">'+I18N.t('prt.lbl_suivant')+'</label><select class="prt-ne-sel" id="pne-fnn">'+nextOpts(n.falsenextnode)+'</select></div>'+
    '</div>'+
    '<label class="prt-ne-lbl" for="pne-fan">'+I18N.t('prt.lbl_note_false')+'</label>'+
    '<input class="prt-ne-inp mono" id="pne-fan" value="'+_hesc(n.falseanswernote)+'">'+
    '<label class="prt-ne-lbl">'+I18N.t('prt.lbl_feedback_false')+'</label>'+
    _fbTplRow('pne-ffb')+
    '<div class="rich-preview prt-rich-prev" id="prev-pne-ffb" tabindex="0" role="button" onclick="prtOpenRich(\'pne-ffb\')" data-ph="'+I18N.t('prt.ph_write_click')+'"></div>'+
    '<textarea id="pne-ffb" style="display:none"></textarea>'+

    _buildVarsHtml()+
    '<button class="prt-ne-apply-btn" onclick="prtApplyNodeEdit('+idx+')">'+I18N.t('prt.btn_apply')+'</button>';

  if(typeof setRichVal==='function'){
    setRichVal('pne-tfb', n.truefeedback);
    setRichVal('pne-ffb', n.falsefeedback);
    _prtHighlightTpl('pne-tfb', _prtDetectTpl(n.truefeedback));
    _prtHighlightTpl('pne-ffb', _prtDetectTpl(n.falsefeedback));
  }
}

// ── AIDE ANSWERTEST ──────────────────────────────────────────────────
function prtToggleAtHelp(){
  var el=document.getElementById('pne-at-help'); if(!el) return;
  el.style.display=(el.style.display==='none')?'block':'none';
  if(el.style.display==='block') prtUpdateAtHelp();
}
function prtUpdateAtHelp(){
  var s=document.getElementById('pne-at'), e=document.getElementById('pne-at-help');
  if(!s||!e||e.style.display==='none') return;
  e.innerHTML=(PRT_AT_HELP_KEYS[s.value]?I18N.t(PRT_AT_HELP_KEYS[s.value]):null)||I18N.t('prt.help_none');
}
function prtOpenRich(fieldId){ if(typeof openRich==='function') openRich(fieldId); }

// ── CALQUES DE PRÉSENTATION FEEDBACK ────────────────────────────────
var _PRT_FB_TPLS = {
  vrai:    { bg:'#f0fdf4', bd:'#86efac', pfx:'✅ ' },
  faux:    { bg:'#F9B3A9', bd:'#e2e8f0', pfx:'❌ ' },
  partiel: { bg:'#F9F2BB', bd:'#EDB465', pfx:'🔶 ' }
};

function _fbTplRow(fid) {
  function btn(t,lbl){ return '<button class="prt-fb-tpl-btn" id="tpl-'+fid+'-'+t+'" onclick="prtApplyFbTpl(\''+fid+'\',\''+t+'\')">'+lbl+'</button>'; }
  return '<div class="prt-fb-tpl-row">'+
    btn('sans',I18N.t('prt.tpl_sans'))+btn('vrai',I18N.t('prt.tpl_vrai'))+btn('faux',I18N.t('prt.tpl_faux'))+btn('partiel',I18N.t('prt.tpl_partiel'))+
  '</div>';
}

function _prtDetectTpl(html) {
  if (!html) return 'sans';
  var s = html.trim();
  if (s.indexOf('background:#f0fdf4') >= 0) return 'vrai';
  if (s.indexOf('background:#F9B3A9') >= 0 || s.indexOf('background:#f9b3a9') >= 0 || s.indexOf('background:#fafafa') >= 0) return 'faux';
  if (s.indexOf('background:#F9F2BB') >= 0 || s.indexOf('background:#f9f2bb') >= 0 || s.indexOf('background:#FCDFCF') >= 0 || s.indexOf('background:#fcdfcf') >= 0) return 'partiel';
  return 'sans';
}

function _prtUnwrapFb(html) {
  var s = html.trim();
  if (!s.startsWith('<div style="padding:12px;background:')) return html;
  var tagEnd = s.indexOf('>');
  if (tagEnd < 0) return html;
  var lastDiv = s.lastIndexOf('</div>');
  if (lastDiv < 0) return html;
  return s.slice(tagEnd + 1, lastDiv).replace(/^(?:✅|❌|🔶)\s*/, '');
}

function _prtWrapFb(html, tpl) {
  var t = _PRT_FB_TPLS[tpl];
  if (!t) return html;
  return '<div style="padding:12px;background:'+t.bg+';border-radius:8px;border:1px solid '+t.bd+'">'+t.pfx+html+'</div>';
}

function _prtHighlightTpl(fid, tpl) {
  ['sans','vrai','faux','partiel'].forEach(function(t){
    var el = document.getElementById('tpl-'+fid+'-'+t);
    if (el) el.classList.toggle('prt-fb-tpl-active', t === tpl);
  });
}

function prtApplyFbTpl(fid, tpl) {
  if (typeof richVal !== 'function' || typeof setRichVal !== 'function') return;
  var cur     = richVal(fid);
  var curTpl  = _prtDetectTpl(cur);
  var content = curTpl === 'sans' ? cur : _prtUnwrapFb(cur);
  setRichVal(fid, tpl === 'sans' ? content : _prtWrapFb(content, tpl));
  _prtHighlightTpl(fid, tpl);
}

// ── VARIABLES ────────────────────────────────────────────────────────
function _buildVarsHtml(){
  var q=questions[_prtQid], pN=_prtMeta.name||'prt1', X=pN.replace(/^prt/,'');
  var seen={}, chips='';
  function chip(nm,cls,title){
    if(seen[nm]) return; seen[nm]=true;
    chips+='<span class="prt-var-chip '+cls+'" title="'+title+'" onclick="prtInsertVar(this)">'+_hesc(nm)+'</span>';
  }
  chip('ans'+X,'prt-var-std',I18N.t('prt.var_title_student'));
  chip('ta'+X, 'prt-var-std',I18N.t('prt.var_title_expected'));
  if(q&&q.vars){
    (q.vars.match(/\b([a-zA-Z_]\w*)\s*:/g)||[]).forEach(function(m){
      var nm=m.replace(/\s*:$/,'').trim();
      if(nm&&!/^(if|then|else|true|false|block|for|do|while)$/.test(nm)) chip(nm,'prt-var-q',I18N.t('prt.var_title_question'));
    });
  }
  if(_prtMeta.feedbackvariables){
    (_prtMeta.feedbackvariables.match(/\b([a-zA-Z_]\w*)\s*:/g)||[]).forEach(function(m){
      var nm=m.replace(/\s*:$/,'').trim(); if(nm) chip(nm,'prt-var-fb',I18N.t('prt.var_title_feedback'));
    });
  }
  if(!chips) chips='<span style="color:#94a3b8;font-size:.75rem;font-style:italic">'+I18N.t('prt.vars_none')+'</span>';
  return '<div class="prt-ne-section">'+I18N.t('prt.section_vars_title')+' <small style="font-weight:400;font-size:.67rem">'+I18N.t('prt.vars_copy_hint')+'</small></div>'+
         '<div class="prt-vars-panel">'+chips+'</div>';
}
function prtInsertVar(el){
  var nm=el.textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(nm);
  if(typeof toast==='function') toast(I18N.t('prt.toast_copied', {name: nm}));
}

// ── APPLY EDITS ──────────────────────────────────────────────────────
function prtApplyNodeEdit(idx){
  var n=_prtNodes[idx]; if(!n) return;
  function gv(id){var e=document.getElementById(id);return e?e.value:'';}
  function rv(id){return (typeof richVal==='function')?richVal(id):gv(id);}
  n.description=gv('pne-desc'); n.answertest=gv('pne-at');
  n.sans=gv('pne-sans'); n.tans=gv('pne-tans'); n.testoptions=gv('pne-opts');
  n.truescoremode=gv('pne-tsm'); n.truescore=gv('pne-ts');
  n.truenextnode=gv('pne-tnn'); n.trueanswernote=gv('pne-tan'); n.truefeedback=rv('pne-tfb');
  n.falsescoremode=gv('pne-fsm'); n.falsescore=gv('pne-fs');
  n.falsenextnode=gv('pne-fnn'); n.falseanswernote=gv('pne-fan'); n.falsefeedback=rv('pne-ffb');
  // Full re-render preserves _prtPos (user drag positions) while ensuring
  // FIN/node indicator type changes (node→FIN or FIN→node) render correctly.
  renderPrtSvg();
  _prtSelectedNode = idx; // mark selected before re-applying highlight
  var nc = document.querySelector('#prt-node-'+idx+' circle');
  if(nc){ nc.setAttribute('fill','#1e3a8a'); nc.setAttribute('stroke','#93c5fd'); nc.setAttribute('stroke-width','4'); nc.setAttribute('filter','url(#prt-sel-glow)'); }
  renderNodeEditor(idx);
  if(typeof toast==='function') toast(I18N.t('prt.toast_node_updated', {name: n.name}));
}

// ── ADD NODE ─────────────────────────────────────────────────────────
function prtAddNode(){
  var used=_prtNodes.map(function(n){return parseInt(n.name,10);}), next=0;
  while(used.indexOf(next)>=0) next++;
  var pN=_prtMeta.name||'prt', X=pN.replace('prt','');
  var newNode={name:String(next),description:'',answertest:'AlgEquiv',sans:'ans'+X,tans:'ta'+X,
    testoptions:'',quiet:'0',truescoremode:'=',truescore:'1',truepenalty:'',
    truenextnode:'-1',trueanswernote:pN+'-'+(next+1)+'-T',truefeedback:'',
    falsescoremode:'=',falsescore:'0',falsepenalty:'',
    falsenextnode:'-1',falseanswernote:pN+'-'+(next+1)+'-F',falsefeedback:''};
  _prtNodes.push(newNode);
  // Place new node below the last node
  var lastP=_prtPos[_prtPos.length-1]||{cx:PRT_PAD+PRT_R,cy:PRT_PAD+PRT_R};
  _prtPos.push({cx:lastP.cx+PRT_SLOT, cy:lastP.cy+PRT_ROW});
  _prtNameToIdx[String(next)]=_prtNodes.length-1;
  renderPrtSvg();
  prtSelectNode(_prtNodes.length-1);
}

// ── DELETE NODE ──────────────────────────────────────────────────────
function prtDeleteNode(idx){
  if(_prtNodes.length<=1){if(typeof toast==='function') toast(I18N.t('prt.toast_min_node')); return;}
  var name=_prtNodes[idx].name;
  if(!confirm(I18N.t('msg.confirm_del_node') + name + ' ?')) return;
  _prtNodes.splice(idx,1); _prtPos.splice(idx,1);
  _prtNodes.forEach(function(n){
    if(n.truenextnode===name) n.truenextnode='-1';
    if(n.falsenextnode===name) n.falsenextnode='-1';
  });
  // Rebuild nameToIdx
  _prtNameToIdx={};
  _prtNodes.forEach(function(n,i){ _prtNameToIdx[n.name]=i; });
  _prtSelectedNode=-1;
  renderPrtSvg(); renderNodeEditorPlaceholder();
}

// Bouton "🗑 Supprimer" de la barre d'outils : le petit bouton dans l'éditeur de
// nœud n'était pas assez visible, on ajoute un point d'entrée évident qui agit
// sur le nœud actuellement sélectionné.
function prtDeleteSelectedNode(){
  if(_prtSelectedNode<0){ if(typeof toast==='function') toast(I18N.t('prt.toast_select_first')); return; }
  prtDeleteNode(_prtSelectedNode);
}

// ── TIDY ─────────────────────────────────────────────────────────────
function prtTidy(){
  if(!_prtNodes.length) return;
  var oldMap={}; _prtNodes.forEach(function(n,i){ oldMap[n.name]=i; });
  var vis=[], queue=[0], seen={0:true};
  while(queue.length){
    var idx=queue.shift(); vis.push(idx); var n=_prtNodes[idx];
    [n.truenextnode,n.falsenextnode].forEach(function(nx){
      if(nx!=='-1'&&nx!==-1){var ni=oldMap[String(nx)];if(ni!==undefined&&!seen[ni]){seen[ni]=true;queue.push(ni);}}
    });
  }
  _prtNodes.forEach(function(n,i){if(!seen[i])vis.push(i);});
  var renMap={}; vis.forEach(function(oi,ns){renMap[_prtNodes[oi].name]=String(ns);});
  var pN=_prtMeta.name||'prt';
  _prtNodes = vis.map(function(oi,ns){
    var n=Object.assign({},_prtNodes[oi]), old=n.name;
    n.name=String(ns);
    n.truenextnode  =(n.truenextnode ==='-1')?'-1':(renMap[n.truenextnode] ??'-1');
    n.falsenextnode =(n.falsenextnode==='-1')?'-1':(renMap[n.falsenextnode]??'-1');
    var pat=new RegExp('^'+pN.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'-'+(parseInt(old,10)+1)+'-');
    if(pat.test(n.trueanswernote))  n.trueanswernote =pN+'-'+(ns+1)+'-T';
    if(pat.test(n.falseanswernote)) n.falseanswernote=pN+'-'+(ns+1)+'-F';
    return n;
  });
  // Keep same positions in new order
  _prtPos = vis.map(function(oi){ return _prtPos[oi]||{cx:PRT_PAD+PRT_R,cy:PRT_PAD+PRT_R}; });
  _prtNameToIdx={}; _prtNodes.forEach(function(n,i){_prtNameToIdx[n.name]=i;});
  _prtSelectedNode=-1;
  renderPrtSvg(); renderNodeEditorPlaceholder();
  if(typeof toast==='function') toast(I18N.t('prt.toast_renumbered'));
}

// ── RESET LAYOUT ─────────────────────────────────────────────────────
function prtResetLayout(){
  _prtPos=[];
  _prtInitLayout();
  renderPrtSvg();
  renderNodeEditorPlaceholder();
  if(typeof toast==='function') toast(I18N.t('prt.toast_layout_reset'));
}

// ── SAVE ─────────────────────────────────────────────────────────────
function savePrtManager(){
  if(!_prtQid) return;
  if(_prtSelectedNode>=0 && document.getElementById('pne-at')) prtApplyNodeEdit(_prtSelectedNode);
  var _fbvIn=document.getElementById('prt-fbvars-input');
  if(_fbvIn) _prtMeta.feedbackvariables=_fbvIn.value;
  var g = _prtValidateGraph();
  if(!g.ok){
    var gmsg = _prtGraphErrorMsg(g);
    if(!confirm('⚠️ '+gmsg+'\n\n'+I18N.t('msg.confirm_apply_anyway'))) return;
  }
  var v = _prtValidateTruePath();
  if(!v.ok){
    var msg = v.reason
      ? I18N.t('prt.err_prefix', {reason: v.reason})
      : I18N.t('prt.err_truepath_score', {score: v.score});
    if(!confirm('⚠️ '+msg+'\n\n'+I18N.t('msg.confirm_apply_anyway'))) return;
  }
  var xml=buildPrtXml(_prtMeta,_prtNodes);
  if(questions[_prtQid]){
    questions[_prtQid].prtXML=xml;
    // Si la question a un PRT JSON (type migré), on le garde synchronisé : q.prt
    // reste la source de vérité éditable, prtXML n'est qu'une sérialisation dérivée
    // pour l'export/l'aperçu.
    if(questions[_prtQid].prt){
      questions[_prtQid].prt = {
        meta: Object.assign({}, _prtMeta),
        nodes: _prtNodes.map(function(n){ return Object.assign({}, n); })
      };
    }
    // Sync back into prtXmls for stack-raw imported questions
    if(typeof _stackRawSyncPrt==='function') _stackRawSyncPrt(_prtQid, xml);
    if(_prtInlineMode){
      if(typeof _expertSyncPrtInline==='function') _expertSyncPrtInline(_prtQid, xml);
    } else {
      if(typeof _expertSyncPrt==='function') _expertSyncPrt(_prtQid, xml);
    }
    if(typeof saveEditorState==='function') saveEditorState();
    if(typeof toast==='function') toast(I18N.t('prt.toast_prt_updated', {qid: _prtQid}));
  }
  if(!_prtInlineMode) closePrtManager(true);
}

// ── VALIDATION DU CHEMIN VRAI ────────────────────────────────────────
function _prtValidateTruePath(){
  if(!_prtNodes.length) return {ok:true};
  // Racine = premier nœud non pointé par aucun autre
  var pointed={};
  _prtNodes.forEach(function(n){
    if(n.truenextnode !=='-1') pointed[n.truenextnode] =true;
    if(n.falsenextnode!=='-1') pointed[n.falsenextnode]=true;
  });
  var rootIdx=0;
  for(var i=0;i<_prtNodes.length;i++){
    if(!pointed[_prtNodes[i].name]){rootIdx=i;break;}
  }
  var score=0, visited={}, idx=rootIdx, path=[], MAX=100;
  while(idx>=0 && path.length<MAX){
    if(visited[idx]) return {ok:false, reason:I18N.t('prt.err_cycle_at', {name: _prtNodes[idx].name})};
    visited[idx]=true;
    var n=_prtNodes[idx];
    path.push('N'+n.name);
    var val=parseFloat(n.truescore)||0;
    if     (n.truescoremode==='=') score=val;
    else if(n.truescoremode==='+') score+=val;
    else if(n.truescoremode==='-') score-=val;
    var nxt=n.truenextnode;
    if(nxt==='-1'||nxt===null||nxt===undefined) break;
    idx=_ni(nxt);
    if(idx<0) break;
  }
  var s=Math.round(score*10000)/10000;
  return {ok:Math.abs(s-1)<0.001, score:s, path:path};
}

// ── VALIDATION DU GRAPHE (connexité + boucles) ──────────────────────
// Contrairement à _prtValidateTruePath (qui ne suit que les branches vraies
// depuis la racine), ceci parcourt TOUTES les arêtes (vraie + fausse) pour
// détecter : des nœuds orphelins (ex: un nœud ajouté via "+ Nœud" jamais relié
// par personne) et des cycles n'importe où dans le graphe (pas seulement sur
// le chemin des branches vraies).
function _prtValidateGraph(){
  var N=_prtNodes.length;
  if(!N) return {ok:true, orphans:[], cycle:null};
  var pointed={};
  _prtNodes.forEach(function(n){
    if(n.truenextnode!=='-1')  pointed[n.truenextnode]=true;
    if(n.falsenextnode!=='-1') pointed[n.falsenextnode]=true;
  });
  var rootIdx=0;
  for(var i=0;i<N;i++){ if(!pointed[_prtNodes[i].name]){ rootIdx=i; break; } }

  // Connexité : parcours depuis la racine sur les 2 branches.
  var reached={}; reached[rootIdx]=true;
  var stack=[rootIdx];
  while(stack.length){
    var idx=stack.pop(), n=_prtNodes[idx];
    [n.truenextnode, n.falsenextnode].forEach(function(nx){
      if(nx==='-1') return;
      var ni=_ni(nx);
      if(ni>=0 && !reached[ni]){ reached[ni]=true; stack.push(ni); }
    });
  }
  var orphans=[];
  for(var i=0;i<N;i++){ if(!reached[i]) orphans.push(_prtNodes[i].name); }

  // Cycle : DFS colorié (blanc/gris/noir) sur tout le graphe, 2 branches confondues.
  var color=new Array(N).fill(0), cycleNode=null, hasCycle=false;
  function dfs(idx){
    color[idx]=1;
    var n=_prtNodes[idx];
    var nbrs=[_ni(n.truenextnode), _ni(n.falsenextnode)];
    for(var k=0;k<nbrs.length;k++){
      var ni=nbrs[k];
      if(ni<0) continue;
      if(color[ni]===1){ cycleNode=_prtNodes[ni].name; return true; }
      if(color[ni]===0 && dfs(ni)) return true;
    }
    color[idx]=2;
    return false;
  }
  for(var i=0;i<N && !hasCycle;i++){ if(color[i]===0) hasCycle=dfs(i); }

  return { ok: orphans.length===0 && !hasCycle, orphans:orphans, cycle:hasCycle?cycleNode:null };
}

// Construit le message d'erreur (boucle ou nœuds orphelins) à partir du résultat
// de _prtValidateGraph(), utilisé à la fois par closePrtManager() et savePrtManager().
function _prtGraphErrorMsg(g) {
  return g.cycle
    ? I18N.t('prt.err_cycle', {node: g.cycle})
    : I18N.t('prt.err_orphans', {names: g.orphans.join(', N')});
}

function _prtUpdateScoreBanner(){
  var el=document.getElementById('prt-score-banner'); if(!el) return;
  var v=_prtValidateTruePath();
  if(v.ok){
    el.className='prt-score-banner prt-score-ok';
    el.textContent=I18N.t('prt.banner_ok');
  } else if(v.reason){
    el.className='prt-score-banner prt-score-err';
    el.textContent='⚠ '+v.reason;
  } else {
    el.className='prt-score-banner prt-score-err';
    el.textContent=I18N.t('prt.banner_warn_score', {score: v.score});
  }
}

// ── GEOMETRY HELPERS ─────────────────────────────────────────────────
// Exit angle : 50° de la verticale descendante → 100° d'écart entre les 2 branches.
var _SIN50 = Math.sin(50 * Math.PI / 180); // ≈ 0.766
var _COS50 = Math.cos(50 * Math.PI / 180); // ≈ 0.643

// Retourne le point de sortie sur le bord du nœud + le vecteur directeur sortant.
function _exitPt(p, isTrue) {
  var s = isTrue ? -1 : 1;
  return { x: p.cx + s*PRT_R*_SIN50, y: p.cy + PRT_R*_COS50,
           dx: s*_SIN50,              dy: _COS50 };
}

// ── Point d'entrée sur le nœud cible ──────────────────────────────
// 1 flèche entrante → sommet (0°). 2 flèches → ±50°. N flèches → répartis ±50°.
// Retourne {x, y, angDeg}.
function _getEntryPt(ni, fromIdx, br) {
  var tp = _prtPos[ni];
  var inc = [];
  _prtNodes.forEach(function(n, k) {
    if (_ni(n.truenextnode)  === ni) inc.push({k:k, br:'t'});
    if (_ni(n.falsenextnode) === ni) inc.push({k:k, br:'f'});
  });
  var N = inc.length;
  if (N === 0) return {x: tp.cx, y: tp.cy - PRT_R, angDeg: 0};
  // Trier par x source pour un ordre gauche→droite stable
  inc.sort(function(a, b) { return _prtPos[a.k].cx - _prtPos[b.k].cx; });
  var slot = -1;
  inc.forEach(function(e, idx) { if (e.k === fromIdx && e.br === br) slot = idx; });
  if (slot < 0) return {x: tp.cx, y: tp.cy - PRT_R, angDeg: 0};
  var angDeg = N === 1 ? 0 : -50 + (100 / (N - 1)) * slot;
  var rad = angDeg * Math.PI / 180;
  return { x: tp.cx + PRT_R * Math.sin(rad), y: tp.cy - PRT_R * Math.cos(rad), angDeg: angDeg };
}

// Courbe de Bézier cubique directionnelle :
//  - cp1 suit la direction de sortie (edx,edy)
//  - cp2 respecte l'angle d'arrivée tAngDeg (degrés depuis verticale haute)
function _bezier(ex, ey, edx, edy, tx, ty, tAngDeg) {
  var dist = Math.max(30, Math.sqrt((tx-ex)*(tx-ex)+(ty-ey)*(ty-ey)));
  var t    = Math.min(dist * 0.48, 110);
  var cp1x = ex + edx*t, cp1y = ey + edy*t;
  var cp2x, cp2y;
  if (tAngDeg !== undefined) {
    var trad = tAngDeg * Math.PI / 180;
    // CP2 dans la direction opposée à l'arrivée (vers l'extérieur du cercle)
    cp2x = tx + Math.sin(trad) * t * 0.42;
    cp2y = ty - Math.cos(trad) * t * 0.42;
  } else {
    cp2x = tx; cp2y = ty - t * 0.38;
  }
  return 'M'+ex+','+ey+' C'+cp1x+','+cp1y+' '+cp2x+','+cp2y+' '+tx+','+ty;
}

// Position du centre de l'indicateur FIN (dans la direction de sortie).
function _endPos(ex, ey, edx, edy) {
  return { x: ex + edx*46, y: ey + edy*46 };
}
function _hesc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── RESIZE PANNEAU ÉDITEUR ───────────────────────────────────────────
var _prtResizing = false;

function prtResizePanelStart(e) {
  e.preventDefault();
  _prtResizing = true;
  var h = document.getElementById('prt-resize-handle');
  if (h) h.classList.add('prt-resizing');
  document.addEventListener('mousemove', _prtResizeMove);
  document.addEventListener('mouseup',   _prtResizeEnd);
}
function _prtResizeMove(e) {
  if (!_prtResizing) return;
  var editor = document.getElementById('prt-node-editor');
  if (!editor) return;
  /* En mode inline on prend le body PRT comme référence, sinon la modale */
  var container = _prtInlineMode
    ? document.getElementById('prt-mngr-body-el')
    : document.getElementById('prt-manager-modal');
  if (!container) return;
  var containerRight = container.getBoundingClientRect().right;
  var containerWidth = container.getBoundingClientRect().width;
  var maxW = Math.floor(containerWidth * 0.82);
  var newW = Math.max(240, Math.min(maxW, containerRight - e.clientX));
  editor.style.width = newW + 'px';
  editor.style.minWidth = newW + 'px';
}
function _prtResizeEnd() {
  document.removeEventListener('mousemove', _prtResizeMove);
  document.removeEventListener('mouseup',   _prtResizeEnd);
  _prtResizing = false;
  var h = document.getElementById('prt-resize-handle');
  if (h) h.classList.remove('prt-resizing');
}

// Export CommonJS pour les tests Node (test/unit/*.test.js) : seules les fonctions
// pures (aucune dépendance au DOM) sont exposées. Sans effet dans le navigateur.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildPrtXml: buildPrtXml, parsePrtXml: parsePrtXml };
}
