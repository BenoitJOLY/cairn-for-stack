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

// ── XML GENERATOR: ieee754 (NSI) ──
// Premier type NSI de l'app, gabarit suivi : js/gen-chi2.js — une seule
// sous-question (mantisse binaire tronquée à n bits, écrite comme somme de
// puissances de 2), avec un PRT à 2 nœuds diagnostiquant le piège classique :
// oublier le dernier terme (poids le plus faible, 2^-n).
// Helper Maxima pur : js/gen-ieee754-calc.js.

function _fltBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('flt-bareme')) || 1,
    context: {
      intro: richVal('flt-intro')
    },
    grandeurs: {
      xList: gs('flt-xlist').trim() || '1/10,3/10,1/5,7/10,9/10,3/5',
      nBits: gs('flt-nbits').trim() || '8'
    },
    fbGen: richVal('flt-fbgen')
  };
}

async function genIeee754(X) {
  var p = _fltBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ieee754', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "ieee754", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "ieee754", repli sur le calcul local.', e); }
  return genIeee754Core(X, p);
}

/* genIeee754Core : fonction pure (aucun accès DOM) — voir js/gen-chi2.js pour
   le pattern deps injectables (test/unit/gen-ieee754.test.js). */
function genIeee754Core(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var fltVars_D = deps._fltVars || _fltVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = fltVars_D(X, p, {}) + '\n';

  var xVar = `q${X}_flt_x`, nVar = `q${X}_flt_n`;
  var tansVar = `q${X}_flt_tans`, errshortVar = `q${X}_flt_errshort`;
  var ans = `ans_flt${X}`;

  var HDR = `<div style="background:#0f766e;border-left:5px solid #134e4a;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('flt.title')}</strong> <span style="background:#134e4a;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>On souhaite représenter le nombre <b>{@${xVar}@}</b> en base 2, avec une mantisse tronquée à <b>{@${nVar}@} bits</b> (troncature, sans arrondi).</p>`;
  var qFrag = `<p>Donne la valeur de cette mantisse, écrite comme une somme de puissances de 2 (ou toute écriture équivalente).<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'mantisse correcte', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : à chaque étape, tu as doublé le reste et regardé s'il dépasse 1 pour poser le bit correspondant.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'dernier terme oublié', answertest: 'AlgEquiv', sans: ans, tans: errshortVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Il te manque le dernier terme (le poids le plus faible, \\( 2^{-n} \\)) : ta somme correspond à une troncature à \\( n-1 \\) bits, pas à \\( n \\) bits.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Reprends bit à bit : multiplie le reste par 2, si le résultat dépasse 1 le bit vaut 1 (retranche 1 et continue), sinon il vaut 0.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>La mantisse binaire d'un nombre \\( x \\in ]0,1[ \\) tronquée à \\( n \\) bits se calcule bit à bit : on double le reste, on pose 1 s'il dépasse 1 (et on retranche 1), sinon 0, et on répète \\( n \\) fois. La somme des puissances de 2 correspondant aux bits à 1 donne la mantisse — n'importe quelle écriture équivalente est valable.</p>`,
    p.fbGen));

  return {
    type: 'ieee754', bareme, vars, qnote: `mantisse={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genIeee754: genIeee754, genIeee754Core: genIeee754Core };
}
