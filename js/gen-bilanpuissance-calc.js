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

// ── GÉNÉRATEUR "Bilan de puissance et rendement global" (SI) — helper Maxima pur ──
// Premier type SI de l'app (catégorie "Physique"), gabarit suivi :
// js/gen-ieee754-calc.js (tirage natif Maxima via rand() sur des listes
// configurables, une seule sous-question). Scénario svt.txt : un ascenseur de
// masse m atteint une vitesse v, entraîné par un moteur de rendement etaMot à
// travers un réducteur de rendement etaRed ; on demande la puissance
// électrique absorbée Pabs = m*g*v/(etaRed*etaMot).
// g = 9,81 m/s² est une constante fixe (981/100, fraction exacte).
// Pièges classiques diagnostiqués :
//  - oubli du facteur g (erreur d'homogénéité) : m*v/(etaRed*etaMot) ;
//  - rendements multipliés au lieu d'être divisés (un rendement < 1 doit
//    augmenter la puissance à fournir, pas la diminuer) : m*g*v*etaRed*etaMot.
function _bpuVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var mRaw = (g.mList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var vRaw = (g.vList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var erRaw = (g.etaRedList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var emRaw = (g.etaMotList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (mRaw.length < 1) throw new Error('Bilan de puissance : indiquez au moins une masse m possible (kg).');
  if (vRaw.length < 1) throw new Error('Bilan de puissance : indiquez au moins une vitesse v possible (m/s).');
  if (erRaw.length < 1) throw new Error('Bilan de puissance : indiquez au moins un rendement de réducteur possible (entre 0 et 1).');
  if (emRaw.length < 1) throw new Error('Bilan de puissance : indiquez au moins un rendement de moteur possible (entre 0 et 1).');

  return `/* Q${X} Bilan de puissance - rendement global (tirage natif Maxima) */
q${X}_bpu_mlist: [${mRaw.join(',')}]$
q${X}_bpu_m: rand(q${X}_bpu_mlist)$
q${X}_bpu_vlist: [${vRaw.join(',')}]$
q${X}_bpu_v: rand(q${X}_bpu_vlist)$
q${X}_bpu_erlist: [${erRaw.join(',')}]$
q${X}_bpu_etared: rand(q${X}_bpu_erlist)$
q${X}_bpu_emlist: [${emRaw.join(',')}]$
q${X}_bpu_etamot: rand(q${X}_bpu_emlist)$
q${X}_bpu_g: 981/100$
q${X}_bpu_tans: q${X}_bpu_m*q${X}_bpu_g*q${X}_bpu_v/(q${X}_bpu_etared*q${X}_bpu_etamot)$
q${X}_bpu_errnog: q${X}_bpu_m*q${X}_bpu_v/(q${X}_bpu_etared*q${X}_bpu_etamot)$
q${X}_bpu_errinv: q${X}_bpu_m*q${X}_bpu_g*q${X}_bpu_v*q${X}_bpu_etared*q${X}_bpu_etamot$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _bpuVars: _bpuVars };
}
