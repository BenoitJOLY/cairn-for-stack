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

// ── XML GENERATOR: complexite (NSI) ──
// Deuxième type NSI de l'app, gabarit suivi : js/gen-chi2.js — une seule
// sous-question (nombre de comparaisons dans le pire des cas d'une recherche
// dichotomique), avec un PRT à 3 nœuds diagnostiquant deux pièges classiques :
// confusion avec la recherche séquentielle (n/2) et inversion log/exponentielle
// (2^n au lieu de log2(n)). Helper Maxima pur : js/gen-complexite-calc.js.

function _cpaBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('cpa-bareme')) || 1,
    context: {
      intro: richVal('cpa-intro')
    },
    grandeurs: {
      nList: gs('cpa-nlist').trim() || '8,16,32,64,128,256,512,1024'
    },
    fbGen: richVal('cpa-fbgen')
  };
}

async function genComplexite(X) {
  var p = _cpaBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'complexite', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "complexite", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "complexite", repli sur le calcul local.', e); }
  return genComplexiteCore(X, p);
}

/* genComplexiteCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js pour
   le pattern deps injectables (test/unit/gen-complexite.test.js). */
function genComplexiteCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var cpaVars_D = deps._cpaVars || _cpaVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = cpaVars_D(X, p, {}) + '\n';

  var nVar = `q${X}_cpa_n`;
  var tansVar = `q${X}_cpa_tans`, errseqVar = `q${X}_cpa_errseq`, errexpVar = `q${X}_cpa_errexp`;
  var ans = `ans_cpa${X}`;

  var HDR = `<div style="background:#1e3a8a;border-left:5px solid #1e293b;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('cpa.title')}</strong> <span style="background:#1e293b;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un algorithme de recherche par dichotomie traite un tableau trié de taille <b>{@${nVar}@}</b>.</p>`;
  var qFrag = `<p>Exprime le nombre maximal de comparaisons effectuées dans le pire des cas.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'complexité correcte', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : à chaque comparaison, la dichotomie divise la taille du problème par 2, d'où \\( \\log_2(n) \\) comparaisons dans le pire des cas.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'confusion avec la recherche séquentielle', answertest: 'AlgEquiv', sans: ans, tans: errseqVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Ceci est la complexité d'une recherche <b>séquentielle</b> (en parcourant la moitié de la liste en moyenne), pas d'un algorithme qui divise la taille par 2 à chaque étape (dichotomie).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'inversion log/exponentielle', answertest: 'AlgEquiv', sans: ans, tans: errexpVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Tu as pris l'inverse de la fonction logarithmique : \\( 2^n \\) est une croissance exponentielle, pas la complexité d'une dichotomie qui, elle, divise la taille par 2 à chaque étape.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. À chaque comparaison, la dichotomie divise la taille du tableau restant par 2 : combien de fois faut-il diviser \\( n \\) par 2 pour arriver à 1 ?</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>La dichotomie divise la taille du problème par 2 à chaque comparaison : le nombre de comparaisons dans le pire des cas est donc \\( \\log_2(n) \\), pas \\( n/2 \\) (recherche séquentielle) ni \\( 2^n \\) (croissance exponentielle, l'inverse du logarithme).</p>`,
    p.fbGen));

  return {
    type: 'complexite', bareme, vars, qnote: `log2(n)={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genComplexite: genComplexite, genComplexiteCore: genComplexiteCore };
}
