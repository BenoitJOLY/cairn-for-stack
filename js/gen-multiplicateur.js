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

// ── XML GENERATOR: multiplicateur (Économie) ──
// Gabarit suivi : js/gen-bilanpuissance.js — une seule sous-question (effet
// total sur la production d'une relance autonome de la demande, via le
// multiplicateur keynésien), avec un PRT à cascade de 3 nœuds diagnostiquant
// deux pièges classiques : oubli du « 1 - » au dénominateur, et calcul du
// seul premier tour de relance. Helper Maxima pur :
// js/gen-multiplicateur-calc.js.

function _mulBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('mul-bareme')) || 1,
    context: {
      intro: richVal('mul-intro')
    },
    grandeurs: {
      cList: gs('mul-clist').trim() || '3/4,4/5,7/10,2/3,3/5',
      diList: gs('mul-dilist').trim() || '10,20,50,100'
    },
    fbGen: richVal('mul-fbgen')
  };
}

async function genMultiplicateur(X) {
  var p = _mulBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'multiplicateur', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "multiplicateur", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "multiplicateur", repli sur le calcul local.', e); }
  return genMultiplicateurCore(X, p);
}

/* genMultiplicateurCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-multiplicateur.test.js). */
function genMultiplicateurCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var mulVars_D = deps._mulVars || _mulVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = mulVars_D(X, p, {}) + '\n';

  var cVar = `q${X}_mul_c`, diVar = `q${X}_mul_di0`;
  var tansVar = `q${X}_mul_tans`, errcVar = `q${X}_mul_errc`, erroneroundVar = `q${X}_mul_erroneround`;
  var ans = `ans_mul${X}`;

  var HDR = `<div style="background:#3f6212;border-left:5px solid #14532d;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('mul.title')}</strong> <span style="background:#14532d;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Une relance autonome de la demande <b>ΔI0 = {@${diVar}@}</b> (milliards d'euros) est injectée dans une économie où la propension marginale à consommer vaut <b>c = {@${cVar}@}</b>.</p>`;
  var qFrag = `<p>Calcule la variation totale de production ΔY engendrée par cette relance.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'multiplicateur keynésien correct', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : chaque euro dépensé relance à son tour une consommation induite, tour après tour, ce qui donne au total \\( \\Delta Y = \\dfrac{\\Delta I_0}{1-c} \\) (multiplicateur keynésien \\( k = \\frac{1}{1-c} \\)).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'oubli du « 1 - » au dénominateur', answertest: 'AlgEquiv', sans: ans, tans: errcVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Le multiplicateur keynésien vaut \\( \\frac{1}{1-c} \\), pas \\( \\frac{1}{c} \\) : il te manque le « 1 - » au dénominateur.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'seul le premier tour de relance est compté', answertest: 'AlgEquiv', sans: ans, tans: erroneroundVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Tu n'as calculé que l'effet du premier tour de relance (la consommation induite immédiate \\( c \\times \\Delta I_0 \\)) : il faut cumuler tous les tours de dépense successifs, ce qui donne au total le multiplicateur \\( \\frac{1}{1-c} \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. Reprends la formule du multiplicateur keynésien : \\( \\Delta Y = \\dfrac{\\Delta I_0}{1-c} \\).</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Une relance autonome de la demande \\( \\Delta I_0 \\) engendre une consommation induite à chaque tour de dépense, dans un rapport égal à la propension marginale à consommer \\( c \\). La somme de tous ces tours (série géométrique de raison \\( c \\)) donne le multiplicateur keynésien : \\( \\Delta Y = \\Delta I_0 \\times \\left(1 + c + c^2 + \\dots\\right) = \\dfrac{\\Delta I_0}{1-c} \\).</p>`,
    p.fbGen));

  return {
    type: 'multiplicateur', bareme, vars, qnote: `dY={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genMultiplicateur: genMultiplicateur, genMultiplicateurCore: genMultiplicateurCore };
}
