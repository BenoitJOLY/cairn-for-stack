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

// ── XML GENERATOR: zscore (compatibilité métrologique, physique-chimie) ──
// Suite logique du type "incertitude" (même famille GUM) : compare une
// valeur mesurée à une valeur de référence via z = |x_mesuré-x_référence|/u_c,
// avec une conclusion de compatibilité à seuil configurable (z < seuil).
// MVP en valeur fixe uniquement (toutes les entrées sont des littéraux du
// prof, jamais randomisées) — cf. décision utilisateur. Comme "incertitude",
// jusqu'à 2 étapes cochables indépendamment, une paire <input>/<prt> par
// étape (LOI 2 : chaque PRT = 1 seul nœud, truenextnode:-1).
// Helpers Maxima purs : js/gen-zscore-calc.js. Gabarit suivi : js/gen-incertitude.js.

var ZS_STEP_ORDER = ['z', 'conclusion'];

function _zsBuildParams() {
  var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
  var gc = function(id){ var e=document.getElementById(id); return e?!!e.checked:false; };
  return {
    bareme: parseFloat(gs('zs-bareme')) || 1,
    context: { grandeur: gs('zs-grandeur').trim(), symbole: gs('zs-symbole').trim() || 'x', unite: gs('zs-unite').trim(), intro: gs('zs-intro').trim() },
    grandeurs: { xMes: gs('zs-xmes'), xRef: gs('zs-xref'), uc: gs('zs-uc') },
    seuil: gs('zs-seuil') || '2',
    steps: { z: gc('zs-step-z'), conclusion: gc('zs-step-conclusion') },
    fbGen: gs('zs-fbgen')
  };
}

async function genZscore(X) {
  var p = _zsBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'zscore', X, params: p})
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "zscore", repli sur le calcul local.');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "zscore", repli sur le calcul local.', e); }
  return genZscoreCore(X, p);
}

/* genZscoreCore : fonction pure (aucun accès DOM) — voir js/gen-incertitude.js
   pour le pattern deps injectables (test/unit/gen-zscore.test.js). */
function genZscoreCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var zsVars_D = deps._zsVars || _zsVars;

  var ctx = p.context || {};
  var g = p.grandeurs || {};
  var bareme = p.bareme || 1;
  var steps = p.steps || {};
  var checked = ZS_STEP_ORDER.filter(function(k){ return !!steps[k]; });
  if (!checked.length) throw new Error(I18N_D.t('zs.err_no_step') || 'Z-score : cochez au moins une étape à évaluer.');

  var vars = zsVars_D(X, p) + '\n';

  var seuil = parseFloat(p.seuil);
  if (isNaN(seuil) || seuil <= 0) seuil = 2;
  var zVal = Math.abs(parseFloat(g.xMes) - parseFloat(g.xRef)) / parseFloat(g.uc);
  var isCompatible = zVal < seuil;

  var stepBareme = +(bareme / checked.length).toFixed(7);
  var symb = htmlEsc(ctx.symbole || 'x');
  var unite = htmlEsc(ctx.unite || '');
  var unitSuffix = unite ? ` \\; \\text{${unite}}` : '';

  var HDR = `<div style="background:#6d28d9;border-left:5px solid #5b21b6;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('zs.title')}${ctx.grandeur ? ' &middot; ' + htmlEsc(ctx.grandeur) : ''}</strong> <span style="background:#5b21b6;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var givensHtml = `<p>\\(${symb}_{mes} = {@q${X}_xmes@}${unitSuffix}\\)</p>` +
    `<p>\\(${symb}_{r\\acute{e}f} = {@q${X}_xref@}${unitSuffix}\\)</p>` +
    `<p>\\(u_c(${symb}) = {@q${X}_uc@}${unitSuffix}\\)</p>`;

  var fbOk = `<strong>${I18N_D.t('mat.fb_ok_correct') || 'Correct !'}</strong>`;
  function fbWrong(varName) { return I18N_D.t('inc.fb_wrong', {tavar: varName}) || `Incorrect. Valeur attendue : {@${varName}@}`; }

  var defs = [
    {
      key: 'z', prtName: `prt${X}_z`, inputName: `ans_z${X}`,
      desc: I18N_D.t('zs.node_z') || 'Calcul du z-score', answertest: 'NumRelative', sans: `ans_z${X}`, tans: `q${X}_z`, opts: '0.01',
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_z`),
      inputOpts: { name: `ans_z${X}`, tans: `q${X}_z`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(z=\\) [[input:ans_z${X}]] [[validation:ans_z${X}]]</p>`
    },
    {
      key: 'conclusion', prtName: `prt${X}_ccl`, inputName: `ans_ccl${X}`,
      desc: I18N_D.t('zs.node_conclusion') || 'Conclusion de compatibilité', answertest: 'String', sans: `ans_ccl${X}`,
      tans: `"${isCompatible ? 'compatible' : 'incompatible'}"`, opts: '',
      fbOk: fbOk, fbWrong: I18N_D.t('zs.fb_wrong_ccl', {seuil: seuil}) || `Incorrect. Le critère est z < ${seuil}.`,
      inputOpts: { name: `ans_ccl${X}`, type: 'dropdown', showvalidation: 0,
        tans: `<![CDATA[[["compatible", ${isCompatible}, "${I18N_D.t('zs.compatible_choice') || 'Compatible'}"], ["incompatible", ${!isCompatible}, "${I18N_D.t('zs.incompatible_choice') || 'Incompatible'}"]]]]>` },
      textFrag: `<p>${I18N_D.t('zs.conclusion_label', {seuil: seuil}) || `Conclusion (critère z &lt; ${seuil}) :`} [[input:ans_ccl${X}]] [[validation:ans_ccl${X}]]</p>`
    }
  ];

  var inputBlocks = [], prtBlocks = [], feedbackRefs = [], allPrts = [], textParts = [];

  defs.forEach(function(def) {
    if (!steps[def.key]) return;
    var node = {
      name: '0', description: def.desc, answertest: def.answertest, sans: def.sans, tans: def.tans,
      testoptions: def.opts || '', quiet: '0',
      truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
      trueanswernote: 'PRT-'+X+'-'+def.key+'-OK', truefeedback: def.fbOk,
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
      falseanswernote: 'PRT-'+X+'-'+def.key+'-NOK', falsefeedback: def.fbWrong
    };
    var prtMeta = { name: def.prtName, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    var xmlNode = Object.assign({}, node, { truefeedback: applyFbBox_D('true', node.truefeedback), falsefeedback: applyFbBox_D('false', node.falsefeedback) });
    inputBlocks.push(mkInput_D(def.inputOpts));
    prtBlocks.push(buildPrtXml_D(prtMeta, [xmlNode]));
    feedbackRefs.push(`[[feedback:${def.prtName}]]`);
    allPrts.push({ meta: prtMeta, nodes: [node] });
    textParts.push(def.textFrag);
  });

  var textFrag = HDR + introHtml + givensHtml + textParts.join('\n');
  var generalFeedback = applyFbBox_D('general', mkFbGen_D(`<strong>${I18N_D.t('trig.correction_title') || 'Correction'}</strong><br>${I18N_D.t('zs.fbgen', {zvar: 'q'+X+'_z', seuil: seuil, ccl: (isCompatible ? (I18N_D.t('zs.compatible_choice') || 'Compatible') : (I18N_D.t('zs.incompatible_choice') || 'Incompatible'))}) || ''}`, p.fbGen));

  return {
    type: 'zscore', bareme, vars, qnote: `z={@q${X}_z@}`,
    textFrag, inputXML: inputBlocks.join('\n'), prtXML: prtBlocks.join('\n\n'),
    // Même limitation MVP que "incertitude" : prt-manager.js n'affiche que le
    // 1er PRT dans l'éditeur d'arbre. Le XML exporté contient bien tous les PRTs.
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: feedbackRefs.join(' ')
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genZscore: genZscore, genZscoreCore: genZscoreCore, ZS_STEP_ORDER: ZS_STEP_ORDER };
}
