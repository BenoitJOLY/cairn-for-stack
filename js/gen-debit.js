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

// ── XML GENERATOR: debit (SVT, débit cardiaque — conversion mL vers L) ──
// Dixième type SVT de l'app, gabarit suivi : js/gen-malthus.js — une seule
// sous-question (calcul du débit cardiaque Q = FC x VES), avec un PRT à
// 2 nœuds diagnostiquant le piège classique : oubli de convertir le VES de
// mL en L avant la multiplication (crédit partiel 0.5, cf. gabarit hand-XML
// svt-10-debit-cardiaque.xml déjà validé). Helper Maxima pur : js/gen-debit-calc.js.

function _debBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('deb-bareme')) || 1,
    context: {
      intro: richVal('deb-intro')
    },
    grandeurs: {
      fcList: gs('deb-fclist').trim() || '60,65,70,72,75,80',
      vesList: gs('deb-veslist').trim() || '60,65,70,75,80,90'
    },
    fbGen: richVal('deb-fbgen')
  };
}

async function genDebit(X) {
  var p = _debBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'debit', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "debit", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "debit", repli sur le calcul local.', e); }
  return genDebitCore(X, p);
}

/* genDebitCore : fonction pure (aucun accès DOM) — voir js/gen-malthus.js pour le
   pattern deps injectables (test/unit/gen-debit.test.js). */
function genDebitCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var debVars_D = deps._debVars || _debVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = debVars_D(X, p, {}) + '\n';

  var fcVar = `q${X}_deb_fc`, vesVar = `q${X}_deb_vesml`;
  var qCorrectVar = `q${X}_deb_qcorrect`, errForgotConvertVar = `q${X}_deb_errforgotconvert`;
  var ans = `ans_deb${X}`;

  var HDR = `<div style="background:#be123c;border-left:5px solid #881337;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('deb.title')}</strong> <span style="background:#881337;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un individu a une fréquence cardiaque <b>FC = {@${fcVar}@} battements/min</b> et un volume d'éjection systolique <b>VES = {@${vesVar}@} mL</b>.</p>`;
  var qFrag = `<p>Calcule le débit cardiaque <i>Q</i> = FC &times; VES, exprimé en <b>L/min</b>.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: qCorrectVar, boxsize: 15, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'débit correct en L/min', answertest: 'AlgEquiv', sans: ans, tans: qCorrectVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : \\( Q = FC \\times VES \\) avec VES converti en L.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'conversion mL vers L oubliée', answertest: 'AlgEquiv', sans: ans, tans: errForgotConvertVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0.5', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Ton calcul est parfait, mais tu as oublié de convertir tes mL en litres : ta valeur est 1000 fois trop grande pour être exprimée en L/min. Divise le VES par 1000 avant de multiplier par FC.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. \\( Q = FC \\times VES \\), en convertissant le VES de mL en L (division par 1000).</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('partial', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>\\( Q = FC \\times VES \\). Le VES est donné en mL, il faut le convertir en L (diviser par 1000) avant de multiplier, puisque le résultat est demandé en L/min.</p>`,
    p.fbGen));

  return {
    type: 'debit', bareme, vars, qnote: `Q={@${qCorrectVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genDebit: genDebit, genDebitCore: genDebitCore };
}
