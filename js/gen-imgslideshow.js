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

// ── XML GENERATOR: diaporama chronométré (imgslideshow) ──
// Gabarit suivi : js/gen-imgclick.js (mode séquence) — une série d'images
// défile automatiquement (JSXGraph, objets image empilés, visibilité togglée),
// l'élève choisit une proposition texte parmi plusieurs avant la fin du temps
// imparti. Réponse "string" (id de la proposition, ou "_timeout_" si le temps
// est écoulé), écrite par le JS du jeu — même convention que le mode séquence
// de "Sélection sur image". PRT à cascade de 2 nœuds (bonne réponse / temps
// écoulé / mauvaise réponse), chaque branche pédagogiquement explicite.

function genImgSlideshowParams() {
    var bareme    = parseFloat(v('imsl-bareme')) || 1;
    var text      = richVal('imsl-text');
    var fbOkTxt   = v('imsl-fb-ok').trim();
    var fbWrTxt   = v('imsl-fb-wrong').trim();
    var fbGen     = v('imsl-fbgen');
    var interval  = parseFloat(v('imsl-interval')) || 2;
    var timeLimit = parseInt(v('imsl-timelimit'), 10) || 15;

    var st = window._imslState || {};
    var images = (st.images || []).map(function (im) { return { data: im.data, w: im.w, h: im.h }; });

    var props = [], correctPropId = '';
    document.querySelectorAll('#imsl-props-items .imsl-prop-row').forEach(function (r, i) {
        var pid = 'p' + i;
        var text = (r.querySelector('.imsl-prop-text').value || '').trim();
        var radio = r.querySelector('.imsl-prop-correct');
        props.push({ id: pid, text: text });
        if (radio && radio.checked) correctPropId = pid;
    });

    if (images.length < 2) throw new Error(I18N.t('imsl.err_no_images'));
    if (props.length < 2) throw new Error(I18N.t('imsl.err_min_props'));
    if (props.some(function (p) { return !p.text; })) throw new Error(I18N.t('imsl.err_empty_prop'));
    if (!correctPropId) throw new Error(I18N.t('imsl.err_no_correct'));

    return {
        bareme: bareme, text: text, fbOkTxt: fbOkTxt, fbWrTxt: fbWrTxt, fbGen: fbGen,
        interval: interval, timeLimit: timeLimit,
        images: images, props: props, correctPropId: correctPropId
    };
}

async function genImgSlideshow(X) {
    var p = genImgSlideshowParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'imgslideshow', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "imgslideshow", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "imgslideshow", repli sur le calcul local.', e); }
    return genImgSlideshowCore(X, p);
}

function genImgSlideshowCore(X, p, deps) {
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
    var interval = p.interval, timeLimit = p.timeLimit;
    var images = p.images, props = p.props, correctPropId = p.correctPropId;
    var correctProp = props.filter(function (pr) { return pr.id === correctPropId; })[0] || { text: '' };

    var BGW = images[0].w || 400, BGH = images[0].h || 300;

    /* ── Input XML : réponse = id de la proposition choisie, ou "_timeout_" ── */
    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>string</type>\n'
        + '      <tans><![CDATA["' + correctPropId + '"]]></tans>\n'
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

    /* ── Feedback : la bonne réponse est connue à la génération (pas de CAS), on
       peut donc la révéler littéralement — cf. genImgClickSequenceCore pour le
       style "temps écoulé" distinct d'une "mauvaise réponse". ── */
    var revealTxt = I18N_D.t('imsl.fb_reveal', { answer: htmlEsc_D(correctProp.text) });
    var fbOk      = '<p>✅ <strong>' + I18N_D.t('imsl.fb_ok_title') + '</strong></p>'
                       + (fbOkTxt ? '<p>' + htmlEsc_D(fbOkTxt) + '</p>' : '');
    var fbTimeout = '<p>⏱️ <strong>' + I18N_D.t('imsl.fb_timeout_title') + '</strong> ' + revealTxt + '</p>'
                       + (fbWrTxt ? '<p>' + htmlEsc_D(fbWrTxt) + '</p>' : '');
    var fbWrong   = '<p>❌ <strong>' + I18N_D.t('imsl.fb_wrong_title') + '</strong> ' + revealTxt + '</p>'
                       + (fbWrTxt ? '<p>' + htmlEsc_D(fbWrTxt) + '</p>' : '');

    /* ── PRT : cascade 2 nœuds — bonne réponse, puis distinction temps écoulé / mauvais choix ── */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    var canonicalNodes = [
        {
            name: '0', description: '', answertest: 'String', sans: 'ans' + X, tans: '"' + correctPropId + '"',
            testoptions: '', quiet: '1',
            truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '1',
            falseanswernote: 'PRT' + X + '-1-F', falsefeedback: ''
        },
        {
            name: '1', description: '', answertest: 'String', sans: 'ans' + X, tans: '"_timeout_"',
            testoptions: '', quiet: '1',
            truescoremode: '=', truescore: '0', truepenalty: '0', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-2-T', truefeedback: fbTimeout,
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-2-F', falsefeedback: fbWrong
        }
    ];
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(inferFbKind_D(n, 'true'), n.truefeedback),
            falsefeedback: applyFbBox_D(inferFbKind_D(n, 'false'), n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    /* ── JSXGraph code : diaporama (images empilées, visibilité togglée) + boutons
       de propositions + minuteur, injectés en DOM brut à côté du board (même
       technique que genImgClickSequenceCore : le board ne sert que d'ancre). ── */
    var slidesJS = images.map(function (im) {
        return jxgDropChunkedJsString_D(im.data, 2000);
    }).join(',\n        ');
    var propsJS = props.map(function (pr) {
        return '{id:"' + pr.id + '",text:"' + rawEsc_D(pr.text) + '"}';
    }).join(',\n        ');

    var MAX_DISP_W = 700;
    var dscale = Math.min(1, MAX_DISP_W / BGW);
    var dispW = Math.round(BGW * dscale), dispH = Math.round(BGH * dscale);
    var UI_RESERVE_H = 140;

    var jxgCode = '(function(){\n'
        + '/* Q' + X + ' — Diaporama chronométré */\n'
        + 'var _boardCont0=document.getElementById(divid);\n'
        + "if(_boardCont0)_boardCont0.style.height='" + dispH + "px';\n"
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[0,' + BGH + ',' + BGW + ',0],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        + 'var slides=[\n        ' + slidesJS + '\n    ];\n'
        + 'var slideObjs=[];\n'
        + 'for(var _s=0;_s<slides.length;_s++){\n'
        + "  slideObjs.push(board.create('image',[slides[_s],[0,0],[" + BGW + ',' + BGH + "]],{fixed:true,highlight:false,visible:_s===0}));\n"
        + '}\n'
        + 'var props=[\n        ' + propsJS + '\n    ];\n'
        + 'var INTERVALLE=' + interval + '*1000;\n'
        + 'var TEMPS=' + timeLimit + ';\n'
        + 'var curSlide=0,tempsRestant=TEMPS,verrou=false,gameStarted=false,slideTimer,compteur;\n'
        + "var timerTxt=board.create('text',[" + (BGW - 6) + ',' + (BGH - 6) + ",''],{fontSize:16,cssStyle:'color:#dc2626;font-weight:bold;',anchorX:'right',anchorY:'top'});\n"
        + 'var _boardCont=document.getElementById(divid);\n'
        + "var instrEl=document.createElement('div');\n"
        + "instrEl.style.cssText='display:block;margin-top:10px;text-align:center;font-size:1.05rem;font-weight:800;color:#0f766e;';\n"
        + "instrEl.textContent=" + JSON.stringify(I18N_D.t('imsl.instr_template', { sec: timeLimit })) + ";\n"
        + "if(_boardCont&&_boardCont.parentNode)_boardCont.parentNode.insertBefore(instrEl,_boardCont.nextSibling);\n"
        + "var propsEl=document.createElement('div');\n"
        + "propsEl.style.cssText='display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px;';\n"
        + "if(instrEl.parentNode)instrEl.parentNode.insertBefore(propsEl,instrEl.nextSibling);\n"
        + 'var btns=[];\n'
        + 'for(var _p=0;_p<props.length;_p++){\n'
        + '  (function(idx){\n'
        + "    var b=document.createElement('button');\n"
        + "    b.type='button';\n"
        + '    b.textContent=props[idx].text;\n'
        + "    b.style.cssText='padding:8px 16px;font-size:.92rem;font-weight:700;color:#0f766e;background:#fff;border:2px solid #0d9488;border-radius:8px;cursor:pointer;';\n"
        + "    b.addEventListener('click',function(){choisir(idx);});\n"
        + '    btns.push(b);\n'
        + '    propsEl.appendChild(b);\n'
        + '  })(_p);\n'
        + '}\n'
        + "var startBtn=document.createElement('button');\n"
        + "startBtn.type='button';\n"
        + "startBtn.textContent=" + JSON.stringify(I18N_D.t('imsl.start_btn')) + ";\n"
        + "startBtn.style.cssText='display:block;margin:10px auto 0;padding:10px 22px;font-size:1.05rem;font-weight:800;color:#fff;background:#0f766e;border:none;border-radius:8px;cursor:pointer;';\n"
        + "if(propsEl.parentNode)propsEl.parentNode.insertBefore(startBtn,propsEl.nextSibling);\n"
        + 'for(var _b=0;_b<btns.length;_b++)btns[_b].disabled=true;\n'
        + 'function avancerSlide(){\n'
        + '  slideObjs[curSlide].setAttribute({visible:false});\n'
        + '  curSlide=(curSlide+1)%slideObjs.length;\n'
        + '  slideObjs[curSlide].setAttribute({visible:true});\n'
        + '  board.update();\n'
        + '}\n'
        + 'function lancerTimer(){\n'
        + '  clearInterval(compteur);\n'
        + '  tempsRestant=TEMPS;\n'
        + '  timerTxt.setText(tempsRestant+"s");\n'
        + '  compteur=setInterval(function(){\n'
        + '    tempsRestant--;\n'
        + '    timerTxt.setText(Math.max(0,tempsRestant)+"s");\n'
        + '    if(tempsRestant<=0){verrouiller("_timeout_");}\n'
        + '    board.update();\n'
        + '  },1000);\n'
        + '}\n'
        + 'function verrouiller(valeur){\n'
        + '  if(verrou)return;\n'
        + '  verrou=true;\n'
        + '  clearInterval(slideTimer);clearInterval(compteur);\n'
        + '  for(var _d=0;_d<btns.length;_d++)btns[_d].disabled=true;\n'
        + '  timerTxt.setText("");\n'
        + '  var inputEl=document.getElementById(refAns' + X + ');\n'
        + '  inputEl.value=valeur;\n'
        + "  inputEl.dispatchEvent(new Event('change'));\n"
        + '  if(valeur==="_timeout_"){\n'
        + "    instrEl.textContent=" + JSON.stringify(I18N_D.t('imsl.timeout_msg')) + ";instrEl.style.color='#dc2626';\n"
        + '  } else {\n'
        + "    instrEl.textContent=" + JSON.stringify(I18N_D.t('imsl.answered_msg')) + ";instrEl.style.color='#0f766e';\n"
        + '  }\n'
        + '}\n'
        + 'function choisir(idx){\n'
        + '  if(!gameStarted||verrou)return;\n'
        + "  btns[idx].style.background='#0d9488';btns[idx].style.color='#fff';\n"
        + '  verrouiller(props[idx].id);\n'
        + '}\n'
        + 'function demarrer(){\n'
        + '  if(gameStarted)return;\n'
        + '  gameStarted=true;\n'
        + '  if(startBtn&&startBtn.parentNode)startBtn.parentNode.removeChild(startBtn);\n'
        + '  for(var _e=0;_e<btns.length;_e++)btns[_e].disabled=false;\n'
        + '  curSlide=0;\n'
        + '  for(var _f=0;_f<slideObjs.length;_f++)slideObjs[_f].setAttribute({visible:_f===0});\n'
        + '  slideTimer=setInterval(avancerSlide,INTERVALLE);\n'
        + '  lancerTimer();\n'
        + '  board.update();\n'
        + '}\n'
        + "startBtn.addEventListener('click',demarrer);\n"
        + 'board.unsuspendUpdate();\n'
        + '})();';

    /* ── Question text ── */
    /* Le JS brut (jxgCode) n'est pas inliné directement (marqueur HS-KBD substitué
       après stripMathDivs/moodleLatex, cf. gen-jxgdrop.js / gen-imgclick.js). */
    var textFrag = '<div style="background:#0d9488;border-left:5px solid #0f766e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t('imsl.banniere') + '</strong>'
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
        qnote:           'Diaporama Q' + X,
        kbdRaw:          jxgCode,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', mkFbGen_D('', p.fbGen)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genImgSlideshow: genImgSlideshow, genImgSlideshowCore: genImgSlideshowCore, genImgSlideshowParams: genImgSlideshowParams };
}
