/*
 * StackForge — générateur de questions STACK pour Moodle
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

// ── XML GENERATOR: hardyweinberg (SVT, génétique des populations) ──
// Toujours 3 sous-questions (q, p, fréquence des hétérozygotes 2pq) : contrairement à
// "zscore"/"incertitude", aucune étape n'est cochable, cf. décision de conception (le
// scénario n'a de sens pédagogique qu'avec les 3 réponses). Une paire <input>/<prt> par
// sous-question (LOI 2), sauf la 3e (hétérozygotes) qui porte un PRT à 2 nœuds en
// cascade pour diagnostiquer la confusion classique phénotype dominant / hétérozygotes
// (cf. err_dominant dans svt-01-hardy-weinberg.xml, gabarit hand-XML déjà validé).
// Helper Maxima pur : js/gen-hardyweinberg-calc.js. Gabarit suivi : js/gen-zscore.js.

function _hwBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('hw-bareme')) || 3,
    context: {
      espece: gs('hw-espece').trim() || 'souris',
      phenoDom: gs('hw-pheno-dom').trim() || 'pelage gris',
      phenoRec: gs('hw-pheno-rec').trim() || 'pelage blanc',
      intro: richVal('hw-intro')
    },
    grandeurs: { qList: gs('hw-qlist') || '1/10,2/10,3/10,4/10,6/10,7/10,8/10,9/10' },
    fbGen: richVal('hw-fbgen')
  };
}

async function genHardyWeinberg(X) {
  var p = _hwBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'hardyweinberg', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "hardyweinberg", repli sur le calcul local.');
  } catch (e) { console.warn('[stackforge] /api/generate injoignable pour "hardyweinberg", repli sur le calcul local.', e); }
  return genHardyWeinbergCore(X, p);
}

/* genHardyWeinbergCore : fonction pure (aucun accès DOM) — voir js/gen-zscore.js
   pour le pattern deps injectables (test/unit/gen-hardyweinberg.test.js). */
function genHardyWeinbergCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var hwVars_D = deps._hwVars || _hwVars;

  var ctx = p.context || {};
  var bareme = p.bareme || 3;
  var espece = htmlEsc(ctx.espece || 'souris');
  var phenoDom = htmlEsc(ctx.phenoDom || 'pelage gris');
  var phenoRec = htmlEsc(ctx.phenoRec || 'pelage blanc');

  var vars = hwVars_D(X, p) + '\n';

  var qVar = `q${X}_hwq`, pVar = `q${X}_hwp`, hetVar = `q${X}_hwhet`, errDomVar = `q${X}_hwerrdom`, pctVar = `q${X}_hwq2pct`;
  var ansQ = `ans_hwq${X}`, ansP = `ans_hwp${X}`, ansHet = `ans_hwhet${X}`;
  var stepBareme = +(bareme / 3).toFixed(7);

  var HDR = `<div style="background:#15803d;border-left:5px solid #14532d;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('hw.title')}</strong> <span style="background:#14532d;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>Dans une population de ${espece} en équilibre de Hardy-Weinberg, le caractère « ${phenoRec} » est récessif (allèle <i>q</i>) face au caractère « ${phenoDom} » (allèle <i>p</i>). On observe que <b>{@${pctVar}@} %</b> des ${espece} de la population ont le ${phenoRec}.</p>`;
  var qFrag = `<p>a) Quelle est la fréquence de l'allèle récessif (<i>q</i>) ?<br/>[[input:${ansQ}]] [[validation:${ansQ}]]</p>`;
  var pFrag = `<p>b) Quelle est la fréquence de l'allèle dominant (<i>p</i>) ?<br/>[[input:${ansP}]] [[validation:${ansP}]]</p>`;
  var hetFrag = `<p>c) Quelle est la fréquence des individus hétérozygotes dans la population ?<br/>[[input:${ansHet}]] [[validation:${ansHet}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + qFrag + pFrag + hetFrag;

  var inputXML = [
    mkInput_D({ name: ansQ, tans: qVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 }),
    mkInput_D({ name: ansP, tans: pVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 }),
    mkInput_D({ name: ansHet, tans: hetVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 })
  ].join('\n');

  var nodeQ = {
    name: '0', description: 'q correct', answertest: 'AlgEquiv', sans: ansQ, tans: qVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}q-0-T`, truefeedback: `<p>Correct : \\( q=\\sqrt{q^2} \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}q-0-F`, falsefeedback: `<p>Incorrect. La fréquence de l'allèle récessif est la racine carrée de la fréquence du phénotype récessif observé : \\( q=\\sqrt{q^2} \\).</p>`
  };
  var nodeP = {
    name: '0', description: 'p correct', answertest: 'AlgEquiv', sans: ansP, tans: pVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}p-0-T`, truefeedback: `<p>Correct : \\( p=1-q \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}p-0-F`, falsefeedback: `<p>Incorrect. Utilise la relation \\( p+q=1 \\), donc \\( p=1-q \\).</p>`
  };
  var nodeHet0 = {
    name: '0', description: '2pq correct', answertest: 'AlgEquiv', sans: ansHet, tans: hetVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}het-0-T`, truefeedback: `<p>Correct : la fréquence des hétérozygotes est \\( 2pq \\).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}het-0-F`, falsefeedback: ''
  };
  var nodeHet1 = {
    name: '1', description: 'confusion phénotype dominant vs hétérozygotes', answertest: 'AlgEquiv', sans: ansHet, tans: errDomVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}het-1-T`, truefeedback: `<p>Attention, tu as donné la fréquence des individus <b>dominants</b> ( \\( 1-q^2 \\), c'est-à-dire \\( p^2+2pq \\) ), mais on te demande la fréquence des <b>hétérozygotes</b> uniquement ( \\( 2pq \\) ).</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}het-1-F`, falsefeedback: `<p>Incorrect. La fréquence des hétérozygotes se calcule par \\( 2pq \\), avec \\( p=1-q \\) et \\( q=\\sqrt{q^2} \\).</p>`
  };

  var prtQMeta = { name: `prt${X}q`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtPMeta = { name: `prt${X}p`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtHetMeta = { name: `prt${X}het`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNodeQ = Object.assign({}, nodeQ, { truefeedback: applyFbBox_D('true', nodeQ.truefeedback), falsefeedback: applyFbBox_D('false', nodeQ.falsefeedback) });
  var xmlNodeP = Object.assign({}, nodeP, { truefeedback: applyFbBox_D('true', nodeP.truefeedback), falsefeedback: applyFbBox_D('false', nodeP.falsefeedback) });
  var xmlNodeHet0 = Object.assign({}, nodeHet0, { truefeedback: applyFbBox_D('true', nodeHet0.truefeedback) });
  var xmlNodeHet1 = Object.assign({}, nodeHet1, { truefeedback: applyFbBox_D('false', nodeHet1.truefeedback), falsefeedback: applyFbBox_D('false', nodeHet1.falsefeedback) });

  var prtXML = [
    buildPrtXml_D(prtQMeta, [xmlNodeQ]),
    buildPrtXml_D(prtPMeta, [xmlNodeP]),
    buildPrtXml_D(prtHetMeta, [xmlNodeHet0, xmlNodeHet1])
  ].join('\n\n');

  var allPrts = [
    { meta: prtQMeta, nodes: [nodeQ] },
    { meta: prtPMeta, nodes: [nodeP] },
    { meta: prtHetMeta, nodes: [nodeHet0, nodeHet1] }
  ];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Rappel : sous les conditions de Hardy-Weinberg, \\( p+q=1 \\) et \\( p^2+2pq+q^2=1 \\).<br>` +
    `La fréquence du phénotype récessif observé donne directement \\( q^2 \\), d'où \\( q=\\sqrt{q^2} \\), puis \\( p=1-q \\), puis la fréquence des hétérozygotes \\( 2pq \\).</p>`,
    p.fbGen));

  return {
    type: 'hardyweinberg', bareme, vars, qnote: `q={@${qVar}@}`,
    textFrag, inputXML, prtXML,
    // Même limitation MVP que "zscore"/"incertitude" : prt-manager.js n'affiche que le
    // 1er PRT dans l'éditeur d'arbre. Le XML exporté contient bien les 3 PRTs.
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtQMeta.name}]] [[feedback:${prtPMeta.name}]] [[feedback:${prtHetMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genHardyWeinberg: genHardyWeinberg, genHardyWeinbergCore: genHardyWeinbergCore };
}
