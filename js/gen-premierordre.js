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

// ── XML GENERATOR: premierordre (SI) ──
// Troisième type SI de l'app (catégorie "Physique"), gabarit suivi :
// js/gen-ieee754.js — une seule sous-question (erreur statique d'un système
// asservi du premier ordre H(p) = K/(1+τp) soumis à un échelon E0), avec un
// PRT à 2 nœuds diagnostiquant le piège classique : confondre l'erreur
// statique avec la valeur finale de la sortie. Helper Maxima pur :
// js/gen-premierordre-calc.js.

function _pmoBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('pmo-bareme')) || 1,
    context: {
      intro: richVal('pmo-intro')
    },
    grandeurs: {
      kList: gs('pmo-klist').trim() || '2,3,4,5,3/2,5/2',
      e0List: gs('pmo-e0list').trim() || '1,2,5,10'
    },
    fbGen: richVal('pmo-fbgen')
  };
}

async function genPremierordre(X) {
  var p = _pmoBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'premierordre', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "premierordre", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "premierordre", repli sur le calcul local.', e); }
  return genPremierordreCore(X, p);
}

/* genPremierordreCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-premierordre.test.js). */
function genPremierordreCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var pmoVars_D = deps._pmoVars || _pmoVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = pmoVars_D(X, p, {}) + '\n';

  var kVar = `q${X}_pmo_k`, e0Var = `q${X}_pmo_e0`;
  var tansVar = `q${X}_pmo_tans`, errfinalVar = `q${X}_pmo_errfinal`;
  var ans = `ans_pmo${X}`;

  var HDR = `<div style="background:#365314;border-left:5px solid #1a2e05;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('pmo.title')}</strong> <span style="background:#1a2e05;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un système asservi du premier ordre a pour fonction de transfert \\( H(p) = \\dfrac{K}{1+\\tau p} \\), de gain statique <b>K = {@${kVar}@}</b>. On applique en entrée un échelon d'amplitude <b>E0 = {@${e0Var}@}</b>.</p>`;
  var qFrag = `<p>Exprime l'erreur statique (écart entre la consigne et la sortie) en régime permanent.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'erreur statique correcte', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : en régime permanent (\\( p \\to 0 \\)), la sortie tend vers \\( K \\cdot E_0 \\), donc l'erreur (consigne moins sortie) vaut \\( \\varepsilon = E_0(1-K) \\) — remarque qu'elle ne dépend pas de \\( \\tau \\), qui ne joue que sur la rapidité du régime transitoire.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'valeur finale de la sortie confondue avec l\'erreur', answertest: 'AlgEquiv', sans: ans, tans: errfinalVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Ton résultat correspond à la valeur finale de la sortie (\\( K \\cdot E_0 \\)), pas à l'erreur, qui est la différence entre l'entrée et la sortie : \\( \\varepsilon = E_0 - K \\cdot E_0 = E_0(1-K) \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. En régime permanent, la sortie tend vers \\( K \\cdot E_0 \\) ; l'erreur statique est l'écart entre la consigne \\( E_0 \\) et cette valeur finale.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Pour un système du premier ordre \\( H(p) = \\dfrac{K}{1+\\tau p} \\) soumis à un échelon \\( E_0 \\), le théorème de la valeur finale donne une sortie en régime permanent \\( s(\\infty) = K \\cdot E_0 \\). L'erreur statique, écart entre la consigne et cette sortie, vaut donc \\( \\varepsilon = E_0(1-K) \\) — elle ne dépend pas de \\( \\tau \\), qui n'influence que la rapidité du régime transitoire.</p>`,
    p.fbGen));

  return {
    type: 'premierordre', bareme, vars, qnote: `erreurstatique={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genPremierordre: genPremierordre, genPremierordreCore: genPremierordreCore };
}
