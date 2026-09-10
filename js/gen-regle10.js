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

// ── XML GENERATOR: regle10 (SVT, règle du 10% — pyramides de biomasse) ──
// Huitième type SVT de l'app, gabarit suivi : js/gen-radiochronologie.js pour le
// découpage en 2 sous-questions, mais SANS cascade diagnostique de piège classique
// (le gabarit hand-XML svt-08-regle-10pourcent.xml ne teste qu'un seul nœud par
// PRT) : a) biomasse atteinte à un niveau trophique donné ; b) nombre maximal de
// niveaux trophiques supplémentaires supportables par une population donnée.
// Helper Maxima pur : js/gen-regle10-calc.js.

function _regBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('reg-bareme')) || 2,
    context: {
      intro: richVal('reg-intro')
    },
    grandeurs: {
      b0List: gs('reg-b0list').trim() || '5000,10000,20000,50000',
      nPartAList: gs('reg-npartalist').trim() || '2,3,4',
      kList: gs('reg-klist').trim() || '1,2,3',
      mList: gs('reg-mlist').trim() || '1/5,3/10,2/5,1/2,3/5,7/10,4/5,9/10,1'
    },
    fbGen: richVal('reg-fbgen')
  };
}

async function genRegle10(X) {
  var p = _regBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'regle10', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "regle10", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "regle10", repli sur le calcul local.', e); }
  return genRegle10Core(X, p);
}

/* genRegle10Core : fonction pure (aucun accès DOM) — voir js/gen-radiochronologie.js
   pour le pattern deps injectables (test/unit/gen-regle10.test.js). */
function genRegle10Core(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var regVars_D = deps._regVars || _regVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 2;

  var vars = regVars_D(X, p, {}) + '\n';

  var b0Var = `q${X}_reg_b0`, nPartAVar = `q${X}_reg_npartA`, bNeedVar = `q${X}_reg_bneed`;
  var biomasseAVar = `q${X}_reg_biomassea`, nMaxVar = `q${X}_reg_nmax`;
  var ans1 = `ans_reg1_${X}`, ans2 = `ans_reg2_${X}`;
  var stepBareme = +(bareme / 2).toFixed(7);

  var HDR = `<div style="background:#065f46;border-left:5px solid #022c22;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('reg.title')}</strong> <span style="background:#022c22;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un écosystème produit <b>{@${b0Var}@} kg</b> de biomasse de phytoplancton (niveau trophique 1). On admet la règle du 10% : seuls 10% de la biomasse d'un niveau trophique sont transférés au niveau trophique supérieur.</p>`;
  var qaFrag = `<p>a) Quelle biomasse atteint le prédateur situé au <b>{@${nPartAVar}@}<sup>e</sup> niveau trophique</b> (le phytoplancton étant le niveau 1) ?<br/>[[input:${ans1}]] [[validation:${ans1}]]</p>`;
  var qbFrag = `<p>b) Une population de prédateurs a besoin de <b>{@${bNeedVar}@} kg</b> de nourriture par an pour subsister. Combien de niveaux trophiques supplémentaires cette chaîne alimentaire peut-elle supporter au maximum à partir du phytoplancton ?<br/>[[input:${ans2}]] [[validation:${ans2}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qaFrag + qbFrag;

  var inputXML = [
    mkInput_D({ name: ans1, type: 'algebraic', tans: biomasseAVar, boxsize: 15, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 }),
    mkInput_D({ name: ans2, type: 'algebraic', tans: nMaxVar, boxsize: 15, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 })
  ].join('\n');

  var nodeA0 = {
    name: '0', description: 'biomasse correcte', answertest: 'AlgEquiv', sans: ans1, tans: biomasseAVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}a-0-T`, truefeedback: `<p>Correct : \\( B_0 \\times 0.1^n \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}a-0-F`, falsefeedback: `<p>Incorrect. Applique la règle du 10% une fois par transfert de niveau trophique : \\( B_0 \\times 0.1^n \\), où <i>n</i> est le nombre de transferts depuis le phytoplancton.</p>`
  };
  var nodeB0 = {
    name: '0', description: 'nombre de niveaux correct', answertest: 'AlgEquiv', sans: ans2, tans: nMaxVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}b-0-T`, truefeedback: `<p>Correct.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}b-0-F`, falsefeedback: `<p>Incorrect. Pose l'inégalité \\( B_0 \\times 0.1^n \\geq B_{besoin} \\) et résous en <i>n</i> à l'aide d'un logarithme : \\( n_{max} = \\lfloor \\log(B_{besoin}/B_0)/\\log(0.1) \\rfloor \\).</p>`
  };

  var prtAMeta = { name: `prt${X}a`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtBMeta = { name: `prt${X}b`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNodeA0 = Object.assign({}, nodeA0, { truefeedback: applyFbBox_D('true', nodeA0.truefeedback), falsefeedback: applyFbBox_D('false', nodeA0.falsefeedback) });
  var xmlNodeB0 = Object.assign({}, nodeB0, { truefeedback: applyFbBox_D('true', nodeB0.truefeedback), falsefeedback: applyFbBox_D('false', nodeB0.falsefeedback) });

  var prtXML = [
    buildPrtXml_D(prtAMeta, [xmlNodeA0]),
    buildPrtXml_D(prtBMeta, [xmlNodeB0])
  ].join('\n\n');

  var allPrts = [
    { meta: prtAMeta, nodes: [nodeA0] },
    { meta: prtBMeta, nodes: [nodeB0] }
  ];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Biomasse au niveau <i>n</i> : \\( B_n = B_0 \\times 0.1^n \\) (avec <i>n</i> le nombre de transferts depuis le niveau 1). Nombre maximal de niveaux supportables sachant le besoin \\( B_{besoin} \\) : \\( n_{max} = \\lfloor \\log(B_{besoin}/B_0)/\\log(0.1) \\rfloor \\).</p>`,
    p.fbGen));

  return {
    type: 'regle10', bareme, vars, qnote: `Ba={@${biomasseAVar}@} nmax={@${nMaxVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtAMeta.name}]] [[feedback:${prtBMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genRegle10: genRegle10, genRegle10Core: genRegle10Core };
}
