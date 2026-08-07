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

// ── Définitions des 7 étapes d'évaluation cochables du type "incertitude" ──
// Pure vue/déclaratif (texte + config d'input), aucune isolation à respecter
// entre étapes puisqu'aucune ne dépend d'une autre — consommé par
// js/gen-incertitude.js (genIncertitudeCore), qui filtre selon p.steps.

function _incStepDefs(X, symb, unite, p, I18N_D) {
  var k = (parseInt((p.rounding||{}).k) === 2) ? 2 : 1;
  var fbOk = `<strong>${I18N_D.t('mat.fb_ok_correct') || 'Correct !'}</strong>`;
  function fbWrong(varName) {
    return I18N_D.t('inc.fb_wrong', {tavar: varName}) || `Incorrect. Valeur attendue : {@${varName}@}`;
  }

  return [
    {
      key: 'moyenne', prtName: `prt${X}_moy`, inputName: `ans_moy${X}`,
      desc: I18N_D.t('inc.node_moyenne') || 'Moyenne', test: 'NumRelative', tans: `q${X}_moy`,
      opts: String(p.moyenneTolerance != null && p.moyenneTolerance !== '' ? p.moyenneTolerance : 0.01),
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_moy`),
      inputOpts: { name: `ans_moy${X}`, tans: `q${X}_moy`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(\\bar{${symb}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`
    },
    {
      key: 's', prtName: `prt${X}_s`, inputName: `ans_s${X}`,
      desc: I18N_D.t('inc.node_s') || 'Écart-type échantillon', test: 'NumRelative', tans: `q${X}_s`, opts: '0.01',
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_s`),
      inputOpts: { name: `ans_s${X}`, tans: `q${X}_s`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(s=\\) [[input:ans_s${X}]] [[validation:ans_s${X}]]</p>`
    },
    {
      key: 'uA', prtName: `prt${X}_uA`, inputName: `ans_ua${X}`,
      desc: I18N_D.t('inc.node_uA') || 'Incertitude-type A', test: 'NumRelative', tans: `q${X}_uA`, opts: '0.01',
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_uA`),
      inputOpts: { name: `ans_ua${X}`, tans: `q${X}_uA`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(u_A(${symb})=\\) [[input:ans_ua${X}]] [[validation:ans_ua${X}]]</p>`
    },
    {
      key: 'uB', prtName: `prt${X}_uB`, inputName: `ans_ub${X}`,
      desc: I18N_D.t('inc.node_uB') || 'Incertitude-type B', test: 'NumRelative', tans: `q${X}_uB`, opts: '0.01',
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_uB`),
      inputOpts: { name: `ans_ub${X}`, tans: `q${X}_uB`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(u_B(${symb})=\\) [[input:ans_ub${X}]] [[validation:ans_ub${X}]]</p>`
    },
    {
      key: 'uc', prtName: `prt${X}_uc`, inputName: `ans_uc${X}`,
      desc: I18N_D.t('inc.node_uc') || 'Incertitude composée', test: 'NumRelative', tans: `q${X}_uc`, opts: '0.01',
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_uc`),
      inputOpts: { name: `ans_uc${X}`, tans: `q${X}_uc`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(u_c(${symb})=\\) [[input:ans_uc${X}]] [[validation:ans_uc${X}]]</p>`
    },
    {
      key: 'U', prtName: `prt${X}_U`, inputName: `ans_U${X}`,
      desc: I18N_D.t('inc.node_U') || 'Incertitude élargie', test: 'NumAbsolute', tans: `q${X}_U`, opts: `q${X}_scale/2`,
      fbOk: fbOk, fbWrong: fbWrong(`q${X}_U`),
      inputOpts: { name: `ans_U${X}`, tans: `q${X}_U`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 },
      textFrag: `<p>\\(U(${symb})=\\) [[input:ans_U${X}]] [[validation:ans_U${X}]] <em>(k=${k})</em></p>`
    },
    {
      key: 'ecriture', prtName: `prt${X}_ecr`, inputName: `ans_ecr${X}`,
      desc: I18N_D.t('inc.node_ecriture') || 'Écriture finale du résultat', test: 'RegExp', tans: `q${X}_ecr_regex`, opts: '',
      fbOk: fbOk, fbWrong: I18N_D.t('inc.fb_wrong_ecr', {tavar: `q${X}_ecr_attendue`}) || `Incorrect. Réponse attendue : {@q${X}_ecr_attendue@}`,
      inputOpts: { name: `ans_ecr${X}`, tans: `q${X}_ecr_attendue`, type: 'string', boxsize: 26, forbidfloat: 0, insertstars: 0, checkanswertype: 0, mustverify: 0, showvalidation: 0 },
      textFrag: `<p>${I18N_D.t('inc.ecriture_label') || 'Écriture du résultat :'} [[input:ans_ecr${X}]] [[validation:ans_ecr${X}]]</p>`
    }
  ];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _incStepDefs: _incStepDefs };
}
