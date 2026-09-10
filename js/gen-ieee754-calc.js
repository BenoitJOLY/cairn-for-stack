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

// ── GÉNÉRATEUR "Norme IEEE 754 (mantisse binaire)" (NSI) — helper Maxima pur ──
// Premier type NSI de l'app, gabarit suivi : js/gen-chi2-calc.js (tirage natif
// Maxima via rand() sur une liste configurable, une seule sous-question). On
// demande d'écrire la mantisse d'un nombre x (fraction exacte de ]0,1[,
// puisque Maxima gère mal les flottants décimaux non exacts) tronquée à n
// bits, sous forme de somme de puissances de 2 — n'importe quelle écriture
// algébriquement équivalente est acceptée (c'est tout l'intérêt de STACK/CAS
// ici : le prof ne fige pas une seule forme d'écriture).
// tans = floor(x*2^n)/2^n (troncature exacte, sans arrondi, à n bits).
// Piège classique diagnostiqué : oublier le dernier terme (poids le plus
// faible, 2^-n) — équivalent à s'être arrêté à n-1 bits.
function _fltVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var xRaw = (g.xList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var nBits = parseInt(g.nBits, 10);
  if (xRaw.length < 1) throw new Error('IEEE 754 : indiquez au moins une valeur x possible (fraction exacte entre 0 et 1).');
  if (!nBits || nBits < 2) throw new Error('IEEE 754 : indiquez un nombre de bits de mantisse (entier ≥ 2).');

  return `/* Q${X} Norme IEEE 754 - mantisse binaire tronquee (tirage natif Maxima) */
q${X}_flt_xlist: [${xRaw.join(',')}]$
q${X}_flt_x: rand(q${X}_flt_xlist)$
q${X}_flt_n: ${nBits}$
q${X}_flt_tans: floor(q${X}_flt_x*2^q${X}_flt_n)/2^q${X}_flt_n$
q${X}_flt_errshort: floor(q${X}_flt_x*2^(q${X}_flt_n-1))/2^(q${X}_flt_n-1)$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _fltVars: _fltVars };
}
