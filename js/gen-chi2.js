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

// ── XML GENERATOR: chi2 (SVT, test du χ² en écologie) ──
// Neuvième type SVT de l'app, gabarit suivi : js/gen-malthus.js — une seule
// sous-question (calcul du χ²), avec un PRT à 2 nœuds diagnostiquant le piège
// classique : division par l'effectif observé O au lieu de l'effectif
// théorique T. Cf. svt-09-chi2-ecologie.xml (gabarit hand-XML déjà validé).
// Helper Maxima pur : js/gen-chi2-calc.js.

function _chiBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('chi-bareme')) || 1,
    context: {
      intro: richVal('chi-intro')
    },
    grandeurs: {
      nList: gs('chi-nlist').trim() || '100,200',
      dList: gs('chi-dlist').trim() || '2,4,6,8',
      eList: gs('chi-elist').trim() || '1,2,3'
    },
    fbGen: richVal('chi-fbgen')
  };
}

async function genChi2(X) {
  var p = _chiBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chi2', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "chi2", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "chi2", repli sur le calcul local.', e); }
  return genChi2Core(X, p);
}

/* genChi2Core : fonction pure (aucun accès DOM) — voir js/gen-malthus.js pour le
   pattern deps injectables (test/unit/gen-chi2.test.js). */
function genChi2Core(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var chiVars_D = deps._chiVars || _chiVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = chiVars_D(X, p, {}) + '\n';

  var nTotalVar = `q${X}_chi_ntotal`;
  var o1 = `q${X}_chi_o1`, o2 = `q${X}_chi_o2`, o3 = `q${X}_chi_o3`, o4 = `q${X}_chi_o4`;
  var t1 = `q${X}_chi_t1`, t2 = `q${X}_chi_t2`, t3 = `q${X}_chi_t3`, t4 = `q${X}_chi_t4`;
  var chi2Var = `q${X}_chi_chi2`, errWrongDenomVar = `q${X}_chi_errwrongdenom`;
  var ans = `ans_chi${X}`;

  var HDR = `<div style="background:#4c1d95;border-left:5px solid #2e1065;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('chi.title')}</strong> <span style="background:#2e1065;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>On souhaite vérifier si la répartition observée de 4 espèces dans un milieu correspond au modèle théorique attendu (40% / 30% / 20% / 10%), sur un échantillon total de <b>{@${nTotalVar}@} individus</b> :</p>
<table border="1" cellpadding="4">
<tr><th>Espèce</th><th>Effectif observé O</th><th>Effectif théorique T</th></tr>
<tr><td>A</td><td>{@${o1}@}</td><td>{@${t1}@}</td></tr>
<tr><td>B</td><td>{@${o2}@}</td><td>{@${t2}@}</td></tr>
<tr><td>C</td><td>{@${o3}@}</td><td>{@${t3}@}</td></tr>
<tr><td>D</td><td>{@${o4}@}</td><td>{@${t4}@}</td></tr>
</table>`;
  var qFrag = `<p>Calcule la valeur du χ² pour cette répartition.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: chi2Var, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'χ² correct', answertest: 'AlgEquiv', sans: ans, tans: chi2Var,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : tu as construit et évalué la bonne formule statistique.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'division par O au lieu de T', answertest: 'AlgEquiv', sans: ans, tans: errWrongDenomVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Attention, tu as divisé par l'effectif <b>observé</b> (O) dans chaque terme, alors qu'il faut diviser par l'effectif <b>théorique</b> (T) : \\( \\chi^2 = \\sum (O-T)^2/T \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Pour chaque espèce, calcule \\( (O-T)^2/T \\), puis fais la somme des 4 termes.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>\\( \\chi^2 = \\sum \\dfrac{(O-T)^2}{T} \\) — on divise toujours par l'effectif <b>théorique</b> T (jamais par l'effectif observé O).</p>`,
    p.fbGen));

  return {
    type: 'chi2', bareme, vars, qnote: `chi2={@${chi2Var}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genChi2: genChi2, genChi2Core: genChi2Core };
}
