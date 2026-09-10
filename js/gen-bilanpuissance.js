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

// ── XML GENERATOR: bilanpuissance (SI) ──
// Premier type SI de l'app (catégorie "Physique"), gabarit suivi :
// js/gen-ieee754.js — une seule sous-question (puissance électrique absorbée
// par un moteur, compte tenu du rendement du réducteur et du moteur), avec
// un PRT à cascade de 3 nœuds diagnostiquant deux pièges classiques : oubli
// du facteur g, et rendements multipliés au lieu d'être divisés. Helper
// Maxima pur : js/gen-bilanpuissance-calc.js.

function _bpuBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('bpu-bareme')) || 1,
    context: {
      intro: richVal('bpu-intro')
    },
    grandeurs: {
      mList: gs('bpu-mlist').trim() || '500,600,800,1000,1200',
      vList: gs('bpu-vlist').trim() || '1,3/2,2,5/2,3',
      etaRedList: gs('bpu-etaredlist').trim() || '9/10,17/20,4/5,7/8',
      etaMotList: gs('bpu-etamotlist').trim() || '9/10,17/20,4/5,7/8'
    },
    fbGen: richVal('bpu-fbgen')
  };
}

async function genBilanpuissance(X) {
  var p = _bpuBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bilanpuissance', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "bilanpuissance", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "bilanpuissance", repli sur le calcul local.', e); }
  return genBilanpuissanceCore(X, p);
}

/* genBilanpuissanceCore : fonction pure (aucun accès DOM) — voir js/gen-chi2.js
   pour le pattern deps injectables (test/unit/gen-bilanpuissance.test.js). */
function genBilanpuissanceCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var bpuVars_D = deps._bpuVars || _bpuVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;

  var vars = bpuVars_D(X, p, {}) + '\n';

  var mVar = `q${X}_bpu_m`, vVar = `q${X}_bpu_v`, erVar = `q${X}_bpu_etared`, emVar = `q${X}_bpu_etamot`;
  var tansVar = `q${X}_bpu_tans`, errnogVar = `q${X}_bpu_errnog`, errinvVar = `q${X}_bpu_errinv`;
  var ans = `ans_bpu${X}`;

  var HDR = `<div style="background:#9f1239;border-left:5px solid #4c0519;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('bpu.title')}</strong> <span style="background:#4c0519;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Un ascenseur de masse <b>m = {@${mVar}@} kg</b> doit atteindre une vitesse <b>v = {@${vVar}@} m/s</b>. Le rendement du réducteur est <b>η_réd = {@${erVar}@}</b> et celui du moteur <b>η_mot = {@${emVar}@}</b> (on prendra g = 9,81 m/s²).</p>`;
  var qFrag = `<p>Exprime la puissance électrique absorbée par le moteur.<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag;

  var inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: tansVar, boxsize: 25, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

  var node0 = {
    name: '0', description: 'puissance absorbée correcte', answertest: 'AlgEquiv', sans: ans, tans: tansVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : la puissance mécanique utile \\( m \\cdot g \\cdot v \\) doit être fournie en amont des deux rendements (réducteur puis moteur), on divise donc par \\( \\eta_{réd} \\cdot \\eta_{mot} \\) pour remonter à la puissance électrique absorbée.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}-0-F`, falsefeedback: ''
  };
  var node1 = {
    name: '1', description: 'oubli du facteur g', answertest: 'AlgEquiv', sans: ans, tans: errnogVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Il te manque l'accélération de pesanteur \\( g \\) : la puissance mécanique utile d'un système en translation verticale est \\( P = m \\cdot g \\cdot v \\), pas \\( m \\cdot v \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
    falseanswernote: `prt${X}-1-F`, falsefeedback: ''
  };
  var node2 = {
    name: '2', description: 'rendements multipliés au lieu d\'être divisés', answertest: 'AlgEquiv', sans: ans, tans: errinvVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}-2-T`, truefeedback: `<p>Un rendement est toujours inférieur à 1 : la puissance électrique absorbée en amont doit être supérieure à la puissance mécanique utile, donc on divise par les rendements, on ne les multiplie pas.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}-2-F`, falsefeedback: `<p>Incorrect. Reprends la chaîne d'énergie : puissance mécanique utile \\( m \\cdot g \\cdot v \\), puis on remonte vers l'amont en divisant successivement par le rendement du réducteur puis par celui du moteur.</p>`
  };

  var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
  var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback) });
  var xmlNode2 = Object.assign({}, node2, { truefeedback: applyFbBox_D('false', node2.truefeedback), falsefeedback: applyFbBox_D('false', node2.falsefeedback) });

  var prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1, xmlNode2]);

  var allPrts = [{ meta: prtMeta, nodes: [node0, node1, node2] }];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>La puissance mécanique utile pour élever une masse \\( m \\) à la vitesse \\( v \\) est \\( P_{méca} = m \\cdot g \\cdot v \\). Cette puissance traverse successivement le réducteur (rendement \\( \\eta_{réd} \\)) puis le moteur (rendement \\( \\eta_{mot} \\)) : la puissance électrique absorbée en amont, forcément supérieure, vaut \\( P_{abs} = \\dfrac{m \\cdot g \\cdot v}{\\eta_{réd} \\cdot \\eta_{mot}} \\).</p>`,
    p.fbGen));

  return {
    type: 'bilanpuissance', bareme, vars, qnote: `Pabs={@${tansVar}@}`,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genBilanpuissance: genBilanpuissance, genBilanpuissanceCore: genBilanpuissanceCore };
}
