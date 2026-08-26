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

// Lecture pure du formulaire (aucun effet de bord réseau) — factorisée pour
// être appelée à la fois par genStatistiques() (export réel) et par l'aperçu
// local synchrone (js/preview.js:renderPreviewHTML_statistiques), qui ne doit
// pas dépendre du réseau ni devenir async (voir PLAN.md, étape 3 du chantier
// Backend NAS, même piège que gen-math-calcul.js/_calcBuildParams).
function _statParseNumList(raw) {
    return (raw || '').split(',').map(function(s){ return parseFloat(s.trim()); }).filter(function(n){ return !isNaN(n); });
}

function _statBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var dataDecimals = parseInt(gs('stat-data-decimals'));
    if (isNaN(dataDecimals) || dataDecimals < 0) dataDecimals = 1;
    if (dataDecimals > 3) dataDecimals = 3;
    var randFormatEl = document.querySelector('input[name="stat-rand-format-radio"]:checked');
    return {
        bareme: parseFloat(gs('stat-bareme')) || 1,
        scenario: gs('stat-scenario') || 'moyenne',
        display: gs('stat-display') || 'liste',
        fbOk: gs('stat-fb-ok').trim(),
        fbWrong: gs('stat-fb-wrong').trim(),
        custText: gs('stat-text').trim(),
        varName: gs('stat-varname').trim() || 'x',
        dataDecimals: dataDecimals,
        randFormat: randFormatEl ? randFormatEl.value : 'decimal',
        fbGen: gs('stat-fbgen'),
        mode: gs('stat-mode') || 'fixe',
        data: _statParseNumList(gs('stat-data')),
        vals: _statParseNumList(gs('stat-vals')),
        effs: _statParseNumList(gs('stat-effs'))
    };
}

async function genStatistiques(X) {
    var p = _statBuildParams();
    // Étape 3 (PLAN.md) : tente la génération côté serveur, avec repli
    // automatique sur le calcul local si le serveur échoue ou est absent —
    // aucun risque de casser la génération pendant la migration.
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'statistiques', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "statistiques", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "statistiques", repli sur le calcul local.', e); }
    return genStatistiquesCore(X, p);
}

/* genStatistiquesCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-math-statistiques.test.js). */
function genStatistiquesCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var bareme = p.bareme, scenario = p.scenario, display = p.display;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText, varName = p.varName;
    // Fragment Maxima ajoutant une partie fractionnaire aléatoire (0 à dataDecimals décimales) à un entier de base :
    // "" si 0 décimale (valeurs entières), sinon "+ri(0,10^d-1)/10^d".
    var frac = p.dataDecimals > 0 ? `+ri(0,${Math.pow(10, p.dataDecimals) - 1})/${Math.pow(10, p.dataDecimals)}` : '';
    var wrapOpen = p.randFormat === 'decimal' ? 'float(' : '';
    var wrapClose = p.randFormat === 'decimal' ? ')' : '';
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    // Mode "valeurs fixes" : q${X}_L est un littéral Maxima construit à partir des
    // valeurs saisies par l'enseignant (p.data), sans aucun rand()/ri() — voir
    // AskUserQuestion "Implémenter le mode fixe (recommandé)". sortFixed applique le
    // même tri que la variante aléatoire du scénario (nécessaire pour first/last/L[pos]).
    var isFixed = p.mode === 'fixe';
    function buildSeriesVars(label, randomListExpr, randomN, sortFixed) {
        if (isFixed) {
            var arr = (p.data || []).slice();
            if (!arr.length) throw new Error('Série vide (mode "valeurs fixes")');
            if (sortFixed) arr.sort(function(a,b){ return a-b; });
            return { code: `/* Q${X} Stats — ${label} (valeurs fixes) */\nq${X}_L:[${arr.join(',')}];`, n: arr.length };
        }
        return { code: `/* Q${X} Stats — ${label} */\nri(a,b):=a+rand(b-a+1);\nq${X}_L:${randomListExpr};`, n: randomN };
    }

    function statNode(desc, test, sans, tans, opts, trueFb, falseFb) {
        return {
            name: '0', description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: opts || '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT-'+X+'-OK', truefeedback: trueFb,
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: falseFb
        };
    }

    // Rend la série q${X}_L dans l'énoncé : en ligne (LaTeX) ou en tableau HTML (une cellule par valeur, via {@q${X}_L[i]@})
    var serieHTML = function(n) {
        if (display === 'tableau') {
            var cells = '';
            for (var i = 1; i <= n; i++) {
                cells += `<td style="padding:6px 14px;border:1px solid #cbd5e1;text-align:center;">{@q${X}_L[${i}]@}</td>`;
            }
            return `<table style="border-collapse:collapse;margin:8px 0;"><tr>${cells}</tr></table>`;
        }
        return `\\( {@q${X}_L@} \\)`;
    };

    var HDR = `<div style="background:#0284c7;border-left:5px solid #0369a1;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('stat.title')}</strong> <span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'mediane') {
        var svMed = buildSeriesVars('M\xe9diane',
            `${wrapOpen}sort([ri(1,9)${frac},ri(10,17)${frac},ri(20,28)${frac},ri(30,38)${frac},ri(40,47)${frac},ri(50,58)${frac}])${wrapClose}`,
            6, true);
        vars = `${svMed.code}
q${X}_n:length(q${X}_L);
q${X}_ta:float(median(q${X}_L));`;
        qnote = `L={@q${X}_L@}, mediane={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_mediane')}</p>${serieHTML(svMed.n)}
<p>${I18N_D.t('stat.lbl_mediane')}[[input:ans_med${X}]] [[validation:ans_med${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_med${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_mediane'), 'NumAbsolute', `ans_med${X}`, `q${X}_ta`, '0.005',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong> ${I18N_D.t('stat.fb_ok_mediane_suffix', {tavar:'q'+X+'_ta'})}`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_mediane', {tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_mediane', {lvar:'q'+X+'_L', nvar:'q'+X+'_n', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'ecart-type') {
        var svEt = buildSeriesVars('\xc9cart-type',
            `${wrapOpen}[ri(1,8)${frac},ri(1,8)${frac},ri(1,8)${frac},ri(1,8)${frac},ri(1,8)${frac}]${wrapClose}`,
            5, false);
        vars = `${svEt.code}
q${X}_n:length(q${X}_L);
q${X}_moy:float(mean(q${X}_L));
q${X}_var:float(sum((q${X}_L[i]-q${X}_moy)^2,i,1,q${X}_n)/q${X}_n);
q${X}_ta:1.0*round(sqrt(q${X}_var)*100)/100;`;
        qnote = `L={@q${X}_L@}, sigma={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_ecart_type')}</p>${serieHTML(svEt.n)}
<p>\\(\\sigma=\\) [[input:ans_std${X}]] [[validation:ans_std${X}]]</p>
<p><em>${I18N_D.t('stat.arrondi_deux_decimales')}</em></p>`;
        inputXML = mkInput_D({name:`ans_std${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_ecart_type'), 'NumAbsolute', `ans_std${X}`, `q${X}_ta`, '0.015',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_ecart_type', {varname:varName, tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_ecart_type', {varname:varName, moyvar:'q'+X+'_moy', varvar:'q'+X+'_var', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'etendue') {
        var svEtd = buildSeriesVars('\xc9tendue',
            `${wrapOpen}sort([ri(10,20)${frac},ri(20,30)${frac},ri(30,40)${frac},ri(40,50)${frac},ri(50,60)${frac},ri(60,70)${frac}])${wrapClose}`,
            6, true);
        vars = `${svEtd.code}
q${X}_ta_max:last(q${X}_L);
q${X}_ta_min:first(q${X}_L);
q${X}_ta:1.0*round((q${X}_ta_max-q${X}_ta_min)*100)/100;`;
        qnote = `L={@q${X}_L@}, etendue={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_etendue')}</p>${serieHTML(svEtd.n)}
<p>${I18N_D.t('stat.lbl_etendue')}[[input:ans_et${X}]] [[validation:ans_et${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_et${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_etendue'), 'NumAbsolute', `ans_et${X}`, `q${X}_ta`, '0.015',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_etendue', {maxvar:'q'+X+'_ta_max', minvar:'q'+X+'_ta_min', tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fb_wrong_etendue', {maxvar:'q'+X+'_ta_max', minvar:'q'+X+'_ta_min', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'moyenne') {
        var svMoy = buildSeriesVars('Moyenne',
            `${wrapOpen}[ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac}]${wrapClose}`,
            6, false);
        vars = `${svMoy.code}
q${X}_ta:1.0*round(float(mean(q${X}_L))*100)/100;`;
        qnote = `L={@q${X}_L@}, moy={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_moyenne')}</p>${serieHTML(svMoy.n)}
<p>\\(\\bar{${varName}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_moy${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_moyenne'), 'NumAbsolute', `ans_moy${X}`, `q${X}_ta`, '0.015',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_moyenne', {varname:varName, tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_moyenne', {varname:varName, tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'variance') {
        var svVar = buildSeriesVars('Variance',
            `${wrapOpen}[ri(1,10)${frac},ri(1,10)${frac},ri(1,10)${frac},ri(1,10)${frac},ri(1,10)${frac}]${wrapClose}`,
            5, false);
        vars = `${svVar.code}
q${X}_n:length(q${X}_L);
q${X}_moy:float(mean(q${X}_L));
q${X}_ta:1.00*round(float(sum((q${X}_L[i]-q${X}_moy)^2,i,1,q${X}_n)/q${X}_n)*100)/100;`;
        qnote = `L={@q${X}_L@}, var={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_variance')}</p>${serieHTML(svVar.n)}
<p>\\(V=\\) [[input:ans_var${X}]] [[validation:ans_var${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_var${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_variance'), 'NumAbsolute', `ans_var${X}`, `q${X}_ta`, '0.015',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_variance', {varname:varName, tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_variance', {varname:varName, moyvar:'q'+X+'_moy', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'q1') {
        var svQ1 = buildSeriesVars('Quartile Q1',
            `${wrapOpen}sort([ri(5,15)${frac},ri(15,25)${frac},ri(25,35)${frac},ri(35,45)${frac},ri(45,55)${frac},ri(55,65)${frac},ri(65,75)${frac},ri(75,85)${frac}])${wrapClose}`,
            8, true);
        vars = `${svQ1.code}
q${X}_n:length(q${X}_L);
q${X}_pos:max(1,floor(q${X}_n/4));
q${X}_ta:1.0*q${X}_L[q${X}_pos];`;
        qnote = `L={@q${X}_L@}, Q1={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_q1')}</p>${serieHTML(svQ1.n)}
<p>\\(Q_1=\\) [[input:ans_q1${X}]] [[validation:ans_q1${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_q1${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_q1'), 'NumAbsolute', `ans_q1${X}`, `q${X}_ta`, '0.005',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_q1', {posvar:'q'+X+'_pos', tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_q1', {posvar:'q'+X+'_pos', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'q3') {
        var svQ3 = buildSeriesVars('Quartile Q3',
            `${wrapOpen}sort([ri(5,15)${frac},ri(15,25)${frac},ri(25,35)${frac},ri(35,45)${frac},ri(45,55)${frac},ri(55,65)${frac},ri(65,75)${frac},ri(75,85)${frac}])${wrapClose}`,
            8, true);
        vars = `${svQ3.code}
q${X}_n:length(q${X}_L);
q${X}_pos:max(1,floor(3*q${X}_n/4));
q${X}_ta:1.0*q${X}_L[q${X}_pos];`;
        qnote = `L={@q${X}_L@}, Q3={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_q3')}</p>${serieHTML(svQ3.n)}
<p>\\(Q_3=\\) [[input:ans_q3${X}]] [[validation:ans_q3${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_q3${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_q3'), 'NumAbsolute', `ans_q3${X}`, `q${X}_ta`, '0.005',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_q3', {posvar:'q'+X+'_pos', tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_q3', {posvar:'q'+X+'_pos', tavar:'q'+X+'_ta'})}`;

    } else { /* moyenne-ponderee */
        var tblHdr = `<table style="border-collapse:collapse;margin:10px 0;"><tr style="background:#e2e8f0;"><th style="padding:6px 12px;border:1px solid #cbd5e1;">${I18N_D.t('stat.tbl_valeur')}</th><th style="padding:6px 12px;border:1px solid #cbd5e1;">${I18N_D.t('stat.tbl_effectif')}</th></tr>`;
        if (isFixed) {
            var mpVals = (p.vals || []).slice(), mpEffs = (p.effs || []).slice();
            if (!mpVals.length || mpVals.length !== mpEffs.length) throw new Error('Valeurs/effectifs invalides (mode "valeurs fixes")');
            vars = `/* Q${X} Stats — Moyenne pond\xe9r\xe9e (valeurs fixes) */
q${X}_V:[${mpVals.join(',')}];
q${X}_E:[${mpEffs.join(',')}];
q${X}_n:length(q${X}_V);
q${X}_N:sum(q${X}_E[i],i,1,q${X}_n);
q${X}_S:sum(q${X}_V[i]*q${X}_E[i],i,1,q${X}_n);
q${X}_ta:1.0*round(float(q${X}_S/q${X}_N)*10)/10;`;
            var mpRows = mpVals.map(function(_, i) {
                return `<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_V[${i+1}]@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_E[${i+1}]@}</td></tr>`;
            }).join('\n');
            textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_moy_ponderee')}</p>
${tblHdr}
${mpRows}</table>
<p>\\(\\bar{${varName}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`;
        } else {
            vars = `/* Q${X} Stats — Moyenne pond\xe9r\xe9e */
ri(a,b):=a+rand(b-a+1);
q${X}_v1:${wrapOpen}ri(10,15)${frac}${wrapClose};q${X}_v2:${wrapOpen}ri(15,20)${frac}${wrapClose};q${X}_v3:${wrapOpen}ri(20,25)${frac}${wrapClose};
q${X}_e1:ri(20,35);q${X}_e2:ri(20,35);q${X}_e3:ri(20,35);
q${X}_N:q${X}_e1+q${X}_e2+q${X}_e3;
q${X}_S:q${X}_v1*q${X}_e1+q${X}_v2*q${X}_e2+q${X}_v3*q${X}_e3;
q${X}_ta:1.0*round(float(q${X}_S/q${X}_N)*10)/10;`;
            textFrag = `${HDR}${custText}<p>${I18N_D.t('stat.calc_moy_ponderee')}</p>
${tblHdr}
<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_v1@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_e1@}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_v2@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_e2@}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_v3@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_e3@}</td></tr></table>
<p>\\(\\bar{${varName}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`;
        }
        qnote = `moy pond={@q${X}_ta@}`;
        inputXML = mkInput_D({name:`ans_moy${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode(I18N_D.t('stat.node_moyenne_ponderee'), 'NumAbsolute', `ans_moy${X}`, `q${X}_ta`, '0.05',
            fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
            fbWrong || `${I18N_D.t('stat.fb_wrong_moy_ponderee', {varname:varName, tavar:'q'+X+'_ta'})}`)];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('stat.fbgen_moy_ponderee', {varname:varName, svar:'q'+X+'_S', nvar:'q'+X+'_N', tavar:'q'+X+'_ta'})}`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    // ── Encadrés colorés : appliqués uniquement sur la copie servant à l'export XML ──
    // canonicalNodes (exposé via prt.nodes pour prt-manager.js) reste en texte brut,
    // sans encadré, pour que l'édition manuelle du PRT ne montre jamais de HTML de
    // présentation. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = canonicalNodes.map(function(n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    generalFeedback = applyFbBox_D('general', mkFbGen_D(generalFeedback, p.fbGen));

    return {type:'statistiques', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genStatistiques: genStatistiques, genStatistiquesCore: genStatistiquesCore };
}

// ─── MATRICES ────────────────────────────────────────────────

