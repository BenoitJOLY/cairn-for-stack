// ── XML GENERATORS: acide-base ──

/* ══════════════════════════════════════════════════════
   ACIDE-BASE — pH-métrie avec courbe de titrage JSXGraph
   Mono / Di / Triprotique (n=1,2,3)
   ══════════════════════════════════════════════════════ */

function genAcideBase(X) {
    var p = {
        abMethod: v('ab-method') || 'colorimetrie',
        abType:   v('ab-type')  || 'af-bf',
        abFind:   v('ab-find')  || 'equivalence',
        nProtons: parseInt(v('ab-n-protons') || '1'),
        c1:       parseFloat(v('ab-c1'))   || 0.1,
        v1:       parseFloat(v('ab-v1'))   || 20,
        c2:       parseFloat(v('ab-c2'))   || 0.1,
        pka:      parseFloat(v('ab-pka'))  || 4.8,
        pka2:     parseFloat(v('ab-pka2')) || 9.2,
        pka3:     parseFloat(v('ab-pka3')) || 12.35,
        tolVol:   parseFloat(v('ab-tol-vol')) || 0.5,
        dispW:    parseInt(v('ab-w'))  || 500,
        dispH:    parseInt(v('ab-h'))  || 400,
        bareme:   parseFloat(v('ab-bareme')) || 1,
        text:     richVal('ab-text'),
        fbGenExtra: v('ab-fbgen') || '',
        indKeys:  Array.prototype.slice.call(document.querySelectorAll('.ab-ind-chk:checked'))
            .map(function(el) { return el.dataset.ind; })
    };
    return genAcideBaseCore(X, p);
}

/* genAcideBaseCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour
   le pattern (deps injectables pour les tests Node — test/unit/gen-acidebase.test.js). */
function genAcideBaseCore(X, p, deps) {
    deps = deps || {};
    var I18N_D        = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D     = deps.mkFbGen || _mkFbGen;

    var S = '_' + X;  // suffixe Maxima/inputs pour éviter les collisions entre sous-questions
    var abMethod = p.abMethod;
    var abType   = p.abType;
    var abFind   = p.abFind;
    var nProtons = p.nProtons;
    var c1       = p.c1;
    var v1       = p.v1;
    var c2       = p.c2;
    var pka      = p.pka;
    var pka2     = p.pka2;
    var pka3     = p.pka3;
    var tolVol   = p.tolVol;
    var dispW    = p.dispW;
    var dispH    = p.dispH;
    var bareme   = p.bareme;
    var text     = p.text;
    var fbGenExtra = p.fbGenExtra;

    // ── Physique ───────────────────────────────────────────────────────
    var isBfAf = (abType === 'bf-af');
    if (isBfAf || abType === 'af-fort-bf') nProtons = 1;

    var Ka1 = (abType === 'af-fort-bf') ? 1e10 : Math.pow(10, -pka);
    var Ka2 = Math.pow(10, -pka2);
    var Ka3 = Math.pow(10, -pka3);
    var Kw  = 1e-14;

    var xLabel = isBfAf ? 'V(HCl) (mL)' : 'V(NaOH) (mL)';
    var Veq1   = c1 * v1 / c2;
    var Veq2   = 2 * Veq1;
    var Veq3   = 3 * Veq1;
    var lastVeq = (nProtons === 3) ? Veq3 : (nProtons === 2) ? Veq2 : Veq1;
    var vbMax   = lastVeq * 1.45;

    var targetVol = (abFind === 'veq2') ? Veq2 : (abFind === 'veq3') ? Veq3 : Veq1;
    var eqLabel   = (abFind === 'veq2') ? 'Veq2' : (abFind === 'veq3') ? 'Veq3' : 'Veq1';

    // ── Formule générique de la courbe V(pH) — réutilisée partout (courbe,
    //    simulation colorimétrique par inversion numérique, dérivées Maxima) ──
    // Tous les cas : Vb = V1*(Ca*aw + (oh-h)) / (Cb-(oh-h)), aw = alpha pondéré
    var curveFnBody;
    if (isBfAf) {
        curveFnBody = '  var num = h - oh + cc1 * Ka1 / (Ka1 + oh);\n'
                    + '  var den = cc2 - (h - oh);\n';
    } else if (nProtons === 1) {
        curveFnBody = '  var D  = h + Ka1;\n'
                    + '  var aw = Ka1 / D;\n'
                    + '  var num = cc1 * aw + (oh - h);\n'
                    + '  var den = cc2 - (oh - h);\n';
    } else if (nProtons === 2) {
        curveFnBody = '  var D  = h*h + Ka1*h + Ka1*Ka2;\n'
                    + '  var aw = (Ka1*h + 2*Ka1*Ka2) / D;\n'
                    + '  var num = cc1 * aw + (oh - h);\n'
                    + '  var den = cc2 - (oh - h);\n';
    } else {  // n === 3
        curveFnBody = '  var D  = h*h*h + Ka1*h*h + Ka1*Ka2*h + Ka1*Ka2*Ka3;\n'
                    + '  var aw = (Ka1*h*h + 2*Ka1*Ka2*h + 3*Ka1*Ka2*Ka3) / D;\n'
                    + '  var num = cc1 * aw + (oh - h);\n'
                    + '  var den = cc2 - (oh - h);\n';
    }
    var calcVFnJs = 'function calcV(pH) {\n'
        + '  var h = Math.pow(10, -pH), oh = Kw / h;\n'
        + curveFnBody
        + '  var x = vv1 * num / den;\n'
        + '  return (Math.sign(x)===-1 || !isFinite(x) || isNaN(x)) ? NaN : x;\n'
        + '}\n';

    // Évaluateur numérique côté génération (même algèbre) — sert à choisir
    // l'indicateur coloré et à cadrer les fenêtres de recherche des tangentes.
    function numDen(pH) {
        var h = Math.pow(10, -pH), oh = Kw / h, num, den;
        if (isBfAf) {
            num = h - oh + c1 * Ka1 / (Ka1 + oh);
            den = c2 - (h - oh);
        } else if (nProtons === 1) {
            var D = h + Ka1, aw = Ka1 / D;
            num = c1 * aw + (oh - h); den = c2 - (oh - h);
        } else if (nProtons === 2) {
            var D2 = h*h + Ka1*h + Ka1*Ka2, aw2 = (Ka1*h + 2*Ka1*Ka2) / D2;
            num = c1 * aw2 + (oh - h); den = c2 - (oh - h);
        } else {
            var D3 = h*h*h + Ka1*h*h + Ka1*Ka2*h + Ka1*Ka2*Ka3;
            var aw3 = (Ka1*h*h + 2*Ka1*Ka2*h + 3*Ka1*Ka2*Ka3) / D3;
            num = c1 * aw3 + (oh - h); den = c2 - (oh - h);
        }
        return { num: num, den: den };
    }
    function vAtPh(pH) {
        var nd = numDen(pH);
        var x = v1 * nd.num / nd.den;
        return (x < 0 || !isFinite(x) || isNaN(x)) ? NaN : x;
    }
    function phAtVolume(Vtarget) {
        var lo = 0.05, hi = 13.95;
        for (var w = 1390; w--;) {
            if (isNaN(vAtPh(lo))) lo += 0.01;
        }
        var floorV = vAtPh(lo);
        if (floorV >= Vtarget) return lo;
        var flo = floorV - Vtarget;
        for (var i = 0; i < 60; i++) {
            var mid = (lo + hi) / 2, fm = vAtPh(mid) - Vtarget;
            if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else { hi = mid; }
        }
        return (lo + hi) / 2;
    }
    var pHeq = phAtVolume(targetVol);

    // ── Données et bandeau communs ────────────────────────────────────
    var typeMap = {'af-bf':I18N_D.t('ab.typemap_af_bf'),'bf-af':I18N_D.t('ab.typemap_bf_af'),'af-fort-bf':I18N_D.t('ab.typemap_af_fort_bf')};
    var pKa1_exp = isBfAf ? (14 - pka) : pka;
    var pkaStr = '';
    if (abType !== 'af-fort-bf') {
        pkaStr = ', pKa1&nbsp;=&nbsp;' + pKa1_exp.toFixed(2);
        if (nProtons >= 2) pkaStr += ', pKa2&nbsp;=&nbsp;' + pka2.toFixed(2);
        if (nProtons >= 3) pkaStr += ', pKa3&nbsp;=&nbsp;' + pka3.toFixed(2);
    }
    var nStr = nProtons > 1 ? ' (H₂A, n=' + nProtons + ')' : '';
    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>' + I18N_D.t('ab.donnees_lbl') + '</strong> '
        + (typeMap[abType] || abType) + nStr
        + ' &mdash; C₁&nbsp;=&nbsp;' + c1 + '&nbsp;mol/L,'
        + ' V₁&nbsp;=&nbsp;' + v1 + '&nbsp;mL,'
        + ' C₂&nbsp;=&nbsp;' + c2 + '&nbsp;mol/L'
        + pkaStr
        + '</p>\n';

    function banner(title) {
        return '<div style="background:#14532d;border-left:5px solid #166534;'
            + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
            + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
            + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + title + '</strong>'
            + '<span style="background:#166534;color:#fff;padding:2px 9px;border-radius:20px;'
            + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n';
    }

    var textFrag, inputXML, prtMeta, canonicalNodes, vars, generalFeedbackAuto, feedbackVarsText;

    // ═══════════════════════════════════════════════════════════════
    //  MÉTHODE 1 — Simulation colorimétrique (indicateur coloré)
    // ═══════════════════════════════════════════════════════════════
    if (abMethod === 'colorimetrie') {
        var ALL_INDICATORS = {
            hel:  { label: 'Hélianthine',          pL: 3.1,  pH: 4.4,  cL: [255,0,0],     cH: [255,255,0] },
            vbc:  { label: 'Vert de bromocrésol',  pL: 3.8,  pH: 5.4,  cL: [255,255,0],   cH: [0,120,90]  },
            rm:   { label: 'Rouge de méthyle',     pL: 4.2,  pH: 6.3,  cL: [220,20,60],   cH: [255,255,0] },
            bbt:  { label: 'Bleu de Bromothymol',  pL: 6.0,  pH: 7.6,  cL: [255,215,0],   cH: [0,0,255]   },
            rc:   { label: 'Rouge de crésol',      pL: 7.2,  pH: 8.8,  cL: [255,255,0],   cH: [220,20,60] },
            phph: { label: 'Phénolphtaléine',      pL: 8.2,  pH: 10.0, cL: [240,240,240], cH: [255,20,147] },
            ja:   { label: "Jaune d'alizarine",    pL: 10.1, pH: 12.0, cL: [255,255,0],   cH: [255,140,0] }
        };
        var indKeys = (p.indKeys || []).filter(function(k) { return ALL_INDICATORS[k]; });
        if (!indKeys.length) indKeys = ['hel', 'bbt', 'phph'];
        var INDICATORS = {};
        indKeys.forEach(function(k) { INDICATORS[k] = ALL_INDICATORS[k]; });

        var taInd = indKeys[0], bestDist = Infinity;
        Object.keys(INDICATORS).forEach(function(k) {
            var i = INDICATORS[k];
            var dist = (pHeq < i.pL) ? (i.pL - pHeq) : (pHeq > i.pH) ? (pHeq - i.pH) : 0;
            if (dist < bestDist) { bestDist = dist; taInd = k; }
        });
        var indLabel = INDICATORS[taInd].label;
        var indZone  = INDICATORS[taInd].pL.toFixed(1) + '–' + INDICATORS[taInd].pH.toFixed(1);

        var nameVol = 'ans_vol' + S, nameInd = 'ans_ind' + S, nameTries = 'ans_tries' + S, nameVeq = 'ans_veq' + S;
        var mKa1 = 'Ka1' + S, mKa2 = 'Ka2' + S, mKa3 = 'Ka3' + S, mV1 = 'V1' + S, mC1 = 'C1' + S, mC2 = 'C2' + S;
        var mTaVeq = 'ta_veq' + S, mTaInd = 'ta_ind' + S;

        var indicatorsJsObj = '{\n'
            + indKeys.map(function(k) {
                var i = INDICATORS[k];
                return '    ' + k + ': {pL:' + i.pL + ', pH:' + i.pH + ', cL:[' + i.cL.join(',') + '], cH:[' + i.cH.join(',') + ']}';
              }).join(',\n') + '\n'
            + '  }';
        var indButtonsHtml = indKeys.map(function(k) {
                var i = INDICATORS[k];
                return '      <button class="btn ind-btn" type="button" data-ind="' + k + '">' + i.label + ' (' + i.pL.toFixed(1) + '-' + i.pH.toFixed(1) + ')</button>';
              }).join('\n');

        var scriptModule = 'import {stack_js} from \'[[cors src="stackjsiframe.js"/]]\';\n\n'
            + 'const Ka1 = parseFloat("{#' + mKa1 + '#}");\n'
            + 'const Ka2 = parseFloat("{#' + mKa2 + '#}");\n'
            + 'const Ka3 = parseFloat("{#' + mKa3 + '#}");\n'
            + 'const cc1 = parseFloat("{#' + mC1 + '#}");\n'
            + 'const vv1 = parseFloat("{#' + mV1 + '#}");\n'
            + 'const cc2 = parseFloat("{#' + mC2 + '#}");\n'
            + 'const Kw = 1e-14;\n\n'
            + calcVFnJs + '\n'
            + 'function calcPh(V) {\n'
            + '  var lo = 0.05, hi = 13.95;\n'
            + '  for (var w = 1390; w--;) {\n'
            + '    if (isNaN(calcV(lo))) { lo += 0.01; }\n'
            + '  }\n'
            + '  var floorV = calcV(lo);\n'
            + '  if (Math.sign(floorV - V) !== -1) return lo;\n'
            + '  var flo = floorV - V;\n'
            + '  for (var i = 60; i--;) {\n'
            + '    var mid = (lo + hi) / 2, fm = calcV(mid) - V;\n'
            + '    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else { hi = mid; }\n'
            + '  }\n'
            + '  return (lo + hi) / 2;\n'
            + '}\n\n'
            + 'var ind = ' + indicatorsJsObj + ';\n\n'
            + 'function getColor(pH) {\n'
            + '    if(!curInd) return "#F0F0F0";\n'
            + '    var i = ind[curInd];\n'
            + '    if(Math.sign(pH-i.pL)!==1) return "rgb("+i.cL.join(",")+")";\n'
            + '    if(Math.sign(pH-i.pH)!==-1) return "rgb("+i.cH.join(",")+")";\n'
            + '    var t = (pH - i.pL) / (i.pH - i.pL);\n'
            + '    return "rgb("+Math.round(i.cL[0]+(i.cH[0]-i.cL[0])*t)+","+Math.round(i.cL[1]+(i.cH[1]-i.cL[1])*t)+","+Math.round(i.cL[2]+(i.cH[2]-i.cL[2])*t)+")";\n'
            + '}\n\n'
            + 'var curVol = 0, curInd = "", tries = 1, dosageStarted = false, volStep = 0.5;\n'
            + 'var inputVol, inputInd, inputTries;\n'
            + 'var initialized = false;\n\n'
            + 'function init() {\n'
            + '    if (!inputVol || !inputInd || !inputTries || initialized) return;\n'
            + '    initialized = true;\n'
            + '    curVol = parseFloat(inputVol.value) || 0;\n'
            + '    curInd = inputInd.value || "";\n'
            + '    tries = parseInt(inputTries.value) || 1;\n'
            + '    if (Math.sign(curVol) === 1) dosageStarted = true;\n'
            + '    updateUI();\n'
            + '    attachEvents();\n'
            + '}\n\n'
            + 'function syncInputs() {\n'
            + '    inputVol.value = curVol.toFixed(1);\n'
            + '    inputInd.value = curInd;\n'
            + '    inputTries.value = tries;\n'
            + '    inputVol.dispatchEvent(new Event("change"));\n'
            + '    inputInd.dispatchEvent(new Event("change"));\n'
            + '    inputTries.dispatchEvent(new Event("change"));\n'
            + '}\n\n'
            + 'function updateUI() {\n'
            + '    var pH = calcPh(curVol);\n'
            + '    document.getElementById("color-square").style.backgroundColor = getColor(pH);\n'
            + '    document.getElementById("vol-display").textContent = "V = " + curVol.toFixed(1) + " mL";\n'
            + '    document.getElementById("tries-display").textContent = "Essais : " + tries;\n'
            + '    document.querySelectorAll(".ind-btn").forEach(function(b) {\n'
            + '        if(dosageStarted) { b.classList.add("locked"); } else { b.classList.remove("locked"); }\n'
            + '        if(b.dataset.ind === curInd) { b.classList.add("active"); }\n'
            + '        else if(!dosageStarted) { b.classList.remove("active"); }\n'
            + '    });\n'
            + '}\n\n'
            + 'function setInd(key) {\n'
            + '    if (dosageStarted) return;\n'
            + '    curInd = key; updateUI(); syncInputs();\n'
            + '}\n\n'
            + 'function setStep(val) {\n'
            + '    volStep = val;\n'
            + '    document.querySelectorAll(".step-btn").forEach(function(b) {\n'
            + '        if(parseFloat(b.dataset.step) === val) b.classList.add("active"); else b.classList.remove("active");\n'
            + '    });\n'
            + '}\n\n'
            + 'function addVol() {\n'
            + '    if(Math.sign(curVol-' + (vbMax * 1.2).toFixed(0) + ')!==-1) return;\n'
            + '    curVol = Math.round((curVol + volStep) * 100) / 100;\n'
            + '    if (!dosageStarted) {\n'
            + '        dosageStarted = true;\n'
            + '        document.querySelectorAll(".ind-btn").forEach(function(b) { b.classList.add("locked"); });\n'
            + '    }\n'
            + '    updateUI(); syncInputs();\n'
            + '}\n\n'
            + 'function reset() {\n'
            + '    curVol = 0; dosageStarted = false; tries++;\n'
            + '    document.querySelectorAll(".ind-btn").forEach(function(b) { b.classList.remove("locked"); });\n'
            + '    updateUI(); syncInputs();\n'
            + '}\n\n'
            + 'function attachEvents() {\n'
            + '    document.querySelectorAll(".ind-btn").forEach(function(btn) {\n'
            + '        btn.addEventListener("click", function(e) { e.preventDefault(); setInd(btn.dataset.ind); });\n'
            + '    });\n'
            + '    document.querySelectorAll(".step-btn").forEach(function(btn) {\n'
            + '        btn.addEventListener("click", function(e) { e.preventDefault(); setStep(parseFloat(btn.dataset.step)); });\n'
            + '    });\n'
            + '    document.getElementById("btn-add").addEventListener("click", function(e) { e.preventDefault(); addVol(); });\n'
            + '    document.getElementById("btn-reset").addEventListener("click", function(e) { e.preventDefault(); reset(); });\n'
            + '}\n\n'
            + 'stack_js.request_access_to_input("' + nameVol + '", true).then(function(id) { inputVol = document.getElementById(id); init(); });\n'
            + 'stack_js.request_access_to_input("' + nameInd + '", true).then(function(id) { inputInd = document.getElementById(id); init(); });\n'
            + 'stack_js.request_access_to_input("' + nameTries + '", true).then(function(id) { inputTries = document.getElementById(id); init(); });\n';

        var iframeBlock = '[[iframe width="100%" height="' + dispH + 'px" scrolling="false"]]\n\n'
            + '[[style]]\n'
            + '  body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; }\n'
            + '  .container { display: flex; gap: 30px; padding: 20px; align-items: flex-start; flex-wrap: wrap; }\n'
            + '  .beaker-section { display: flex; flex-direction: column; align-items: center; gap: 10px; }\n'
            + '  .square { width: 120px; height: 120px; border: 4px solid #1e293b; border-radius: 8px; box-shadow: inset 0 4px 8px rgba(0,0,0,0.2); background-color: #F0F0F0; transition: background-color 0.1s; }\n'
            + '  .vol-text { font-size: 1.2em; font-weight: bold; color: #b91c1c; }\n'
            + '  .tries-text { font-size: 0.9em; color: #666; }\n'
            + '  .controls-section { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 250px; }\n'
            + '  .label { font-weight: bold; color: #1e3a5f; margin-bottom: 5px; font-size: 0.95em; }\n'
            + '  .btn { padding: 8px 12px; border: 2px solid #cbd5e1; border-radius: 6px; background: white; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s; }\n'
            + '  .btn:hover { background: #f1f5f9; border-color: #94a3b8; }\n'
            + '  .btn.active { background: #1e3a5f; color: white; border-color: #1e3a5f; }\n'
            + '  .btn.locked { opacity: 0.5; cursor: not-allowed; pointer-events: none; }\n'
            + '  .btn-group { display: flex; flex-wrap: wrap; gap: 8px; }\n'
            + '  .step-group .btn { width: 60px; text-align: center; font-size: 0.85em; }\n'
            + '  .btn-add { background: #166534; color: white; border-color: #166534; width: 100%; margin-top: 10px; }\n'
            + '  .btn-add:hover { background: #15803d; }\n'
            + '  .btn-reset { background: white; color: #dc2626; border-color: #dc2626; width: 100%; }\n'
            + '  .btn-reset:hover { background: #fef2f2; }\n'
            + '[[/style]]\n\n'
            + '<div class="container">\n'
            + '  <div class="beaker-section">\n'
            + '    <div class="label">Bécher</div>\n'
            + '    <div id="color-square" class="square"></div>\n'
            + '    <div id="vol-display" class="vol-text">V = 0.0 mL</div>\n'
            + '    <div id="tries-display" class="tries-text">Essais : 1</div>\n'
            + '  </div>\n'
            + '  <div class="controls-section">\n'
            + '    <div class="label">Choix de l\'indicateur :</div>\n'
            + '    <div class="btn-group">\n'
            + indButtonsHtml + '\n'
            + '    </div>\n'
            + '    <div class="label" style="margin-top: 15px;">Pas de versement :</div>\n'
            + '    <div class="btn-group step-group">\n'
            + '      <button class="btn step-btn" type="button" data-step="0.1">0.1 mL</button>\n'
            + '      <button class="btn step-btn" type="button" data-step="0.2">0.2 mL</button>\n'
            + '      <button class="btn step-btn active" type="button" data-step="0.5">0.5 mL</button>\n'
            + '      <button class="btn step-btn" type="button" data-step="1">1.0 mL</button>\n'
            + '      <button class="btn step-btn" type="button" data-step="2">2.0 mL</button>\n'
            + '    </div>\n'
            + '    <div class="btn-group" style="flex-direction: column;">\n'
            + '      <button id="btn-add" class="btn btn-add" type="button">+ Verser la soude</button>\n'
            + '      <button id="btn-reset" class="btn btn-reset" type="button">Recommencer le dosage</button>\n'
            + '    </div>\n'
            + '  </div>\n'
            + '</div>\n\n'
            + '[[script type="module"]]\n' + scriptModule + '[[/script]]\n'
            + '[[/iframe]]\n';

        textFrag = banner('Simulation de dosage et indicateur coloré')
            + '<p style="margin:10px 0;font-size:.95em;line-height:1.5;">On dose ' + (typeMap[abType] || abType) + nStr + '.</p>\n'
            + dataRow
            + '<p style="margin:10px 0;font-size:.95em;line-height:1.5;"><strong>Consigne :</strong> Sélectionnez un indicateur, choisissez un pas de versement, puis ajoutez le titrant. Le carré représente la couleur de votre bécher. Lorsque vous voyez le virage, saisissez le volume équivalent ci-dessous. <em>(Attention : "Recommencer" ajoute une pénalité).</em></p>\n'
            + '<div style="display:none">\n[[input:' + nameVol + ']][[validation:' + nameVol + ']]\n[[input:' + nameInd + ']][[validation:' + nameInd + ']]\n[[input:' + nameTries + ']][[validation:' + nameTries + ']]\n</div>\n\n'
            + iframeBlock
            + '<div style="margin-top:15px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">\n'
            + '    <label for="' + nameVeq + '" style="font-weight:bold; font-size:0.95em; color:#1e3a5f;">Volume équivalent observé (en mL) :</label>\n'
            + '    [[input:' + nameVeq + ']] [[validation:' + nameVeq + ']]\n'
            + '</div>';

        function _abInput(name, type, tans, boxsize) {
            return '<input><name>' + name + '</name><type>' + type + '</type><tans>' + tans + '</tans>'
                + '<boxsize>' + boxsize + '</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
                + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
                + '<forbidwords></forbidwords><allowwords></allowwords>'
                + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
                + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
                + '<showvalidation>0</showvalidation><options></options></input>';
        }
        inputXML = _abInput(nameInd, 'string', '"' + taInd + '"', 5) + '\n'
            + _abInput(nameTries, 'numerical', '1.0', 5) + '\n'
            + _abInput(nameVeq, 'numerical', '1.0*' + mTaVeq, 10) + '\n'
            + _abInput(nameVol, 'string', '"0.0"', 5);

        vars = mKa1 + ': ' + Ka1.toExponential(4) + '$ ' + mKa2 + ': ' + Ka2.toExponential(4) + '$ '
            + mKa3 + ': ' + Ka3.toExponential(4) + '$ ' + mV1 + ': ' + v1 + '$ ' + mC1 + ': ' + c1 + '$ '
            + mC2 + ': ' + c2 + '$ ' + mTaVeq + ': ' + targetVol.toFixed(4) + '$ ' + mTaInd + ': "' + taInd + '"$';

        // Valeurs littérales pour l'aperçu live (substituent les {#...#} STACK, non
        // évaluables hors runtime Moodle) — mêmes nombres que ceux injectés dans <questionvariables>.
        var previewVars = {};
        previewVars[mKa1] = Ka1; previewVars[mKa2] = Ka2; previewVars[mKa3] = Ka3;
        previewVars[mC1] = c1; previewVars[mV1] = v1; previewVars[mC2] = c2;
        var previewInputNames = { vol: nameVol, ind: nameInd, tries: nameTries };

        feedbackVarsText = 'is_veq_ok' + S + ': is(abs(float(' + nameVeq + ') - ' + mTaVeq + ') <= ' + tolVol.toFixed(4) + ')$ '
            + 'is_ind_ok' + S + ': is(' + nameInd + ' = ' + mTaInd + ')$ '
            + 'tries_val' + S + ': if numberp(float(' + nameTries + ')) then floor(float(' + nameTries + ')) else 0$';

        var b1 = bareme, b2 = +(bareme * 0.75).toFixed(4), b3 = +(bareme * 0.5).toFixed(4);
        canonicalNodes = [
            { name: '0', description: 'Vérification indicateur', answertest: 'AlgEquiv', sans: 'is_ind_ok' + S, tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: '0', truepenalty: '0', truenextnode: '1', trueanswernote: 'PRT' + X + '-0-T', truefeedback: '',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-0-F',
              falsefeedback: '<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fef2f2;border-radius:4px;margin:4px 0;">❌ <strong>Indicateur incorrect.</strong> Le pH à l\'équivalence est d\'environ ' + pHeq.toFixed(2) + '. Le <strong>' + indLabel + '</strong> (zone ' + indZone + ') est le seul indicateur adapté ici.</div>' },
            { name: '1', description: 'Vérification volume équivalent', answertest: 'AlgEquiv', sans: 'is_veq_ok' + S, tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: '0', truepenalty: '0', truenextnode: '2', trueanswernote: 'PRT' + X + '-1-T', truefeedback: '',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-1-F',
              falsefeedback: '<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;margin:4px 0;">⚠️ <strong>Bon indicateur, mais volume incorrect.</strong> Le virage doit apparaître pour un volume d\'environ ' + targetVol.toFixed(1) + ' mL.</div>' },
            { name: '2', description: 'Calcul pénalité essais (1 essai)', answertest: 'AlgEquiv', sans: 'tries_val' + S, tans: '1',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(b1), truepenalty: '0', truenextnode: '-1', trueanswernote: 'PRT' + X + '-2-T',
              truefeedback: '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;margin:4px 0;">✅ <strong>Parfait !</strong> Indicateur correct et dosage réussi du premier coup.</div>',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '3', falseanswernote: 'PRT' + X + '-2-F', falsefeedback: '' },
            { name: '3', description: 'Calcul pénalité essais (2 essais)', answertest: 'AlgEquiv', sans: 'tries_val' + S, tans: '2',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(b2), truepenalty: '0', truenextnode: '-1', trueanswernote: 'PRT' + X + '-3-T',
              truefeedback: '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;margin:4px 0;">✅ <strong>Correct.</strong> Vous avez dû recommencer une fois, une pénalité est appliquée.</div>',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '4', falseanswernote: 'PRT' + X + '-3-F', falsefeedback: '' },
            { name: '4', description: 'Calcul pénalité essais (3 essais ou +)', answertest: 'AlgEquiv', sans: 'true', tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(b3), truepenalty: '0', truenextnode: '-1', trueanswernote: 'PRT' + X + '-4-T',
              truefeedback: '<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;margin:4px 0;">⚠️ <strong>Correct, mais trop d\'essais.</strong> Vous avez recommencé le dosage à plusieurs reprises. Le score est plafonné.</div>',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-4-F', falsefeedback: '' }
        ];
        prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedbackVarsText };

        generalFeedbackAuto = '<div style="margin-top:20px; padding:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">'
            + '<div style="font-weight:bold; color:#1e3a5f; margin-bottom:10px; display:flex; align-items:center; gap:8px;"><span style="font-size:1.2rem;">🔑</span> Réponses attendues</div>'
            + '<div style="margin-bottom:8px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:6px;">'
            + '<span style="font-weight:bold;color:#1e3a5f;">Q' + X + ' Analyse :</span> Le pH à l\'équivalence est d\'environ ' + pHeq.toFixed(2)
            + '. La <strong>' + indLabel + '</strong> est l\'indicateur dont la zone de virage encadre ce pH. Le volume équivalent théorique est '
            + '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#d946ef;">V_eq = ' + targetVol.toFixed(1) + ' mL</code>.</div></div>';

    // ═══════════════════════════════════════════════════════════════
    //  MÉTHODE 2 — Méthode des tangentes (JSXGraph)
    // ═══════════════════════════════════════════════════════════════
    } else {
        var name1 = 'ans1' + S, name2 = 'ans2' + S, refSlopes = 'refSlopes' + S;
        var qKa1 = 'Ka1' + S, qKa2 = 'Ka2' + S, qKa3 = 'Ka3' + S, qV1 = 'V1' + S, qC1 = 'C1' + S, qC2 = 'C2' + S, qTaVeq = 'ta_veq' + S;
        var hF = 'h' + S, ohF = 'oh' + S, aF = 'A' + S, bF = 'B' + S, dAF = 'dAdpH' + S, dBF = 'dBdpH' + S;
        var mF = 'm_tang' + S, dmF = 'dm_tang' + S, rv1 = 'raw_v1' + S, rv2 = 'raw_v2' + S, ve1 = 'v_extremum1' + S, ve2 = 'v_extremum2' + S;

        // Fenêtres de recherche find_root (best-effort, autour du pH d'équivalence ciblé)
        var loLo = Math.max(0.1, pHeq - 6).toFixed(2), loHi = (pHeq - 0.5).toFixed(2);
        var hiLo = (pHeq + 0.5).toFixed(2), hiHi = (pHeq + 6).toFixed(2);
        var fbV1 = (targetVol * 0.2).toFixed(2), fbV2 = (targetVol * 1.4).toFixed(2);

        // Même recherche que le find_root Maxima, mais évaluée numériquement en JS
        // (bissection sur dm/dpH) — sert uniquement à alimenter l'aperçu live, la
        // vraie valeur exportée dans le XML reste calculée symboliquement par Maxima.
        function Anum(pH) { return numDen(pH).den; }
        function Bnum(pH) { return v1 * numDen(pH).num; }
        function dAnum(pH) { var e = 1e-4; return (Anum(pH + e) - Anum(pH - e)) / (2 * e); }
        function dBnum(pH) { var e = 1e-4; return (Bnum(pH + e) - Bnum(pH - e)) / (2 * e); }
        function mNum(pH) { var a = Anum(pH), b = Bnum(pH); return -a / ((b / a) * dAnum(pH) - dBnum(pH)); }
        function dmNum(pH) { var e = 1e-4; return (mNum(pH + e) - mNum(pH - e)) / (2 * e); }
        function findRootNum(fn, lo, hi) {
            var flo = fn(lo), fhi = fn(hi);
            if (!isFinite(flo) || !isFinite(fhi) || (flo < 0) === (fhi < 0)) return null;
            for (var i = 0; i < 60; i++) {
                var mid = (lo + hi) / 2, fm = fn(mid);
                if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else { hi = mid; }
            }
            return (lo + hi) / 2;
        }
        var rv1Num = findRootNum(dmNum, parseFloat(loLo), parseFloat(loHi));
        var rv2Num = findRootNum(dmNum, parseFloat(hiLo), parseFloat(hiHi));
        var ve1Num = (rv1Num !== null) ? (Bnum(rv1Num) / Anum(rv1Num)) : parseFloat(fbV1);
        var ve2Num = (rv2Num !== null) ? (Bnum(rv2Num) / Anum(rv2Num)) : parseFloat(fbV2);
        if (rv1Num === null) rv1Num = (parseFloat(loLo) + parseFloat(loHi)) / 2;
        if (rv2Num === null) rv2Num = (parseFloat(hiLo) + parseFloat(hiHi)) / 2;

        // A(pH)/B(pH) Maxima génériques : mêmes branches que curveFnBody
        var abMaxima;
        if (isBfAf) {
            abMaxima = aF + '(pH) := ' + qC2 + ' - (' + ohF + '(pH) - ' + hF + '(pH))$ \n'
                     + bF + '(pH) := ' + qV1 + ' * (' + ohF + '(pH) - ' + hF + '(pH) + ' + qC1 + ' * ' + qKa1 + '/(' + qKa1 + '+' + ohF + '(pH)))$ \n';
            // (isBfAf inverse la variable de dosage : h-oh au numérateur, voir curveFnBody)
            abMaxima = aF + '(pH) := ' + qC2 + ' - (' + hF + '(pH) - ' + ohF + '(pH))$ \n'
                     + bF + '(pH) := ' + qV1 + ' * (' + hF + '(pH) - ' + ohF + '(pH) + ' + qC1 + ' * ' + qKa1 + '/(' + qKa1 + '+' + ohF + '(pH)))$ \n';
        } else if (nProtons === 1) {
            abMaxima = aF + '(pH) := ' + qC2 + ' - (' + ohF + '(pH) - ' + hF + '(pH))$ \n'
                     + bF + '(pH) := ' + qV1 + ' * (' + qC1 + ' * (' + qKa1 + '/(' + hF + '(pH)+' + qKa1 + ')) + ' + ohF + '(pH) - ' + hF + '(pH))$ \n';
        } else if (nProtons === 2) {
            abMaxima = aF + '(pH) := ' + qC2 + ' - (' + ohF + '(pH) - ' + hF + '(pH))$ \n'
                     + bF + '(pH) := ' + qV1 + ' * (' + qC1 + ' * ((' + qKa1 + '*' + hF + '(pH) + 2*' + qKa1 + '*' + qKa2 + ')/(' + hF + '(pH)^2 + ' + qKa1 + '*' + hF + '(pH) + ' + qKa1 + '*' + qKa2 + ')) + ' + ohF + '(pH) - ' + hF + '(pH))$ \n';
        } else {
            abMaxima = aF + '(pH) := ' + qC2 + ' - (' + ohF + '(pH) - ' + hF + '(pH))$ \n'
                     + bF + '(pH) := ' + qV1 + ' * (' + qC1 + ' * ((' + qKa1 + '*' + hF + '(pH)^2 + 2*' + qKa1 + '*' + qKa2 + '*' + hF + '(pH) + 3*' + qKa1 + '*' + qKa2 + '*' + qKa3 + ')/(' + hF + '(pH)^3 + ' + qKa1 + '*' + hF + '(pH)^2 + ' + qKa1 + '*' + qKa2 + '*' + hF + '(pH) + ' + qKa1 + '*' + qKa2 + '*' + qKa3 + ')) + ' + ohF + '(pH) - ' + hF + '(pH))$ \n';
        }

        vars = qKa1 + ': ' + Ka1.toExponential(4) + '$ ' + qKa2 + ': ' + Ka2.toExponential(4) + '$ ' + qKa3 + ': ' + Ka3.toExponential(4) + '$ '
            + qV1 + ': ' + v1 + '$ ' + qC1 + ': ' + c1 + '$ ' + qC2 + ': ' + c2 + '$ ' + qTaVeq + ': ' + targetVol.toFixed(4) + '$ \n'
            + hF + '(pH) := 10^(-pH)$ ' + ohF + '(pH) := 10^(pH-14)$ \n'
            + abMaxima
            + dAF + '(pH) := diff(' + aF + '(pH), pH)$ ' + dBF + '(pH) := diff(' + bF + '(pH), pH)$ \n'
            + mF + '(pH) := -' + aF + '(pH) / ((' + bF + '(pH)/' + aF + '(pH)) * ' + dAF + '(pH) - ' + dBF + '(pH))$ \n'
            + dmF + '(pH) := diff(' + mF + '(pH), pH)$ \n'
            + rv1 + ': find_root(' + dmF + ', pH, [' + loLo + ', ' + loHi + '])$ \n'
            + rv2 + ': find_root(' + dmF + ', pH, [' + hiLo + ', ' + hiHi + '])$ \n'
            + ve1 + ': if numberp(' + rv1 + ') then float(' + bF + '(' + rv1 + ')/' + aF + '(' + rv1 + ')) else ' + fbV1 + '$ \n'
            + ve2 + ': if numberp(' + rv2 + ') then float(' + bF + '(' + rv2 + ')/' + aF + '(' + rv2 + ')) else ' + fbV2 + '$';

        // Valeurs littérales (calculées en JS, cf. findRootNum ci-dessus) pour l'aperçu
        // live — substituent les {#...#} des gliders T1/T2, non évaluables hors Moodle.
        var previewVars = {};
        previewVars[ve1] = ve1Num; previewVars[rv1] = rv1Num;
        previewVars[ve2] = ve2Num; previewVars[rv2] = rv2Num;
        var previewInputNames = { slopes: name1, veq: name2 };
        var previewRefSlopesVar = refSlopes;

        var jxg = 'var board = JXG.JSXGraph.initBoard(divid, {\n'
            + '  boundingbox: [-2, 14.8, ' + (vbMax * 1.08).toFixed(1) + ', -0.8],\n'
            + '  keepaspectratio: false, showCopyright: false, showNavigation: true\n'
            + '});\n'
            + 'board.create("axis", [[0,0],[1,0]], {\n'
            + '  name: "' + xLabel + '", withLabel: true,\n'
            + '  label: {position:"lrt", offset:[-20,15], fontSize:14}\n'
            + '});\n'
            + 'board.create("axis", [[0,0],[0,1]], {\n'
            + '  name: "pH", withLabel: true,\n'
            + '  label: {position:"rt", offset:[10,0], fontSize:14},\n'
            + '  ticks: {ticksDistance:2, minorTicks:1}\n'
            + '});\n\n'
            + 'var Ka1=' + Ka1.toExponential(4) + ', Ka2=' + Ka2.toExponential(4) + ', Ka3=' + Ka3.toExponential(4) + ', Kw=1e-14;\n'
            + 'var cc1=' + c1 + ', vv1=' + v1 + ', cc2=' + c2 + ';\n\n'
            + calcVFnJs + '\n'
            + 'function A(pH) {\n  var h = Math.pow(10,-pH), oh = Kw/h;\n' + curveFnBody + '  return den;\n}\n'
            + 'function B(pH) {\n  var h = Math.pow(10,-pH), oh = Kw/h;\n' + curveFnBody + '  return vv1*num;\n}\n'
            + 'function dA(pH){ var e=1e-4; return (A(pH+e)-A(pH-e))/(2*e); }\n'
            + 'function dB(pH){ var e=1e-4; return (B(pH+e)-B(pH-e))/(2*e); }\n\n'
            + 'var curve = board.create("curve", [\n'
            + '  function(t) { return calcV(t); },\n'
            + '  function(t) { return t; },\n'
            + '  0.3, 13.7\n'
            + '], {strokeColor:"#2563eb",strokeWidth:3,fixed:true,highlight:false,numberPointsHigh:300});\n\n'
            + 'function coeffs(p) {\n'
            + '    var v0 = p.X(), pH0 = p.Y();\n'
            + '    var a = A(pH0);\n'
            + '    var b = v0 * dA(pH0) - dB(pH0);\n'
            + '    var c = -(a * v0 + b * pH0);\n'
            + '    return [a, b, c];\n'
            + '}\n\n'
            + 'var p1 = board.create("glider", [parseFloat("{#' + ve1 + '#}"), parseFloat("{#' + rv1 + '#}"), curve], {\n'
            + '  size:7, face:"diamond", fillColor:"#f97316", strokeColor:"#c2410c",\n'
            + '  name:"T1", label:{offset:[-20,-15], fontSize:14, color:"#c2410c", fontweight:"bold"}\n'
            + '});\n'
            + 'var p2 = board.create("glider", [parseFloat("{#' + ve2 + '#}"), parseFloat("{#' + rv2 + '#}"), curve], {\n'
            + '  size:7, face:"diamond", fillColor:"#a855f7", strokeColor:"#7e22ce",\n'
            + '  name:"T2", label:{offset:[15,15], fontSize:14, color:"#7e22ce", fontweight:"bold"}\n'
            + '});\n\n'
            + 'var c1f = function(){ return coeffs(p1); };\n'
            + 'var c2f = function(){ return coeffs(p2); };\n\n'
            + 'var t1 = board.create("line", [\n'
            + '  function(){ return [p1.X(), p1.Y()]; },\n'
            + '  function(){ var cc = c1f(); return [p1.X() - cc[1], p1.Y() + cc[0]]; }\n'
            + '], {strokeColor:"#f97316", strokeWidth:2.5, fixed:false});\n\n'
            + 'var t2 = board.create("line", [\n'
            + '  function(){ return [p2.X(), p2.Y()]; },\n'
            + '  function(){ var cc = c2f(); return [p2.X() - cc[1], p2.Y() + cc[0]]; }\n'
            + '], {strokeColor:"#a855f7", strokeWidth:2.5, fixed:false});\n\n'
            + 'var V0_ref = ' + (targetVol * 0.5).toFixed(1) + ';\n'
            + 'var eqLine = board.create("line", [\n'
            + '  function() {\n'
            + '      var v1c = c1f(), v2c = c2f();\n'
            + '      var b1 = v1c[1], b2 = v2c[1];\n'
            + '      if (Math.sign(Math.abs(b1)-1e-9)===-1 || Math.sign(Math.abs(b2)-1e-9)===-1) return [0,0];\n'
            + '      var pH1 = -(v1c[0] * V0_ref + v1c[2]) / b1;\n'
            + '      var pH2 = -(v2c[0] * V0_ref + v2c[2]) / b2;\n'
            + '      return [V0_ref, (pH1 + pH2) / 2];\n'
            + '  },\n'
            + '  function() {\n'
            + '      var v1c = c1f(), v2c = c2f();\n'
            + '      var a_eq = (v1c[0] + v2c[0]) / 2;\n'
            + '      var b_eq = (v1c[1] + v2c[1]) / 2;\n'
            + '      var b1 = v1c[1], b2 = v2c[1];\n'
            + '      if (Math.sign(Math.abs(b1)-1e-9)===-1 || Math.sign(Math.abs(b2)-1e-9)===-1) return [1,0];\n'
            + '      var Y0_ref = (-(v1c[0]*V0_ref + v1c[2])/b1 + -(v2c[0]*V0_ref + v2c[2])/b2) / 2;\n'
            + '      return [V0_ref - b_eq, Y0_ref + a_eq];\n'
            + '  }\n'
            + '], {strokeColor:"#10b981", strokeWidth:3, fixed:false});\n\n'
            + 'var inputSlopes = document.getElementById(' + refSlopes + ');\n'
            + 'var isFrozen = false;\n'
            + 'if (inputSlopes) {\n'
            + '  if (inputSlopes.value !== "") {\n'
            + '    if (inputSlopes.value !== "[0.0000, 0.0000]") { isFrozen = true; }\n'
            + '  }\n'
            + '}\n\n'
            + 'function updateSlopes() {\n'
            + '    if (isFrozen || !inputSlopes) return;\n'
            + '    var v1c = c1f(), v2c = c2f();\n'
            + '    var m1 = (Math.sign(Math.abs(v1c[1])-1e-9)===-1) ? 9999 : -(v1c[0] / v1c[1]);\n'
            + '    var m2 = (Math.sign(Math.abs(v2c[1])-1e-9)===-1) ? 9999 : -(v2c[0] / v2c[1]);\n'
            + '    if (!isFinite(m1)) m1 = 0;\n'
            + '    if (!isFinite(m2)) m2 = 0;\n'
            + '    inputSlopes.value = "[" + m1.toFixed(4) + ", " + m2.toFixed(4) + "]";\n'
            + '    inputSlopes.dispatchEvent(new Event("change"));\n'
            + '}\n\n'
            + 'board.addHook(updateSlopes, "update");\n\n'
            + 'var guideLine = board.create("line", [[-2, 7], [' + (vbMax * 1.08).toFixed(1) + ', 7]], {\n'
            + '    visible: false, straightFirst: true, straightLast: true\n'
            + '});\n\n'
            + 'var cursor = board.create("glider", [' + (targetVol * 1.25).toFixed(1) + ', 7, guideLine], {\n'
            + '  size:8, face:"circle", fillColor:"#ef4444", strokeColor:"#b91c1c",\n'
            + '  name:"Votre r\\u00e9ponse", label:{fontSize:12, color:"#b91c1c", offset:[10,-15]}\n'
            + '});\n\n'
            + 'var cursorLine = board.create("line", [\n'
            + '    function(){ return [cursor.X(), -0.5]; },\n'
            + '    function(){ return [cursor.X(), 14.5]; }\n'
            + '], {\n'
            + '    strokeColor:"#ef4444", strokeWidth:2, dash:3, fixed:true,\n'
            + '    point1: {size:0, visible:false},\n'
            + '    point2: {size:0, visible:false}\n'
            + '});\n\n'
            + 'board.create("text",\n'
            + '  [function(){return cursor.X()+0.8;}, 14.0,\n'
            + '   function(){return "V="+cursor.X().toFixed(1)+" mL";}],\n'
            + '  {fixed:false, fontSize:12, color:"#ef4444", highlight:false});\n';

        textFrag = banner('pH-métrie')
            + '<p style="margin:10px 0;font-size:.95em;line-height:1.5;">On réalise le dosage ' + (typeMap[abType] || abType) + nStr + '. La courbe de dosage pH-métrique est tracée ci-dessous.</p>\n'
            + dataRow
            + '<p style="margin:10px 0;font-size:.95em;line-height:1.5;"><strong>Consigne :</strong> Appliquez la <strong>méthode des tangentes</strong>. Déplacez les points <span style="color:#f97316;font-weight:bold;">T<sub>1</sub></span> et <span style="color:#a855f7;font-weight:bold;">T<sub>2</sub></span> à l\'endroit où la courbe est la plus incurvée. Le graphique tracera la droite équidistante (en vert). Déplacez le curseur rouge à l\'abscisse du point d\'intersection trouvé pour lire le volume équivalent.</p>\n'
            + '<div style="display:none">[[input:' + name1 + ']][[validation:' + name1 + ']]</div>\n\n'
            + '[[jsxgraph input-ref-' + name1 + '="' + refSlopes + '" width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
            + jxg + '\n[[/jsxgraph]]\n'
            + '<div style="margin-top:15px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">\n'
            + '    <label for="' + name2 + '" style="font-weight:bold; font-size:0.95em; color:#1e3a5f;">Volume équivalent lu sur le graphique (en mL) :</label>\n'
            + '    [[input:' + name2 + ']] [[validation:' + name2 + ']]\n'
            + '</div>';

        function _abInput2(name, type, tans, boxsize) {
            return '<input><name>' + name + '</name><type>' + type + '</type><tans>' + tans + '</tans>'
                + '<boxsize>' + boxsize + '</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
                + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
                + '<forbidwords></forbidwords><allowwords></allowwords>'
                + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
                + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
                + '<showvalidation>0</showvalidation><options></options></input>';
        }
        inputXML = _abInput2(name1, 'string', '"0.0000, 0.0000"', 5) + '\n'
            + _abInput2(name2, 'numerical', qTaVeq, 10);

        feedbackVarsText = 'parsed' + S + ': sscanf(' + name1 + ', "[%f, %f]")$ \n'
            + 'm1' + S + ': if listp(parsed' + S + ') and length(parsed' + S + ') = 2 then float(parsed' + S + '[1]) else 0.0$ \n'
            + 'm2' + S + ': if listp(parsed' + S + ') and length(parsed' + S + ') = 2 then float(parsed' + S + '[2]) else 0.0$ \n'
            + 'is_parallel' + S + ': is(abs(m1' + S + ' - m2' + S + ') < 0.2)$ \n'
            + 'v_cur' + S + ': float(' + name2 + ')$ \n'
            + 'is_veq_ok' + S + ': is(abs(v_cur' + S + ' - ' + qTaVeq + ') <= ' + tolVol.toFixed(4) + ')$';

        var t1s = +(bareme * 0.5).toFixed(4), t2s = +(bareme * 0.5).toFixed(4), t3s = +(bareme * 0.25).toFixed(4);
        canonicalNodes = [
            { name: '0', description: 'Vérification parallélisme des tangentes', answertest: 'AlgEquiv', sans: 'is_parallel' + S, tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(t1s), truepenalty: '0', truenextnode: '1', trueanswernote: 'PRT' + X + '-0-T', truefeedback: '',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0.1', falsenextnode: '2', falseanswernote: 'PRT' + X + '-0-F',
              falsefeedback: '<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;margin:4px 0;">⚠️ <strong>Tangentes non parallèles.</strong> L\'écart entre les pentes est trop grand. Ajustez finement les points T1 et T2 pour qu\'elles aient la même pente.</div>' },
            { name: '1', description: 'Vérification volume équivalent', answertest: 'AlgEquiv', sans: 'is_veq_ok' + S, tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(t2s), truepenalty: '0', truenextnode: '-1', trueanswernote: 'PRT' + X + '-1-T',
              truefeedback: '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;margin:4px 0;">✅ <strong>Excellent !</strong> La méthode des tangentes est parfaitement maîtrisée et le volume équivalent est correct.</div>',
              falsescoremode: '=', falsescore: '0', falsepenalty: '0.1', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-1-F',
              falsefeedback: '<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;margin:4px 0;">⚠️ <strong>Parallélisme correct.</strong> Cependant, la valeur du volume équivalent lue est incorrecte.</div>' },
            { name: '2', description: 'Repli : volume équivalent sans tangentes rigoureuses', answertest: 'AlgEquiv', sans: 'is_veq_ok' + S, tans: 'true',
              testoptions: '', quiet: '0',
              truescoremode: '+', truescore: String(t3s), truepenalty: '', truenextnode: '-1', trueanswernote: 'PRT' + X + '-2-T',
              truefeedback: '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;margin:4px 0;">Le volume équivalent est correct mais le travail n\'est pas rigoureux.</div>',
              falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '-1', falseanswernote: 'PRT' + X + '-2-F',
              falsefeedback: '<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;margin:4px 0;">⚠️ <strong>Parallélisme et valeur incorrects.</strong> La méthode des tangentes est à revoir.</div>' }
        ];
        prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedbackVarsText };

        generalFeedbackAuto = '<div style="margin-top:20px; padding:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">'
            + '<div style="font-weight:bold; color:#1e3a5f; margin-bottom:10px; display:flex; align-items:center; gap:8px;"><span style="font-size:1.2rem;">🔑</span> Réponses attendues</div>'
            + '<div style="margin-bottom:8px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:6px;">'
            + '<span style="font-weight:bold;color:#1e3a5f;">Q' + X + ' Méthode :</span> Tangentes aux points d\'inflexion de la pente et '
            + '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#d946ef;">V_eq = ' + targetVol.toFixed(1) + ' mL</code></div></div>';
    }

    var prtXML = buildPrtXml_D(prtMeta, canonicalNodes);
    var generalFeedback = mkFbGen_D(generalFeedbackAuto, fbGenExtra);
    var diagNodes = canonicalNodes.map(function(n) {
        return { desc: n.description || '', fb: n.truefeedback || n.falsefeedback || '' };
    });

    return {
        bareme:              bareme,
        vars:                vars,
        qnote:               'AcideBase Q' + X + ' n=' + nProtons + ' ' + abType + ' ' + abMethod + ' ' + eqLabel,
        textFrag:            textFrag,
        inputXML:            inputXML,
        prtXML:              prtXML,
        prt:                 { meta: prtMeta, nodes: canonicalNodes },
        diagNodes:           diagNodes,
        generalFeedback:     generalFeedback,
        generalFeedbackAuto: generalFeedbackAuto,
        feedbackRef:         '[[feedback:prt' + X + ']]',
        abMethod:            abMethod,
        previewVars:         previewVars,
        previewInputNames:   previewInputNames,
        previewRefSlopesVar: previewRefSlopesVar,
        dispW:               dispW,
        dispH:               dispH
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

// Export CommonJS pour les tests Node (test/unit/*.test.js) : seule la fonction
// pure (aucune dépendance au DOM) est exposée. Sans effet dans le navigateur.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genAcideBase: genAcideBase, genAcideBaseCore: genAcideBaseCore };
}
