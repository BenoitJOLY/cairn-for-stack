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

// ── XML GENERATOR: malthus (SVT, croissance exponentielle) ──
// Septième type SVT de l'app, gabarit suivi : js/gen-ondesismique.js — une seule
// sous-question (population finale N_t = N0 * q^t), avec un PRT à 2 nœuds
// diagnostiquant le piège classique : erreur d'une période (t-1 au lieu de t).
// Cf. svt-07-malthus.xml (gabarit hand-XML déjà validé). Helper Maxima pur :
// js/gen-malthus-calc.js.

function _malBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('mal-bareme')) || 1,
    context: {
      intro: richVal('mal-intro')
    },
    grandeurs: {
      n0List: gs('mal-n0list').trim() || '200,500,1000,2000',
      qList: gs('mal-qlist').trim() || '2,3',
      tList: gs('mal-tlist').trim() || '10,12,15,18,20'
    },
    fbGen: richVal('mal-fbgen')
  };
}

async function genMalthus(X) {
  var p = _malBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'malthus', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "malthus", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "malthus", repli sur le calcul local.', e); }
  return genMalthusCore(X, p);
}

/* genMalthusCore : fonction pure (aucun accès DOM) — voir js/gen-ondesismique.js
   pour le pattern deps injectables (test/unit/gen-malthus.test.js). */
function genMalthusCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var malVars_D = deps._malVars || _malVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = malVars_D(X, p, {}) + '\n';

  var n0Var = `q${X}_mal_n0`, qVar = `q${X}_mal_q`, tVar = `q${X}_mal_t`;
  var nFinalVar = `q${X}_mal_nfinal`, errOffByOneVar = `q${X}_mal_erroffbyone`, tMinus1Var = `q${X}_mal_tminus1`;
  var ans = `ans_mal${X}`;

  var HDR = `<div style="background:#a16207;border-left:5px solid #713f12;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('mal.title')}</strong> <span style="background:#713f12;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Une population de levures voit son effectif multiplié par <b>{@${qVar}@}</b> toutes les heures. On part d'une population initiale de <b>{@${n0Var}@} individus</b>.</p>`;
  var qFrag = `<p>Quelle est la taille de la population après <b>{@${tVar}@} heures</b> ?<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: nFinalVar, boxsize: 15, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'population correcte', answertest: 'AlgEquiv', sans: ans, tans: nFinalVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : \\( N_t = N_0 \\times q^t \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: "erreur d'une période (t-1 au lieu de t)", answertest: 'AlgEquiv', sans: ans, tans: errOffByOneVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Ton calcul est cohérent avec une durée de {@${tMinus1Var}@}h, mais l'énoncé indique {@${tVar}@}h — as-tu bien compté le bon nombre de périodes écoulées ?</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Utilise \\( N_t = N_0 \\times q^t \\) avec le nombre de périodes écoulées indiqué dans l'énoncé.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Modèle de croissance exponentielle (suite géométrique) : \\( N_t = N_0 \\times q^t \\), où <i>q</i> est le facteur multiplicatif par période et <i>t</i> le nombre de périodes écoulées.</p>`,
    p.fbGen));

  return {
    type: 'malthus', bareme, vars, qnote: `Nt={@${nFinalVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genMalthus: genMalthus, genMalthusCore: genMalthusCore };
}
