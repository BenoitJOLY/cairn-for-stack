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

// ── GÉNÉRATEUR "Dénombrement sur les arbres binaires complets" (NSI) — helper Maxima pur ──
// Troisième type NSI de l'app, gabarit suivi : js/gen-chi2-calc.js (tirage
// natif Maxima via rand() sur une liste configurable, une seule sous-
// question). Arbre binaire complet de hauteur h (racine à la profondeur 0) :
// nombre total de noeuds = 2^(h+1) - 1 = somme des 2^k pour k=0..h. Piège
// classique diagnostiqué : confondre avec 2^h - 1 (erreur liée à la
// définition de la hauteur, comme si la racine était à la profondeur 1).
function _arbVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var hRaw = (g.hList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (hRaw.length < 1) throw new Error('Arbres binaires : indiquez au moins une hauteur h possible (entier ≥ 1).');

  return `/* Q${X} Denombrement arbres binaires complets (tirage natif Maxima) */
q${X}_arb_hlist: [${hRaw.join(',')}]$
q${X}_arb_h: rand(q${X}_arb_hlist)$
q${X}_arb_tans: 2^(q${X}_arb_h+1)-1$
q${X}_arb_errdef: 2^q${X}_arb_h-1$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _arbVars: _arbVars };
}
