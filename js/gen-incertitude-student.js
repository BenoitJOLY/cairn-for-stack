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

// ── Table de Student (bilatérale) — coefficients t critiques classiques ──
// ν (degrés de liberté = n-1) de 1 à 30, colonnes 90% / 95% / 99%. Au-delà de
// ν=30 on réutilise la ligne ν=30 (convergence rapide vers la loi normale —
// approximation usuelle en enseignement, cf. spec : "Ignoré (n>30)").
// Table de référence standard (tout ouvrage de statistiques) reprise ici en
// JS plutôt qu'en Maxima : Règle 0 DSTU (zéro improvisation) interdit
// d'utiliser une fonction CAS non documentée/vérifiée dans le sandbox STACK
// (ex. load(distrib)$ + quantile_student_t(), jamais éprouvé ici) — n est de
// toute façon un littéral connu côté JS au moment de la génération (jamais
// randomisé), donc le calcul se fait ici et le résultat est injecté en dur
// dans q${X}_k, exactement comme round()/ceiling() dans _incRoundingVars.
var _INC_STUDENT_TABLE = {
  90: [6.314,2.920,2.353,2.132,2.015,1.943,1.895,1.860,1.833,1.812,1.796,1.782,1.771,1.761,1.753,1.746,1.740,1.734,1.729,1.725,1.721,1.717,1.714,1.711,1.708,1.706,1.703,1.701,1.699,1.697],
  95: [12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,2.093,2.086,2.080,2.074,2.069,2.064,2.060,2.056,2.052,2.048,2.045,2.042],
  99: [63.657,9.925,5.841,4.604,4.032,3.707,3.499,3.355,3.250,3.169,3.106,3.055,3.012,2.977,2.947,2.921,2.898,2.878,2.861,2.845,2.831,2.819,2.807,2.797,2.787,2.779,2.771,2.763,2.756,2.750]
};

function _incStudentConfidence(confidence) {
  var c = parseInt(confidence);
  return (c === 90 || c === 99) ? c : 95;
}

function _incStudentDf(n) {
  return Math.max(1, Math.min(30, (parseInt(n) || 2) - 1));
}

function _incStudentFactor(n, confidence) {
  var col = _INC_STUDENT_TABLE[_incStudentConfidence(confidence)];
  return col[_incStudentDf(n) - 1];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _incStudentFactor: _incStudentFactor, _incStudentConfidence: _incStudentConfidence, _incStudentDf: _incStudentDf, _INC_STUDENT_TABLE: _INC_STUDENT_TABLE };
}
