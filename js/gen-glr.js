// ── XML GENERATORS: graphique libre (GLR) ──

function glrPrepareFn(expr) {
    return expr
        .replace(/\bsin\b/g,  'Math.sin')
        .replace(/\bcos\b/g,  'Math.cos')
        .replace(/\btan\b/g,  'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\babs\b/g,  'Math.abs')
        .replace(/\bexp\b/g,  'Math.exp')
        .replace(/\bln\b/g,   'Math.log')
        .replace(/\blog\b/g,  'Math.log')
        .replace(/\bPI\b/g,   'Math.PI')
        .replace(/\bpi\b/g,   'Math.PI')
        .replace(/\^/g,       '**');
}

function genGLR(X) {
    var bareme  = parseFloat(v('glr-bareme'))  || 1;
    var text    = richVal('glr-text');
    var fnRaw   = v('glr-fn').trim();
    var xMin    = parseFloat(v('glr-xmin'))    || -5;
    var xMax    = parseFloat(v('glr-xmax'))    || 5;
    var yMin    = parseFloat(v('glr-ymin'))    || -5;
    var yMax    = parseFloat(v('glr-ymax'))    || 5;
    var x0      = parseFloat(v('glr-x0'));
    var tol     = parseFloat(v('glr-tol'))     || 0.25;
    var dispW   = parseInt(v('glr-w'))         || 600;
    var dispH   = parseInt(v('glr-h'))         || 400;
    var fbOkTxt = v('glr-fb-ok').trim();
    var fbWrTxt = v('glr-fb-wrong').trim();

    if (!fnRaw) throw new Error(I18N.t('glr.err_fn'));
    if (isNaN(x0)) throw new Error(I18N.t('glr.err_x0'));

    /* ── Convert expression to JS + evaluate y₀ ── */
    var fnJs = glrPrepareFn(fnRaw);
    var y0 = 0;
    try {
        /* jshint evil:true */
        y0 = (new Function('x', 'return (' + fnJs + ');'))(x0);
        if (!isFinite(y0)) throw new Error('f(x₀) non fini');
    } catch (e) {
        throw new Error(I18N.t('glr.err_fn_eval') + ' : ' + e.message);
    }
    y0 = parseFloat(y0.toFixed(6));
    x0 = parseFloat(x0.toFixed(6));
    var tansPt = '[' + x0 + ',' + y0 + ']';

    /* ── Maxima feedbackvariables ── */
    /* Snap guarantees y is always on curve → only x-tolerance needed */
    var fbVars = 'glr_x_' + X + ': if listp(ans' + X + ') and length(ans' + X + ')=2 then ans' + X + '[1] else -9999;\n'
               + 'glr_y_' + X + ': if listp(ans' + X + ') and length(ans' + X + ')=2 then ans' + X + '[2] else -9999;\n'
               + 'glr_in_' + X + ': is(glr_x_' + X + '>=' + xMin + ' and abs(glr_x_' + X + '-(' + x0 + '))<=' + tol + ');';

    /* ── Input XML ── */
    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans>' + tansPt + '</tans>\n'
        + '      <boxsize>15</boxsize>\n'
        + '      <strictsyntax>1</strictsyntax>\n'
        + '      <insertstars>0</insertstars>\n'
        + '      <syntaxhint></syntaxhint>\n'
        + '      <syntaxattribute>0</syntaxattribute>\n'
        + '      <forbidwords></forbidwords>\n'
        + '      <allowwords></allowwords>\n'
        + '      <forbidfloat>0</forbidfloat>\n'
        + '      <requirelowestterms>0</requirelowestterms>\n'
        + '      <checkanswertype>0</checkanswertype>\n'
        + '      <mustverify>0</mustverify>\n'
        + '      <showvalidation>0</showvalidation>\n'
        + '      <options></options>\n'
        + '    </input>';

    /* ── Feedback ── */
    var fbOk    = wrapFb('<p>✅ <strong>Bonne lecture !</strong>'
                       + (fbOkTxt ? ' ' + htmlEsc(fbOkTxt) : '')
                       + '</p><p style="font-size:.9em">x&nbsp;≈&nbsp;{@round(glr_x_' + X + '*100)/100@} — réponse attendue&nbsp;: x&nbsp;=&nbsp;' + x0 + '</p>', true);
    var fbWrong = wrapFb('<p>❌ <strong>Point incorrect.</strong>'
                       + (fbWrTxt ? ' ' + htmlEsc(fbWrTxt) : '')
                       + '</p><p style="font-size:.9em">Vous avez sélectionné x&nbsp;≈&nbsp;{@round(glr_x_' + X + '*100)/100@}. La tolérance est ±' + tol + ' unités.</p>', false);

    /* ── PRT ── */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'glr_in_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    /* ── JSXGraph code ── */
    /* The click snaps to the curve: stores [x, f(x)] → y-axis check not needed */
    var sentinelX = (xMin - 1).toFixed(2);
    var jxgCode = '(function(){\n'
        + '/* Q' + X + ' — Lecture graphique */\n'
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[' + xMin + ',' + yMax + ',' + xMax + ',' + yMin + '],\n'
        + '  axis:true,grid:true,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        + 'var glrFn=function(x){try{return(' + fnJs + ');}catch(e){return NaN;}};\n'
        + "board.create('functiongraph',[glrFn," + xMin + "," + xMax + "],{\n"
        + "  strokeColor:'#2563eb',strokeWidth:2.5,fixed:true,highlight:false\n"
        + "});\n"
        + "var tracker=board.create('point',[" + sentinelX + ",0],{visible:false});\n"
        + 'stack_jxg.bind_point(board,ans' + X + ',tracker);\n'
        + "var marker=board.create('point',[" + sentinelX + ",0],{\n"
        + "  size:7,fillColor:'#ef4444',strokeColor:'#fff',strokeWidth:2.5,\n"
        + "  visible:false,fixed:true,name:'',label:{visible:false}\n"
        + "});\n"
        + "var xLabel=board.create('text',[" + sentinelX + ",0,''],{\n"
        + "  fixed:true,fontSize:13,strokeColor:'#1e293b',visible:false\n"
        + "});\n"
        + "board.on('down',function(e){\n"
        + '  var c=new JXG.Coords(JXG.COORDS_BY_SCREEN,board.getMousePosition(e),board);\n'
        + '  var ux=Math.max(' + xMin + ',Math.min(' + xMax + ',c.usrCoords[1]));\n'
        + '  var uy=glrFn(ux);\n'
        + '  if(!isFinite(uy))return;\n'
        + '  tracker.setPosition(JXG.COORDS_BY_USER,[ux,uy]);\n'
        + '  marker.setPosition(JXG.COORDS_BY_USER,[ux,uy]);\n'
        + '  marker.setAttribute({visible:true});\n'
        + "  xLabel.setCoords(ux,uy+0.4*((" + yMax + "-" + yMin + ")/10));\n"
        + "  xLabel.setText('x≈'+(Math.round(ux*100)/100));\n"
        + '  xLabel.setAttribute({visible:true});\n'
        + '  board.update();\n'
        + '});\n'
        + 'board.unsuspendUpdate();\n'
        + 'setTimeout(function(){\n'
        + '  var tx=tracker.X();\n'
        + '  if(tx>=' + xMin + '){\n'
        + '    var ty=glrFn(tx);\n'
        + '    if(isFinite(ty)){\n'
        + '      marker.setPosition(JXG.COORDS_BY_USER,[tx,ty]);\n'
        + '      marker.setAttribute({visible:true});\n'
        + "      xLabel.setCoords(tx,ty+0.4*((" + yMax + "-" + yMin + ")/10));\n"
        + "      xLabel.setText('x≈'+(Math.round(tx*100)/100));\n"
        + '      xLabel.setAttribute({visible:true});\n'
        + '      board.update();\n'
        + '    }\n'
        + '  }\n'
        + '},50);\n'
        + '})();';

    /* ── Question text ── */
    var textFrag = '<div style="background:#0369A1;border-left:5px solid #075985;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — Lecture graphique</strong>'
        + '<span style="background:#075985;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxgCode + '\n'
        + '[[/jsxgraph]]\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Graph Q' + X + ' x₀=' + x0,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('glr-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

