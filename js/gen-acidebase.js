// ── XML GENERATORS: acide-base ──

/* ══════════════════════════════════════════════════════
   ACIDE-BASE — pH-métrie avec courbe de titrage JSXGraph
   Mono / Di / Triprotique (n=1,2,3)
   ══════════════════════════════════════════════════════ */

function genAcideBase(X) {
    var abType   = v('ab-type')  || 'af-bf';
    var abFind   = v('ab-find')  || 'equivalence';
    var nProtons = parseInt(v('ab-n-protons') || '1');
    var c1       = parseFloat(v('ab-c1'))   || 0.1;
    var v1       = parseFloat(v('ab-v1'))   || 20;
    var c2       = parseFloat(v('ab-c2'))   || 0.1;
    var pka      = parseFloat(v('ab-pka'))  || 4.8;
    var pka2     = parseFloat(v('ab-pka2')) || 9.2;
    var pka3     = parseFloat(v('ab-pka3')) || 12.35;
    var tolVol   = parseFloat(v('ab-tol-vol')) || 0.5;
    var tolPh    = parseFloat(v('ab-tol-ph'))  || 0.2;
    var dispW    = parseInt(v('ab-w'))  || 500;
    var dispH    = parseInt(v('ab-h'))  || 400;
    var bareme   = parseFloat(v('ab-bareme')) || 1;
    var text     = richVal('ab-text');
    var fbOk     = v('ab-fb-ok')    || wrapFb('✅ <strong>Bonne r\xe9ponse !</strong>', true);
    var fbWrong  = v('ab-fb-wrong') || wrapFb('❌ <strong>R\xe9ponse incorrecte.</strong> V\xe9rifiez sur la courbe.', false);

    // ── Physique ───────────────────────────────────────────────────────
    var isBfAf = (abType === 'bf-af');

    // bf-af est toujours monoprote
    if (isBfAf) nProtons = 1;
    // af-fort-bf aussi
    if (abType === 'af-fort-bf') nProtons = 1;

    var Ka1 = (abType === 'af-fort-bf') ? 1e10 : Math.pow(10, -pka);
    var Ka2 = Math.pow(10, -pka2);
    var Ka3 = Math.pow(10, -pka3);

    var xLabel = isBfAf ? 'V(HCl) (mL)' : 'V(NaOH) (mL)';
    var Veq1   = c1 * v1 / c2;
    var Veq2   = 2 * Veq1;
    var Veq3   = 3 * Veq1;

    // vbMax : montrer jusqu'à 40 % après la dernière équivalence
    var lastVeq = (nProtons === 3) ? Veq3 : (nProtons === 2) ? Veq2 : Veq1;
    var vbMax   = lastVeq * 1.45;

    // pKa attendu pour chaque mode (bf-af : pKa conjugué)
    var pKa1_exp = isBfAf ? (14 - pka) : pka;
    var pKa2_exp = pka2;
    var pKa3_exp = pka3;

    // Cible et curseur selon abFind
    var isVolCursor = (abFind === 'equivalence' || abFind === 'veq2' || abFind === 'veq3');
    var targetVol = (abFind === 'veq2') ? Veq2 : (abFind === 'veq3') ? Veq3 : Veq1;
    var targetPh  = (abFind === 'pka2') ? pKa2_exp : (abFind === 'pka3') ? pKa3_exp : pKa1_exp;

    // ── Formule de la courbe ─────────────────────────────────────────
    // Tous les cas : Vb = V1*(Ca*aw + (oh-h)) / (Cb-(oh-h))
    // aw = weighted alpha = sum(k*alpha_k, k=1..n)
    // aw = (Ka1*h^(n-1) + 2*Ka1*Ka2*h^(n-2) + ...) / D
    var curveFn;
    if (isBfAf) {
        // Va = Vb*(h-oh + Cb*Kb/(Kb+oh)) / (Ca-(h-oh))  [Kb = Ka1 ici]
        curveFn = '    var num = h - oh + cc1 * Ka1 / (Ka1 + oh);\n'
                + '    var den = cc2 - (h - oh);\n';
    } else if (nProtons === 1) {
        curveFn = '    var D  = h + Ka1;\n'
                + '    var aw = Ka1 / D;\n'
                + '    var num = cc1 * aw + (oh - h);\n'
                + '    var den = cc2 - (oh - h);\n';
    } else if (nProtons === 2) {
        curveFn = '    var D  = h*h + Ka1*h + Ka1*Ka2;\n'
                + '    var aw = (Ka1*h + 2*Ka1*Ka2) / D;\n'
                + '    var num = cc1 * aw + (oh - h);\n'
                + '    var den = cc2 - (oh - h);\n';
    } else {  // n === 3
        curveFn = '    var D  = h*h*h + Ka1*h*h + Ka1*Ka2*h + Ka1*Ka2*Ka3;\n'
                + '    var aw = (Ka1*h*h + 2*Ka1*Ka2*h + 3*Ka1*Ka2*Ka3) / D;\n'
                + '    var num = cc1 * aw + (oh - h);\n'
                + '    var den = cc2 - (oh - h);\n';
    }

    // ── JSXGraph string ─────────────────────────────────────────────
    var bb  = '[-0.8, 14.8, ' + (vbMax * 1.08).toFixed(1) + ', -0.5]';

    var jxg = 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '  boundingbox: ' + bb + ',\n'
        + '  keepaspectratio: false, showCopyright: false, showNavigation: false\n'
        + '});\n'
        + 'board.create("axis", [[0,0],[1,0]], {\n'
        + '  name: "' + xLabel + '", withLabel: true,\n'
        + '  label: {position:"rt", offset:[0,15], fontSize:12}\n'
        + '});\n'
        + 'board.create("axis", [[0,0],[0,1]], {\n'
        + '  name: "pH", withLabel: true,\n'
        + '  label: {position:"rt", offset:[10,0], fontSize:12},\n'
        + '  ticks: {ticksDistance:2, minorTicks:1}\n'
        + '});\n'
        + 'var Ka1=' + Ka1.toExponential(4) + ', Ka2=' + Ka2.toExponential(4)
        + ', Ka3=' + Ka3.toExponential(4) + ', Kw=1e-14;\n'
        + 'var cc1=' + c1 + ', vv1=' + v1 + ', cc2=' + c2 + ';\n'
        + 'board.create("curve", [\n'
        + '  function(t) {\n'
        + '    var h = Math.pow(10, -t), oh = Kw / h;\n'
        + curveFn
        + '    var x = vv1 * num / den;\n'
        + '    return (x < 0 || !isFinite(x) || isNaN(x)) ? NaN : x;\n'
        + '  },\n'
        + '  function(t) { return t; },\n'
        + '  0.3, 13.7\n'
        + '], {strokeColor:"#2563eb",strokeWidth:2.5,fixed:true,highlight:false,numberPointsHigh:300});\n';

    // Curseur vertical (équivalence) ─────────────────────────
    if (isVolCursor) {
        var initVe   = (targetVol * 0.5).toFixed(2);
        var clampMax = (vbMax * 1.05).toFixed(1);
        var dx       = (vbMax * 0.025).toFixed(2);
        var lbl      = (abFind === 'veq2') ? 'Veq2?' : (abFind === 'veq3') ? 'Veq3?' : 'Veq?';
        jxg += 'var cursor = board.create("point", [' + initVe + ', 0], {\n'
            + '  size:7, face:"circle", fillColor:"#ef4444", strokeColor:"#b91c1c",\n'
            + '  name:"' + lbl + '", label:{fontSize:12, color:"#b91c1c", offset:[5,8]}\n'
            + '});\n'
            + 'cursor.on("drag", function() {\n'
            + '  this.setPosition(JXG.COORDS_BY_USER, [Math.max(0, Math.min(' + clampMax + ', this.X())), 0]);\n'
            + '  board.update();\n'
            + '});\n'
            + 'var cTop = board.create("point", [function(){return cursor.X();}, 14.5],\n'
            + '  {visible:false, fixed:false, highlight:false});\n'
            + 'board.create("segment", [cursor, cTop],\n'
            + '  {strokeColor:"#ef4444", strokeWidth:1.5, dash:2, fixed:false, highlight:false});\n'
            + 'board.create("text",\n'
            + '  [function(){return cursor.X()+' + dx + ';}, 13.2,\n'
            + '   function(){return "V="+cursor.X().toFixed(1)+" mL";}],\n'
            + '  {fixed:false, fontSize:11, color:"#ef4444", highlight:false});\n'
            + 'stack_jxg.bind_point(board, "ans' + X + '", cursor);\n';

    // Curseur horizontal (pKa) ───────────────────────────────
    } else {
        var initPH  = (targetPh * 0.65).toFixed(2);
        var clampRt = (vbMax * 1.05).toFixed(1);
        var pLbl    = (abFind === 'pka2') ? 'pKa2?' : (abFind === 'pka3') ? 'pKa3?' : 'pKa1?';
        jxg += 'var cursor = board.create("point", [0, ' + initPH + '], {\n'
            + '  size:7, face:"circle", fillColor:"#7c3aed", strokeColor:"#6d28d9",\n'
            + '  name:"' + pLbl + '", label:{fontSize:12, color:"#6d28d9", offset:[8,0]}\n'
            + '});\n'
            + 'cursor.on("drag", function() {\n'
            + '  this.setPosition(JXG.COORDS_BY_USER, [0, Math.max(0, Math.min(14, this.Y()))]);\n'
            + '  board.update();\n'
            + '});\n'
            + 'var cRight = board.create("point",\n'
            + '  [' + clampRt + ', function(){return cursor.Y();}],\n'
            + '  {visible:false, fixed:false, highlight:false});\n'
            + 'board.create("segment", [cursor, cRight],\n'
            + '  {strokeColor:"#7c3aed", strokeWidth:1.5, dash:2, fixed:false, highlight:false});\n'
            + 'board.create("text",\n'
            + '  [' + (Veq1 * 0.3).toFixed(1) + ', function(){return cursor.Y()+0.35;},\n'
            + '   function(){return "pH="+cursor.Y().toFixed(2);}],\n'
            + '  {fixed:false, fontSize:11, color:"#7c3aed", highlight:false});\n'
            + 'stack_jxg.bind_point(board, "ans' + X + '", cursor);\n';
    }

    // ── STACK XML ───────────────────────────────────────────────────
    var tans, feedVars, condition;
    if (isVolCursor) {
        tans      = '[' + targetVol.toFixed(4) + ', 0]';
        feedVars  = 'ab_vcur_' + X + ':float(ans' + X + '[1]);\n'
                  + 'ab_vtgt_' + X + ':' + targetVol.toFixed(4) + ';\n'
                  + 'ab_ok_'   + X + ':is(abs(ab_vcur_' + X + ' - ab_vtgt_' + X + ') <= ' + tolVol.toFixed(4) + ');\n';
    } else {
        tans      = '[0, ' + targetPh.toFixed(4) + ']';
        feedVars  = 'ab_phcur_' + X + ':float(ans' + X + '[2]);\n'
                  + 'ab_phtgt_' + X + ':' + targetPh.toFixed(4) + ';\n'
                  + 'ab_ok_'    + X + ':is(abs(ab_phcur_' + X + ' - ab_phtgt_' + X + ') <= ' + tolPh.toFixed(4) + ');\n';
    }
    condition = 'ab_ok_' + X;

    var inputXML = '<input><name>ans' + X + '</name>'
        + '<type>algebraic</type><tans>' + tans + '</tans>'
        + '<boxsize>5</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>0</showvalidation><options></options></input>';

    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: condition, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: String(bareme), truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    // ── Données et consigne ─────────────────────────────────────────
    var typeMap = {'af-bf':'Acide faible + base forte','bf-af':'Base faible + acide fort','af-fort-bf':'Acide fort + base forte'};
    var instrMap = {
        'equivalence': 'Faites glisser le curseur vertical (rouge) jusqu\'au saut de pH de la 1ʳᵉ \xe9quivalence.',
        'veq2':        'Faites glisser le curseur vertical (rouge) jusqu\'au saut de pH de la 2ᵉ \xe9quivalence.',
        'veq3':        'Faites glisser le curseur vertical (rouge) jusqu\'au saut de pH de la 3ᵉ \xe9quivalence.',
        'pka':         'Faites glisser le curseur horizontal (violet) \xe0 la hauteur du pKa1 (\xe0 la demi-\xe9quivalence).',
        'pka2':        'Faites glisser le curseur horizontal (violet) \xe0 la hauteur du pKa2.',
        'pka3':        'Faites glisser le curseur horizontal (violet) \xe0 la hauteur du pKa3.'
    };

    var pkaStr = '';
    if (abType !== 'af-fort-bf') {
        pkaStr = ', pKa1&nbsp;=&nbsp;' + pKa1_exp.toFixed(2);
        if (nProtons >= 2) pkaStr += ', pKa2&nbsp;=&nbsp;' + pKa2_exp.toFixed(2);
        if (nProtons >= 3) pkaStr += ', pKa3&nbsp;=&nbsp;' + pKa3_exp.toFixed(2);
    }
    var nStr  = nProtons > 1 ? ' (H₂A, n=' + nProtons + ')' : '';

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Donn\xe9es :</strong> '
        + (typeMap[abType] || abType) + nStr
        + ' &mdash; C₁&nbsp;=&nbsp;' + c1 + '&nbsp;mol/L,'
        + ' V₁&nbsp;=&nbsp;' + v1 + '&nbsp;mL,'
        + ' C₂&nbsp;=&nbsp;' + c2 + '&nbsp;mol/L'
        + pkaStr
        + '</p>\n';

    var textFrag = '<div style="background:#14532d;border-left:5px solid #166534;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — pH-m\xe9trie</strong>'
        + '<span style="background:#166534;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + (instrMap[abFind] || '')
        + '</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'AcideBase Q' + X + ' n=' + nProtons + ' ' + abType + ' ' + abFind,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        prt:             { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback: _mkFbGen('', v('ab-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]'
    };
}

// ══════════════════════════════════════════════════════════════
//  genRedox — Dosage oxydo-réduction (potentiométrie)
//  Courbe E(V) : deux branches Nernst de part et d'autre de Veq
//    Avant Veq : E = E°₂ + (0.06/n₂)·log(V/(Veq−V))
//    Après Veq : E = E°₁ + (0.06/n₁)·log((V−Veq)/Veq)
//    À Veq     : E_eq = (n₁·E°₁ + n₂·E°₂)/(n₁+n₂)
//  Veq = n₂·C₂·V₂ / (n₁·C₁)
// ══════════════════════════════════════════════════════════════
