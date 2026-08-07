/*
 * StackForge — générateur de questions STACK pour Moodle
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

// ── XML GENERATORS: circuit électrique (atelier de construction) ──
// L'enseignant construit un circuit modèle dans le canvas de la modale de
// config (js/circuit-ui.js), l'élève reconstruit le même circuit dans la
// question Moodle. Correction par comparaison de graphes (isomorphisme),
// portée depuis js/circuit-atelier.js (cirEngineRun / CIR_ENGINE_JS).

function genCircuitParams() {
    var gv = function(id) { var el=document.getElementById(id); return el?parseFloat(el.value)||0:0; };
    var gs = function(id) { var el=document.getElementById(id); return el?el.value:""; };
    var gc = function(id) { var el=document.getElementById(id); return !!(el && el.checked); };

    var model = (typeof cirReadModelFromCanvas === 'function') ? cirReadModelFromCanvas() : null;
    if (!model) {
        throw new Error(I18N.t('cir.err_no_model'));
    }

    return {
        model:       model,
        checkValues: gc('cir-check-values'),
        bareme:      parseFloat(gv('cir-bareme')) || 1,
        text:        richVal('cir-text'),
        fbGen:       gs('cir-fbgen')
    };
}

async function genCircuit(X) {
    var p = genCircuitParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'circuit', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "circuit", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "circuit", repli sur le calcul local.', e); }
    return genCircuitCore(X, p);
}

/* genCircuitCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-circuit.test.js).
   p.model = { signature, components, values, state } (retourné par
   window.__cirGetModelState() côté canvas enseignant). */
function genCircuitCore(X, p, deps) {
    deps = deps || {};
    var I18N_D        = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D      = deps._mkFbGen || _mkFbGen;
    var CIR_ENGINE_JS_D  = deps.CIR_ENGINE_JS  || (typeof cirEngineRun !== 'undefined' ? cirEngineRun.toString() : '');
    var CIR_ATELIER_CSS_D = deps.CIR_ATELIER_CSS || (typeof CIR_ATELIER_CSS !== 'undefined' ? CIR_ATELIER_CSS : '');
    var cirBuildLabels_D = deps.cirBuildLabels || (typeof cirBuildLabels !== 'undefined' ? cirBuildLabels : function () { return {}; });

    var model    = p.model || {};
    var bareme   = p.bareme;
    var checkValues = !!p.checkValues;
    var text     = p.text;

    var escStr = function(s) {
        return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    };

    var nameS = 'ans' + X + 's', nameC = 'ans' + X + 'c', nameW = 'ans' + X + 'w', nameV = 'ans' + X + 'v';
    // Convention de nommage 'ta{X}_xxx' (digit de qid immédiatement après 'ta') : c'est le
    // seul motif reconnu par la regex étroite ren() de js/editor.js (renumberChips()) pour
    // renommer les <tans> lors d'un réordonnancement de questions ; 'ta_xxx{X}' ne matcherait
    // pas et laisserait une référence Maxima périmée dans inputXML après renumérotage.
    var mTaComponents = 'ta' + X + '_components', mTaSignature = 'ta' + X + '_signature', mTaValues = 'ta' + X + '_values';
    var mVerifierValeurs = 'verifier_valeurs' + X;
    var mSchemaEleve = 'schema_eleve' + X, mValEleve = 'val_eleve' + X;

    var vars = mTaComponents + ': "' + escStr(model.components) + '"$\n'
        + mTaSignature + ': "' + escStr(model.signature) + '"$\n'
        + mTaValues + ': "' + escStr(model.values) + '"$\n'
        + mVerifierValeurs + ': ' + (checkValues ? 'true' : 'false') + '$';

    function _cirInput(name, tans, boxsize) {
        return '<input><name>' + name + '</name><type>string</type><tans>' + tans + '</tans>'
            + '<boxsize>' + boxsize + '</boxsize><strictsyntax>0</strictsyntax><insertstars>0</insertstars>'
            + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
            + '<forbidwords></forbidwords><allowwords></allowwords>'
            + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
            + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
            + '<showvalidation>0</showvalidation><options></options></input>';
    }
    var inputXML = _cirInput(nameS, mTaSignature, 60) + '\n'
        + _cirInput(nameC, mTaComponents, 30) + '\n'
        + _cirInput(nameW, '""', 10) + '\n'
        + _cirInput(nameV, mTaValues, 40);

    // ── Bloc iframe : moteur JS embarqué à l'identique (CIR_ENGINE_JS), mode 'student' ──
    var bootCfg = { mode: 'student', inputNames: { s: nameS, c: nameC, w: nameW, v: nameV }, labels: cirBuildLabels_D(I18N_D) };
    var scriptModule = 'import {stack_js} from \'[[cors src="stackjsiframe.js"/]]\';\n\n'
        + CIR_ENGINE_JS_D + '\n\n'
        + 'cirEngineRun(' + JSON.stringify(bootCfg) + ');\n';

    var atelierBody = '<h1 class="sc">🔌 ' + I18N_D.t('cir.atelier_title') + '</h1>\n'
        + '<p class="sub">' + I18N_D.t('cir.atelier_instructions') + '</p>\n'
        + '<div class="layout">\n'
        + '  <div class="left">\n'
        + '    <div class="toolbar">\n'
        + '      <button id="btnScissors" type="button">✂️ ' + I18N_D.t('cir.btn_scissors') + '</button>\n'
        + '      <button id="btnUndo" type="button">← ' + I18N_D.t('cir.btn_undo') + '</button>\n'
        + '      <button id="btnReset" type="button">↺ ' + I18N_D.t('cir.btn_reset') + '</button>\n'
        + '    </div>\n'
        + '    <div id="board" role="img"></div>\n'
        + '    <div id="feedback">' + I18N_D.t('cir.feedback_placeholder') + '</div>\n'
        + '  </div>\n'
        + '  <div class="right">\n'
        + '    <h2 class="sc">' + I18N_D.t('cir.heading_components') + '</h2>\n'
        + '    <div class="palette" id="palette"></div>\n'
        + '    <h2 class="sc">' + I18N_D.t('cir.heading_value') + '</h2>\n'
        + '    <div id="valBox">\n'
        + '      <div id="valName">' + I18N_D.t('cir.valname_placeholder') + '</div>\n'
        + '      <div class="valrow">\n'
        + '        <input id="valInput" type="number" step="any" min="0" disabled>\n'
        + '        <span id="valUnit"></span>\n'
        + '      </div>\n'
        + '      <div id="valHint">' + I18N_D.t('cir.valhint') + '</div>\n'
        + '    </div>\n'
        + '    <h2 class="sc">' + I18N_D.t('cir.heading_validation') + '</h2>\n'
        + '    <button id="btnExport" type="button">✅ ' + I18N_D.t('cir.btn_export') + '</button>\n'
        + '  </div>\n'
        + '</div>\n';

    var iframeBlock = '[[iframe width="100%" height="740px" scrolling="false"]]\n\n'
        + '[[style]]\n' + CIR_ATELIER_CSS_D + '\n[[/style]]\n\n'
        + atelierBody + '\n'
        + '[[script type="module"]]\n' + scriptModule + '[[/script]]\n'
        + '[[/iframe]]\n';

    var instrText = text || ('<p><strong>' + I18N_D.t('cir.default_instruction_lead') + '</strong> ' + I18N_D.t('cir.default_instruction_body1') + ' '
        + I18N_D.t('cir.default_instruction_body2_pre') + ' <strong>✅ ' + I18N_D.t('cir.btn_export') + '</strong> ' + I18N_D.t('cir.default_instruction_body2_post') + '</p>');

    var questionText = instrText
        + '<div style="display: none;" aria-hidden="true" tabindex="-1">\n'
        + '[[input:' + nameS + ']] [[validation:' + nameS + ']]\n'
        + '[[input:' + nameC + ']] [[validation:' + nameC + ']]\n'
        + '[[input:' + nameW + ']] [[validation:' + nameW + ']]\n'
        + '[[input:' + nameV + ']] [[validation:' + nameV + ']]\n'
        + '</div>\n'
        + iframeBlock
        + '[[feedback:prt' + X + ']]';

    // ── PRT — 3 nœuds (composants / topologie / valeurs), score additif final ──
    var feedVars = mSchemaEleve + ': ' + nameW + '$\n'
        + mValEleve + ': if ' + mVerifierValeurs + ' then ' + nameV + ' else ' + mTaValues + '$';

    var prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedVars };
    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('tpl.cir_desc_composants'), answertest: 'String',
            sans: nameC, tans: mTaComponents, testoptions: '', quiet: '0',
            truescoremode: '+', truescore: '0', truepenalty: '0', truenextnode: '1',
            trueanswernote: 'PRT' + X + '-0-T', truefeedback: '',
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-0-F',
            falsefeedback: '<p>' + I18N_D.t('tpl.cir_fb_composants_ko', { btn: '✅ ' + I18N_D.t('cir.btn_export') }) + '</p>'
        },
        {
            name: '1', description: I18N_D.t('tpl.cir_desc_topologie'), answertest: 'String',
            sans: nameS, tans: mTaSignature, testoptions: '', quiet: '0',
            truescoremode: '+', truescore: '0', truepenalty: '0', truenextnode: '2',
            trueanswernote: 'PRT' + X + '-1-T', truefeedback: '',
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-1-F',
            falsefeedback: '<p>' + I18N_D.t('tpl.cir_fb_topologie_ko') + '</p>'
        },
        {
            name: '2', description: I18N_D.t('tpl.cir_desc_valeurs'), answertest: 'String',
            sans: mValEleve, tans: mTaValues, testoptions: '', quiet: '0',
            truescoremode: '+', truescore: String(bareme), truepenalty: '0', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-2-T', truefeedback: '<p>' + I18N_D.t('tpl.cir_fb_valeurs_ok') + '</p>',
            falsescoremode: '+', falsescore: String(+(bareme * 0.5).toFixed(4)), falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-2-F',
            falsefeedback: '<p>' + I18N_D.t('tpl.cir_fb_valeurs_ko') + '</p>'
        }
    ];
    var prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    return {
        type:            'circuit',
        bareme:          bareme,
        vars:            vars,
        qnote:           'Circuit Q' + X + ' composants=' + model.components + ' signature=' + model.signature,
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: mkFbGen_D('', p.fbGen),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genCircuit: genCircuit, genCircuitCore: genCircuitCore, genCircuitParams: genCircuitParams };
}
