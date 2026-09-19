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

// ── XML GENERATOR: tauxvariation (Économie) ──
// Premier type Économie de l'app (nouvelle catégorie "Économie"), gabarit
// suivi : js/gen-bilanpuissance.js — une seule sous-question (taux de
// variation d'une grandeur économique entre deux dates), avec un PRT à
// cascade de 3 nœuds diagnostiquant deux pièges classiques : confusion avec
// l'indice base 100 (oubli de soustraire 100), et inversion du sens de la
// variation. Helper Maxima pur : js/gen-tauxvariation-calc.js.

function _tvaBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('tva-bareme')) || 1,
    context: {
      intro: richVal('tva-intro')
    },
    grandeurs: {
      v0List: gs('tva-v0list').trim() || '80,100,120,150,200',
      v1List: gs('tva-v1list').trim() || '88,115,138,165,220'
    },
    fbGen: richVal('tva-fbgen')
  };
}

async function genTauxvariation(X) {
  var p = _tvaBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tauxvariation', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "tauxvariation", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "tauxvariation", repli sur le calcul local.', e); }
  return genTauxvariationCore(X, p);
}

/* genTauxvariationCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-tauxvariation.test.js). */
function genTauxvariationCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var tvaVars_D = deps._tvaVars || _tvaVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = tvaVars_D(X, p, {}) + '\n';

  var v0Var = `q${X}_tva_v0`, v1Var = `q${X}_tva_v1`;
  var tansVar = `q${X}_tva_tans`, errindiceVar = `q${X}_tva_errindice`, errsignVar = `q${X}_tva_errsign`;
  var ans = `ans_tva${X}`;

  var HDR = `<div style="background:#155e75;border-left:5px solid #083344;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('tva.title')}</strong> <span style="background:#083344;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Une grandeur économique passe de la valeur <b>V0 = {@${v0Var}@}</b> à la valeur <b>V1 = {@${v1Var}@}</b> entre deux dates.</p>`;
  var qFrag = `<p>Exprime le taux de variation (en %) de cette grandeur entre les deux dates.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'taux de variation correct', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : le taux de variation rapporte la variation \\( V_1 - V_0 \\) à la valeur de départ \\( V_0 \\), puis on multiplie par 100 pour l'exprimer en pourcentage : \\( t = \\dfrac{V_1 - V_0}{V_0} \\times 100 \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'confusion avec l\'indice base 100', answertest: 'AlgEquiv', sans: ans, tans: errindiceVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Tu as calculé l'indice base 100 (\\( \\frac{V_1}{V_0} \\times 100 \\)), pas le taux de variation : il ne faut pas oublier de soustraire 100 à l'indice (ou de soustraire 1 au coefficient multiplicateur) pour obtenir le taux de variation.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'sens de la variation inversé', answertest: 'AlgEquiv', sans: ans, tans: errsignVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Tu as inversé le sens de la variation : c'est toujours la valeur de départ \\( V_0 \\) qui sert de référence au dénominateur, et \\( V_1 - V_0 \\) (arrivée moins départ) au numérateur, jamais l'inverse.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. Reprends la formule du taux de variation : \\( t = \\dfrac{V_1 - V_0}{V_0} \\times 100 \\), avec \\( V_0 \\) la valeur de départ.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Le taux de variation (en %) entre une valeur de départ \\( V_0 \\) et une valeur d'arrivée \\( V_1 \\) vaut \\( t = \\dfrac{V_1 - V_0}{V_0} \\times 100 \\). On en déduit le coefficient multiplicateur \\( CM = 1 + \\frac{t}{100} = \\frac{V_1}{V_0} \\), et l'indice base 100 \\( I = 100 \\times CM = 100 + t \\).</p>`,
    p.fbGen));

  return {
    type: 'tauxvariation', bareme, vars, qnote: `t={@${tansVar}@}%`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genTauxvariation: genTauxvariation, genTauxvariationCore: genTauxvariationCore };
}
