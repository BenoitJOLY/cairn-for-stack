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

// ── XML GENERATOR: incertitude (physique-chimie, mesures GUM) ──
// Contrairement aux autres types (1 input + 1 PRT), le prof coche jusqu'à 7
// étapes de calcul indépendantes (moyenne, s, uA, uB, uc, U, écriture finale) :
// une paire <input>/<prt> DISTINCTE par étape cochée, chacune notée séparément
// (LOI 2 : chaque PRT = 1 seul nœud, truenextnode:-1, aucune dépendance croisée).
// Helpers Maxima purs : js/gen-incertitude-calc.js. Gabarit suivi : js/gen-math-statistiques.js.

var INC_STEP_ORDER = ['moyenne', 's', 'uA', 'uB', 'uc', 'U', 'ecriture'];

function _incBuildParams() {
  var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
  var gc = function(id){ var e=document.getElementById(id); return e?!!e.checked:false; };
  var typeAMode = (document.querySelector('input[name="inc-typea-mode"]:checked')||{}).value || 'manuel';
  var typeBSource = gs('inc-typeb-source') || 'resolution';
  return {
    bareme: parseFloat(gs('inc-bareme')) || 1,
    context: { grandeur: gs('inc-grandeur').trim(), symbole: gs('inc-symbole').trim() || 'x', unite: gs('inc-unite').trim(), intro: gs('inc-intro').trim() },
    typeA: {
      mode: typeAMode,
      data: _statParseNumList(gs('inc-typea-data')),
      moyenneVraie: gs('inc-typea-moyenne'), ecartTypePop: gs('inc-typea-ecarttype'),
      n: parseInt(gs('inc-typea-n')) || 0, decimales: parseInt(gs('inc-typea-decimales'))
    },
    typeB: {
      source: typeBSource, q: gs('inc-typeb-q'), delta: gs('inc-typeb-delta'), ucert: gs('inc-typeb-ucert'), kcert: gs('inc-typeb-kcert'), valeur: gs('inc-typeb-valeur'),
      propTerms: (typeof incGetPropTerms === 'function') ? incGetPropTerms() : []
    },
    display: gs('inc-display') || 'liste',
    rounding: {
      sigfig: parseInt(gs('inc-sigfig')) || 1, roundup: gc('inc-roundup'), k: parseInt(gs('inc-k')) || 1,
      studentEnabled: gc('inc-student-enabled'), confidence: parseInt(gs('inc-student-confidence')) || 95
    },
    steps: {
      moyenne: gc('inc-step-moyenne'), s: gc('inc-step-s'), uA: gc('inc-step-uA'), uB: gc('inc-step-uB'),
      uc: gc('inc-step-uc'), U: gc('inc-step-U'), ecriture: gc('inc-step-ecriture')
    },
    moyenneTolerance: (parseFloat(gs('inc-moyenne-tolerance')) || 1) / 100,
    fbGen: gs('inc-fbgen')
  };
}

async function genIncertitude(X) {
  var p = _incBuildParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'incertitude', X, params: p})
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || I18N.t('msg.err_quota_hebdo')); }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "incertitude", repli sur le calcul local.');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "incertitude", repli sur le calcul local.', e); }
  return genIncertitudeCore(X, p);
}

/* genIncertitudeCore : fonction pure (aucun accès DOM) — voir js/gen-math-statistiques.js
   pour le pattern deps injectables (test/unit/gen-incertitude.test.js). */
function genIncertitudeCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;

  var ctx = p.context || {};
  var bareme = p.bareme || 1;
  var steps = p.steps || {};
  var checked = INC_STEP_ORDER.filter(function(k){ return !!steps[k]; });
  if (!checked.length) throw new Error(I18N_D.t('inc.err_no_step') || 'Incertitude : cochez au moins une étape à évaluer.');

  var vars = [_incTypeAVars(X, p), _incTypeBVars(X, p), _incRoundingVars(X, p)];
  if (steps.ecriture) vars.push(_incFinalRegex(X, p, {escapeMaximaString: escapeMaximaString_D}));
  vars = vars.join('\n');

  var stepBareme = +(bareme / checked.length).toFixed(7);
  var symb = htmlEsc(ctx.symbole || 'x');
  var unite = htmlEsc(ctx.unite || '');
  var unitSuffix = unite ? ` \\; \\text{${unite}}` : '';

  var HDR = `<div style="background:#9333ea;border-left:5px solid #7e22ce;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('inc.title')}${ctx.grandeur ? ' &middot; ' + htmlEsc(ctx.grandeur) : ''}</strong> <span style="background:#7e22ce;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
  var introHtml = ctx.intro ? `<p>${ctx.intro}</p>` : '';
  var serieHtml;
  if (p.display === 'tableau') {
    var n = (p.typeA && p.typeA.mode === 'aleatoire') ? parseInt(p.typeA.n) : (p.typeA && p.typeA.data ? p.typeA.data.length : 0);
    var cells = '';
    for (var iCell = 1; iCell <= n; iCell++) {
      cells += `<td style="padding:6px 14px;border:1px solid #cbd5e1;text-align:center;">\\( {@q${X}_L[${iCell}]@}${unitSuffix} \\)</td>`;
    }
    serieHtml = `<p>${I18N_D.t('inc.mesures')} \\( ${symb}_i \\) :</p><table style="border-collapse:collapse;margin:8px 0;"><tr>${cells}</tr></table>`;
  } else {
    serieHtml = `<p>${I18N_D.t('inc.mesures')} \\( ${symb}_i \\) : \\( {@q${X}_L@}${unitSuffix} \\)</p>`;
  }

  var defs = _incStepDefs(X, symb, unite, p, I18N_D);
  var inputBlocks = [], prtBlocks = [], feedbackRefs = [], allPrts = [], textParts = [];

  defs.forEach(function(def) {
    if (!steps[def.key]) return;
    var node = {
      name: '0', description: def.desc, answertest: def.test, sans: def.inputName, tans: def.tans,
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

  var textFrag = HDR + introHtml + serieHtml + textParts.join('\n');
  var generalFeedback = applyFbBox_D('general', mkFbGen_D(`<strong>${I18N_D.t('trig.correction_title') || 'Correction'}</strong><br>${I18N_D.t('inc.fbgen', {lvar:'q'+X+'_L', moyvar:'q'+X+'_moy', svar:'q'+X+'_s', uavar:'q'+X+'_uA', ubvar:'q'+X+'_uB', ucvar:'q'+X+'_uc', uvar:'q'+X+'_U'}) || ''}`, p.fbGen));

  return {
    type: 'incertitude', bareme, vars, qnote: `${symb}\u0304={@q${X}_moy@}, U={@q${X}_U@}`,
    textFrag, inputXML: inputBlocks.join('\n'), prtXML: prtBlocks.join('\n\n'),
    // Limitation MVP connue : l'éditeur d'arbre PRT (prt-manager.js) ne sait afficher
    // qu'un seul PRT par question — seule la 1ère étape cochée y est éditable visuellement.
    // Le XML exporté, lui, contient bien tous les PRTs (voir prts[] + prtXML complet).
    prt: allPrts[0], prts: allPrts,
    generalFeedback, feedbackRef: feedbackRefs.join(' ')
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genIncertitude: genIncertitude, genIncertitudeCore: genIncertitudeCore, INC_STEP_ORDER: INC_STEP_ORDER };
}
