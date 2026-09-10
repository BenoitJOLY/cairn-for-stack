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

// ── XML GENERATOR: horlogemoleculaire (SVT, phylogénie — horloge moléculaire) ──
// Quatrième type SVT de l'app, gabarit suivi : js/gen-distancegenetique.js. Toujours 2
// sous-questions : a) expression littérale de la date de divergence T (input algebraic,
// symboles libres nbdiff/mu/long_seq, non préfixés : ce sont des noms génériques que
// l'élève doit utiliser tels quels, pas des variables Maxima assignées) ; b) valeur
// numérique de T. Chaque sous-question a un PRT à 2 nœuds diagnostiquant le même piège
// classique : l'oubli du facteur 2 (mutations accumulées indépendamment dans les DEUX
// lignées depuis la divergence), cf. svt-04-horloge-moleculaire.xml (gabarit hand-XML
// déjà validé). Helper Maxima pur : js/gen-horlogemoleculaire-calc.js.

function _hmBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('hm-bareme')) || 2,
    context: {
      intro: richVal('hm-intro')
    },
    grandeurs: {
      seqList: gs('hm-seqlist').trim() || '1000,2000,5000',
      tauxList: gs('hm-tauxlist').trim() || '1,2,4,5,8',
      dpctList: gs('hm-dpctlist').trim() || '1,2,3,4,5,6,8,10'
    },
    fbGen: richVal('hm-fbgen')
  };
}

async function genHorlogeMoleculaire(X) {
  var p = _hmBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'horlogemoleculaire', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "horlogemoleculaire", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "horlogemoleculaire", repli sur le calcul local.', e); }
  return genHorlogeMoleculaireCore(X, p);
}

/* genHorlogeMoleculaireCore : fonction pure (aucun accès DOM) — voir js/gen-distancegenetique.js
   pour le pattern deps injectables (test/unit/gen-horlogemoleculaire.test.js). */
function genHorlogeMoleculaireCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var hmVars_D = deps._hmVars || _hmVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 2;

  var vars = hmVars_D(X, p, {}) + '\n';

  var seqVar = `q${X}_hm_seqval`, tauxAVar = `q${X}_hm_tauxa`, diffVar = `q${X}_hm_diffval`;
  var taFormulaVar = `q${X}_hm_taformula`, errNo2FormulaVar = `q${X}_hm_errno2formula`;
  var tValVar = `q${X}_hm_tval`, errNo2ValVar = `q${X}_hm_errno2val`;
  var ansFormula = `ans_hmf${X}`, ansVal = `ans_hmv${X}`;
  var stepBareme = +(bareme / 2).toFixed(7);

  var HDR = `<div style="background:#78350f;border-left:5px solid #451a03;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('hm.title')}</strong> <span style="background:#451a03;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>On compare une séquence homologue de <b>{@${seqVar}@} paires de bases</b> chez deux espèces. On dénombre <b>{@${diffVar}@}</b> nucléotides différents entre les deux séquences. Le taux de mutation neutre de ce gène est estimé à <b>{@${tauxAVar}@} &times; 10<sup>-9</sup></b> substitutions par site et par an (noté <i>mu</i>).</p>
<p>On note <i>nbdiff</i> le nombre de nucléotides différents, <i>long_seq</i> la longueur de la séquence comparée, et <i>mu</i> le taux de mutation par site et par an. Les mutations s'accumulent indépendamment dans les deux lignées depuis leur divergence.</p>`;
  var formulaFrag = `<p>a) Écris l'expression littérale de la date de divergence <i>T</i> (en années) en fonction de <i>nbdiff</i>, <i>long_seq</i> et <i>mu</i>.<br/>[[input:${ansFormula}]] [[validation:${ansFormula}]]</p>`;
  var valFrag = `<p>b) Calcule la valeur numérique de cette date de divergence <i>T</i>, en années.<br/>[[input:${ansVal}]] [[validation:${ansVal}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + formulaFrag + valFrag;

  var inputXML = [
    mkInput_D({ name: ansFormula, type: 'algebraic', tans: taFormulaVar, boxsize: 20, strictsyntax: 1, insertstars: 0, allowwords: 'nbdiff,mu,long_seq', forbidfloat: 0, checkanswertype: 1, mustverify: 1, showvalidation: 2 }),
    mkInput_D({ name: ansVal, type: 'numerical', tans: tValVar, boxsize: 15, forbidfloat: 0, mustverify: 0, showvalidation: 0 })
  ].join('\n');

  var nodeFormula0 = {
    name: '0', description: 'formule correcte', answertest: 'AlgEquiv', sans: ansFormula, tans: taFormulaVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}form-0-T`, truefeedback: `<p>Correct.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}form-0-F`, falsefeedback: ''
  };
  var nodeFormula1 = {
    name: '1', description: 'facteur 2 oublié (formule)', answertest: 'AlgEquiv', sans: ansFormula, tans: errNo2FormulaVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}form-1-T`, truefeedback: `<p>Il te manque le facteur 2 au dénominateur : les mutations s'accumulent indépendamment dans <b>chacune</b> des deux lignées depuis la divergence, pas dans une seule.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}form-1-F`, falsefeedback: `<p>Incorrect. La date de divergence s'obtient en isolant <i>T</i> dans nbdiff/long_seq = 2 &times; mu &times; T.</p>`
  };
  var nodeVal0 = {
    name: '0', description: 'valeur numérique correcte', answertest: 'NumRelative', sans: ansVal, tans: tValVar,
    testoptions: '0.01', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}val-0-T`, truefeedback: `<p>Correct.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}val-0-F`, falsefeedback: ''
  };
  var nodeVal1 = {
    name: '1', description: 'facteur 2 oublié (numérique)', answertest: 'NumRelative', sans: ansVal, tans: errNo2ValVar,
    testoptions: '0.01', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}val-1-T`, truefeedback: `<p>Ta valeur est exactement le double de la bonne réponse : tu as oublié de diviser par 2 (accumulation des mutations dans les deux lignées).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}val-1-F`, falsefeedback: `<p>Incorrect. Reprends la formule de a) et substitue les valeurs numériques de l'énoncé.</p>`
  };

  var prtFormMeta = { name: `prt${X}form`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtValMeta = { name: `prt${X}val`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNodeFormula0 = Object.assign({}, nodeFormula0, { truefeedback: applyFbBox_D('true', nodeFormula0.truefeedback) });
  var xmlNodeFormula1 = Object.assign({}, nodeFormula1, { truefeedback: applyFbBox_D('false', nodeFormula1.truefeedback), falsefeedback: applyFbBox_D('false', nodeFormula1.falsefeedback) });
  var xmlNodeVal0 = Object.assign({}, nodeVal0, { truefeedback: applyFbBox_D('true', nodeVal0.truefeedback) });
  var xmlNodeVal1 = Object.assign({}, nodeVal1, { truefeedback: applyFbBox_D('false', nodeVal1.truefeedback), falsefeedback: applyFbBox_D('false', nodeVal1.falsefeedback) });

  var prtXML = [
    buildPrtXml_D(prtFormMeta, [xmlNodeFormula0, xmlNodeFormula1]),
    buildPrtXml_D(prtValMeta, [xmlNodeVal0, xmlNodeVal1])
  ].join('\n\n');

  var allPrts = [
    { meta: prtFormMeta, nodes: [nodeFormula0, nodeFormula1] },
    { meta: prtValMeta, nodes: [nodeVal0, nodeVal1] }
  ];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>La proportion de différences observée D = nbdiff/long_seq résulte de mutations accumulées <b>indépendamment dans chacune des deux lignées</b> depuis la divergence, d'où le facteur 2 : D = 2 &times; mu &times; T, soit T = nbdiff/(2 &times; mu &times; long_seq).</p>`,
    p.fbGen));

  return {
    type: 'horlogemoleculaire', bareme, vars, qnote: `T={@${tValVar}@}`,
    textFrag, inputXML, prtXML,
    // Même limitation MVP que "distancegenetique" : prt-manager.js n'affiche
    // que le 1er PRT dans l'éditeur d'arbre. Le XML exporté contient bien les 2 PRTs.
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtFormMeta.name}]] [[feedback:${prtValMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genHorlogeMoleculaire: genHorlogeMoleculaire, genHorlogeMoleculaireCore: genHorlogeMoleculaireCore };
}
