// ── XML GENERATORS: redox ──

// Wrapper DOM-couplé : lit les champs du panneau et délègue à genRedoxCore()
// (fonction pure, testable hors navigateur — voir test/unit/gen-redox.test.js).
async function genRedox(X) {
    var v = function(id){ var el=document.getElementById(id); return el?el.value:''; };

    var p = {
        // rxFind: equivalence | eo1 | eo2 | demi | double | eeq | calc
        rxFind:      v('rx-find') || 'equivalence',
        e1:          parseFloat(v('rx-e1'))  || 1.51,  // E° titrant (Ox1/Red1), fort
        n1:          parseInt(v('rx-n1'))    || 5,     // e⁻ par molécule titrant
        e2:          parseFloat(v('rx-e2'))  || 0.77,  // E° espèce titrée (Ox2/Red2)
        n2:          parseInt(v('rx-n2'))    || 1,     // e⁻ par molécule titrée
        c1:          parseFloat(v('rx-c1'))  || 0.02,  // conc. titrant (mol/L)
        c2:          parseFloat(v('rx-c2'))  || 0.1,   // conc. espèce titrée (mol/L)
        v2:          parseFloat(v('rx-v2'))  || 20,    // volume espèce titrée (mL)
        titrantName: v('rx-titrant-name')    || 'titrant',
        tolVol:      parseFloat(v('rx-tol-vol')) || 0.5,
        tolE:        parseFloat(v('rx-tol-e'))   || 0.05,
        tolC:        parseFloat(v('rx-tol-c'))   || 0.005,
        W:           parseInt(v('rx-w'))     || 750,
        H:           parseInt(v('rx-h'))     || 400,
        bareme:      parseFloat(v('rx-bareme')) || 1,
        fbOk:        v('rx-fb-ok'),
        fbWrong:     v('rx-fb-wrong'),
        fbGen:       v('rx-fbgen'),
        textFrag:    richVal('rx-text')
    };

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'redox', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Quota hebdomadaire atteint.');
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "redox", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "redox", repli sur le calcul local.', e); }
    return genRedoxCore(X, p);
}

// Cœur pur : aucune lecture du DOM, uniquement des paramètres explicites.
// `deps` permet d'injecter des implémentations de test (voir test/unit/gen-redox.test.js) ;
// par défaut on retombe sur les globales chargées par l'app (I18N, buildPrtXml, _mkFbGen).
function genRedoxCore(X, p, deps) {
    deps = deps || {};
    var I18Nd       = deps.I18N       || I18N;
    var buildPrtXml_= deps.buildPrtXml|| buildPrtXml;
    var mkFbGen     = deps._mkFbGen   || _mkFbGen;

    var rxFind      = p.rxFind;
    var e1 = p.e1, n1 = p.n1, e2 = p.e2, n2 = p.n2;
    var c1 = p.c1, c2 = p.c2, v2 = p.v2;
    var titrantName = p.titrantName;
    // Échappe apostrophes + tout caractère non-ASCII (\uXXXX) pour une chaîne JS
    // insérée littéralement dans un bloc [[jsxgraph]] : voir Problème connu #38,
    // un caractère Unicode littéral (ex: "₄" dans "KMnO₄") casse le rendu réel
    // Moodle 4.5.12/qtype_stack 4.11.1 ("SyntaxError: missing ) in parenthetical").
    function jsxEscape(s) {
        return String(s).replace(/[\\']/g, '\\$&').replace(/[^\x00-\x7F]/g, function(c) {
            return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');
        });
    }
    var tolVol = p.tolVol, tolE = p.tolE, tolC = p.tolC;
    var W = p.W, H = p.H, bareme = p.bareme;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, textFrag = p.textFrag;

    // ── Bandeau coloré d'en-tête (Q{X} — titre / barème) ───────────────────
    // Bug trouvé lors de la validation Moodle réelle du 2026-07-24 : genRedoxCore
    // ne posait jamais de bandeau, contrairement à tous les autres types migrés
    // (voir le motif équivalent dans gen-acidebase.js:banner(), gen-basen.js:HDR, etc.).
    var RX_BG = '#1e40af', RX_BORDER = '#172554';
    var banner = '<div style="background:' + RX_BG + ';border-left:5px solid ' + RX_BORDER + ';border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18Nd.t('rx.title') + '</strong>'
        + '<span style="background:' + RX_BORDER + ';color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n';

    // ── Grandeurs physiques ──────────────────────────────────────────────
    var Veq  = n2 * c2 * v2 / (n1 * c1);          // mL
    var Eeq  = (n1 * e1 + n2 * e2) / (n1 + n2);   // V

    // 'double' a besoin de voir jusqu'à 2·Veq sur le graphe
    var Vmax = Veq * (rxFind === 'double' ? 2.3 : 1.65);

    var yLow  = Math.min(e1, e2) - 0.40;
    var yHigh = Math.max(e1, e2) + 0.30;

    // Catégorie de curseur selon rxFind
    var cursorMode = 'none';           // 'x' | 'y' | 'xy' | 'none'
    var Vt = null, Et = null;          // cible(s)
    if (rxFind === 'equivalence') { cursorMode = 'x';  Vt = Veq; }
    else if (rxFind === 'eo1')    { cursorMode = 'y';  Et = e1; }
    else if (rxFind === 'eo2')    { cursorMode = 'y';  Et = e2; }
    else if (rxFind === 'demi')   { cursorMode = 'xy'; Vt = Veq / 2;  Et = e2; }
    else if (rxFind === 'double') { cursorMode = 'xy'; Vt = Veq * 2;  Et = e1; }
    else if (rxFind === 'eeq')    { cursorMode = 'xy'; Vt = Veq;      Et = Eeq; }
    else if (rxFind === 'calc')   { cursorMode = 'none'; }

    // Le repère (Veq,Eeq) + pointillés donnerait la réponse pour 'equivalence', 'eeq' et
    // 'calc' (l'élève doit lire Veq lui-même) : on le masque alors.
    var showVeqMarker = (rxFind === 'eo1' || rxFind === 'eo2' || rxFind === 'demi' || rxFind === 'double');

    // ── Curseur initial hors-cible ────────────────────────────────────────
    var cursorInitX, cursorInitY;
    if (cursorMode === 'x')       { cursorInitX = Veq * 0.55; cursorInitY = yLow; }
    else if (cursorMode === 'y')  { cursorInitX = 0;          cursorInitY = (yLow + yHigh) / 2; }
    else if (cursorMode === 'xy') { cursorInitX = Vmax * 0.12; cursorInitY = yHigh - 0.05; }

    // ── JSXGraph code (embedding all params as literals) ─────────────────
    var bb0 = (-Vmax * 0.04).toFixed(3);
    var bb1 = (yHigh + 0.05).toFixed(3);
    var bb2 = (Vmax * 1.08).toFixed(3);
    var bb3 = (yLow  - 0.05).toFixed(3);

    // Cursor colour: rouge (vol), violet (potentiel), orange (point 2D)
    var curCol  = (cursorMode === 'x') ? '#ef4444' : (cursorMode === 'y') ? '#7c3aed' : '#ea580c';
    var curColD = (cursorMode === 'x') ? '#b91c1c' : (cursorMode === 'y') ? '#5b21b6' : '#9a3412';

    var cursorCode = '';
    if (cursorMode === 'x') {
        cursorCode = [
'var cur=board.create("point",[' + cursorInitX.toFixed(3) + ',' + yLow.toFixed(3) + '],{size:8,fillColor:"' + curCol + '",strokeColor:"' + curColD + '",name:"\\u25b6",label:{offset:[0,10],fontSize:12,fontWeight:"bold",color:"' + curCol + '"}});',
'cur.on("drag",function(){this.setPosition(JXG.COORDS_BY_USER,[Math.max(0.001,Math.min(Vmax*1.05,this.X())),' + yLow.toFixed(3) + ']);});',
'var cTop=board.create("point",[function(){return cur.X();},yHigh+0.03],{visible:false,fixed:false});',
'board.create("segment",[cur,cTop],{strokeColor:"' + curCol + '",dash:2,strokeWidth:1.8,highlight:false});'
        ].join('\n');
    } else if (cursorMode === 'y') {
        cursorCode = [
'var cur=board.create("point",[0,' + cursorInitY.toFixed(3) + '],{size:8,fillColor:"' + curCol + '",strokeColor:"' + curColD + '",name:"\\u25b6",label:{offset:[10,0],fontSize:12,fontWeight:"bold",color:"' + curCol + '"}});',
'cur.on("drag",function(){this.setPosition(JXG.COORDS_BY_USER,[0,Math.max(' + (yLow).toFixed(3) + ',Math.min(' + (yHigh).toFixed(3) + ',this.Y()))]);});',
'var cRight=board.create("point",[Vmax*1.05,function(){return cur.Y();}],{visible:false,fixed:false});',
'board.create("segment",[cur,cRight],{strokeColor:"' + curCol + '",dash:2,strokeWidth:1.8,highlight:false});'
        ].join('\n');
    } else if (cursorMode === 'xy') {
        cursorCode = [
'var cur=board.create("point",[' + cursorInitX.toFixed(3) + ',' + cursorInitY.toFixed(3) + '],{size:8,fillColor:"' + curCol + '",strokeColor:"' + curColD + '",name:"\\u271b",label:{offset:[8,8],fontSize:12,fontWeight:"bold",color:"' + curCol + '"}});',
'cur.on("drag",function(){this.setPosition(JXG.COORDS_BY_USER,[Math.max(0.001,Math.min(Vmax*1.05,this.X())),Math.max(' + yLow.toFixed(3) + ',Math.min(' + yHigh.toFixed(3) + ',this.Y()))]);});',
'var cTop=board.create("point",[function(){return cur.X();},yHigh+0.03],{visible:false,fixed:false});',
'var cRight=board.create("point",[Vmax*1.05,function(){return cur.Y();}],{visible:false,fixed:false});',
'board.create("segment",[cur,cTop],{strokeColor:"' + curCol + '",dash:2,strokeWidth:1.2,highlight:false});',
'board.create("segment",[cur,cRight],{strokeColor:"' + curCol + '",dash:2,strokeWidth:1.2,highlight:false});'
        ].join('\n');
    }

    var jxgCode = [
'var board=JXG.JSXGraph.initBoard(divid,{',
'  boundingbox:[' + bb0 + ',' + bb1 + ',' + bb2 + ',' + bb3 + '],',
'  axis:false,keepAspectRatio:false,showCopyright:false,showNavigation:false',
'});',
'var xAxis=board.create("axis",[[-0.01,' + yLow.toFixed(4) + '],[1,' + yLow.toFixed(4) + ']],{ticks:{insertTicks:true,minTicksDistance:30},label:{position:"rt",offset:[-5,-12],fontSize:11}});',
'var yAxis=board.create("axis",[[0,-0.5],[0,1]],{ticks:{insertTicks:true,minTicksDistance:30},label:{position:"rt",offset:[8,0],fontSize:11}});',
'board.create("text",[' + (Vmax*0.52).toFixed(2) + ',' + (yLow - 0.03).toFixed(3) + ',function(){return "V(' + jsxEscape(titrantName) + ') (mL)";}],{anchorX:"middle",fontSize:11});',
'board.create("text",[' + (Vmax*0.015).toFixed(3) + ',' + (yHigh + 0.02).toFixed(3) + ',function(){return "E (V)";}],{anchorX:"left",fontSize:11});',
'var Veq=' + Veq.toFixed(4) + ';',
'var e1=' + e1.toFixed(4) + ';var n1=' + n1 + ';',
'var e2=' + e2.toFixed(4) + ';var n2=' + n2 + ';',
'var Vmax=' + Vmax.toFixed(4) + ';',
'var yLow=' + yLow.toFixed(4) + ';var yHigh=' + yHigh.toFixed(4) + ';',
'var eps=Veq*0.003;',
// Branche avant Veq
'board.create("curve",[function(t){return t;},function(t){var r=t/(Veq-t);return(Math.sign(r)===1)?e2+(0.06/n2)*Math.log10(r):NaN;},eps,Veq-eps],{strokeColor:"#2563eb",strokeWidth:2.5,highlight:false,recursionDepthHigh:5,numberPointsHigh:300});',
// Branche après Veq
'board.create("curve",[function(t){return t;},function(t){var r=(t-Veq)/Veq;return(Math.sign(r)===1)?e1+(0.06/n1)*Math.log10(r):NaN;},Veq+eps,Vmax],{strokeColor:"#2563eb",strokeWidth:2.5,highlight:false,recursionDepthHigh:5,numberPointsHigh:300});',
'var Eeq=' + Eeq.toFixed(4) + ';',
// Repère (Veq,Eeq) : masqué si la question demande justement ces coordonnées (fuite de réponse)
(showVeqMarker ? [
'board.create("point",[Veq,Eeq],{size:4,fillColor:"#2563eb",strokeColor:"#1d4ed8",name:"",fixed:true,withLabel:false});',
'board.create("segment",[[Veq,yLow-0.02],[Veq,Eeq]],{strokeColor:"#94a3b8",dash:2,strokeWidth:1.2,highlight:false});'
].join('\n') : ''),
cursorCode,
(cursorMode !== 'none' ? 'stack_jxg.bind_point(ans' + X + 'Ref,cur);' : ''),
'board.update();'
    ].filter(Boolean).join('\n');

    // ── Encodage XML ──────────────────────────────────────────────────────
    // input-ref-ansX="ansXRef" : nécessaire pour que stack_jxg.bind_point()
    // puisse lier le curseur au champ de saisie STACK (voir Problème connu #38) :
    // le graphe s'exécute dans un iframe sandboxé, document.getElementById()
    // n'y voit pas le champ <input>, qui vit dans la page Moodle parente.
    // input-ref-* déclenche côté serveur STACK un stack_js.request_access_to_input(...)
    // (voir jsxgraph.block.php) qui résout la référence via postMessage inter-frame.
    var inputRefAttr = (cursorMode !== 'none') ? ' input-ref-ans' + X + '="ans' + X + 'Ref"' : '';
    var jxgXML = '[[jsxgraph width="' + W + 'px" height="' + H + 'px"' + inputRefAttr + ']]' + jxgCode + '[[/jsxgraph]]';

    // ── Boîtes de feedback colorées (mêmes codes couleur que gen-acidebase.js) ──
    function fbBox(color, bg, html) {
        return '<div style="border-left:4px solid ' + color + ';padding:10px 14px;background:' + bg + ';border-radius:4px;margin:4px 0;">' + html + '</div>';
    }
    var RED = '#dc2626', REDBG = '#fef2f2';
    var ORANGE = '#f97316', ORANGEBG = '#fff7ed';
    var GREEN = '#15803d', GREENBG = '#f0fdf4';

    // Indice directionnel générique : {@if cur<tgt then "tropBas" else "tropHaut"@}
    function dirHint(curVar, tgtVar, tropBas, tropHaut) {
        return '{@if ' + curVar + '<' + tgtVar + ' then "' + tropBas.replace(/"/g,'\\"') + '" else "' + tropHaut.replace(/"/g,'\\"') + '"@}';
    }

    if (rxFind === 'calc') {
        // ── Mode calcul : pas de curseur, réponse vectorielle [Veq lu, C2 calculé] ──
        var c2Target = (n1 * c1 * Veq) / (n2 * v2);
        var tansVal = '[' + Veq.toFixed(4) + ', ' + c2Target.toFixed(6) + ']';
        var inputXML = '<input><name>ans' + X + '</name>'
            + '<type>algebraic</type><tans>' + tansVal + '</tans>'
            + '<boxsize>15</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
            + '<syntaxhint>[Veq, C2]</syntaxhint><syntaxattribute>0</syntaxattribute>'
            + '<forbidwords></forbidwords><allowwords></allowwords>'
            + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
            + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
            + '<showvalidation>0</showvalidation><options></options></input>';

        var feedVars = 'rx_vcur:float(ans' + X + '[1]);\n'
                      + 'rx_ccur:float(ans' + X + '[2]);\n'
                      + 'rx_vtgt:' + Veq.toFixed(4) + ';\n'
                      + 'rx_ctgt:' + c2Target.toFixed(6) + ';\n'
                      + 'rx_v_ok:is(abs(rx_vcur-rx_vtgt)<=' + tolVol.toFixed(3) + ');\n'
                      + 'rx_c_ok:is(abs(rx_ccur-rx_ctgt)<=' + tolC.toFixed(4) + ');\n';

        var vWrongFb = fbBox(RED, REDBG, '❌ <strong>Le volume équivalent lu n\'est pas correct.</strong> '
            + dirHint('rx_vcur', 'rx_vtgt',
                'Ta lecture est trop faible : repère l\'endroit où le potentiel bascule brutalement (saut de potentiel), plus loin sur l\'axe des volumes.',
                'Ta lecture est trop grande : le saut de potentiel se situe plus tôt sur la courbe.')
            + '<br>Méthode : Veq est l\'abscisse du saut brutal de potentiel (rupture de pente, matérialisée par le pointillé).');
        var cWrongFb = fbBox(ORANGE, ORANGEBG, '⚠️ <strong>Bonne lecture de Veq, mais le calcul de C₂ est incorrect.</strong> '
            + 'Méthode : à l\'équivalence, les quantités de matière échangées sont proportionnelles aux électrons : n₁·C₁·Veq = n₂·C₂·V₂, donc C₂ = (n₁·C₁·Veq)/(n₂·V₂).');
        var okFb = fbBox(GREEN, GREENBG, '✅ <strong>Lecture du graphe et calcul corrects !</strong>');

        var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
        var canonicalNodes = [
            { name: '0', description: 'Lecture de Veq sur le graphe', answertest: 'AlgEquiv', sans: 'rx_v_ok', tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: '0', truepenalty: '0', truenextnode: '1', trueanswernote: 'PRT' + X + '-0-T', truefeedback: '',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-0-F', falsefeedback: vWrongFb },
            { name: '1', description: 'Calcul de C2', answertest: 'AlgEquiv', sans: 'rx_c_ok', tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(bareme), truepenalty: '0', truenextnode: '-1', trueanswernote: 'PRT' + X + '-1-T', truefeedback: okFb,
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-1-F', falsefeedback: cWrongFb }
        ];
        var prtXML = buildPrtXml_(prtMeta, canonicalNodes);

        var genFb = fbBox(GREEN, GREENBG, '<strong>🔑 Méthode et résultat :</strong> Le saut de potentiel a lieu à Veq = ' + Veq.toFixed(2) + ' mL. '
            + 'À l\'équivalence : n₁·C₁·Veq = n₂·C₂·V₂, soit C₂ = (' + n1 + '×' + c1 + '×' + Veq.toFixed(2) + ')/(' + n2 + '×' + v2 + ') = ' + c2Target.toFixed(4) + ' mol/L.');

        var questionLabel = I18Nd.t('rx.qnote_calc_fallback', {n: String(X)});
        var questionText  = banner + '<p>' + (textFrag || questionLabel) + '</p>' + jxgXML
            + '<p>[[input:ans' + X + ']][[validation:ans' + X + ']]</p>';

        return {
            type:            'redox',
            bareme:          bareme,
            vars:            '',
            qnote:           'Redox Q' + X + ' calc C2=' + c2Target.toFixed(4),
            textFrag:        questionText,
            inputXML:        inputXML,
            prtXML:          prtXML,
            generalFeedback: mkFbGen(genFb, p.fbGen),
            feedbackRef:     '[[feedback:prt' + X + ']]',
            prt:             { meta: prtMeta, nodes: canonicalNodes }
        };
    }

    // ── STACK input (modes curseur) ────────────────────────────────────────
    var tansVal = (cursorMode === 'x') ? '[' + Vt.toFixed(4) + ', 0]'
                : (cursorMode === 'y') ? '[0, ' + Et.toFixed(4) + ']'
                : '[' + Vt.toFixed(4) + ', ' + Et.toFixed(4) + ']';
    var inputXML = '<input><name>ans' + X + '</name>'
        + '<type>algebraic</type><tans>' + tansVal + '</tans>'
        + '<boxsize>5</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>0</showvalidation><options></options></input>';

    // ── Textes pédagogiques par mode (indices de méthode, sans révéler la valeur) ──
    var RX_METHOD = {
        equivalence: {
            vWrong: 'Veq est le volume où la courbe présente un <strong>saut brutal de potentiel</strong> (rupture de pente) : c\'est là que le réactif titré vient d\'être totalement consommé.',
            genLabel: 'Veq = ' + Veq.toFixed(2) + ' mL (saut de potentiel)'
        },
        eo1: {
            eWrong: 'Après un <strong>grand excès de titrant</strong> (V ≫ Veq), la quasi-totalité du titrant ajouté reste sous forme oxydée : le potentiel se stabilise près de E°₁ (palier après le saut).',
            genLabel: 'E°₁ = ' + e1.toFixed(3) + ' V (palier après le saut, V ≫ Veq)'
        },
        eo2: {
            eWrong: 'Juste <strong>avant l\'équivalence</strong>, l\'espèce titrée est encore largement présente : le potentiel reste proche de E°₂ (palier avant le saut).',
            genLabel: 'E°₂ = ' + e2.toFixed(3) + ' V (palier avant le saut, V ≪ Veq)'
        },
        demi: {
            vWrong: 'La demi-équivalence correspond à <strong>V = Veq / 2</strong>, c\'est-à-dire la moitié du volume où intervient le saut de potentiel.',
            eWrong: 'À la demi-équivalence, les concentrations des deux formes du couple titré sont égales ([Ox₂] = [Red₂]) : dans la relation de Nernst, le terme logarithmique s\'annule, donc <strong>E = E°₂</strong>.',
            genLabel: 'Demi-équivalence : V = Veq/2 = ' + (Veq/2).toFixed(2) + ' mL, E = E°₂ = ' + e2.toFixed(3) + ' V'
        },
        double: {
            vWrong: 'Le point à double équivalence correspond à <strong>V = 2 × Veq</strong> : l\'excès de titrant ajouté égale alors la quantité initiale d\'espèce titrée.',
            eWrong: 'Dans cet excès, les concentrations des deux formes du couple titrant sont égales ([Ox₁] = [Red₁]) : d\'après Nernst, <strong>E = E°₁</strong>.',
            genLabel: 'Double équivalence : V = 2·Veq = ' + (Veq*2).toFixed(2) + ' mL, E = E°₁ = ' + e1.toFixed(3) + ' V'
        },
        eeq: {
            vWrong: 'Le point d\'équivalence se situe exactement à l\'abscisse du <strong>saut brutal de potentiel</strong> (V = Veq).',
            eWrong: 'Le potentiel à l\'équivalence est une <strong>moyenne pondérée par les électrons échangés</strong> : Eeq = (n₁·E°₁ + n₂·E°₂)/(n₁+n₂).',
            genLabel: 'Point d\'équivalence : V = Veq = ' + Veq.toFixed(2) + ' mL, Eeq = ' + Eeq.toFixed(3) + ' V'
        }
    };
    var meth = RX_METHOD[rxFind] || {};

    // ── feedvars & PRT (diagnostic multi-étages) ────────────────────────────
    var feedVars, canonicalNodes, prtMeta;
    var okFb = fbBox(GREEN, GREENBG, '✅ <strong>' + I18Nd.t('rx.fb_ok_default') + '</strong>');

    if (cursorMode === 'x') {
        feedVars = 'rx_vcur:float(ans' + X + '[1]);\n'
                 + 'rx_vtgt:' + Vt.toFixed(4) + ';\n'
                 + 'rx_v_ok:is(abs(rx_vcur-rx_vtgt)<=' + tolVol.toFixed(3) + ');\n';
        var vWrongFbX = fbBox(RED, REDBG, '❌ <strong>Ce n\'est pas le bon volume.</strong> '
            + dirHint('rx_vcur', 'rx_vtgt', 'Tu es trop tôt sur la courbe : continue vers la droite.', 'Tu es allé trop loin : reviens vers la gauche.')
            + (meth.vWrong ? '<br>' + meth.vWrong : ''));
        canonicalNodes = [{
            name: '0', description: '', answertest: 'AlgEquiv', sans: 'rx_v_ok', tans: 'true',
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: String(bareme), truepenalty: '0', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-0-T', truefeedback: fbOk || okFb,
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-0-F', falsefeedback: fbWrong || vWrongFbX
        }];
        prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
    } else if (cursorMode === 'y') {
        feedVars = 'rx_ecur:float(ans' + X + '[2]);\n'
                 + 'rx_etgt:' + Et.toFixed(4) + ';\n'
                 + 'rx_e_ok:is(abs(rx_ecur-rx_etgt)<=' + tolE.toFixed(3) + ');\n';
        var eWrongFbY = fbBox(RED, REDBG, '❌ <strong>Ce n\'est pas le bon potentiel.</strong> '
            + dirHint('rx_ecur', 'rx_etgt', 'Ta valeur est trop basse : place le curseur plus haut.', 'Ta valeur est trop haute : redescends.')
            + (meth.eWrong ? '<br>' + meth.eWrong : ''));
        canonicalNodes = [{
            name: '0', description: '', answertest: 'AlgEquiv', sans: 'rx_e_ok', tans: 'true',
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: String(bareme), truepenalty: '0', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-0-T', truefeedback: fbOk || okFb,
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-0-F', falsefeedback: fbWrong || eWrongFbY
        }];
        prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
    } else {
        feedVars = 'rx_vcur:float(ans' + X + '[1]);\n'
                 + 'rx_ecur:float(ans' + X + '[2]);\n'
                 + 'rx_vtgt:' + Vt.toFixed(4) + ';\n'
                 + 'rx_etgt:' + Et.toFixed(4) + ';\n'
                 + 'rx_v_ok:is(abs(rx_vcur-rx_vtgt)<=' + tolVol.toFixed(3) + ');\n'
                 + 'rx_e_ok:is(abs(rx_ecur-rx_etgt)<=' + tolE.toFixed(3) + ');\n';
        var vWrongFbXY = fbBox(RED, REDBG, '❌ <strong>Le volume n\'est pas correct.</strong> '
            + dirHint('rx_vcur', 'rx_vtgt', 'Tu es trop tôt sur la courbe.', 'Tu es allé trop loin.')
            + (meth.vWrong ? '<br>' + meth.vWrong : ''));
        var eWrongFbXY = fbBox(ORANGE, ORANGEBG, '⚠️ <strong>Bon volume, mais le potentiel n\'est pas bon.</strong> '
            + dirHint('rx_ecur', 'rx_etgt', 'Ta valeur est trop basse.', 'Ta valeur est trop haute.')
            + (meth.eWrong ? '<br>' + meth.eWrong : ''));
        canonicalNodes = [
            { name: '0', description: 'Vérification volume', answertest: 'AlgEquiv', sans: 'rx_v_ok', tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: '0', truepenalty: '0', truenextnode: '1', trueanswernote: 'PRT' + X + '-0-T', truefeedback: '',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-0-F',
              falsefeedback: fbWrong || vWrongFbXY },
            { name: '1', description: 'Vérification potentiel', answertest: 'AlgEquiv', sans: 'rx_e_ok', tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(bareme), truepenalty: '0', truenextnode: '-1', trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk || okFb,
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-1-F',
              falsefeedback: fbWrong || eWrongFbXY }
        ];
        prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
    }
    var prtXML = buildPrtXml_(prtMeta, canonicalNodes);

    var genFb = meth.genLabel ? fbBox(GREEN, GREENBG, '<strong>🔑 Méthode et résultat :</strong> ' + meth.genLabel + '.') : '';

    var questionLabel = I18Nd.t('rx.qnote_fallback', {n: String(X)});
    var questionText  = banner + '<p>' + (textFrag || questionLabel) + '</p>' + jxgXML
        + '[[input:ans' + X + ']][[validation:ans' + X + ']]';

    return {
        type:            'redox',
        bareme:          bareme,
        vars:            '',
        qnote:           'Redox Q' + X + ' ' + rxFind + ' Veq=' + Veq.toFixed(2),
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: mkFbGen(genFb, p.fbGen),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

// Export CommonJS pour les tests Node (test/gen-redox.test.js). Sans effet dans le
// navigateur : `module` n'y est pas défini, cette branche n'est donc jamais exécutée.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genRedox: genRedox, genRedoxCore: genRedoxCore };
}
// ==============================================================
//  genBasen — Conversion de base N (bibliotheque STACK basen)
//  Scenarios : dec-to-base | base-to-dec
//  Notation  : S (suffixe _n) ou C (0b / 0o / 0x)
// ==============================================================
