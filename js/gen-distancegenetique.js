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

// ── XML GENERATOR: distancegenetique (SVT, génétique — distance génétique test-cross) ──
// Troisième type SVT de l'app, gabarit suivi : js/gen-croisements.js. Toujours 2
// sous-questions : a) taux de recombinaison observé (PRT simple) ; b) distance génétique
// en centiMorgans (PRT à 2 nœuds en cascade diagnostiquant l'oubli classique de
// conversion : rendre le taux de recombinaison brut au lieu de le multiplier par 100,
// cf. err_forgot_convert dans svt-03-distance-genetique.xml, gabarit hand-XML déjà
// validé). Helper Maxima pur : js/gen-distancegenetique-calc.js.

function _dgBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('dg-bareme')) || 2,
    context: {
      intro: richVal('dg-intro')
    },
    grandeurs: {
      nList: gs('dg-nlist').trim() || '1000,2000',
      rpctList: gs('dg-rpctlist').trim() || '4,6,8,10,12,14,16,18,20,22,24'
    },
    fbGen: richVal('dg-fbgen')
  };
}

async function genDistanceGenetique(X) {
  var p = _dgBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'distancegenetique', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "distancegenetique", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "distancegenetique", repli sur le calcul local.', e); }
  return genDistanceGenetiqueCore(X, p);
}

/* genDistanceGenetiqueCore : fonction pure (aucun accès DOM) — voir js/gen-croisements.js
   pour le pattern deps injectables (test/unit/gen-distancegenetique.test.js). */
function genDistanceGenetiqueCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var dgVars_D = deps._dgVars || _dgVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 2;

  var vars = dgVars_D(X, p, {}) + '\n';

  var nVar = `q${X}_dg_ntotal`, parentalHalfVar = `q${X}_dg_parentalhalf`, recombHalfVar = `q${X}_dg_recombhalf`;
  var tauxVar = `q${X}_dg_tauxrecomb`, distVar = `q${X}_dg_distancecm`, errForgotVar = `q${X}_dg_errforgot`;
  var ansTaux = `ans_dga${X}`, ansDist = `ans_dgd${X}`;
  var stepBareme = +(bareme / 2).toFixed(7);

  var HDR = `<div style="background:#9d174d;border-left:5px solid #831843;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('dg.title')}</strong> <span style="background:#831843;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un test-cross entre deux gènes liés donne la répartition phénotypique suivante sur la descendance :</p>
<table border="1" cellpadding="4">
<tr><th>Phénotype</th><th>Effectif</th></tr>
<tr><td>Parental type 1</td><td>{@${parentalHalfVar}@}</td></tr>
<tr><td>Parental type 2</td><td>{@${parentalHalfVar}@}</td></tr>
<tr><td>Recombinant type 1</td><td>{@${recombHalfVar}@}</td></tr>
<tr><td>Recombinant type 2</td><td>{@${recombHalfVar}@}</td></tr>
<tr><td><b>Total</b></td><td><b>{@${nVar}@}</b></td></tr>
</table>`;
  var tauxFrag = `<p>a) Quel est le taux de recombinaison observé entre ces deux gènes ?<br/>[[input:${ansTaux}]] [[validation:${ansTaux}]]</p>`;
  var distFrag = `<p>b) Quelle est la distance génétique entre ces deux gènes, exprimée en centiMorgans (cM) ?<br/>[[input:${ansDist}]] [[validation:${ansDist}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + tauxFrag + distFrag;

  var inputXML = [
    mkInput_D({ name: ansTaux, tans: tauxVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 }),
    mkInput_D({ name: ansDist, tans: distVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 })
  ].join('\n');

  var nodeTaux = {
    name: '0', description: 'taux correct', answertest: 'AlgEquiv', sans: ansTaux, tans: tauxVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}taux-0-T`, truefeedback: `<p>Correct.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}taux-0-F`, falsefeedback: `<p>Incorrect. Le taux de recombinaison est le rapport (effectifs recombinants)/(effectif total).</p>`
  };
  var nodeDist0 = {
    name: '0', description: 'distance cM correcte', answertest: 'AlgEquiv', sans: ansDist, tans: distVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}dist-0-T`, truefeedback: `<p>Correct : 1% de recombinaison = 1 cM.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}dist-0-F`, falsefeedback: ''
  };
  var nodeDist1 = {
    name: '1', description: 'oubli de conversion en cM', answertest: 'AlgEquiv', sans: ansDist, tans: errForgotVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}dist-1-T`, truefeedback: `<p>Ton calcul est juste, mais tu as redonné le taux de recombinaison (sans unité), pas la distance génétique. Multiplie ce taux par 100 pour l'exprimer en centiMorgans.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}dist-1-F`, falsefeedback: `<p>Incorrect. La distance en cM s'obtient en multipliant le taux de recombinaison par 100.</p>`
  };

  var prtTauxMeta = { name: `prt${X}taux`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtDistMeta = { name: `prt${X}dist`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNodeTaux = Object.assign({}, nodeTaux, { truefeedback: applyFbBox_D('true', nodeTaux.truefeedback), falsefeedback: applyFbBox_D('false', nodeTaux.falsefeedback) });
  var xmlNodeDist0 = Object.assign({}, nodeDist0, { truefeedback: applyFbBox_D('true', nodeDist0.truefeedback) });
  var xmlNodeDist1 = Object.assign({}, nodeDist1, { truefeedback: applyFbBox_D('false', nodeDist1.truefeedback), falsefeedback: applyFbBox_D('false', nodeDist1.falsefeedback) });

  var prtXML = [
    buildPrtXml_D(prtTauxMeta, [xmlNodeTaux]),
    buildPrtXml_D(prtDistMeta, [xmlNodeDist0, xmlNodeDist1])
  ].join('\n\n');

  var allPrts = [
    { meta: prtTauxMeta, nodes: [nodeTaux] },
    { meta: prtDistMeta, nodes: [nodeDist0, nodeDist1] }
  ];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Le taux de recombinaison est le rapport (effectifs recombinants)/(effectif total). La distance génétique en centiMorgans se lit en multipliant ce taux par 100 : 1% de recombinaison correspond conventionnellement à 1 cM.</p>`,
    p.fbGen));

  return {
    type: 'distancegenetique', bareme, vars, qnote: `taux={@${tauxVar}@}`,
    textFrag, inputXML, prtXML,
    // Même limitation MVP que "hardyweinberg"/"croisements" : prt-manager.js n'affiche
    // que le 1er PRT dans l'éditeur d'arbre. Le XML exporté contient bien les 2 PRTs.
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtTauxMeta.name}]] [[feedback:${prtDistMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genDistanceGenetique: genDistanceGenetique, genDistanceGenetiqueCore: genDistanceGenetiqueCore };
}
