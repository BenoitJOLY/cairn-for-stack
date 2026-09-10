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

// ── XML GENERATOR: nernst (SVT, potentiel de repos — équation de Nernst) ──
// Onzième type SVT de l'app, gabarit suivi : js/gen-chi2.js — une seule
// sous-question (calcul du potentiel d'équilibre du potassium), avec un PRT à
// 2 nœuds diagnostiquant le piège classique : concentrations extra/intracellulaires
// inversées (signe positif au lieu de négatif). Cf. svt-11-nernst.xml (gabarit
// hand-XML déjà validé). Helper Maxima pur : js/gen-nernst-calc.js.

function _nstBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('nst-bareme')) || 1,
    context: {
      intro: richVal('nst-intro')
    },
    grandeurs: {
      kextList: gs('nst-kextlist').trim() || '3,4,5,6',
      kintList: gs('nst-kintlist').trim() || '120,130,140,150,155'
    },
    fbGen: richVal('nst-fbgen')
  };
}

async function genNernst(X) {
  var p = _nstBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'nernst', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "nernst", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "nernst", repli sur le calcul local.', e); }
  return genNernstCore(X, p);
}

/* genNernstCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js pour le
   pattern deps injectables (test/unit/gen-nernst.test.js). */
function genNernstCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var nstVars_D = deps._nstVars || _nstVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = nstVars_D(X, p, {}) + '\n';

  var kExtVar = `q${X}_nst_kext`, kIntVar = `q${X}_nst_kint`;
  var eCorrectVar = `q${X}_nst_ecorrect`, errInvertedVar = `q${X}_nst_errinverted`;
  var ans = `ans_nst${X}`;

  var HDR = `<div style="background:#6366f1;border-left:5px solid #3730a3;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('nst.title')}</strong> <span style="background:#3730a3;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un neurone présente les concentrations en ions potassium K<sup>+</sup> suivantes : <b>[K<sup>+</sup>]<sub>extracellulaire</sub> = {@${kExtVar}@} mM</b> et <b>[K<sup>+</sup>]<sub>intracellulaire</sub> = {@${kIntVar}@} mM</b>.</p>`;
  var qFrag = `<p>À l'aide de l'équation de Nernst simplifiée \\( E_K = 60 \\times \\log_{10}\\!\\left(\\dfrac{[K^+]_{ext}}{[K^+]_{int}}\\right) \\) (en mV), calcule le potentiel d'équilibre du potassium.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: eCorrectVar, boxsize: 20, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'potentiel correct (négatif)', answertest: 'AlgEquiv', sans: ans, tans: eCorrectVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : \\( E_K = 60 \\times \\log_{10}(C_{ext}/C_{int}) \\), un potentiel de repos négatif.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'concentrations intra/extra inversées (signe positif)', answertest: 'AlgEquiv', sans: ans, tans: errInvertedVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Un potentiel de repos est normalement négatif. As-tu bien placé la concentration intra et extracellulaire ? Le rapport doit être \\( C_{ext}/C_{int} \\), pas l'inverse.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Utilise \\( E_K = 60 \\times \\log_{10}(C_{ext}/C_{int}) \\) avec les concentrations extra- et intracellulaires données.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>\\( E_K = 60 \\times \\log_{10}(C_{ext}/C_{int}) \\). Comme le potassium est bien plus concentré à l'intérieur de la cellule, le rapport \\( C_{ext}/C_{int} \\) est inférieur à 1, donc son logarithme est négatif : un potentiel de repos est physiologiquement négatif.</p>`,
    p.fbGen));

  return {
    type: 'nernst', bareme, vars, qnote: `E_K={@${eCorrectVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genNernst: genNernst, genNernstCore: genNernstCore };
}
