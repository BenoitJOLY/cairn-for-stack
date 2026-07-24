// ── GENERATOR MATCH + MATCH PROMPT ─────────────────────────────────────
async function genMatch(X){
  const bareme=parseFloat(v('match-bareme'))||2;
  const text=richVal('match-text');

  if(matchState.left.length === 0 || matchState.right.length === 0) throw new Error(I18N.t('msg.err_match_col', {n: X}));
  if(matchState.connections.length === 0) throw new Error(I18N.t('msg.err_match_lien', {n: X}));

  const p = {
    bareme: bareme, text: text,
    left: matchState.left, right: matchState.right, connections: matchState.connections,
    fbGen: v('match-fbgen')
  };
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'match', X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Quota hebdomadaire atteint.');
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "match", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "match", repli sur le calcul local.', e); }
  return genMatchCore(X, p);
}

function genMatchCore(X, p, deps){
  deps = deps || {};
  const I18N_D = deps.I18N || I18N;
  const buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  const mkFbGen_D = deps._mkFbGen || _mkFbGen;
  const escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;

  const bareme = p.bareme, text = p.text;
  const left = p.left, right = p.right, connections = p.connections;

  const maximaLeftRaw = "[" + left.map(i => `"${escapeMaximaString_D(i.html)}"`).join(",") + "]";
  const maximaRightRaw = "[" + right.map(i => `"${escapeMaximaString_D(i.html)}"`).join(",") + "]";
  const maximaTans = "[" + connections.map(c => `["${escapeMaximaString_D(left[c.l].html)}", "${escapeMaximaString_D(right[c.r].html)}"]`).join(",") + "]";

  // Variables standards
  const vars=`list_left: ${maximaLeftRaw};
list_right: ${maximaRightRaw};
tans: ${maximaTans};
left: random_permutation(list_left);
right: random_permutation(list_right);
`;

  const fbVars=`rep_etud_set: if listp(ans${X}) then setify(ans${X}) else {};
rep_corr_set: setify(tans);
bons_elements: intersect(rep_etud_set, rep_corr_set);
faux_elements: setdifference(rep_etud_set, rep_corr_set);
nb_bons: length(bons_elements);
nb_faux: length(faux_elements);
total: length(rep_corr_set);
if total > 0 then note_calculee: max(0, (nb_bons - nb_faux) / total) else note_calculee: 0;
faux_elements: setdifference(rep_etud_set, rep_corr_set);
faux_list: listify(faux_elements);
faux_feedback_str: if length(faux_list) = 0 then "${I18N_D.t('match.no_errors')}" else
    block([txt],
        txt: "<ul style='margin: 5px 0; padding-left: 20px; color: #c0392b;'>",
        for i:1 thru length(faux_list) do (
            txt: sconcat(txt, "<li>", faux_list[i][1], " - ", faux_list[i][2], "</li>")
        ),
        sconcat(txt, "</ul>")
    );
`;

  const matchMaxN = Math.max(left.length, right.length);
  const matchBoardH = matchMaxN * 52 + 60;

  // ── CODE JSXGRAPH (SYMBOLES BRUTS) ──
  const jsxCode = `
[[jsxgraph input-ref-ans${X}="refAns${X}" width="100%" height="${matchBoardH}px"]]
function setRef(ref, value) {
  var el = document.getElementById(ref);
  if (el) { el.value = value; el.dispatchEvent(new Event('change')); }
}

var match_leftData  = {#left#};
var match_rightData = {#right#};
var match_selectedLeft = -1;
var match_connections  = [];
var match_lines        = [];
var match_leftAnchors  = [];
var match_rightAnchors = [];

// Dimensions : on attend que le DOM soit prêt via setTimeout
var match_board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [0, 10, 100, 0],
    axis: false, grid: false, showNavigation: false, showCopyright: false,
    keepaspectratio: false
});

function match_init() {
    var boardEl = document.getElementById(divid);
    if (!boardEl || boardEl.offsetWidth < 10) { setTimeout(match_init, 80); return; }

    var W    = 100;
    var nL   = match_leftData.length;
    var nR   = match_rightData.length;
    var maxN = Math.max(nL, nR);
    var ROW  = 12;
    var H    = maxN * ROW + 8;

    // Redimensionner le canvas SVG à la taille réelle du div (STACK le garde sinon à ~500px)
    match_board.resizeContainer(boardEl.offsetWidth, boardEl.offsetHeight);
    match_board.setBoundingBox([0, H, W, 0], false);

    // unitX = pixels par unité APRÈS resize → cohérent avec le positionnement des éléments
    var boxPx = Math.floor(43 * match_board.unitX);

    // ── GRILLE : 1% | 43% boîtes gauche | 1% | 10% points | 1% | 43% boîtes droite | 1% ──
    var xLBox = 1;
    var xAL   = 45;
    var xAR   = 55;
    var xRBox = 56;

    var styleBase = 'border-radius:10px;padding:8px 10px;font-size:13px;font-weight:600;' +
                    'display:flex;align-items:center;justify-content:center;text-align:center;' +
                    'cursor:pointer;pointer-events:auto;box-sizing:border-box;' +
                    'white-space:normal;word-break:break-word;overflow:hidden;' +
                    'width:' + boxPx + 'px;';

    function styleL(sel, linked) {
        var bg  = sel ? '#ede9fe' : (linked ? '#f3e8ff' : '#ffffff');
        var brd = sel ? '#7c3aed' : (linked ? '#a78bfa' : '#c4b5fd');
        var col = sel ? '#5b21b6' : '#4c1d95';
        var sh  = sel ? '0 0 0 3px #c4b5fd' : '0 1px 4px rgba(0,0,0,.10)';
        return styleBase + 'background:' + bg + ';border:2px solid ' + brd + ';color:' + col + ';box-shadow:' + sh + ';';
    }
    function styleR(linked) {
        var bg  = linked ? '#fdf2f8' : '#ffffff';
        var brd = linked ? '#f0abfc' : '#fca5a5';
        var col = '#991b1b';
        return styleBase + 'background:' + bg + ';border:2px solid ' + brd + ';color:' + col + ';box-shadow:0 1px 4px rgba(0,0,0,.10);';
    }

    function match_updateInput() { setRef(refAns${X}, JSON.stringify(match_connections)); }

    function match_redraw() {
        for (var i = 0; i < match_lines.length; i++) match_board.removeObject(match_lines[i]);
        match_lines = [];
        for (var i = 0; i < match_connections.length; i++) {
            var lI = match_leftData.indexOf(match_connections[i][0]);
            var rI = match_rightData.indexOf(match_connections[i][1]);
            if (lI !== -1 && rI !== -1) {
                var li = match_board.create('line',
                    [match_leftAnchors[lI], match_rightAnchors[rI]],
                    { straightFirst:false, straightLast:false, strokeWidth:2.5,
                      strokeColor:'#6d28d9', fixed:true, highlight:false });
                (function(line, tL, tR) {
                    line.on('down', function() {
                        for (var k = 0; k < match_connections.length; k++) {
                            if (match_connections[k][0]===match_leftData[tL] && match_connections[k][1]===match_rightData[tR]) {
                                match_connections.splice(k,1);
                                match_redraw(); match_updateInput(); break;
                            }
                        }
                    });
                })(li, lI, rI);
                match_lines.push(li);
            }
        }
        // Rafraîchir styles
        for (var j = 0; j < match_leftElems.length; j++) {
            var linked = match_connections.some(function(c){ return c[0]===match_leftData[j]; });
            match_leftElems[j].setAttribute({ cssStyle: styleL(j===match_selectedLeft, linked) });
        }
        for (var j = 0; j < match_rightElems.length; j++) {
            var linked = match_connections.some(function(c){ return c[1]===match_rightData[j]; });
            match_rightElems[j].setAttribute({ cssStyle: styleR(linked) });
        }
        match_board.update();
    }

    var match_leftElems  = [];
    var match_rightElems = [];

    for (var i = 0; i < nL; i++) {
        var y = H - 6 - i * ROW;
        var t = match_board.create('text', [xLBox, y, match_leftData[i]], {
            fontSize:14, anchorX:'left', anchorY:'middle',
            cssStyle: styleL(false, false),
            useMathJax:true, fixed:true, highlight:false
        });
        var a = match_board.create('point', [xAL, y], {
            size:5, fillColor:'#a78bfa', strokeColor:'#7c3aed', strokeWidth:2,
            fixed:true, name:'', showInfobox:false, highlight:false
        });
        match_leftAnchors.push(a);
        match_leftElems.push(t);
        (function(idx) {
            var fn = function() { match_selectedLeft = idx; match_redraw(); };
            t.on('down', fn); a.on('down', fn);
        })(i);
    }

    for (var i = 0; i < nR; i++) {
        var y = H - 6 - i * ROW;
        var t = match_board.create('text', [xRBox, y, match_rightData[i]], {
            fontSize:14, anchorX:'left', anchorY:'middle',
            cssStyle: styleR(false),
            useMathJax:true, fixed:true, highlight:false
        });
        var a = match_board.create('point', [xAR, y], {
            size:5, fillColor:'#f87171', strokeColor:'#dc2626', strokeWidth:2,
            fixed:true, name:'', showInfobox:false, highlight:false
        });
        match_rightAnchors.push(a);
        match_rightElems.push(t);
        (function(idx) {
            var fn = function() {
                if (match_selectedLeft === -1) return;
                var conn = [match_leftData[match_selectedLeft], match_rightData[idx]];
                if (!match_connections.some(function(c){ return c[0]===conn[0]&&c[1]===conn[1]; })) {
                    match_connections.push(conn); match_updateInput();
                }
                match_selectedLeft = -1; match_redraw();
            };
            t.on('down', fn); a.on('down', fn);
        })(i);
    }

    // Restaurer état
    var sv = document.getElementById(refAns${X});
    if (sv && sv.value && sv.value.trim()) {
        try { var p = JSON.parse(sv.value); if (Array.isArray(p)) match_connections = p; } catch(e){}
    }
    match_redraw();

    // Bouton effacer
    var btn = document.createElement('button');
    btn.type = 'button'; btn.innerHTML = '${I18N_D.t('match.clear_btn')}';
    btn.style.cssText = 'margin:10px auto 0;display:block;padding:6px 16px;border:1px solid #c4b5fd;border-radius:8px;background:#faf5ff;color:#6d28d9;font-size:13px;cursor:pointer;font-weight:600;';
    btn.onmouseenter = function(){ this.style.background='#ede9fe'; };
    btn.onmouseleave = function(){ this.style.background='#faf5ff'; };
    btn.onclick = function(){ match_connections=[]; match_selectedLeft=-1; match_redraw(); match_updateInput(); };
    boardEl.parentNode.insertBefore(btn, boardEl.nextSibling);
}

setTimeout(match_init, 100);
[[/jsxgraph]]

<div style="display:none;"> [[input:ans${X}]] [[validation:ans${X}]] </div>
`;

  const jsxSol = `
[[jsxgraph width="100%" height="${matchBoardH}px"]]
var sol_leftData  = {#left#};
var sol_rightData = {#right#};
var sol_pairs     = {#tans#};

var sol_board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [0, 10, 100, 0],
    axis: false, grid: false, showNavigation: false, showCopyright: false,
    keepaspectratio: false
});

function sol_init() {
    var boardEl = document.getElementById(divid);
    if (!boardEl || boardEl.offsetWidth < 10) { setTimeout(sol_init, 80); return; }

    var W    = 100;
    var nL   = sol_leftData.length;
    var nR   = sol_rightData.length;
    var maxN = Math.max(nL, nR);
    var ROW  = 12;
    var H    = maxN * ROW + 8;

    sol_board.resizeContainer(boardEl.offsetWidth, boardEl.offsetHeight);
    sol_board.setBoundingBox([0, H, W, 0], false);

    var boxPx = Math.floor(43 * sol_board.unitX);
    var xLBox = 1;
    var xAL = 45, xAR = 55;
    var xRBox = 56;

    var solStyle = 'border-radius:10px;padding:8px 10px;font-size:13px;font-weight:600;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;' +
        'white-space:normal;word-break:break-word;overflow:hidden;' +
        'pointer-events:none;background:#f0fdf4;border:2px solid #86efac;color:#166534;' +
        'box-shadow:0 1px 4px rgba(0,0,0,.08);width:' + boxPx + 'px;';

    var solLeftAnchors = [], solRightAnchors = [];

    for (var i = 0; i < nL; i++) {
        var y = H - 6 - i * ROW;
        sol_board.create('text', [xLBox, y, sol_leftData[i]], {
            fontSize:14, anchorX:'left', anchorY:'middle',
            cssStyle: solStyle, useMathJax:true, fixed:true, highlight:false
        });
        var a = sol_board.create('point', [xAL, y], {
            size:5, fillColor:'#4ade80', strokeColor:'#16a34a', strokeWidth:2,
            fixed:true, name:'', showInfobox:false, highlight:false
        });
        solLeftAnchors.push(a);
    }

    for (var i = 0; i < nR; i++) {
        var y = H - 6 - i * ROW;
        sol_board.create('text', [xRBox, y, sol_rightData[i]], {
            fontSize:14, anchorX:'left', anchorY:'middle',
            cssStyle: solStyle, useMathJax:true, fixed:true, highlight:false
        });
        var a = sol_board.create('point', [xAR, y], {
            size:5, fillColor:'#4ade80', strokeColor:'#16a34a', strokeWidth:2,
            fixed:true, name:'', showInfobox:false, highlight:false
        });
        solRightAnchors.push(a);
    }

    for (var i = 0; i < sol_pairs.length; i++) {
        var lI = sol_leftData.indexOf(sol_pairs[i][0]);
        var rI = sol_rightData.indexOf(sol_pairs[i][1]);
        if (lI !== -1 && rI !== -1) {
            sol_board.create('line', [solLeftAnchors[lI], solRightAnchors[rI]], {
                straightFirst:false, straightLast:false,
                strokeWidth:2.5, strokeColor:'#16a34a', fixed:true, highlight:false
            });
        }
    }
    sol_board.update();
}

setTimeout(sol_init, 100);
[[/jsxgraph]]
`;

  const prtMeta = { name: 'prt'+X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
  const canonicalNodes = [{
    name: '0', description: 'Liaisons correctes ?', answertest: 'NumAbsolute', sans: 'note_calculee', tans: '1',
    testoptions: '0', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: 'PRT-'+X+'-0-T', truefeedback: `<div style="padding:10px; background-color:#d4edda; color:#155724; border-radius:5px;">
    <strong>${I18N_D.t('match.fb_ok_title')}</strong> ${I18N_D.t('match.fb_ok_detail')}
</div>`,
    falsescoremode: '=', falsescore: 'note_calculee', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: 'PRT-'+X+'-0-F', falsefeedback: `<div style="padding:10px; background-color:#fff3cd; color:#856404; border-radius:5px;">
    <strong>${I18N_D.t('match.fb_wrong_title')}</strong> ${I18N_D.t('match.fb_wrong_detail')}<br>
    <div style="margin-top:10px;">
        <strong>${I18N_D.t('match.fb_wrong_errors_title')}</strong><br>
        {@faux_feedback_str@}
    </div>
    <div style="margin-top:10px; font-weight:bold;">
        ${I18N_D.t('match.fb_wrong_note')} {@note_calculee@} / ${bareme}
    </div>
</div>`
  }];
  const prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

  return{
    bareme,vars,qnote:`Match (${left.length}/${right.length})`,
    kbdRaw: jsxCode,
    textFrag: `
  <div style="background:#B686D8;border-left:5px solid #7c3aed;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
    <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('match.banniere')}</strong>
    <span style="background:#7c3aed;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
    <span style="background:#ffffff;color:#7c3aed;border:1px solid #7c3aed;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('match.badge')}</span>
  </div>
  <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
<div id="match-container-${X}" style="width:100%;margin:16px 0;border:1px solid #e9d5ff;border-radius:12px;padding:4px;background:#faf5ff;box-shadow:0 2px 8px rgba(109,40,217,.07);position:relative;">
 <!--HS-KBD:${X}-->
</div>`,
    inputXML:`    <input>
      <name>ans${X}</name>
      <type>algebraic</type>
      <tans>tans</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>1</showvalidation>
      <options></options>
    </input>`,
    prtXML:prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
    kbdRawFbGen: jsxSol,
    generalFeedback: mkFbGen_D(`<p style="color:#166534;font-weight:bold;margin-top:12px;">${I18N_D.t('match.correction_title')}</p><div id="match-solution-container-${X}" style="width:100%;margin:12px 0;border:1px solid #86efac;border-radius:12px;padding:4px;background:#f0fdf4;box-shadow:0 2px 8px rgba(22,163,74,.07);"><!--HS-KBD-FBGEN:${X}--></div>`, p.fbGen),
    feedbackRef:`[[feedback:prt${X}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genMatch: genMatch, genMatchCore: genMatchCore };
}
