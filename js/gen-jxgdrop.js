/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// ── XML GENERATORS: JSXGraph drag & drop ──

// Moodle's XML import (xmlize) fails with "No memory" on pathologically long
// single lines — a base64 image data URI inlined as one JS string literal
// produces exactly that. Break it into quoted chunks joined by +, so the
// runtime string is unchanged but no exported line is huge.
function jxgDropChunkedJsString(str, size) {
    var parts = [];
    for (var i = 0; i < str.length; i += size) {
        parts.push("'" + str.slice(i, i + size) + "'");
    }
    return parts.join('+\n');
}

// Insère des retours à la ligne dans une chaîne base64 (data URI) sans en
// altérer le décodage : les navigateurs (et Moodle) ignorent les espaces/
// retours à la ligne à l'intérieur d'une data URI. Même piège que le "No
// memory" de xmlize (voir feedback_jxgdrop_base64_xml_bug) — une image de
// solution encodée sur une seule ligne dans le feedback général y expose
// aussi.
function jxgDropChunkedRaw(str, size) {
    var parts = [];
    for (var i = 0; i < str.length; i += size) parts.push(str.slice(i, i + size));
    return parts.join('\n');
}

function jxgDropRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Génère une image statique (base64 JPEG) montrant l'image de fond avec
// les pastilles placées dans leur zone correcte — utilisée dans le
// feedback général comme rappel visuel de la solution, indépendamment de
// ce que l'élève a répondu.
function jxgDropBuildSolutionImage(st) {
    if (!st.img || !st.bgW || !st.bgH) return '';
    var maxW = 480;
    var scale = Math.min(1, maxW / st.bgW);
    var w = Math.max(1, Math.round(st.bgW * scale)), h = Math.max(1, Math.round(st.bgH * scale));
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(st.img, 0, 0, w, h);
    st.zones.forEach(function (z) {
        var assignments = z.assignments && z.assignments.length ? z.assignments : (z.assignment ? [z.assignment] : []);
        var labels = assignments.map(function (id) {
            var p = st.proposals.find(function (pp) { return pp.id === id; });
            return p ? (p.text || I18N.t('tpl.vf_prop_fallback', {n: p.id})) : '?';
        });
        var label = labels.join(' / ') || '?';
        var cx, cy;
        if (z.shape === 'circle') { cx = z.x * scale; cy = z.y * scale; }
        else { cx = (z.x + z.w / 2) * scale; cy = (z.y + z.h / 2) * scale; }
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.font = 'bold 12px sans-serif';
        var padX = 7, textW = ctx.measureText(label).width;
        var chipW = textW + padX * 2, chipH = 18;
        var chipX = cx - chipW / 2, chipY = cy + 12;
        ctx.fillStyle = '#1e3a8a';
        jxgDropRoundRect(ctx, chipX, chipY, chipW, chipH, 9);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, chipY + chipH / 2 + 1);
    });
    return canvas.toDataURL('image/jpeg', 0.85);
}

function genJxgDropParams() {
    var st = window._jdState;
    if (!st.bgData)           throw new Error(I18N.t('jd.err_no_image'));
    if (!st.proposals.length) throw new Error(I18N.t('jd.err_no_proposals'));
    if (!st.zones.length)     throw new Error(I18N.t('jd.err_no_zones'));

    var bareme      = parseFloat(document.getElementById('jd-bareme').value) || 1;
    var instruction = richVal('jd-text');
    var zonesVisible = document.getElementById('jd-zones-visible')
        ? document.getElementById('jd-zones-visible').checked : true;

    var solutionImgData = jxgDropBuildSolutionImage(st);

    return {
        bareme: bareme, instruction: instruction, zonesVisible: zonesVisible,
        bgW: st.bgW, bgH: st.bgH, bgData: st.bgData,
        zones: st.zones, proposals: st.proposals,
        solutionImgData: solutionImgData,
        fbGen: v('jd-fbgen')
    };
}

async function genJxgDrop(X) {
    var p = genJxgDropParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'jxgdrop', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "jxgdrop", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "jxgdrop", repli sur le calcul local.', e); }
    return genJxgDropCore(X, p);
}

function genJxgDropCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var htmlEsc_D = deps.htmlEsc || htmlEsc;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var jxgDropChunkedJsString_D = deps.jxgDropChunkedJsString || jxgDropChunkedJsString;
    var jxgDropChunkedRaw_D = deps.jxgDropChunkedRaw || jxgDropChunkedRaw;

    var bareme = p.bareme, instruction = p.instruction, zonesVisible = p.zonesVisible;
    var st = { bgW: p.bgW, bgH: p.bgH, bgData: p.bgData, zones: p.zones, proposals: p.proposals };

    var BGW = st.bgW, BGH = st.bgH;
    var PAL_H  = 84;       // hauteur de la palette en unités image
    var TOTAL_H = BGH + PAL_H;

    // Dimensions d'affichage (max 900×840 px — +50% demandé par l'enseignant)
    var MAX_W = 900, MAX_H = 840;
    var dscale = Math.min(MAX_W / BGW, MAX_H / TOTAL_H);
    var DISP_W = Math.round(BGW * dscale);
    var DISP_H = Math.round(TOTAL_H * dscale);

    // Correspondance propId → indice séquentiel 1-based
    var propSeq = {};
    st.proposals.forEach(function (p, i) { propSeq[p.id] = i + 1; });

    var nZones = st.zones.length;
    var nProps  = st.proposals.length;

    // Positions initiales des propositions dans la palette (coordonnées math JSXGraph)
    // Bounding box : [0, TOTAL_H, BGW, 0] → y croissant vers le haut
    // Image : board.create('image', [url, [0, PAL_H], [BGW, BGH]])
    //   → occupe y = PAL_H .. TOTAL_H (haut du plateau)
    // Palette : y = 0 .. PAL_H (bas du plateau, visuellement sous l'image)
    var initPos = st.proposals.map(function (p, i) {
        return [Math.round(BGW / (nProps + 1) * (i + 1)), Math.round(PAL_H / 2)];
    });

    // Conversion coordonnées image → coordonnées math JSXGraph
    // image (cx, cy) [y=0 en haut] → math (cx, TOTAL_H - cy)
    function toMathY(imgY) { return TOTAL_H - imgY; }

    // ── Code JSXGraph ────────────────────────────────────────────

    var trackerItems = st.zones.map(function () {
        return "board.create('point', [0, 0], {visible: false})";
    });

    // Chaque zone a besoin d'un attribut input-ref-ansXzY="refAnsXzY" sur la
    // balise [[jsxgraph]] : c'est le seul mécanisme STACK qui déclare la
    // variable JS refAnsXzY, référence à l'input Moodle. stack_jxg.bind_point
    // prend exactement 2 arguments (inputRef, point) — pas board en premier.
    var inputRefAttrs = st.zones.map(function (z, i) {
        return ' input-ref-ans' + X + 'z' + (i + 1) + '="refAns' + X + 'z' + (i + 1) + '"';
    }).join('');

    var bindLines = st.zones.map(function (z, i) {
        return 'stack_jxg.bind_point(refAns' + X + 'z' + (i + 1) + ', trackers[' + i + ']);';
    });

    // Palette de couleurs des zones : visibles (contour + fond doux, pointillés)
    // ou invisibles (aucun tracé) — le point de dépôt existe toujours en
    // interne pour le snapping, seule l'apparence change.
    var zoneStrokeColor = zonesVisible ? "'#94a3b8'" : "'none'";
    var zoneFillColor   = zonesVisible ? "'rgba(148,163,184,.16)'" : "'none'";
    var zoneAttrsCommon = zonesVisible
        ? "fixed:true,highlight:false,dash:2,shadow:true,strokeWidth:2"
        : "fixed:true,highlight:false,strokeWidth:0";

    var zoneItems = st.zones.map(function (z) {
        var elCode, snapExpr, jcx, jcy;
        if (z.shape === 'circle') {
            jcx = z.x;
            jcy = toMathY(z.y);
            elCode = "board.create('circle', [[" + jcx + ',' + jcy + '],' + z.r + '],'
                + "{" + zoneAttrsCommon + ",strokeColor:" + zoneStrokeColor + ","
                + "fillColor:" + zoneFillColor + "})";
            snapExpr = 'Math.sqrt((px-' + jcx + ')*(px-' + jcx + ')+(py-' + jcy + ')*(py-' + jcy + '))<=' + z.r;
        } else {
            var jy_top    = toMathY(z.y);          // haut écran = y math élevé
            var jy_bottom = toMathY(z.y + z.h);    // bas écran  = y math faible
            var jx2       = z.x + z.w;
            jcx = z.x + z.w / 2;
            jcy = (jy_top + jy_bottom) / 2;
            elCode = "board.create('polygon',["
                + "board.create('point',[" + z.x  + ',' + jy_top    + "],{visible:false}),"
                + "board.create('point',[" + jx2  + ',' + jy_top    + "],{visible:false}),"
                + "board.create('point',[" + jx2  + ',' + jy_bottom + "],{visible:false}),"
                + "board.create('point',[" + z.x  + ',' + jy_bottom + "],{visible:false})],"
                + "{" + zoneAttrsCommon + ","
                + "borders:{strokeColor:" + zoneStrokeColor + ",strokeWidth:2,dash:2},"
                + "fillColor:" + zoneFillColor + "})";
            snapExpr = 'px>=' + z.x + '&&px<=' + jx2
                + '&&py>=' + jy_bottom + '&&py<=' + jy_top;
        }
        return '{el:' + elCode + ',cx:' + jcx + ',cy:' + jcy
            + ',snap:function(px,py){return ' + snapExpr + ';},occ:-1}';
    });

    var propItems = st.proposals.map(function (p, i) {
        var px = initPos[i][0], py = initPos[i][1];
        var label = (p.text || I18N_D.t('tpl.vf_prop_fallback', {n: p.id})).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return "board.create('point',[" + px + ',' + py + "],"
            + "{name:'" + label + "',size:11,face:'circle',fixed:IS_RO_" + X + ',highlight:!IS_RO_' + X + ','
            + "strokeColor:'#fff',strokeWidth:3,fillColor:'#2563eb',shadow:true,"
            + "label:{offset:[0,20],fontSize:12,fontWeight:'700',color:'#fff',"
            + "cssStyle:'background:#1e3a8a;padding:2px 9px;border-radius:12px;"
            + "box-shadow:0 1px 3px rgba(0,0,0,.35);white-space:nowrap;'}})";
    });

    var initPosStr = initPos.map(function (p) { return '[' + p[0] + ',' + p[1] + ']'; }).join(',');

    var zoneOccFillColor = zonesVisible ? "'rgba(37,99,235,.22)'" : zoneFillColor;
    var restoreLines = st.zones.map(function (z, i) {
        return '(function(){try{var _v=document.getElementById(refAns' + X + 'z' + (i + 1) + ').value;'
            + 'if(_v){var _m=_v.match(/-?\\d+/);if(_m){var _pi=parseInt(_m[0],10)-1;'
            + 'if(_pi>=0&&proposals[_pi]){zones[' + i + '].occ=_pi;'
            + 'proposals[_pi].setPosition(JXG.COORDS_BY_USER,[zones[' + i + '].cx,zones[' + i + '].cy]);'
            + 'zones[' + i + '].el.setAttribute({fillColor:' + zoneOccFillColor + '});'
            + '}}}}catch(e){}})();';
    });

    var jxgCode = '(function(){\n'
        + '/* Q' + X + ' — Glisser-Déposer JSXGraph */\n'
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[0,' + TOTAL_H + ',' + BGW + ',0],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        + "board.create('polygon',["
        + "board.create('point',[0,0],{visible:false}),"
        + "board.create('point',[" + BGW + ",0],{visible:false}),"
        + "board.create('point',[" + BGW + "," + PAL_H + "],{visible:false}),"
        + "board.create('point',[0," + PAL_H + "],{visible:false})],"
        + "{fixed:true,highlight:false,borders:{strokeColor:'none'},fillColor:'#f1f5f9',fillOpacity:1});\n"
        + "board.create('image',[" + jxgDropChunkedJsString_D(st.bgData, 2000) + ",[0," + PAL_H + "],[" + BGW + "," + BGH + "]],"
        + "{fixed:true,highlight:false});\n"
        + "board.create('segment',[\n"
        + "  board.create('point',[0," + PAL_H + "],{visible:false}),\n"
        + "  board.create('point',[" + BGW + "," + PAL_H + "],{visible:false})\n"
        + "],{strokeColor:'#cbd5e1',strokeWidth:1.5,fixed:true,highlight:false});\n"
        + 'var trackers=[\n  ' + trackerItems.join(',\n  ') + '\n];\n'
        + bindLines.join('\n') + '\n'
        // Une fois la tentative validée/figée par Moodle, l'input STACK sous-jacent
        // reçoit readonly="readonly" (même mécanisme que corsscripts/stacksortable.js
        // dans le cœur STACK) : on s'appuie dessus pour geler les pastilles.
        + 'var IS_RO_' + X + '=(function(){try{var _el=document.getElementById(refAns' + X + 'z1);'
        + 'return !!_el&&_el.getAttribute("readonly")==="readonly";}catch(e){return false;}})();\n'
        + 'var zones=[\n  ' + zoneItems.join(',\n  ') + '\n];\n'
        + 'var proposals=[\n  ' + propItems.join(',\n  ') + '\n];\n'
        + 'var INIT_POS=[' + initPosStr + '];\n'
        // bind_point restaure la valeur du tracker (donnée scorée) mais ne
        // touche pas aux pastilles visibles : sans ceci, au rechargement
        // (page suivante, retour en arrière, correction) les pastilles
        // repartent toutes dans la palette alors que la réponse de l'élève
        // est bien enregistrée — cf. doc STACK Binding.md §"initialise the
        // shading based on existing student input", même lecture directe
        // de l'input.value.
        + restoreLines.join('\n') + '\n'
        + 'function _encode(){\n'
        + '  trackers.forEach(function(t,zi){\n'
        + '    var occ=zones[zi].occ;\n'
        + '    t.setPosition(JXG.COORDS_BY_USER,[occ>=0?occ+1:0,0]);\n'
        + '  });\n'
        + '  board.update();\n'
        + '}\n'
        + 'function _snap(pi){\n'
        + '  if(IS_RO_' + X + ')return;\n'
        + '  var p=proposals[pi],px=p.X(),py=p.Y();\n'
        + '  zones.forEach(function(z){if(z.occ===pi){z.occ=-1;z.el.setAttribute({fillColor:' + zoneFillColor + '});}});\n'
        + '  var best=-1,bestDist=Infinity;\n'
        + '  zones.forEach(function(z,zi){\n'
        + '    var d=Math.sqrt((px-z.cx)*(px-z.cx)+(py-z.cy)*(py-z.cy));\n'
        + '    if(z.snap(px,py)&&d<bestDist&&z.occ<0){best=zi;bestDist=d;}\n'
        + '  });\n'
        + '  if(best>=0){\n'
        + '    zones[best].occ=pi;\n'
        + '    zones[best].el.setAttribute({fillColor:' + zoneOccFillColor + '});\n'
        + '    p.setPosition(JXG.COORDS_BY_USER,[zones[best].cx,zones[best].cy]);\n'
        + '  }else{\n'
        + '    p.setPosition(JXG.COORDS_BY_USER,[INIT_POS[pi][0],INIT_POS[pi][1]]);\n'
        + '  }\n'
        + '  _encode();\n'
        + '}\n'
        + 'proposals.forEach(function(p,pi){p.on("up",function(){_snap(pi);});});\n'
        + 'board.unsuspendUpdate();\n'
        + '})();';

    // ── Inputs XML (un par zone) ──────────────────────────────────

    var inputsXML = st.zones.map(function (z, i) {
        return '    <input>\n'
            + '      <name>ans' + X + 'z' + (i + 1) + '</name>\n'
            + '      <type>algebraic</type>\n'
            + '      <tans>[0, 0]</tans>\n'
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
    }).join('\n');

    // ── PRT (feedbackvariables Maxima + nœud unique) ──────────────

    var okItems = st.zones.map(function (z, i) {
        var assignments = z.assignments && z.assignments.length ? z.assignments : (z.assignment ? [z.assignment] : []);
        var correctSeqs = assignments.map(function (id) { return propSeq[id] || 1; });
        if (correctSeqs.length === 1) {
            return 'if ans' + X + 'z' + (i + 1) + '[1]=' + correctSeqs[0] + ' then 1 else 0';
        }
        return 'if member(ans' + X + 'z' + (i + 1) + '[1],[' + correctSeqs.join(',') + ']) then 1 else 0';
    });
    var fbVarsMaxima = 'ok_list_' + X + ': [' + okItems.join(', ') + '];\n'
        + 'n_ok_' + X + ': apply("+", ok_list_' + X + ');\n'
        + 'sc_' + X  + ': float(n_ok_' + X + ' / ' + nZones + ');\n'
        + 'pct_' + X + ': round(sc_' + X + ' * 100);';

    var solutionLines = st.zones.map(function (z, i) {
        var assignments = z.assignments && z.assignments.length ? z.assignments : (z.assignment ? [z.assignment] : []);
        var lbls = assignments.map(function (id) {
            var prop = st.proposals.find(function (p) { return p.id === id; });
            return prop ? htmlEsc_D(prop.text || I18N_D.t('tpl.vf_prop_fallback', {n: prop.id})) : '?';
        });
        return '<li>' + I18N_D.t('jd.zone_label', {n: i + 1}) + ' → ' + (lbls.join(' <em>' + I18N_D.t('jd.or_connector') + '</em> ') || '?') + '</li>';
    }).join('');
    var trueFb  = '<p>✅ <strong>' + I18N_D.t('jd.fb_ok_title') + '</strong> ' + I18N_D.t('jd.fb_ok_detail') + '</p>';
    var falseFb = '<p>❌ ' + I18N_D.t('jd.fb_wrong', {pctvar: 'pct_' + X}) + '</p><ul>' + solutionLines + '</ul>';

    // L'image-solution va dans le feedback général (generalfeedback), affiché
    // à tous les élèves après validation quel que soit leur score — c'est
    // l'emplacement STACK prévu pour montrer le corrigé, pas les feedbacks
    // vrai/faux du PRT (qui restent du texte pour ne pas dupliquer l'image
    // deux fois dans le XML).
    var solutionImgData = p.solutionImgData;
    var solutionImgHtml = solutionImgData
        ? '<p style="margin-top:10px;"><img src="' + jxgDropChunkedRaw_D(solutionImgData, 2000)
          + '" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0;" alt="Solution"></p>'
        : '';

    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVarsMaxima };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'sc_' + X, tans: '1',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: trueFb,
        falsescoremode: '=', falsescore: 'sc_' + X, falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: falseFb
    }];
    var prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    // ── textFrag ──────────────────────────────────────────────────

    var inputTags = st.zones.map(function (z, i) {
        return '[[input:ans' + X + 'z' + (i + 1) + ']][[validation:ans' + X + 'z' + (i + 1) + ']]';
    }).join('\n');

    var textFrag = '<div style="background:#d97706;border-left:5px solid #92400e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('jd.banniere') + '</strong>'
        + '<span style="background:#92400e;color:#fff;padding:2px 9px;'
        + 'border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (instruction || '') + '<!-- ENONCE-END -->\n'
        + '[[jsxgraph width="' + DISP_W + 'px" height="' + DISP_H + 'px"' + inputRefAttrs + ']]\n'
        + '<!--HS-KBD:' + X + '-->\n'
        + '[[/jsxgraph]]\n'
        + '<div style="display:none">\n'
        + inputTags + '\n'
        + '</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Glisser-déposer Q' + X,
        textFrag:        textFrag,
        kbdRaw:          jxgCode,
        inputXML:        inputsXML,
        prtXML:          prtXML,
        generalFeedback: mkFbGen_D(solutionImgHtml, p.fbGen),
        solutionImg:     solutionImgHtml,
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genJxgDrop: genJxgDrop, genJxgDropCore: genJxgDropCore, genJxgDropParams: genJxgDropParams, jxgDropChunkedJsString: jxgDropChunkedJsString, jxgDropChunkedRaw: jxgDropChunkedRaw };
}

// ══════════════════════════════════════════════════════

