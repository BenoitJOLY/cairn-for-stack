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

// ── XML GENERATOR: elasticite (Économie) ──
// Gabarit suivi : js/gen-bilanpuissance.js — une seule sous-question
// (élasticité-prix de la demande), avec un PRT à cascade de 3 nœuds
// diagnostiquant deux pièges classiques : rapport inversé, et variations
// absolues utilisées au lieu des variations relatives. Helper Maxima pur :
// js/gen-elasticite-calc.js.

function _elaBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('ela-bareme')) || 1,
    context: {
      intro: richVal('ela-intro')
    },
    grandeurs: {
      p0List: gs('ela-p0list').trim() || '10,20,50,100',
      p1List: gs('ela-p1list').trim() || '12,25,55,110',
      q0List: gs('ela-q0list').trim() || '1000,2000,500,800',
      q1List: gs('ela-q1list').trim() || '900,1600,420,680'
    },
    fbGen: richVal('ela-fbgen')
  };
}

async function genElasticite(X) {
  var p = _elaBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'elasticite', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "elasticite", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "elasticite", repli sur le calcul local.', e); }
  return genElasticiteCore(X, p);
}

/* genElasticiteCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-elasticite.test.js). */
function genElasticiteCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var elaVars_D = deps._elaVars || _elaVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = elaVars_D(X, p, {}) + '\n';

  var p0Var = `q${X}_ela_p0`, p1Var = `q${X}_ela_p1`, q0Var = `q${X}_ela_q0`, q1Var = `q${X}_ela_q1`;
  var tansVar = `q${X}_ela_tans`, errinvVar = `q${X}_ela_errinv`, errabsVar = `q${X}_ela_errabs`;
  var ans = `ans_ela${X}`;

  var HDR = `<div style="background:#a21caf;border-left:5px solid #701a75;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('ela.title')}</strong> <span style="background:#701a75;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Le prix d'un bien passe de <b>P0 = {@${p0Var}@}</b> à <b>P1 = {@${p1Var}@}</b>, et la quantité demandée passe de <b>Q0 = {@${q0Var}@}</b> à <b>Q1 = {@${q1Var}@}</b>.</p>`;
  var qFrag = `<p>Calcule l'élasticité-prix de la demande.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'élasticité-prix correcte', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : l'élasticité-prix de la demande rapporte la variation relative de la quantité demandée à la variation relative du prix : \\( e = \\dfrac{\\Delta Q / Q_0}{\\Delta P / P_0} \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'rapport inversé', answertest: 'AlgEquiv', sans: ans, tans: errinvVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Tu as inversé le rapport : l'élasticité-prix de la demande est la variation relative de la <b>quantité</b> rapportée à la variation relative du <b>prix</b>, pas l'inverse.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'variations absolues au lieu de relatives', answertest: 'AlgEquiv', sans: ans, tans: errabsVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Il manque la normalisation par les valeurs initiales : l'élasticité se calcule à partir des variations <b>relatives</b> \\( \\Delta Q / Q_0 \\) et \\( \\Delta P / P_0 \\), pas à partir des variations absolues \\( \\Delta Q \\) et \\( \\Delta P \\) seules.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. Reprends la formule de l'élasticité-prix de la demande : \\( e = \\dfrac{\\Delta Q / Q_0}{\\Delta P / P_0} \\).</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>L'élasticité-prix de la demande mesure la sensibilité de la quantité demandée à une variation du prix : \\( e = \\dfrac{\\Delta Q / Q_0}{\\Delta P / P_0} \\), où \\( \\Delta Q = Q_1 - Q_0 \\) et \\( \\Delta P = P_1 - P_0 \\). Une demande est dite élastique si \\( |e| > 1 \\).</p>`,
    p.fbGen));

  return {
    type: 'elasticite', bareme, vars, qnote: `e={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genElasticite: genElasticite, genElasticiteCore: genElasticiteCore };
}
