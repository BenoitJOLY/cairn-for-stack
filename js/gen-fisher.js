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

// ── XML GENERATOR: fisher (Économie) ──
// Gabarit suivi : js/gen-bilanpuissance.js — une seule sous-question (taux
// de croissance nominale à partir du taux de croissance réelle et du taux
// d'inflation, relation de Fisher), avec un PRT à cascade de 3 nœuds
// diagnostiquant deux pièges classiques : approximation additive (terme
// croisé négligé), et confusion avec l'indice (oubli de soustraire 100).
// Helper Maxima pur : js/gen-fisher-calc.js.

function _fisBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('fis-bareme')) || 1,
    context: {
      intro: richVal('fis-intro')
    },
    grandeurs: {
      grList: gs('fis-grlist').trim() || '1,3/2,2,5/2,3,7/2',
      piList: gs('fis-pilist').trim() || '1,3/2,2,5/2,3,7/2'
    },
    fbGen: richVal('fis-fbgen')
  };
}

async function genFisher(X) {
  var p = _fisBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'fisher', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "fisher", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "fisher", repli sur le calcul local.', e); }
  return genFisherCore(X, p);
}

/* genFisherCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-fisher.test.js). */
function genFisherCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var fisVars_D = deps._fisVars || _fisVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = fisVars_D(X, p, {}) + '\n';

  var grVar = `q${X}_fis_gr`, piVar = `q${X}_fis_pi`;
  var tansVar = `q${X}_fis_tans`, errsumVar = `q${X}_fis_errsum`, errindiceVar = `q${X}_fis_errindice`;
  var ans = `ans_fis${X}`;

  var HDR = `<div style="background:#92400e;border-left:5px solid #451a03;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('fis.title')}</strong> <span style="background:#451a03;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Une économie connaît un taux de croissance réelle <b>gr = {@${grVar}@} %</b> et un taux d'inflation <b>π = {@${piVar}@} %</b> sur la même période.</p>`;
  var qFrag = `<p>Calcule le taux de croissance nominale gn (en %) de cette économie.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'taux de croissance nominale correct', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : la relation de Fisher est multiplicative, \\( 1+g_n = (1+g_r)(1+\\pi) \\) (ici exprimée en %), soit \\( g_n = \\dfrac{(100+g_r)(100+\\pi)}{100} - 100 \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'approximation additive (terme croisé négligé)', answertest: 'AlgEquiv', sans: ans, tans: errsumVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>L'approximation additive \\( g_n \\approx g_r + \\pi \\) néglige le terme croisé \\( \\frac{g_r \\times \\pi}{100} \\) : la relation exacte est multiplicative, \\( (1+g_r)(1+\\pi) = 1+g_n \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'confusion avec l\'indice (oubli de soustraire 100)', answertest: 'AlgEquiv', sans: ans, tans: errindiceVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Tu as calculé l'indice \\( \\frac{(100+g_r)(100+\\pi)}{100} \\), pas le taux de croissance nominale : il ne faut pas oublier de soustraire 100 à la fin.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. Reprends la relation de Fisher : \\( g_n = \\dfrac{(100+g_r)(100+\\pi)}{100} - 100 \\).</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>La relation de Fisher relie de façon multiplicative les taux de croissance nominale, réelle et d'inflation : \\( (1+g_n) = (1+g_r)(1+\\pi) \\). En pourcentages, cela donne \\( g_n = \\dfrac{(100+g_r)(100+\\pi)}{100} - 100 = g_r + \\pi + \\dfrac{g_r \\times \\pi}{100} \\) — l'approximation usuelle \\( g_n \\approx g_r + \\pi \\) néglige le dernier terme, souvent faible.</p>`,
    p.fbGen));

  return {
    type: 'fisher', bareme, vars, qnote: `gn={@${tansVar}@}%`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genFisher: genFisher, genFisherCore: genFisherCore };
}
