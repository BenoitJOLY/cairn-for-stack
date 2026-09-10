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

// ── GÉNÉRATEUR "Système du premier ordre — erreur statique" (SI) — helper
// Maxima pur ──
// Troisième type SI de l'app (catégorie "Physique"), gabarit suivi :
// js/gen-ieee754-calc.js (tirage natif Maxima via rand() sur des listes
// configurables, une seule sous-question). Scénario svt.txt : un système
// asservi du premier ordre H(p) = K/(1+τp) de gain statique K reçoit en
// entrée un échelon d'amplitude E0. L'erreur statique en régime permanent
// vaut err = E0*(1-K) — elle ne dépend pas de τ (constante de temps), qui
// n'influe que sur la rapidité, pas sur le régime permanent.
// Piège classique diagnostiqué : confondre l'erreur statique avec la valeur
// finale de la sortie, qui vaut E0*K.
function _pmoVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var kRaw = (g.kList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var e0Raw = (g.e0List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (kRaw.length < 1) throw new Error('Système du premier ordre : indiquez au moins un gain statique K possible.');
  if (e0Raw.length < 1) throw new Error('Système du premier ordre : indiquez au moins une amplitude d\'échelon E0 possible.');

  return `/* Q${X} Systeme premier ordre - erreur statique (tirage natif Maxima) */
q${X}_pmo_klist: [${kRaw.join(',')}]$
q${X}_pmo_k: rand(q${X}_pmo_klist)$
q${X}_pmo_e0list: [${e0Raw.join(',')}]$
q${X}_pmo_e0: rand(q${X}_pmo_e0list)$
q${X}_pmo_tans: q${X}_pmo_e0*(1-q${X}_pmo_k)$
q${X}_pmo_errfinal: q${X}_pmo_e0*q${X}_pmo_k$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _pmoVars: _pmoVars };
}
