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

// ── XML GENERATOR: thevenin (SI) ──
// Deuxième type SI de l'app (catégorie "Physique"), gabarit suivi :
// js/gen-ieee754.js — une seule sous-question (courant dans une résistance
// R3 via l'équivalent de Thévenin d'un pont diviseur R1/R2 alimenté par une
// source E), avec un PRT à cascade de 3 nœuds diagnostiquant deux pièges
// classiques : oubli du diviseur de tension, et résistance de Thévenin
// calculée comme en série au lieu d'en parallèle. Helper Maxima pur :
// js/gen-thevenin-calc.js.

function _thvBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('thv-bareme')) || 1,
    context: {
      intro: richVal('thv-intro')
    },
    grandeurs: {
      eList: gs('thv-elist').trim() || '6,9,12,15,24',
      r1List: gs('thv-r1list').trim() || '10,20,30,40,100',
      r2List: gs('thv-r2list').trim() || '10,20,30,40,100',
      r3List: gs('thv-r3list').trim() || '10,20,50,100'
    },
    fbGen: richVal('thv-fbgen')
  };
}

async function genThevenin(X) {
  var p = _thvBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'thevenin', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "thevenin", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "thevenin", repli sur le calcul local.', e); }
  return genTheveninCore(X, p);
}

/* genTheveninCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-thevenin.test.js). */
function genTheveninCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var thvVars_D = deps._thvVars || _thvVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = thvVars_D(X, p, {}) + '\n';

  var eVar = `q${X}_thv_e`, r1Var = `q${X}_thv_r1`, r2Var = `q${X}_thv_r2`, r3Var = `q${X}_thv_r3`;
  var tansVar = `q${X}_thv_tans`, errnodivVar = `q${X}_thv_errnodiv`, errseriesVar = `q${X}_thv_errseries`;
  var ans = `ans_thv${X}`;

  var HDR = `<div style="background:#0c4a6e;border-left:5px solid #082f49;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('thv.title')}</strong> <span style="background:#082f49;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un circuit comporte une source de tension <b>E = {@${eVar}@} V</b> alimentant deux résistances <b>R1 = {@${r1Var}@} Ω</b> et <b>R2 = {@${r2Var}@} Ω</b> placées en parallèle ; l'ensemble alimente une résistance <b>R3 = {@${r3Var}@} Ω</b> branchée en série. En modélisant le dipôle {E, R1, R2} par son équivalent de Thévenin vu des bornes de R3, exprime le courant <b>I3</b> qui traverse R3.</p>`;
  var qFrag = `<p>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'courant I3 correct', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : le générateur de Thévenin équivalent à {E, R1, R2} vu des bornes de R3 a pour f.é.m. \\( E_{th} = E \\cdot \\dfrac{R_2}{R_1+R_2} \\) (diviseur de tension à vide) et pour résistance interne \\( R_{th} = \\dfrac{R_1 R_2}{R_1+R_2} \\) (R1 // R2, générateur éteint) ; le courant dans R3 vaut alors \\( I_3 = \\dfrac{E_{th}}{R_{th}+R_3} \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'diviseur de tension oublié', answertest: 'AlgEquiv', sans: ans, tans: errnodivVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Tu as utilisé la tension \\( E \\) de la source directement comme tension de Thévenin. Or à vide (R3 débranchée), R1 et R2 forment un diviseur de tension : \\( E_{th} = E \\cdot \\dfrac{R_2}{R_1+R_2} \\), qui est inférieure à \\( E \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'R1 et R2 traitées comme en série', answertest: 'AlgEquiv', sans: ans, tans: errseriesVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Pour calculer la résistance de Thévenin, on éteint la source E (remplacée par un fil) : R1 et R2 se retrouvent alors en parallèle entre elles, pas en série : \\( R_{th} = \\dfrac{R_1 R_2}{R_1+R_2} \\), pas \\( R_1+R_2 \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. Détermine séparément la tension de Thévenin (diviseur de tension à vide entre R1 et R2) puis la résistance de Thévenin (R1 en parallèle avec R2, source éteinte), avant de calculer le courant dans la maille avec R3.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Vu des bornes de R3, le dipôle {E, R1, R2} se comporte comme un générateur de Thévenin de f.é.m. \\( E_{th} = E \\cdot \\dfrac{R_2}{R_1+R_2} \\) (diviseur de tension) et de résistance interne \\( R_{th} = \\dfrac{R_1 R_2}{R_1+R_2} \\) (R1 // R2). Le courant qui traverse R3, une fois cette dernière rebranchée, est alors \\( I_3 = \\dfrac{E_{th}}{R_{th}+R_3} \\) — n'importe quelle écriture algébriquement équivalente est acceptée.</p>`,
    p.fbGen));

  return {
    type: 'thevenin', bareme, vars, qnote: `I3={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genThevenin: genThevenin, genTheveninCore: genTheveninCore };
}
