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

// ── XML GENERATOR: ondesismique (SVT) ──
// Sixième type SVT de l'app, gabarit suivi : js/gen-radiochronologie.js. Deux
// scénarios (p.scenario, cf. js/gen-ondesismique-calc.js pour le détail Maxima) :
//  - 'delai-ps' (par défaut) : UNE SEULE sous-question (délai Δt entre l'arrivée
//    de l'onde P et celle de l'onde S), avec un PRT à 2 nœuds diagnostiquant le
//    piège classique : ordre de soustraction inversé (l'onde P est toujours plus
//    rapide que l'onde S, donc Δt = d/vS - d/vP > 0). Cf. svt-06-ondes-sismiques.xml
//    (gabarit hand-XML déjà validé).
//  - 'vitesse-onde' : lecture d'une heure d'arrivée sur un sismogramme JSXGraph
//    dont l'axe des temps affiche une VRAIE heure locale (comme un sismogramme
//    réel, pas un axe relatif en secondes depuis le séisme — js/gen-ondesismique-jsx.js),
//    soustraction de l'heure du séisme (donnée dans l'énoncé) pour obtenir la
//    durée de propagation, puis calcul de la célérité en km/s (1 PRT à 1 nœud)
//    et en km/h (1 PRT à 2 nœuds diagnostiquant la confusion 1 h = 60 s).
// Helper Maxima pur : js/gen-ondesismique-calc.js.

function _sisBuildParams() {
  var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gs('sis-bareme')) || 1,
    scenario: gs('sis-scenario') || 'delai-ps',
    context: {
      intro: richVal('sis-intro')
    },
    grandeurs: {
      dList: gs('sis-dlist').trim() || '80,120,150,200,240,300',
      vpList: gs('sis-vplist').trim() || '6,7,8',
      vsList: gs('sis-vslist').trim() || '3,7/2,4,9/2',
      dList2: gs('sis-dlist2').trim() || '210,340,411,480,560,620,710',
      arrList: gs('sis-arrlist').trim() || '40,60,80,100,120,140,160,180'
    },
    fbGen: richVal('sis-fbgen')
  };
}

async function genOndeSismique(X) {
  var p = _sisBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ondesismique', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "ondesismique", repli sur le calcul local.');
  } catch (e) { console.warn('[cairnforstack] /api/generate injoignable pour "ondesismique", repli sur le calcul local.', e); }
  return genOndeSismiqueCore(X, p);
}

/* genOndeSismiqueCore : fonction pure (aucun accès DOM) — voir js/gen-radiochronologie.js
   pour le pattern deps injectables (test/unit/gen-ondesismique.test.js). */
function genOndeSismiqueCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var sisVars_D = deps._sisVars || _sisVars;
  var sisSeismogramJSX_D = deps._sisSeismogramJSX || _sisSeismogramJSX;
  var sisComputeGraphBounds_D = deps._sisComputeGraphBounds || _sisComputeGraphBounds;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;
  var scenario = p.scenario || 'delai-ps';

  var vars = sisVars_D(X, p, {}) + '\n';

  var HDR = `<div style="background:#334155;border-left:5px solid #1e293b;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('sis.title')}</strong> <span style="background:#1e293b;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';

  var textFrag, inputXML, prtXML, allPrts, generalFeedback, qnote, feedbackRef;

  if (scenario === 'vitesse-onde') {
    var d2Var = `q${X}_sis_d2`, tarrVar = `q${X}_sis_tarr`, stationVar = `q${X}_sis_station`, heureVar = `q${X}_sis_heure`;
    var heureSecVar = `q${X}_sis_heuresec`;
    var vkmsVar = `q${X}_sis_vkms`, vkmhVar = `q${X}_sis_vkmh`, errminVar = `q${X}_sis_errmin`;
    var ansA = `ans_sisa${X}`, ansB = `ans_sisb${X}`;

    var bounds = sisComputeGraphBounds_D((p.grandeurs || {}).arrList);
    var jsxBlock = sisSeismogramJSX_D({ tarrExpr: `{#${tarrVar}#}`, heureSecExpr: `{#${heureSecVar}#}`, xMax: bounds.xMax, tickStep: bounds.tickStep, width: 700, height: 300 });

    var statementHtml = `<p>Un séisme se produit à l'épicentre à <b>{@${heureVar}@}</b>. La station <b>{@${stationVar}@}</b> est distante de <b>{@${d2Var}@} km</b> de l'épicentre. Le sismogramme ci-dessous, enregistré à cette station, indique l'heure locale sur son axe des temps.</p>${jsxBlock}<p>Lis sur le graphique l'heure d'arrivée de l'onde à la station, soustrais-lui l'heure du séisme pour obtenir la durée de propagation, puis détermine la célérité de l'onde.</p>`;
    var qFrag = `<p>Célérité en km/s : [[input:${ansA}]] [[validation:${ansA}]]</p>
<p>Célérité en km/h : [[input:${ansB}]] [[validation:${ansB}]]</p>`;
    textFrag = HDR + introHtml + statementHtml + qFrag;

    inputXML = mkInput_D({ name: ansA, type: 'algebraic', tans: vkmsVar, boxsize: 12, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 })
      + '\n' + mkInput_D({ name: ansB, type: 'algebraic', tans: vkmhVar, boxsize: 12, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

    var nodeA = {
      name: '0', description: 'célérité en km/s', answertest: 'AlgEquiv', sans: ansA, tans: vkmsVar,
      testoptions: '', quiet: '0',
      truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
      trueanswernote: `prt${X}a-0-T`, truefeedback: `<p>Correct : \\( v = d/t \\).</p>`,
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
      falseanswernote: `prt${X}a-0-F`, falsefeedback: `<p>Incorrect. Relis l'heure d'arrivée de l'onde sur le sismogramme, soustrais-lui l'heure du séisme pour obtenir la durée de propagation \\( t \\), puis calcule \\( v=d/t \\).</p>`
    };
    var nodeB0 = {
      name: '0', description: 'célérité en km/h correcte', answertest: 'AlgEquiv', sans: ansB, tans: vkmhVar,
      testoptions: '', quiet: '0',
      truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
      trueanswernote: `prt${X}b-0-T`, truefeedback: `<p>Correct : 1 h = 3600 s, donc \\( v_{km/h} = v_{km/s}\\times 3600 \\).</p>`,
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
      falseanswernote: `prt${X}b-0-F`, falsefeedback: ''
    };
    var nodeB1 = {
      name: '1', description: 'confusion 1 h = 60 s', answertest: 'AlgEquiv', sans: ansB, tans: errminVar,
      testoptions: '', quiet: '0',
      truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
      trueanswernote: `prt${X}b-1-T`, truefeedback: `<p>Tu as multiplié par 60 : c'est la conversion en km/min, pas en km/h. Une heure contient 3600 secondes (60×60) : multiplie ta célérité en km/s par 3600.</p>`,
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
      falseanswernote: `prt${X}b-1-F`, falsefeedback: `<p>Incorrect. Convertis ta célérité en km/s vers km/h en multipliant par 3600 (nombre de secondes dans une heure).</p>`
    };

    var prtMetaA = { name: `prt${X}a`, value: (bareme / 2).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    var prtMetaB = { name: `prt${X}b`, value: (bareme / 2).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

    var xmlNodeA = Object.assign({}, nodeA, { truefeedback: applyFbBox_D('true', nodeA.truefeedback), falsefeedback: applyFbBox_D('false', nodeA.falsefeedback) });
    var xmlNodeB0 = Object.assign({}, nodeB0, { truefeedback: applyFbBox_D('true', nodeB0.truefeedback) });
    var xmlNodeB1 = Object.assign({}, nodeB1, { truefeedback: applyFbBox_D('false', nodeB1.truefeedback), falsefeedback: applyFbBox_D('false', nodeB1.falsefeedback) });

    prtXML = buildPrtXml_D(prtMetaA, [xmlNodeA]) + buildPrtXml_D(prtMetaB, [xmlNodeB0, xmlNodeB1]);
    allPrts = [{ meta: prtMetaA, nodes: [nodeA] }, { meta: prtMetaB, nodes: [nodeB0, nodeB1] }];

    generalFeedback = applyFbBox_D('general', mkFbGen_D(
      `<p>La célérité d'une onde se calcule par \\( v = d/t \\), où \\( d \\) est la distance parcourue et \\( t \\) la durée de propagation. Sur un sismogramme réel, l'axe des temps indique l'heure locale : il faut donc soustraire l'heure du séisme (donnée dans l'énoncé) à l'heure d'arrivée lue sur le graphique pour obtenir \\( t \\). Pour convertir la célérité en km/h, on multiplie par 3600 (1 h = 3600 s).</p>`,
      p.fbGen));

    qnote = `v={@${vkmsVar}@} km/s`;
    feedbackRef = `[[feedback:${prtMetaA.name}]] [[feedback:${prtMetaB.name}]]`;

  } else {
    var dVar = `q${X}_sis_d`, vpVar = `q${X}_sis_vp`, vsVar = `q${X}_sis_vs`;
    var deltaTVar = `q${X}_sis_deltat`, errReversedVar = `q${X}_sis_errreversed`;
    var ans = `ans_sis${X}`;

    var statementHtml2 = `<p>Une station sismique enregistre un séisme situé à une distance épicentrale de <b>{@${dVar}@} km</b>. L'onde P se propage à <b>{@${vpVar}@} km/s</b>, l'onde S se propage à <b>{@${vsVar}@} km/s</b> (l'onde P est toujours plus rapide que l'onde S).</p>`;
    var qFrag2 = `<p>Quel est le délai, en secondes, entre l'arrivée de l'onde P et l'arrivée de l'onde S à cette station ?<br/>[[input:${ans}]] [[validation:${ans}]]</p>`;
    textFrag = HDR + introHtml + statementHtml2 + qFrag2;

    inputXML = mkInput_D({ name: ans, type: 'algebraic', tans: deltaTVar, boxsize: 15, strictsyntax: 1, insertstars: 0, forbidfloat: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 });

    var node0 = {
      name: '0', description: 'délai correct', answertest: 'AlgEquiv', sans: ans, tans: deltaTVar,
      testoptions: '', quiet: '0',
      truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
      trueanswernote: `prt${X}-0-T`, truefeedback: `<p>Correct : \\( \\Delta t = d/v_S - d/v_P \\).</p>`,
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
      falseanswernote: `prt${X}-0-F`, falsefeedback: ''
    };
    var node1 = {
      name: '1', description: 'ordre de soustraction inversé', answertest: 'AlgEquiv', sans: ans, tans: errReversedVar,
      testoptions: '', quiet: '0',
      truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
      trueanswernote: `prt${X}-1-T`, truefeedback: `<p>Ton résultat est négatif : tu as inversé l'ordre de la soustraction. L'onde P arrive en premier (elle est plus rapide), donc le délai observé est (temps d'arrivée de S) − (temps d'arrivée de P), soit \\( d/v_S - d/v_P \\).</p>`,
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
      falseanswernote: `prt${X}-1-F`, falsefeedback: `<p>Incorrect. Calcule séparément le temps de trajet de chaque onde ( \\( t=d/v \\) ), puis soustrais.</p>`
    };

    var prtMeta = { name: `prt${X}`, value: (+bareme).toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

    var xmlNode0 = Object.assign({}, node0, { truefeedback: applyFbBox_D('true', node0.truefeedback) });
    var xmlNode1 = Object.assign({}, node1, { truefeedback: applyFbBox_D('false', node1.truefeedback), falsefeedback: applyFbBox_D('false', node1.falsefeedback) });

    prtXML = buildPrtXml_D(prtMeta, [xmlNode0, xmlNode1]);
    allPrts = [{ meta: prtMeta, nodes: [node0, node1] }];

    generalFeedback = applyFbBox_D('general', mkFbGen_D(
      `<p>Chaque onde met un temps \\( t = d/v \\) pour parcourir la distance \\( d \\). L'onde P arrive en premier (plus rapide), l'onde S arrive ensuite : le délai observé est donc \\( \\Delta t = d/v_S - d/v_P \\).</p>`,
      p.fbGen));

    qnote = `dt={@${deltaTVar}@}`;
    feedbackRef = `[[feedback:${prtMeta.name}]]`;
  }

  return {
    type: 'ondesismique', bareme, vars, qnote,
    textFrag, inputXML, prtXML,
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genOndeSismique: genOndeSismique, genOndeSismiqueCore: genOndeSismiqueCore };
}
