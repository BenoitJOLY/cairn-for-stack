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

// ── GÉNÉRATEUR "Kirchhoff / Thévenin (résistance équivalente, courant)" (SI)
// — helper Maxima pur ──
// Deuxième type SI de l'app (catégorie "Physique"), gabarit suivi :
// js/gen-ieee754-calc.js (tirage natif Maxima via rand() sur des listes
// configurables, une seule sous-question). Scénario svt.txt : une source de
// tension E alimente deux résistances R1 et R2 en parallèle, l'ensemble
// alimentant une résistance R3 en série. On demande le courant I3 dans R3, en
// modélisant {E,R1,R2} par son équivalent de Thévenin vu des bornes de R3 :
//   Eth = E*R2/(R1+R2)  (diviseur de tension à vide)
//   Rth = R1*R2/(R1+R2) (résistance équivalente, générateur éteint)
//   I3  = Eth/(Rth+R3)
// Pièges classiques diagnostiqués :
//  - tension de Thévenin confondue avec la tension de la source (oubli du
//    diviseur de tension) : E/(Rth+R3) ;
//  - résistance de Thévenin calculée comme si R1 et R2 étaient en série au
//    lieu d'en parallèle : Eth/(R1+R2+R3).
function _thvVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var eRaw = (g.eList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var r1Raw = (g.r1List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var r2Raw = (g.r2List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var r3Raw = (g.r3List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (eRaw.length < 1) throw new Error('Thévenin : indiquez au moins une tension de source E possible (V).');
  if (r1Raw.length < 1) throw new Error('Thévenin : indiquez au moins une résistance R1 possible (Ω).');
  if (r2Raw.length < 1) throw new Error('Thévenin : indiquez au moins une résistance R2 possible (Ω).');
  if (r3Raw.length < 1) throw new Error('Thévenin : indiquez au moins une résistance R3 possible (Ω).');

  return `/* Q${X} Kirchhoff-Thevenin - courant dans R3 (tirage natif Maxima) */
q${X}_thv_elist: [${eRaw.join(',')}]$
q${X}_thv_e: rand(q${X}_thv_elist)$
q${X}_thv_r1list: [${r1Raw.join(',')}]$
q${X}_thv_r1: rand(q${X}_thv_r1list)$
q${X}_thv_r2list: [${r2Raw.join(',')}]$
q${X}_thv_r2: rand(q${X}_thv_r2list)$
q${X}_thv_r3list: [${r3Raw.join(',')}]$
q${X}_thv_r3: rand(q${X}_thv_r3list)$
q${X}_thv_eth: q${X}_thv_e*q${X}_thv_r2/(q${X}_thv_r1+q${X}_thv_r2)$
q${X}_thv_rth: q${X}_thv_r1*q${X}_thv_r2/(q${X}_thv_r1+q${X}_thv_r2)$
q${X}_thv_tans: q${X}_thv_eth/(q${X}_thv_rth+q${X}_thv_r3)$
q${X}_thv_errnodiv: q${X}_thv_e/(q${X}_thv_rth+q${X}_thv_r3)$
q${X}_thv_errseries: q${X}_thv_eth/(q${X}_thv_r1+q${X}_thv_r2+q${X}_thv_r3)$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _thvVars: _thvVars };
}
