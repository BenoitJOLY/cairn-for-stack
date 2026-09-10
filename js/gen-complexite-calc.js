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

// ── GÉNÉRATEUR "Complexité algorithmique (dichotomie)" (NSI) — helper Maxima pur ──
// Deuxième type NSI de l'app, gabarit suivi : js/gen-chi2-calc.js (tirage
// natif Maxima via rand() sur une liste configurable, une seule sous-
// question). Le scénario pédagogique (recherche dichotomique dans un tableau
// trié de taille n) est un invariant fixe ; seule la taille n est tirée
// aléatoirement, dans une liste de puissances de 2 configurée par
// l'enseignant (pour que log2(n) tombe juste). Deux pièges classiques
// diagnostiqués : confondre avec la recherche séquentielle (n/2 comparaisons
// en moyenne) et inverser logarithme/exponentielle (2^n).
function _cpaVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var nRaw = (g.nList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (nRaw.length < 1) throw new Error('Complexité algorithmique : indiquez au moins une taille de tableau n possible (idéalement une puissance de 2).');

  return `/* Q${X} Complexite algorithmique - dichotomie (tirage natif Maxima) */
q${X}_cpa_nlist: [${nRaw.join(',')}]$
q${X}_cpa_n: rand(q${X}_cpa_nlist)$
q${X}_cpa_tans: log(q${X}_cpa_n)/log(2)$
q${X}_cpa_errseq: q${X}_cpa_n/2$
q${X}_cpa_errexp: 2^q${X}_cpa_n$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _cpaVars: _cpaVars };
}
