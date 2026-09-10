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

// ── XML GENERATOR: dilutions (SVT, titrage et dilutions en série — immunologie) ──
// Douzième et dernier type SVT de l'app, gabarit suivi : js/gen-nernst.js —
// une seule sous-question (facteur de dilution du tube n°n), avec un PRT à
// 2 nœuds diagnostiquant le piège classique : addition des facteurs (10*n)
// au lieu de leur multiplication (10^n). Cf. svt-12-dilutions-serie.xml
// (gabarit hand-XML déjà validé). Helper Maxima pur : js/gen-dilutions-calc.js.

function _dilBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('dil-bareme')) || 1,
    context: {
      intro: richVal('dil-intro')
    },
    grandeurs: {
      ntubeList: gs('dil-ntubelist').trim() || '2,3,4,5,6'
    },
    fbGen: richVal('dil-fbgen')
  };
}

async function genDilutions(X) {
  var p = _dilBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'dilutions', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "dilutions", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "dilutions", repli sur le calcul local.', e); }
  return genDilutionsCore(X, p);
}

/* genDilutionsCore : fonction pure (aucun accès DOM) — voir js/gen-nernst.js pour le
   pattern deps injectables (test/unit/gen-dilutions.test.js). */
function genDilutionsCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var dilVars_D = deps._dilVars || _dilVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = dilVars_D(X, p, {}) + '\n';

  var nTubeVar = `q${X}_dil_ntube`;
  var correctVar = `q${X}_dil_correct`, errAdditionVar = `q${X}_dil_erraddition`;
  var ans = `ans_dil${X}`;

  var HDR = `<div style="background:#ca8a04;border-left:5px solid #854d0e;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('dil.title')}</strong> <span style="background:#854d0e;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Pour titrer un sérum, on réalise une série de dilutions successives au <b>1/10</b> : chaque tube reçoit un dixième de la concentration du tube précédent.</p>`;
  var qFrag = `<p>Écris la formule du facteur de dilution du sérum dans le tube n°<b>{@${nTubeVar}@}</b> (le tube n°1 correspondant au sérum non dilué).<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: correctVar, boxsize: 15, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'facteur de dilution correct', answertest: 'AlgEquiv', sans: ans, tans: correctVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : les facteurs 1/10 se multiplient à chaque tube, soit \\( 1/10^n \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'addition au lieu de multiplication des facteurs', answertest: 'AlgEquiv', sans: ans, tans: errAdditionVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Tu as additionné les facteurs de dilution (10 × n) au lieu de les multiplier. À chaque tube, la dilution au 1/10 précédente est encore divisée par 10 : le facteur global est \\( 1/10^n \\), pas \\( 1/(10n) \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Chaque tube reprend le facteur du tube précédent et le multiplie par 1/10 : après <i>n</i> dilutions, le facteur global est \\( 1/10^n \\).</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Les facteurs de dilution se <b>multiplient</b> à chaque étape : après <i>n</i> dilutions au 1/10, le facteur global est \\( 1/10^n \\) (et non \\( 1/(10n) \\), qui reviendrait à additionner les facteurs).</p>`,
    p.fbGen));

  return {
    type: 'dilutions', bareme, vars, qnote: `dilution={@${correctVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genDilutions: genDilutions, genDilutionsCore: genDilutionsCore };
}
