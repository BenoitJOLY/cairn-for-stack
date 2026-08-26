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

// ── Définitions des 7 étapes d'évaluation cochables du type "incertitude" ──
// Pure vue/déclaratif (texte + config d'input), aucune isolation à respecter
// entre étapes puisqu'aucune ne dépend d'une autre — consommé par
// js/gen-incertitude.js (genIncertitudeCore), qui filtre selon p.steps.

function _incStepDefs(X, symb, unite, p, I18N_D) {
  var k = (parseInt((p.rounding||{}).k) === 2) ? 2 : 1;
  var isPropagation = ((p.typeB||{}).source === 'propagation');
  var fbOk = `<strong>${I18N_D.t('mat.fb_ok_correct') || 'Correct !'}</strong>`;
  // "Correct !" seul n'a aucun sens dès que plusieurs étapes/champs sont
  // notés séparément (l'élève ne sait plus à quoi le message se rapporte) —
  // chaque étape a donc son propre libellé ("Moyenne correcte.", etc.),
  // même logique déjà appliquée aux feedbacks d'erreur (fbWrongStep) et à
  // l'écriture finale (fbEcrOk).
  function fbOkStep(key) {
    var t = I18N_D.t('inc.fb_ok_' + key);
    return t ? `<strong>${t}</strong>` : fbOk;
  }
  function fbWrong(varName) {
    return I18N_D.t('inc.fb_wrong', {tavar: varName}) || `Incorrect. Valeur attendue : {@${varName}@}`;
  }
  function fbWrongStep(key, varName) {
    return I18N_D.t('inc.fb_wrong_' + key, {tavar: varName}) || fbWrong(varName);
  }
  var uBSource = ((p.typeB || {}).source) || 'resolution';
  var unitRaw = ((p.context || {}).unite || '').trim();

  // Si la grandeur a une unité, TOUTES les étapes numériques (pas seulement
  // l'écriture finale) doivent être saisies en champ natif STACK `units`
  // (nombre*unité, ex. "2.01*s"), comme js/gen-units.js — jamais en nombre
  // seul. PRT à 2 nœuds par champ, calqué sur js/gen-units.js : nœud 0
  // UnitsAbsolute (dimension, astuce ×2, testoptions:'0') → nœud 1
  // UnitsRelative/UnitsAbsolute (magnitude, même answertest/testoptions que
  // la version sans unité). Score 0.5+0.5.
  function _unitizeStep(def) {
    if (!unitRaw) return def;
    var inputName = def.inputName;
    var tansExpr = def.tans;
    var magTest = (def.test === 'NumAbsolute') ? 'UnitsAbsolute' : 'UnitsRelative';
    var magOpts = def.opts;
    var unitTans = `${tansExpr}*(${unitRaw})`;
    var eleveVar = 'eleve_unit_' + inputName;
    var teachVar = 'teacher_unit_' + inputName;
    var fbVars = `stud_si_${inputName} : stack_unit_si_to_si_base(${inputName});
teach_si_${inputName} : stack_unit_si_to_si_base(${unitTans});
v_pure_e_${inputName} : subst(map(lambda([u], u=1), listofvars(stud_si_${inputName})), stud_si_${inputName});
v_pure_t_${inputName} : subst(map(lambda([u], u=1), listofvars(teach_si_${inputName})), teach_si_${inputName});
${eleveVar} : 2 * stud_si_${inputName} / v_pure_e_${inputName};
${teachVar} : 2 * teach_si_${inputName} / v_pure_t_${inputName};`;
    var nodes = [
      {
        name: '0', description: '', answertest: 'UnitsAbsolute', sans: eleveVar, tans: teachVar, testoptions: '0', quiet: '0',
        truescoremode: '+', truescore: '0.5', truepenalty: '', truenextnode: '1',
        trueanswernote: `PRT-${X}-${def.key}-dim-OK`, truefeedback: '',
        falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
        falseanswernote: `PRT-${X}-${def.key}-dim-NOK`,
        falsefeedback: I18N_D.t('inc.fb_ecr_unite_wrong', {unitvar: teachVar + '/2'})
      },
      {
        name: '1', description: '', answertest: magTest, sans: inputName, tans: unitTans, testoptions: magOpts, quiet: '0',
        truescoremode: '+', truescore: '0.5', truepenalty: '', truenextnode: '-1',
        trueanswernote: `PRT-${X}-${def.key}-mag-OK`, truefeedback: fbOkStep(def.fbOkKey),
        falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
        falseanswernote: `PRT-${X}-${def.key}-mag-NOK`,
        falsefeedback: fbWrongStep(def.fbWrongKey, unitTans)
      }
    ];
    return {
      key: def.key, prtName: def.prtName, customNodes: nodes, feedbackvariables: fbVars,
      rawInputXML: `    <input>\n      <name>${inputName}</name><type>units</type><tans>${unitTans}</tans>\n      <mustverify>0</mustverify><showvalidation>0</showvalidation>\n    </input>`,
      textFrag: def.textFrag
    };
  }
  var ecritureFormat = (p.ecritureFormat === 'encadrement') ? 'encadrement' : 'pm';
  var ecrLabel = ecritureFormat === 'encadrement'
    ? (I18N_D.t('inc.ecriture_label_encadrement') || 'Écriture du résultat (encadrement) :')
    : (I18N_D.t('inc.ecriture_label') || 'Écriture du résultat :');

  // Format "pm" : le "±" est du texte FIXE dans l'énoncé. La valeur et
  // l'incertitude sont 2 champs numériques simples (NumAbsolute), toujours.
  // Si une unité EST définie sur la grandeur, un 3e champ natif STACK
  // `units` est ajouté, partagé entre les 2 (l'élève ne l'écrit qu'une
  // fois) — design confirmé par l'utilisateur (3 champs, pas 2×`units`).
  // Sa dimension est vérifiée par 1 seul nœud UnitsAbsolute, via l'astuce
  // ×2 (déjà utilisée dans js/gen-units.js) qui isole la dimension pure et
  // rend la comparaison indépendante de la magnitude écrite par l'élève.
  // Les 3 champs sont notés indépendamment (l'échec de l'un ne bloque pas
  // la notation des autres) : chaînage systématique vers le nœud suivant.
  function _ecrPmDefs() {
    var unitRaw = ((p.context || {}).unite || '').trim();
    function fbEcrOk(key) {
      return `<strong>${I18N_D.t('inc.fb_ecr_' + key + '_ok')}</strong>`;
    }
    function fbEcrWrong(key, tavar) {
      return I18N_D.t('inc.fb_ecr_' + key + '_wrong', {tavar: tavar});
    }

    var valScore = unitRaw ? '1/3' : '0.5';
    var uncScore = unitRaw ? '1/3' : '0.5';
    var uncNextNode = unitRaw ? '2' : '-1';
    var nodes = [
      {
        name: '0', description: I18N_D.t('inc.node_ecriture_val') || 'Écriture finale — valeur',
        answertest: 'NumAbsolute', sans: `ans_ecrval${X}`, tans: `q${X}_moy_r`, testoptions: `q${X}_scale/2`, quiet: '0',
        truescoremode: '+', truescore: valScore, truepenalty: '', truenextnode: '1',
        trueanswernote: `PRT-${X}-ecr-val-OK`, truefeedback: fbEcrOk('valeur'),
        falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '1',
        falseanswernote: `PRT-${X}-ecr-val-NOK`, falsefeedback: fbEcrWrong('valeur', `q${X}_moy_r`)
      },
      {
        name: '1', description: I18N_D.t('inc.node_ecriture_unc') || 'Écriture finale — incertitude',
        answertest: 'NumAbsolute', sans: `ans_ecrunc${X}`, tans: `q${X}_U`, testoptions: `q${X}_scale/2`, quiet: '0',
        truescoremode: '+', truescore: uncScore, truepenalty: '', truenextnode: uncNextNode,
        trueanswernote: `PRT-${X}-ecr-unc-OK`, truefeedback: fbEcrOk('incertitude'),
        falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: uncNextNode,
        falseanswernote: `PRT-${X}-ecr-unc-NOK`, falsefeedback: fbEcrWrong('incertitude', `q${X}_U`)
      }
    ];

    if (!unitRaw) {
      return [{
        key: 'ecriture', prtName: `prt${X}_ecr`, customNodes: nodes, feedbackvariables: '',
        rawInputXML:
          `    <input>\n      <name>ans_ecrval${X}</name>\n      <type>numerical</type>\n      <tans>q${X}_moy_r</tans>\n      <boxsize>8</boxsize>\n      <forbidfloat>0</forbidfloat>\n      <mustverify>0</mustverify>\n      <showvalidation>0</showvalidation>\n      <options></options>\n    </input>\n` +
          `    <input>\n      <name>ans_ecrunc${X}</name>\n      <type>numerical</type>\n      <tans>q${X}_U</tans>\n      <boxsize>8</boxsize>\n      <forbidfloat>0</forbidfloat>\n      <mustverify>0</mustverify>\n      <showvalidation>0</showvalidation>\n      <options></options>\n    </input>`,
        textFrag: `<p>${ecrLabel} \\(${symb}=\\) [[input:ans_ecrval${X}]] \\(\\pm\\) [[input:ans_ecrunc${X}]]</p>`
      }];
    }

    nodes.push({
      name: '2', description: I18N_D.t('inc.node_ecriture_unit') || 'Écriture finale — unité',
      answertest: 'UnitsAbsolute', sans: `eleve_unit${X}`, tans: `teacher_unit${X}`, testoptions: '0', quiet: '0',
      truescoremode: '+', truescore: '1/3', truepenalty: '', truenextnode: '-1',
      trueanswernote: `PRT-${X}-ecr-unite-OK`, truefeedback: fbEcrOk('unite'),
      falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
      falseanswernote: `PRT-${X}-ecr-unite-NOK`, falsefeedback: fbEcrWrong('unite', `teacher_unit${X}/2`)
    });

    var fbVars = `stud_si_unit${X} : stack_unit_si_to_si_base(ans_ecrunit${X});
teach_si_unit${X} : stack_unit_si_to_si_base(q${X}_ecrunit_ta);
v_pure_e_unit${X} : subst(map(lambda([u], u=1), listofvars(stud_si_unit${X})), stud_si_unit${X});
v_pure_t_unit${X} : subst(map(lambda([u], u=1), listofvars(teach_si_unit${X})), teach_si_unit${X});
eleve_unit${X} : 2 * stud_si_unit${X} / v_pure_e_unit${X};
teacher_unit${X} : 2 * teach_si_unit${X} / v_pure_t_unit${X};`;

    return [{
      key: 'ecriture', prtName: `prt${X}_ecr`, customNodes: nodes, feedbackvariables: fbVars,
      rawInputXML:
        `    <input>\n      <name>ans_ecrval${X}</name>\n      <type>numerical</type>\n      <tans>q${X}_moy_r</tans>\n      <boxsize>8</boxsize>\n      <forbidfloat>0</forbidfloat>\n      <mustverify>0</mustverify>\n      <showvalidation>0</showvalidation>\n      <options></options>\n    </input>\n` +
        `    <input>\n      <name>ans_ecrunc${X}</name>\n      <type>numerical</type>\n      <tans>q${X}_U</tans>\n      <boxsize>8</boxsize>\n      <forbidfloat>0</forbidfloat>\n      <mustverify>0</mustverify>\n      <showvalidation>0</showvalidation>\n      <options></options>\n    </input>\n` +
        `    <input>\n      <name>ans_ecrunit${X}</name><type>units</type><tans>q${X}_ecrunit_ta</tans>\n      <mustverify>0</mustverify><showvalidation>0</showvalidation>\n    </input>`,
      textFrag: `<p>${ecrLabel} \\(${symb}=\\) [[input:ans_ecrval${X}]] \\(\\pm\\) [[input:ans_ecrunc${X}]] [[input:ans_ecrunit${X}]]</p><div style="font-size:.78rem;color:#6b7280;margin-top:2px;">${I18N_D.t('inc.ecriture_pm_help_unit') || "L'unité s'écrit dans son propre champ ; elle est comparée en base SI."}</div>`
    }];
  }

  var all = [
    {
      key: 'moyenne', prtName: `prt${X}_moy`, inputName: `ans_moy${X}`,
      desc: I18N_D.t('inc.node_moyenne') || 'Moyenne', test: 'NumRelative', tans: `q${X}_moy`,
      opts: String(p.moyenneTolerance != null && p.moyenneTolerance !== '' ? p.moyenneTolerance : 0.01),
      fbOk: fbOkStep('moyenne'), fbWrong: fbWrongStep('moyenne', `q${X}_moy`), fbWrongKey: 'moyenne', fbOkKey: 'moyenne',
      inputOpts: { name: `ans_moy${X}`, tans: `q${X}_moy`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: isPropagation
        ? `<p>\\(${symb}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`
        : `<p>\\(\\bar{${symb}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`
    },
    {
      key: 's', prtName: `prt${X}_s`, inputName: `ans_s${X}`,
      desc: I18N_D.t('inc.node_s') || 'Écart-type échantillon', test: 'NumRelative', tans: `q${X}_s`, opts: '0.01',
      fbOk: fbOkStep('s'), fbWrong: fbWrongStep('s', `q${X}_s`), fbWrongKey: 's', fbOkKey: 's',
      inputOpts: { name: `ans_s${X}`, tans: `q${X}_s`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(s=\\) [[input:ans_s${X}]] [[validation:ans_s${X}]]</p>`
    },
    {
      key: 'uA', prtName: `prt${X}_uA`, inputName: `ans_ua${X}`,
      desc: I18N_D.t('inc.node_uA') || 'Incertitude-type A', test: 'NumRelative', tans: `q${X}_uA`, opts: '0.01',
      fbOk: fbOkStep('uA'), fbWrong: fbWrongStep('uA', `q${X}_uA`), fbWrongKey: 'uA', fbOkKey: 'uA',
      inputOpts: { name: `ans_ua${X}`, tans: `q${X}_uA`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(u_A(${symb})=\\) [[input:ans_ua${X}]] [[validation:ans_ua${X}]]</p>`
    },
    {
      key: 'uB', prtName: `prt${X}_uB`, inputName: `ans_ub${X}`,
      desc: I18N_D.t('inc.node_uB') || 'Incertitude-type B', test: 'NumRelative', tans: `q${X}_uB`, opts: '0.01',
      fbOk: fbOkStep('uB'), fbWrong: fbWrongStep('uB_' + uBSource, `q${X}_uB`), fbWrongKey: 'uB_' + uBSource, fbOkKey: 'uB',
      inputOpts: { name: `ans_ub${X}`, tans: `q${X}_uB`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(u_B(${symb})=\\) [[input:ans_ub${X}]] [[validation:ans_ub${X}]]</p>`
    },
    {
      key: 'uc', prtName: `prt${X}_uc`, inputName: `ans_uc${X}`,
      desc: I18N_D.t('inc.node_uc') || 'Incertitude composée', test: 'NumRelative', tans: `q${X}_uc`, opts: '0.01',
      fbOk: fbOkStep('uc'), fbWrong: fbWrongStep('uc', `q${X}_uc`), fbWrongKey: 'uc', fbOkKey: 'uc',
      inputOpts: { name: `ans_uc${X}`, tans: `q${X}_uc`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(u_c(${symb})=\\) [[input:ans_uc${X}]] [[validation:ans_uc${X}]]</p>`
    },
    {
      key: 'U', prtName: `prt${X}_U`, inputName: `ans_U${X}`,
      desc: I18N_D.t('inc.node_U') || 'Incertitude élargie', test: 'NumAbsolute', tans: `q${X}_U`, opts: `q${X}_scale/2`,
      fbOk: fbOkStep('U'), fbWrong: fbWrongStep('U', `q${X}_U`), fbWrongKey: 'U', fbOkKey: 'U',
      inputOpts: { name: `ans_U${X}`, tans: `q${X}_U`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(U(${symb})=\\) [[input:ans_U${X}]] [[validation:ans_U${X}]] <em>(k=${k})</em></p>`
    },
  ];

  all = all.map(_unitizeStep);

  if (ecritureFormat === 'pm') {
    all = all.concat(_ecrPmDefs());
  } else {
    all.push({
      key: 'ecriture', prtName: `prt${X}_ecr`, inputName: `ans_ecr${X}`,
      desc: I18N_D.t('inc.node_ecriture') || 'Écriture finale du résultat', test: 'RegExp', tans: `q${X}_ecr_regex`, opts: '',
      fbOk: fbOk, fbWrong: I18N_D.t('inc.fb_wrong_ecr', {tavar: `q${X}_ecr_attendue`}) || `Incorrect. Réponse attendue : {@q${X}_ecr_attendue@}`,
      inputOpts: { name: `ans_ecr${X}`, tans: `q${X}_ecr_attendue`, type: 'string', boxsize: 26, forbidfloat: 0, insertstars: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 },
      textFrag: `<p>${ecrLabel} [[input:ans_ecr${X}]] [[validation:ans_ecr${X}]]</p>`
    });
  }

  // En mode "grandeur composée" (propagation), il n'y a ni mesures répétées ni
  // séparation Type A/Type B à faire deviner à l'élève : seules moyenne (=Y0),
  // uc (=u(Y)), U et écriture restent pertinentes.
  return isPropagation ? all.filter(function (d) { return d.key !== 's' && d.key !== 'uA' && d.key !== 'uB'; }) : all;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _incStepDefs: _incStepDefs };
}
