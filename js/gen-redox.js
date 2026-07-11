// ── XML GENERATORS: redox ──

function genRedox(X) {
    var v = function(id){ var el=document.getElementById(id); return el?el.value:''; };

    var rxFind     = v('rx-find') || 'equivalence';  // equivalence | eo1 | eo2
    var e1         = parseFloat(v('rx-e1'))  || 1.51;  // E° titrant (Ox1/Red1), fort
    var n1         = parseInt(v('rx-n1'))    || 5;     // e⁻ par molécule titrant
    var e2         = parseFloat(v('rx-e2'))  || 0.77;  // E° espèce titrée (Ox2/Red2)
    var n2         = parseInt(v('rx-n2'))    || 1;     // e⁻ par molécule titrée
    var c1         = parseFloat(v('rx-c1'))  || 0.02;  // conc. titrant (mol/L)
    var c2         = parseFloat(v('rx-c2'))  || 0.1;   // conc. espèce titrée (mol/L)
    var v2         = parseFloat(v('rx-v2'))  || 20;    // volume espèce titrée (mL)
    var titrantName= v('rx-titrant-name')    || 'titrant';
    var tolVol     = parseFloat(v('rx-tol-vol')) || 0.5;
    var tolE       = parseFloat(v('rx-tol-e'))   || 0.05;
    var W          = parseInt(v('rx-w'))     || 500;
    var H          = parseInt(v('rx-h'))     || 400;
    var bareme     = parseFloat(v('rx-bareme')) || 1;
    var fbOk       = v('rx-fb-ok');
    var fbWrong    = v('rx-fb-wrong');

    var textFrag   = richVal('rx-text');

    // ── Grandeurs physiques ──────────────────────────────────────────────
    var Veq  = n2 * c2 * v2 / (n1 * c1);          // mL
    var Eeq  = (n1 * e1 + n2 * e2) / (n1 + n2);   // V
    var Vmax = Veq * 1.65;

    var yLow  = Math.min(e1, e2) - 0.40;
    var yHigh = Math.max(e1, e2) + 0.30;

    // Pour STACK : valeur cible selon rxFind
    var targetVol = Veq;   // pour 'equivalence'
    var targetE   = (rxFind === 'eo1') ? e1 : e2;  // pour 'eo1' / 'eo2'

    var isVolCursor = (rxFind === 'equivalence');

    // ── Curseur initial hors-cible ────────────────────────────────────────
    // Cursor starts at Veq*0.55 (vol) or midpoint E (pot)
    var cursorInitX = isVolCursor ? (Veq * 0.55) : 0;
    var cursorInitY = isVolCursor ? yLow : ((yLow + yHigh) / 2);

    // ── JSXGraph code (embedding all params as literals) ─────────────────
    var bb0 = (-Vmax * 0.04).toFixed(3);
    var bb1 = (yHigh + 0.05).toFixed(3);
    var bb2 = (Vmax * 1.08).toFixed(3);
    var bb3 = (yLow  - 0.05).toFixed(3);

    // Cursor colour: red for vol, purple for potential
    var curCol   = isVolCursor ? '#ef4444' : '#7c3aed';
    var curColD  = isVolCursor ? '#b91c1c' : '#5b21b6';

    var jxgCode = [
'var board=JXG.JSXGraph.initBoard(divid,{',
'  boundingbox:[' + bb0 + ',' + bb1 + ',' + bb2 + ',' + bb3 + '],',
'  axis:false,keepAspectRatio:false,showCopyright:false,showNavigation:false',
'});',
'var xAxis=board.create("axis",[[-0.01,0],[1,0]],{ticks:{insertTicks:true,minTicksDistance:30},label:{position:"rt",offset:[-5,-12],fontSize:11}});',
'var yAxis=board.create("axis",[[0,-0.5],[0,1]],{ticks:{insertTicks:true,minTicksDistance:30},label:{position:"rt",offset:[8,0],fontSize:11}});',
'board.create("text",[' + (Vmax*0.52).toFixed(2) + ',' + (yLow - 0.03).toFixed(3) + ',"V(' + titrantName.replace(/'/g,"\\'") + ') (mL)",{anchorX:"middle",fontSize:11}]);',
'board.create("text",[' + (Vmax*0.015).toFixed(3) + ',' + (yHigh + 0.02).toFixed(3) + ',"E (V)",{anchorX:"left",fontSize:11}]);',
'var Veq=' + Veq.toFixed(4) + ';',
'var e1=' + e1.toFixed(4) + ';var n1=' + n1 + ';',
'var e2=' + e2.toFixed(4) + ';var n2=' + n2 + ';',
'var Vmax=' + Vmax.toFixed(4) + ';',
'var yLow=' + yLow.toFixed(4) + ';var yHigh=' + yHigh.toFixed(4) + ';',
'var eps=Veq*0.003;',
// Branche avant Veq
'board.create("curve",[function(t){return t;},function(t){var r=t/(Veq-t);return(r<=0)?NaN:e2+(0.06/n2)*Math.log10(r);},eps,Veq-eps],{strokeColor:"#2563eb",strokeWidth:2.5,highlight:false,recursionDepthHigh:5,numberPointsHigh:300});',
// Branche après Veq
'board.create("curve",[function(t){return t;},function(t){var r=(t-Veq)/Veq;return(r<=0)?NaN:e1+(0.06/n1)*Math.log10(r);},Veq+eps,Vmax],{strokeColor:"#2563eb",strokeWidth:2.5,highlight:false,recursionDepthHigh:5,numberPointsHigh:300});',
// Point Eeq
'var Eeq=' + Eeq.toFixed(4) + ';',
'board.create("point",[Veq,Eeq],{size:4,fillColor:"#2563eb",strokeColor:"#1d4ed8",name:"",fixed:true,withLabel:false});',
// Pointillés à Veq (vertical)
'board.create("segment",[[Veq,yLow-0.02],[Veq,Eeq]],{strokeColor:"#94a3b8",dash:2,strokeWidth:1.2,highlight:false});',
// Curseur
(isVolCursor ? [
'var cur=board.create("point",[' + cursorInitX.toFixed(3) + ',' + yLow.toFixed(3) + '],{size:8,fillColor:"' + curCol + '",strokeColor:"' + curColD + '",name:"▶",label:{offset:[0,10],fontSize:12,fontWeight:"bold",color:"' + curCol + '"}});',
'cur.on("drag",function(){this.setPosition(JXG.COORDS_BY_USER,[Math.max(0.001,Math.min(Vmax*1.05,this.X())),' + yLow.toFixed(3) + ']);});',
'var cTop=board.create("point",[function(){return cur.X();},yHigh+0.03],{visible:false,fixed:false});',
'board.create("segment",[cur,cTop],{strokeColor:"' + curCol + '",dash:2,strokeWidth:1.8,highlight:false});'
].join('\n') : [
'var cur=board.create("point",[0,' + cursorInitY.toFixed(3) + '],{size:8,fillColor:"' + curCol + '",strokeColor:"' + curColD + '",name:"▶",label:{offset:[10,0],fontSize:12,fontWeight:"bold",color:"' + curCol + '"}});',
'cur.on("drag",function(){this.setPosition(JXG.COORDS_BY_USER,[0,Math.max(' + (yLow).toFixed(3) + ',Math.min(' + (yHigh).toFixed(3) + ',this.Y()))]);});',
'var cRight=board.create("point",[Vmax*1.05,function(){return cur.Y();}],{visible:false,fixed:false});',
'board.create("segment",[cur,cRight],{strokeColor:"' + curCol + '",dash:2,strokeWidth:1.8,highlight:false});'
].join('\n')),
'stack_jxg.bind_point(board,"ans' + X + '",cur);',
'board.update();'
    ].join('\n');

    // ── Encodage XML ──────────────────────────────────────────────────────
    var jxgXML = '[[jsxgraph width="' + W + 'px" height="' + H + 'px"]]' + jxgCode + '[[/jsxgraph]]';

    // ── STACK input ───────────────────────────────────────────────────────
    var tansVal = isVolCursor ? '[' + Veq.toFixed(4) + ', 0]' : '[0, ' + targetE.toFixed(4) + ']';
    var inputXML = '<input><name>ans' + X + '</name>'
        + '<type>algebraic</type><tans>' + tansVal + '</tans>'
        + '<boxsize>5</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>0</showvalidation><options></options></input>';

    // ── feedvars & PRT ────────────────────────────────────────────────────
    var feedVars;
    if (isVolCursor) {
        feedVars = 'rx_vcur:float(ans' + X + '[1]);\n'
                 + 'rx_vtgt:' + Veq.toFixed(4) + ';\n'
                 + 'rx_ok:is(abs(rx_vcur-rx_vtgt)<=' + tolVol.toFixed(3) + ');\n';
    } else {
        feedVars = 'rx_ecur:float(ans' + X + '[2]);\n'
                 + 'rx_etgt:' + targetE.toFixed(4) + ';\n'
                 + 'rx_ok:is(abs(rx_ecur-rx_etgt)<=' + tolE.toFixed(3) + ');\n';
    }

    var fbOkFinal    = fbOk    || '<p>✅ <strong>Bonne réponse !</strong></p>';
    var fbWrongFinal = fbWrong || '<p>❌ <strong>Réponse incorrecte.</strong></p>';

    var prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'rx_ok', tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: String(bareme), truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOkFinal,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrongFinal
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var questionLabel = 'Question ' + X + ' — Dosage redox';
    var rxFindLabel   = isVolCursor ? ('Veq = ' + Veq.toFixed(2) + ' mL')
                                    : ((rxFind==='eo1'?'E°₁':'E°₂') + ' = ' + targetE.toFixed(3) + ' V');
    var questionText  = '<p>' + (textFrag || questionLabel) + '</p>' + jxgXML
        + '[[input:ans' + X + ']][[validation:ans' + X + ']]'
        + '[[feedback:prt' + X + ']]';

    return {
        type:            'redox',
        bareme:          bareme,
        vars:            '',
        qnote:           'Redox Q' + X + ' ' + rxFind + ' Veq=' + Veq.toFixed(2),
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('rx-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}
// ==============================================================
//  genBasen — Conversion de base N (bibliotheque STACK basen)
//  Scenarios : dec-to-base | base-to-dec
//  Notation  : S (suffixe _n) ou C (0b / 0o / 0x)
// ==============================================================
