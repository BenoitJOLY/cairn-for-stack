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

// ── XML GENERATOR: arbrebinaire (NSI) ──
// Troisième type NSI de l'app, gabarit suivi : js/gen-chi2.js — une seule
// sous-question (nombre total de nœuds d'un arbre binaire complet de hauteur
// h), avec un PRT à 2 nœuds. Comme le note svt.txt, plusieurs écritures
// (2^(h+1)-1, 1+2+2^2+...+2^h, 2*2^h-1) sont algébriquement équivalentes et
// donc toutes acceptées par AlgEquiv — c'est tout l'intérêt du CAS ici : le
// piège diagnostiqué est l'erreur classique 2^h-1 (définition de la hauteur).
// Helper Maxima pur : js/gen-arbrebinaire-calc.js.

function _arbBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('arb-bareme')) || 1,
    context: {
      intro: richVal('arb-intro')
    },
    grandeurs: {
      hList: gs('arb-hlist').trim() || '2,3,4,5,6'
    },
    fbGen: richVal('arb-fbgen')
  };
}

async function genArbrebinaire(X) {
  var p = _arbBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'arbrebinaire', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "arbrebinaire", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "arbrebinaire", repli sur le calcul local.', e); }
  return genArbrebinaireCore(X, p);
}

/* genArbrebinaireCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-arbrebinaire.test.js). */
function genArbrebinaireCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var arbVars_D = deps._arbVars || _arbVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = arbVars_D(X, p, {}) + '\n';

  var hVar = `q${X}_arb_h`;
  var tansVar = `q${X}_arb_tans`, errdefVar = `q${X}_arb_errdef`;
  var ans = `ans_arb${X}`;

  var HDR = `<div style="background:#7c2d12;border-left:5px solid #431407;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('arb.title')}</strong> <span style="background:#431407;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>On considère un arbre binaire <b>complet</b> de hauteur <b>{@${hVar}@}</b> (la racine est à la profondeur 0).</p>`;
  var qFrag = `<p>Exprime le nombre total de nœuds de cet arbre, en fonction de la hauteur.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'nombre de nœuds correct', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : au niveau \\( k \\), un arbre binaire complet compte \\( 2^k \\) nœuds ; en sommant de \\( k=0 \\) à \\( k=h \\), on obtient \\( 2^{h+1}-1 \\) nœuds (toute écriture équivalente, par exemple \\( 1+2+2^2+\\dots+2^h \\), est acceptée).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'erreur classique sur la définition de la hauteur', answertest: 'AlgEquiv', sans: ans, tans: errdefVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Tu as calculé le nombre de nœuds pour un arbre de hauteur \\( h-1 \\) : ici, la racine est à la profondeur 0, donc un arbre de hauteur \\( h \\) compte \\( h+1 \\) niveaux (de 0 à \\( h \\)), pas \\( h \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Compte les nœuds niveau par niveau : au niveau \\( k \\) il y en a \\( 2^k \\), et l'arbre a des niveaux de \\( k=0 \\) (la racine) à \\( k=h \\).</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Un arbre binaire complet de hauteur \\( h \\) (racine à la profondeur 0) a \\( h+1 \\) niveaux, et le niveau \\( k \\) contient \\( 2^k \\) nœuds. Le nombre total de nœuds est donc \\( \\sum_{k=0}^{h} 2^k = 2^{h+1}-1 \\) — n'importe quelle écriture équivalente (somme développée, \\( 2 \\times 2^h - 1 \\), etc.) est valable.</p>`,
    p.fbGen));

  return {
    type: 'arbrebinaire', bareme, vars, qnote: `nb_noeuds={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genArbrebinaire: genArbrebinaire, genArbrebinaireCore: genArbrebinaireCore };
}
