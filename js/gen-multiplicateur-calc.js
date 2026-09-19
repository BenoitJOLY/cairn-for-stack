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

// ── GÉNÉRATEUR "Multiplicateur keynésien" (Économie) — helper Maxima pur ──
// Gabarit suivi : js/gen-bilanpuissance-calc.js. Une relance autonome de la
// demande ΔI0 se propage dans l'économie via la propension marginale à
// consommer c ; on demande la variation totale de production ΔY = ΔI0/(1-c).
// Pièges classiques diagnostiqués :
//  - oublier le « 1 - » au dénominateur (confondre le multiplicateur avec
//    1/c) : ΔI0/c ;
//  - ne calculer que le premier tour de relance (la consommation induite
//    immédiate), sans cumuler les tours suivants : ΔI0*c.
function _mulVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var cRaw = (g.cList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var diRaw = (g.diList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (cRaw.length < 1) throw new Error('Multiplicateur keynésien : indiquez au moins une propension marginale à consommer c possible (entre 0 et 1).');
  if (diRaw.length < 1) throw new Error('Multiplicateur keynésien : indiquez au moins une variation autonome de la demande ΔI0 possible.');

  return `/* Q${X} Multiplicateur keynesien (tirage natif Maxima) */
q${X}_mul_clist: [${cRaw.join(',')}]$
q${X}_mul_c: rand(q${X}_mul_clist)$
q${X}_mul_dilist: [${diRaw.join(',')}]$
q${X}_mul_di0: rand(q${X}_mul_dilist)$
q${X}_mul_tans: q${X}_mul_di0/(1-q${X}_mul_c)$
q${X}_mul_errc: q${X}_mul_di0/q${X}_mul_c$
q${X}_mul_erroneround: q${X}_mul_di0*q${X}_mul_c$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _mulVars: _mulVars };
}
