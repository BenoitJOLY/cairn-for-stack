// ── XML GENERATORS: image cliquable ──

// Construit les paramètres depuis le DOM/l'état pour le mode actuellement sélectionné
// ('single' ou 'sequence') — seul point de contact avec le DOM, réutilisé par le
// wrapper réseau genImgClick(X) et par js/preview.js (aperçu réel, en synchrone,
// voir renderPreviewHTML_imgclick).
function genImgClickParams() {
    var bareme    = parseFloat(v('ic-bareme')) || 1;
    var text      = richVal('ic-text');
    var fbOkTxt   = v('ic-fb-ok').trim();
    var fbWrTxt   = v('ic-fb-wrong').trim();
    var fbGen     = v('ic-fbgen');

    var modeEl = document.querySelector('input[name="ic-mode"]:checked');
    var mode   = modeEl ? modeEl.value : 'single';
    var st = window._icState || {};

    if (mode === 'sequence') {
        var seqTime = parseInt(v('ic-seq-time')) || 5;
        if (!st.bgData)                    throw new Error(I18N.t('ic.err_no_image'));
        if (!st.zones || !st.zones.length) throw new Error(I18N.t('ic.err_seq_zones'));
        return {
            mode: 'sequence',
            bareme: bareme, text: text, fbOkTxt: fbOkTxt, fbWrTxt: fbWrTxt,
            seqTime: seqTime, bgData: st.bgData, bgW: st.bgW, bgH: st.bgH, zones: st.zones,
            fbGen: fbGen
        };
    }

    if (!st.bgData)                    throw new Error(I18N.t('ic.err_no_image'));
    if (!st.zones || !st.zones.length) throw new Error(I18N.t('ic.err_no_zone'));
    return {
        mode: 'single',
        bareme: bareme, text: text, fbOkTxt: fbOkTxt, fbWrTxt: fbWrTxt,
        bgData: st.bgData, bgW: st.bgW, bgH: st.bgH, zone: st.zones[0],
        fbGen: fbGen
    };
}

function genImgClickDispatchLocal(X, p) {
    return (p.mode === 'sequence') ? genImgClickSequenceCore(X, p) : genImgClickCore(X, p);
}

async function genImgClick(X) {
    var p = genImgClickParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'imgclick', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "imgclick", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "imgclick", repli sur le calcul local.', e); }
    return genImgClickDispatchLocal(X, p);
}

function genImgClickCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var htmlEsc_D = deps.htmlEsc || htmlEsc;
    var jxgDropChunkedJsString_D = deps.jxgDropChunkedJsString || jxgDropChunkedJsString;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var inferFbKind_D = deps.inferFbKind || inferFbKind;

    var bareme = p.bareme, text = p.text, fbOkTxt = p.fbOkTxt, fbWrTxt = p.fbWrTxt;
    var BGW = p.bgW, BGH = p.bgH;
    var z = p.zone;
    var zoneLabel = (z.label || '').trim();

    /* ── Zone definition & feedbackvariables (espace pixel image, y math = BGH - y image) ── */
    var zoneExpr, tansPt;
    var fbVarsLines = [
        'ic_px_' + X + ': if listp(ans' + X + ') and length(ans' + X + ')=2 then ans' + X + '[1] else -999;',
        'ic_py_' + X + ': if listp(ans' + X + ') and length(ans' + X + ')=2 then ans' + X + '[2] else -999;'
    ];

    if (z.shape === 'circle') {
        var cx = z.x, cyMath = BGH - z.y, r = z.r;
        zoneExpr = 'is(ic_px_' + X + '>=0 and (ic_px_' + X + '-' + cx + ')^2+(ic_py_' + X + '-' + cyMath + ')^2<=' + (r * r) + ')';
        tansPt   = '[' + cx + ',' + cyMath + ']';
    } else {
        var x1 = z.x, x2 = z.x + z.w;
        var yTop = BGH - z.y, yBot = BGH - (z.y + z.h);
        zoneExpr = 'is(ic_px_' + X + '>=0 and ic_px_' + X + '>=' + x1 + ' and ic_px_' + X + '<=' + x2
                 + ' and ic_py_' + X + '>=' + yBot + ' and ic_py_' + X + '<=' + yTop + ')';
        tansPt = '[' + ((x1 + x2) / 2) + ',' + ((yTop + yBot) / 2) + ']';
    }
    fbVarsLines.push('ic_in_' + X + ': ' + zoneExpr + ';');
    var fbVars = fbVarsLines.join('\n');

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
    var labelPart = zoneLabel ? ' <em>' + htmlEsc_D(zoneLabel) + '</em>' : '';
    var fbOk    = '<p>✅ <strong>' + I18N_D.t('ic.fb_ok_title') + '</strong>' + labelPart + '</p>'
                       + (fbOkTxt ? '<p>' + htmlEsc_D(fbOkTxt) + '</p>' : '');
    var fbWrong = '<p>❌ <strong>' + I18N_D.t('ic.fb_wrong_title') + '</strong>'
                       + (fbWrTxt ? ' ' + htmlEsc_D(fbWrTxt) : '') + '</p>';

    /* ── PRT ── */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'ic_in_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
    // canonicalNodes (expose via prt.nodes pour prt-manager.js) reste brut, sans
    // encadre, pour que l'edition manuelle du PRT ne montre jamais de HTML de
    // presentation. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(inferFbKind_D(n, 'true'), n.truefeedback),
            falsefeedback: applyFbBox_D(inferFbKind_D(n, 'false'), n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    /* ── JSXGraph code ── */
    /* Coordinate system: boundingbox [0,BGH,BGW,0] pixels image, y math up (convention gen-jxgdrop.js/genImgClickSequence) */
    var jxgCode = '(function(){\n'
        + '/* Q' + X + ' — Zone cliquable */\n'
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[0,' + BGH + ',' + BGW + ',0],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        + "board.create('image',[" + jxgDropChunkedJsString_D(p.bgData, 2000) + ",[0,0],[" + BGW + ',' + BGH + "]],{fixed:true,highlight:false});\n"
        + "var tracker=board.create('point',[-1," + (BGH / 2) + "],{visible:false});\n"
        + 'stack_jxg.bind_point(refAns' + X + ',tracker);\n'
        + "var marker=board.create('point',[-1," + (BGH / 2) + "],{\n"
        + "  size:8,fillColor:'#ef4444',strokeColor:'#fff',strokeWidth:2,\n"
        + "  visible:false,fixed:true,name:'',label:{visible:false}\n"
        + "});\n"
        + "board.on('down',function(e){\n"
        + '  var c=new JXG.Coords(JXG.COORDS_BY_SCREEN,board.getMousePosition(e),board);\n'
        + '  var ux=Math.max(0,Math.min(' + BGW + ',c.usrCoords[1]));\n'
        + '  var uy=Math.max(0,Math.min(' + BGH + ',c.usrCoords[2]));\n'
        + '  tracker.setPosition(JXG.COORDS_BY_USER,[ux,uy]);\n'
        + '  marker.setPosition(JXG.COORDS_BY_USER,[ux,uy]);\n'
        + '  marker.setAttribute({visible:true});\n'
        + '  board.update();\n'
        + '});\n'
        + 'board.unsuspendUpdate();\n'
        + 'setTimeout(function(){\n'
        + '  var tx=tracker.X();\n'
        + '  if(tx>=0){marker.setPosition(JXG.COORDS_BY_USER,[tx,tracker.Y()]);marker.setAttribute({visible:true});board.update();}\n'
        + '},50);\n'
        + '})();';

    /* ── Dimensions d'affichage (l'image peut être plus grande que l'écran) ── */
    var MAX_DISP_W = 700;
    var dscale = Math.min(1, MAX_DISP_W / BGW);
    var dispW = Math.round(BGW * dscale), dispH = Math.round(BGH * dscale);

    /* ── Question text ── */
    /* Le JS brut (jxgCode) n'est PAS inliné ici : cf. genImgClickSequence / gen-jxgdrop.js,
       marqueur HS-KBD substitué après stripMathDivs/moodleLatex via q.kbdRaw. */
    var textFrag = '<div style="background:#0d9488;border-left:5px solid #0f766e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t('ic.banniere') + '</strong>'
        + '<span style="background:#0f766e;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '[[jsxgraph input-ref-ans' + X + '="refAns' + X + '" width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + '<!--HS-KBD:' + X + '-->\n'
        + '[[/jsxgraph]]\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Zone cliquable Q' + X,
        kbdRaw:          jxgCode,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', mkFbGen_D('', p.fbGen)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

// ══════════════════════════════════════════════════════
//  Sélection sur image — mode séquence chronométrée
//  (inspiré de test/.../image-clic : zones JS invisibles,
//   timer JS, ordre imposé, réponse string "reussi"/"echec")
// ══════════════════════════════════════════════════════
function genImgClickSequenceCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var htmlEsc_D = deps.htmlEsc || htmlEsc;
    var rawEsc_D = deps.rawEsc || rawEsc;
    var jxgDropChunkedJsString_D = deps.jxgDropChunkedJsString || jxgDropChunkedJsString;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var inferFbKind_D = deps.inferFbKind || inferFbKind;

    var bareme = p.bareme, text = p.text, fbOkTxt = p.fbOkTxt, fbWrTxt = p.fbWrTxt;
    var seqTime = p.seqTime;
    var BGW = p.bgW, BGH = p.bgH;
    var zones = p.zones.map(function (z, i) {
        var label = (z.label || '').trim() || I18N_D.t('jd.zone_label', {n: i + 1});
        return { id: 'z' + i, label: label, shape: z.shape, x: z.x, y: z.y, r: z.r, w: z.w, h: z.h };
    });

    /* ── Input XML : réponse "reussi"/"echec" écrite par le JS du jeu ── */
    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>string</type>\n'
        + '      <tans><![CDATA["reussi"]]></tans>\n'
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
    var fbOk    = '<p>✅ <strong>' + I18N_D.t('ic.fb_ok_seq') + '</strong></p>'
                       + (fbOkTxt ? '<p>' + htmlEsc_D(fbOkTxt) + '</p>' : '');
    var fbWrong = '<p>❌ <strong>' + I18N_D.t('ic.fb_wrong_seq_title') + '</strong> ' + I18N_D.t('ic.fb_wrong_seq_detail') + '</p>'
                       + (fbWrTxt ? '<p>' + htmlEsc_D(fbWrTxt) + '</p>' : '');

    /* ── PRT ── */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'String', sans: 'ans' + X, tans: '"reussi"',
        testoptions: '', quiet: '1',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
    // canonicalNodes (expose via prt.nodes pour prt-manager.js) reste brut, sans
    // encadre, pour que l'edition manuelle du PRT ne montre jamais de HTML de
    // presentation. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(inferFbKind_D(n, 'true'), n.truefeedback),
            falsefeedback: applyFbBox_D(inferFbKind_D(n, 'false'), n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    /* ── Dimensions d'affichage (l'image peut être plus grande que l'écran) ── */
    var MAX_DISP_W = 700;
    var dscale = Math.min(1, MAX_DISP_W / BGW);
    var dispW = Math.round(BGW * dscale), dispH = Math.round(BGH * dscale);
    /* L'iframe injectée par STACK a une hauteur FIXE = l'attribut height de [[jsxgraph]] (sandbox
       sans scrollbar) : tout contenu HTML ajouté après le board (texte règles + bouton Démarrer)
       doit tenir dans cette hauteur, donc on réserve de la place en plus de dispH pour le tag,
       tout en forçant le div du board (divid) à rester à dispH px pour ne pas déformer l'image. */
    var UI_RESERVE_H = 100;

    /* ── JSXGraph code ── */
    /* Coordinate system: boundingbox [0,BGH,BGW,0] pixels image, y math = BGH - y pixel (convention gen-jxgdrop.js) */
    function toMathY(imgY) { return BGH - imgY; }
    var ciblesJS = zones.map(function (z) {
        if (z.shape === 'circle') {
            return '{id:"' + z.id + '",label:"' + rawEsc_D(z.label) + '",shape:"circle",cx:' + z.x + ',cy:' + toMathY(z.y) + ',r:' + z.r + '}';
        }
        var y1 = toMathY(z.y + z.h), y2 = toMathY(z.y);
        return '{id:"' + z.id + '",label:"' + rawEsc_D(z.label) + '",shape:"rect",x1:' + z.x + ',y1:' + y1 + ',x2:' + (z.x + z.w) + ',y2:' + y2 + '}';
    }).join(',\n            ');

    var jxgCode = '(function(){\n'
        + '/* Q' + X + ' — Séquence de zones invisibles chronométrée */\n'
        + 'var _boardCont0=document.getElementById(divid);\n'
        + "if(_boardCont0)_boardCont0.style.height='" + dispH + "px';\n"
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[0,' + BGH + ',' + BGW + ',0],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        + "board.create('image',[" + jxgDropChunkedJsString_D(p.bgData, 2000) + ",[0,0],[" + BGW + ',' + BGH + "]],{fixed:true,highlight:false});\n"
        + 'var cibles=[\n            ' + ciblesJS + '\n        ];\n'
        + 'for(var _s=cibles.length-1;_s>0;_s--){var _r=Math.floor(Math.random()*(_s+1));var _t=cibles[_s];cibles[_s]=cibles[_r];cibles[_r]=_t;}\n'
        + 'var TEMPS=' + seqTime + ';\n'
        + 'var shapes=[];\n'
        + 'for(var i=0;i<cibles.length;i++){\n'
        + '  var c=cibles[i], shp;\n'
        + '  if(c.shape==="circle"){\n'
        + "    shp=board.create('circle',[[c.cx,c.cy],c.r],{visible:true,fillColor:'#000',fillOpacity:0,strokeOpacity:0,highlight:false,fixed:true,hasInnerPoints:true});\n"
        + '  } else {\n'
        + "    shp=board.create('polygon',[[c.x1,c.y1],[c.x2,c.y1],[c.x2,c.y2],[c.x1,c.y2]],{visible:true,fillColor:'#000',fillOpacity:0,borders:{strokeOpacity:0},vertices:{visible:false},highlight:false,fixed:true,hasInnerPoints:true});\n"
        + '  }\n'
        + '  shapes.push(shp);\n'
        + '}\n'
        + "var timerTxt=board.create('text',[" + (BGW - 6) + ',' + (BGH - 6) + ",''],{fontSize:16,cssStyle:'color:#dc2626;font-weight:bold;',anchorX:'right',anchorY:'top'});\n"
        + 'var _boardCont=document.getElementById(divid);\n'
        + "var instrEl=document.createElement('div');\n"
        + "instrEl.style.cssText='display:block;margin-top:10px;text-align:center;font-size:1.15rem;font-weight:800;color:#0f766e;';\n"
        + "instrEl.textContent=" + JSON.stringify(I18N_D.t('ic.instr_template', {sec: seqTime})) + ";\n"
        + "if(_boardCont&&_boardCont.parentNode)_boardCont.parentNode.insertBefore(instrEl,_boardCont.nextSibling);\n"
        + "var startBtn=document.createElement('button');\n"
        + "startBtn.type='button';\n"
        + "startBtn.textContent=" + JSON.stringify(I18N_D.t('ic.start_btn')) + ";\n"
        + "startBtn.style.cssText='display:block;margin:10px auto 0;padding:10px 22px;font-size:1.05rem;font-weight:800;color:#fff;background:#0f766e;border:none;border-radius:8px;cursor:pointer;';\n"
        + "if(instrEl.parentNode)instrEl.parentNode.insertBefore(startBtn,instrEl.nextSibling);\n"
        + 'var etatActuel=0,tempsRestant=TEMPS,estFini=false,gameStarted=false,compteur;\n'
        + 'function majConsigne(){if(instrEl)instrEl.textContent=' + JSON.stringify(I18N_D.t('ic.find_prefix')) + '+cibles[etatActuel].label;}\n'
        + 'function lancerTimer(){\n'
        + '  clearInterval(compteur);\n'
        + '  tempsRestant=TEMPS;\n'
        + '  timerTxt.setText(tempsRestant+"s");\n'
        + '  compteur=setInterval(function(){\n'
        + '    tempsRestant--;\n'
        + '    timerTxt.setText(tempsRestant+"s");\n'
        + '    if(tempsRestant<=0){finJeu("echec");}\n'
        + '    board.update();\n'
        + '  },1000);\n'
        + '}\n'
        + 'function finJeu(statut){\n'
        + '  if(estFini)return;\n'
        + '  estFini=true;\n'
        + '  clearInterval(compteur);\n'
        + '  var inputEl=document.getElementById(refAns' + X + ');\n'
        + '  if(statut==="reussi"){\n'
        + "    if(instrEl){instrEl.textContent=" + JSON.stringify(I18N_D.t('ic.win_msg')) + ";instrEl.style.color='#15803d';}\n"
        + '  } else {\n'
        + "    if(instrEl){instrEl.textContent=" + JSON.stringify(I18N_D.t('ic.timeout_msg')) + ";instrEl.style.color='#dc2626';}\n"
        + '  }\n'
        + '  timerTxt.setText("");\n'
        + '  inputEl.value=statut;\n'
        + "  inputEl.dispatchEvent(new Event('change'));\n"
        + '  board.update();\n'
        + '}\n'
        + 'for(var j=0;j<shapes.length;j++){\n'
        + '  (function(index){\n'
        + "    shapes[index].on('down',function(){\n"
        + '      if(!gameStarted||estFini)return;\n'
        + '      if(cibles[index].id===cibles[etatActuel].id){\n'
        + '        etatActuel++;\n'
        + '        if(etatActuel>=cibles.length){finJeu("reussi");}\n'
        + '        else{majConsigne();lancerTimer();}\n'
        + '      }\n'
        + '    });\n'
        + '  })(j);\n'
        + '}\n'
        + 'function demarrerJeu(){\n'
        + '  if(gameStarted)return;\n'
        + '  gameStarted=true;\n'
        + '  if(startBtn&&startBtn.parentNode)startBtn.parentNode.removeChild(startBtn);\n'
        + '  majConsigne();\n'
        + '  lancerTimer();\n'
        + '  board.update();\n'
        + '}\n'
        + "startBtn.addEventListener('click',demarrerJeu);\n"
        + 'board.unsuspendUpdate();\n'
        + '})();';

    /* ── Question text ── */
    /* Le JS brut (jxgCode) n'est PAS inliné ici : il contient des caractères
       (< > guillemets) que stripMathDivs/moodleLatex (js/app.js) échapperaient
       via un aller-retour DOM. On pose un marqueur, substitué après coup par
       le vrai JS via q.kbdRaw — même convention que gen-jxgdrop.js. */
    var textFrag = '<div style="background:#0d9488;border-left:5px solid #0f766e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t('ic.banniere_seq') + '</strong>'
        + '<span style="background:#0f766e;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '<div style="display: none;" aria-hidden="true" tabindex="-1">\n'
        + '  [[input:ans' + X + ']] [[validation:ans' + X + ']]\n'
        + '</div>\n'
        + '[[jsxgraph input-ref-ans' + X + '="refAns' + X + '" width="' + dispW + 'px" height="' + (dispH + UI_RESERVE_H) + 'px"]]\n'
        + '<!--HS-KBD:' + X + '-->\n'
        + '[[/jsxgraph]]';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Séquence Q' + X,
        textFrag:        textFrag,
        kbdRaw:          jxgCode,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', mkFbGen_D('', p.fbGen)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genImgClick: genImgClick, genImgClickCore: genImgClickCore, genImgClickSequenceCore: genImgClickSequenceCore, genImgClickParams: genImgClickParams, genImgClickDispatchLocal: genImgClickDispatchLocal };
}
