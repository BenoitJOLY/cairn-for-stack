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

// ── XML GENERATOR: radiochronologie (SVT, datation absolue par radiochronologie) ──
// Cinquième type SVT de l'app, gabarit suivi : js/gen-horlogemoleculaire.js. Toujours 2
// sous-questions : a) expression littérale de l'âge T (input algebraic, symboles libres
// Nfrac/lam, non préfixés : noms génériques que l'élève doit utiliser tels quels, pas des
// variables Maxima assignées) ; b) valeur numérique de T. Chaque sous-question a un PRT à
// 2 nœuds diagnostiquant le même piège classique : l'oubli du signe moins devant le
// logarithme (Nfrac < 1 donc ln(Nfrac) < 0), cf. svt-05-radiochronologie.xml (gabarit
// hand-XML déjà validé). Helper Maxima pur : js/gen-radiochronologie-calc.js.

function _rcBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('rc-bareme')) || 2,
    context: {
      intro: richVal('rc-intro')
    },
    grandeurs: {
      fracList: gs('rc-fraclist').trim() || '1/2,1/4,1/8,1/16,3/5,7/10,4/5',
      lamaList: gs('rc-lamalist').trim() || '1,2,5,8',
      lambList: gs('rc-lamblist').trim() || '4,5,6'
    },
    fbGen: richVal('rc-fbgen')
  };
}

async function genRadiochronologie(X) {
  var p = _rcBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'radiochronologie', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "radiochronologie", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "radiochronologie", repli sur le calcul local.', e); }
  return genRadiochronologieCore(X, p);
}

/* genRadiochronologieCore : fonction pure (aucun accès DOM) — voir js/gen-horlogemoleculaire.js
   pour le pattern deps injectables (test/unit/gen-radiochronologie.test.js). */
function genRadiochronologieCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var rcVars_D = deps._rcVars || _rcVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 2;

  var vars = rcVars_D(X, p, {}) + '\n';

  var nfracVar = `q${X}_rc_nfrac`, lamaVar = `q${X}_rc_lama`, lambVar = `q${X}_rc_lamb`;
  var taFormulaVar = `q${X}_rc_taformula`, errSignFormulaVar = `q${X}_rc_errsignformula`;
  var tValVar = `q${X}_rc_tval`, errSignValVar = `q${X}_rc_errsignval`;
  var ansFormula = `ans_rcf${X}`, ansVal = `ans_rcv${X}`;
  var stepBareme = +(bareme / 2).toFixed(7);

  var HDR = `<div style="background:#9a3412;border-left:5px solid #431407;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('rc.title')}</strong> <span style="background:#431407;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Dans un échantillon de roche, on mesure qu'il reste une proportion <b>Nfrac = {@${nfracVar}@}</b> de l'isotope radioactif parent par rapport à la quantité initiale. La constante de désintégration radioactive de cet isotope est <b>lam = {@${lamaVar}@} &times; 10<sup>-{@${lambVar}@}</sup> an<sup>-1</sup></b>.</p>`;
  var formulaFrag = `<p>a) Écris l'expression littérale de l'âge <i>T</i> de la roche (en années) en fonction de <i>Nfrac</i> et <i>lam</i>.<br/>[[input:${ansFormula}]] [[validation:${ansFormula}]]</p>`;
  var valFrag = `<p>b) Calcule la valeur numérique de cet âge <i>T</i>, en années.<br/>[[input:${ansVal}]] [[validation:${ansVal}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + formulaFrag + valFrag;

  var inputXML = [
    mkInput_D({ name: ansFormula, type: 'algebraic', tans: taFormulaVar, boxsize: 20, strictsyntax: 1, insertstars: 0, allowwords: 'Nfrac,lam', forbidfloat: 0, checkanswertype: 1, mustverify: 1, showvalidation: 2 }),
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
    name: '1', description: 'signe moins oublié (formule)', answertest: 'AlgEquiv', sans: ansFormula, tans: errSignFormulaVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}form-1-T`, truefeedback: `<p>Il te manque le signe moins : comme <i>Nfrac</i> &lt; 1, \\( \\ln(Nfrac) \\) est négatif, il faut le signe moins devant pour obtenir un âge <i>T</i> positif.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}form-1-F`, falsefeedback: `<p>Incorrect. Isole <i>T</i> dans \\( Nfrac = e^{-lam \\cdot T} \\) en passant par le logarithme népérien.</p>`
  };
  var nodeVal0 = {
    name: '0', description: 'valeur numérique correcte', answertest: 'NumRelative', sans: ansVal, tans: tValVar,
    testoptions: '0.01', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}val-0-T`, truefeedback: `<p>Correct. Toutes les écritures numériques sont acceptées (ex : notation scientifique ou décimale).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}val-0-F`, falsefeedback: ''
  };
  var nodeVal1 = {
    name: '1', description: 'signe moins oublié (numérique, résultat négatif)', answertest: 'NumRelative', sans: ansVal, tans: errSignValVar,
    testoptions: '0.01', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}val-1-T`, truefeedback: `<p>Ton résultat est négatif : un âge ne peut pas être négatif. Tu as sans doute oublié le signe moins devant le logarithme.</p>`,
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
    `<p>La loi de décroissance radioactive s'écrit \\( N/N_0 = e^{-\\lambda t} \\), soit \\( Nfrac = e^{-lam \\cdot T} \\). En isolant \\( T \\) : \\( T = -\\ln(Nfrac)/lam \\). Comme \\( Nfrac < 1 \\), \\( \\ln(Nfrac) \\) est négatif, d'où le signe moins devant pour obtenir un âge positif.</p>`,
    p.fbGen));

  return {
    type: 'radiochronologie', bareme, vars, qnote: `T={@${tValVar}@}`,
    textFrag, inputXML, prtXML,
    // Même limitation MVP que "horlogemoleculaire" : prt-manager.js n'affiche
    // que le 1er PRT dans l'éditeur d'arbre. Le XML exporté contient bien les 2 PRTs.
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtFormMeta.name}]] [[feedback:${prtValMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genRadiochronologie: genRadiochronologie, genRadiochronologieCore: genRadiochronologieCore };
}
