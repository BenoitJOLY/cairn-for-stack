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

// ── XML GENERATOR: croisements (SVT, génétique — mono/dihybridisme, gène lié à l'X) ──
// Deuxième type SVT de l'app, gabarit suivi : js/gen-hardyweinberg.js. Toujours 3
// sous-questions (p_auto, p_sexlié, p_total) : a) ratio d'un gène AUTOSOMAL classique ;
// b) ratio "mâle ET récessif" d'un gène LIÉ À L'X, où PRT à 2 nœuds en cascade diagnostique
// la confusion classique consistant à multiplier naïvement P(mâle)=1/2 par le ratio
// autosomal au lieu de relire l'échiquier de croisement du gène lié à l'X (cf. err_naive_sex
// dans svt-02-croisements.xml, gabarit hand-XML déjà validé) ; c) produit des deux gènes
// indépendants. Helper Maxima pur : js/gen-croisements-calc.js.

function _crBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('cr-bareme')) || 3,
    context: {
      espece: gs('cr-espece').trim() || 'la drosophile (Drosophila melanogaster)',
      autoTrait: gs('cr-auto-trait').trim() || 'la forme des ailes',
      sexTrait: gs('cr-sex-trait').trim() || 'la couleur des yeux',
      intro: richVal('cr-intro')
    },
    grandeurs: {
      autoDomName: gs('cr-auto-dom-name').trim() || 'ailes normales',
      autoDomLetter: gs('cr-auto-dom-letter').trim() || 'V',
      autoRecName: gs('cr-auto-rec-name').trim() || 'ailes vestigiales',
      sexDomName: gs('cr-sex-dom-name').trim() || 'yeux normaux',
      sexDomLetter: gs('cr-sex-dom-letter').trim() || 'W',
      sexRecName: gs('cr-sex-rec-name').trim() || 'yeux blancs'
    },
    fbGen: richVal('cr-fbgen')
  };
}

async function genCroisements(X) {
  var p = _crBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'croisements', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "croisements", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "croisements", repli sur le calcul local.', e); }
  return genCroisementsCore(X, p);
}

/* genCroisementsCore : fonction pure (aucun accès DOM) — voir js/gen-hardyweinberg.js
   pour le pattern deps injectables (test/unit/gen-croisements.test.js). */
function genCroisementsCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;
  var crVars_D = deps._crVars || _crVars;

  var ctx = p.context || {};
  var g = p.grandeurs || {};
  var bareme = p.bareme || 3;
  var espece = htmlEsc_D(ctx.espece || 'la drosophile (Drosophila melanogaster)');
  var autoTrait = htmlEsc_D(ctx.autoTrait || 'la forme des ailes');
  var sexTrait = htmlEsc_D(ctx.sexTrait || 'la couleur des yeux');
  var autoDomName = htmlEsc_D(g.autoDomName || 'ailes normales');
  var autoRecName = htmlEsc_D(g.autoRecName || 'ailes vestigiales');
  var sexDomName = htmlEsc_D(g.sexDomName || 'yeux normaux');
  var sexRecName = htmlEsc_D(g.sexRecName || 'yeux blancs');

  var vars = crVars_D(X, p, { escapeMaximaString: escapeMaximaString_D, htmlEsc: htmlEsc_D }) + '\n';

  var autoDescVar = `q${X}_cr_autodesc`, pAutoVar = `q${X}_cr_pauto`;
  var sexDescVar = `q${X}_cr_sexdesc`, pSexVar = `q${X}_cr_psex`, errNaiveVar = `q${X}_cr_errnaive`;
  var pTotVar = `q${X}_cr_ptotal`;
  var ansAuto = `ans_cra${X}`, ansSex = `ans_crs${X}`, ansTot = `ans_crt${X}`;
  var stepBareme = +(bareme / 3).toFixed(7);

  var HDR = `<div style="background:#0d9488;border-left:5px solid #115e59;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('cr.title')}</strong> <span style="background:#115e59;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var statementHtml = `<p>On réalise un croisement chez ${espece} portant sur deux caractères indépendants :</p>
<ul>
<li>Un gène <b>autosomal</b> contrôlant ${autoTrait} (${autoDomName} dominant, <i>${autoRecName}</i> récessif) : croisement {@${autoDescVar}@}.</li>
<li>Un gène <b>lié au chromosome X</b> contrôlant ${sexTrait} (${sexDomName} dominant, <i>${sexRecName}</i> récessif) : croisement entre {@${sexDescVar}@}.</li>
</ul>`;
  var autoFrag = `<p>a) Quelle est la probabilité qu'un descendant présente le phénotype récessif du premier gène (<i>${autoRecName}</i>) ?<br/>[[input:${ansAuto}]] [[validation:${ansAuto}]]</p>`;
  var sexFrag = `<p>b) Quelle est la probabilité qu'un descendant soit un <b>mâle</b> avec le phénotype récessif du second gène (<i>${sexRecName}</i>) ?<br/>[[input:${ansSex}]] [[validation:${ansSex}]]</p>`;
  var totFrag = `<p>c) En supposant les deux gènes indépendants, quelle est la probabilité qu'un descendant soit à la fois <b>mâle</b>, <i>${sexRecName}</i>, ET <i>${autoRecName}</i> ?<br/>[[input:${ansTot}]] [[validation:${ansTot}]]</p>`;
  var textFrag = HDR + introHtml + statementHtml + autoFrag + sexFrag + totFrag;

  var inputXML = [
    mkInput_D({ name: ansAuto, tans: pAutoVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 }),
    mkInput_D({ name: ansSex, tans: pSexVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 }),
    mkInput_D({ name: ansTot, tans: pTotVar, boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 0 })
  ].join('\n');

  var nodeAuto = {
    name: '0', description: 'p_auto correct', answertest: 'AlgEquiv', sans: ansAuto, tans: pAutoVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}auto-0-T`, truefeedback: `<p>Correct.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}auto-0-F`, falsefeedback: `<p>Incorrect. Relis l'échiquier de croisement du gène autosomal : compte la proportion de descendants homozygotes récessifs sur l'ensemble des combinaisons possibles.</p>`
  };
  var nodeSex0 = {
    name: '0', description: 'p_sex correct', answertest: 'AlgEquiv', sans: ansSex, tans: pSexVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}sex-0-T`, truefeedback: `<p>Correct : le sexe et le phénotype ne sont pas indépendants pour un gène lié à l'X.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
    falseanswernote: `prt${X}sex-0-F`, falsefeedback: ''
  };
  var nodeSex1 = {
    name: '1', description: 'confusion multiplication naïve P(mâle)*ratio autosomal', answertest: 'AlgEquiv', sans: ansSex, tans: errNaiveVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}sex-1-T`, truefeedback: `<p>Attention, tu as multiplié P(mâle)=1/2 par un ratio autosomal 1/4, mais un gène lié à l'X n'est pas indépendant du sexe : le mâle est hémizygote (un seul X). Reconstruis directement l'échiquier de croisement du gène lié à l'X pour lire la proportion « mâle ET ${sexRecName} ».</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}sex-1-F`, falsefeedback: `<p>Incorrect. Construis l'échiquier de croisement du gène lié à l'X et compte la proportion de descendants qui sont à la fois mâles et ${sexRecName}.</p>`
  };
  var nodeTot = {
    name: '0', description: 'p_total correct', answertest: 'AlgEquiv', sans: ansTot, tans: pTotVar,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: `prt${X}tot-0-T`, truefeedback: `<p>Correct : les deux gènes étant indépendants, les probabilités se multiplient.</p>`,
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: `prt${X}tot-0-F`, falsefeedback: `<p>Incorrect. Deux gènes indépendants : multiplie la probabilité obtenue en a) par celle obtenue en b).</p>`
  };

  var prtAutoMeta = { name: `prt${X}auto`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtSexMeta = { name: `prt${X}sex`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var prtTotMeta = { name: `prt${X}tot`, value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var xmlNodeAuto = Object.assign({}, nodeAuto, { truefeedback: applyFbBox_D('true', nodeAuto.truefeedback), falsefeedback: applyFbBox_D('false', nodeAuto.falsefeedback) });
  var xmlNodeSex0 = Object.assign({}, nodeSex0, { truefeedback: applyFbBox_D('true', nodeSex0.truefeedback) });
  var xmlNodeSex1 = Object.assign({}, nodeSex1, { truefeedback: applyFbBox_D('false', nodeSex1.truefeedback), falsefeedback: applyFbBox_D('false', nodeSex1.falsefeedback) });
  var xmlNodeTot = Object.assign({}, nodeTot, { truefeedback: applyFbBox_D('true', nodeTot.truefeedback), falsefeedback: applyFbBox_D('false', nodeTot.falsefeedback) });

  var prtXML = [
    buildPrtXml_D(prtAutoMeta, [xmlNodeAuto]),
    buildPrtXml_D(prtSexMeta, [xmlNodeSex0, xmlNodeSex1]),
    buildPrtXml_D(prtTotMeta, [xmlNodeTot])
  ].join('\n\n');

  var allPrts = [
    { meta: prtAutoMeta, nodes: [nodeAuto] },
    { meta: prtSexMeta, nodes: [nodeSex0, nodeSex1] },
    { meta: prtTotMeta, nodes: [nodeTot] }
  ];

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    `<p>Le premier gène est autosomal : le ratio phénotypique se lit directement sur l'échiquier de croisement classique. Le second est lié à l'X : le sexe et le phénotype ne sont <b>pas</b> indépendants (les mâles sont hémizygotes, un seul allèle X). La probabilité finale combine les deux gènes indépendants par multiplication.</p>`,
    p.fbGen));

  return {
    type: 'croisements', bareme, vars, qnote: `p={@${pAutoVar}@}×{@${pSexVar}@}`,
    textFrag, inputXML, prtXML,
    // Même limitation MVP que "hardyweinberg" : prt-manager.js n'affiche que le
    // 1er PRT dans l'éditeur d'arbre. Le XML exporté contient bien les 3 PRTs.
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: `[[feedback:${prtAutoMeta.name}]] [[feedback:${prtSexMeta.name}]] [[feedback:${prtTotMeta.name}]]`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genCroisements: genCroisements, genCroisementsCore: genCroisementsCore };
}
