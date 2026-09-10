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

// ── GÉNÉRATEUR "Potentiel de repos (équation de Nernst)" (SVT) — helper Maxima pur ──
// Onzième type SVT de l'app, gabarit suivi : js/gen-chi2-calc.js / js/gen-malthus-calc.js
// (tirage natif Maxima via rand() sur des listes configurables par l'enseignant,
// une seule sous-question). Gabarit hand-XML déjà validé : svt-11-nernst.xml.
// Piège classique diagnostiqué : concentrations extra/intracellulaires inversées
// dans le rapport (le signe du potentiel devient positif au lieu de négatif).
function _nstVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var extRaw = (g.kextList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var intRaw = (g.kintList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (extRaw.length < 1) throw new Error('Potentiel de Nernst : indiquez au moins une concentration extracellulaire possible.');
  if (intRaw.length < 1) throw new Error('Potentiel de Nernst : indiquez au moins une concentration intracellulaire possible.');

  return `/* Q${X} Potentiel de repos - equation de Nernst simplifiee (tirage natif Maxima) */
q${X}_nst_kextlist: [${extRaw.join(',')}]$
q${X}_nst_kext: rand(q${X}_nst_kextlist)$
q${X}_nst_kintlist: [${intRaw.join(',')}]$
q${X}_nst_kint: rand(q${X}_nst_kintlist)$
q${X}_nst_ecorrect: 60*log(q${X}_nst_kext/q${X}_nst_kint)/log(10)$
q${X}_nst_errinverted: 60*log(q${X}_nst_kint/q${X}_nst_kext)/log(10)$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _nstVars: _nstVars };
}
