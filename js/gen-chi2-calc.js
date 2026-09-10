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

// ── GÉNÉRATEUR "Test du χ² en écologie" (SVT) — helper Maxima pur ──
// Neuvième type SVT de l'app, gabarit suivi : js/gen-ondesismique-calc.js /
// js/gen-malthus-calc.js (tirage natif Maxima via rand() sur des listes
// configurables par l'enseignant, une seule sous-question). Gabarit hand-XML
// déjà validé : svt-09-chi2-ecologie.xml. La répartition théorique attendue
// (40%/30%/20%/10% sur 4 espèces) est un invariant du scénario pédagogique et
// reste fixe ; seuls l'effectif total et les écarts d'effectif observés (donc
// le χ² obtenu) sont configurables via les listes de tirage ci-dessous.
function _chiVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var nRaw = (g.nList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var dRaw = (g.dList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var eRaw = (g.eList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (nRaw.length < 1) throw new Error('Test du χ² : indiquez au moins un effectif total possible.');
  if (dRaw.length < 1) throw new Error('Test du χ² : indiquez au moins un écart possible pour les espèces A/B.');
  if (eRaw.length < 1) throw new Error('Test du χ² : indiquez au moins un écart possible pour les espèces C/D.');

  return `/* Q${X} Test du chi2 en ecologie (tirage natif Maxima) */
q${X}_chi_nlist: [${nRaw.join(',')}]$
q${X}_chi_ntotal: rand(q${X}_chi_nlist)$
q${X}_chi_t1: q${X}_chi_ntotal*2/5$
q${X}_chi_t2: q${X}_chi_ntotal*3/10$
q${X}_chi_t3: q${X}_chi_ntotal*1/5$
q${X}_chi_t4: q${X}_chi_ntotal*1/10$
q${X}_chi_dlist: [${dRaw.join(',')}]$
q${X}_chi_ddev: rand(q${X}_chi_dlist)$
q${X}_chi_elist: [${eRaw.join(',')}]$
q${X}_chi_edev: rand(q${X}_chi_elist)$
q${X}_chi_o1: q${X}_chi_t1+q${X}_chi_ddev$
q${X}_chi_o2: q${X}_chi_t2-q${X}_chi_ddev$
q${X}_chi_o3: q${X}_chi_t3+q${X}_chi_edev$
q${X}_chi_o4: q${X}_chi_t4-q${X}_chi_edev$
q${X}_chi_chi2: (q${X}_chi_o1-q${X}_chi_t1)^2/q${X}_chi_t1 + (q${X}_chi_o2-q${X}_chi_t2)^2/q${X}_chi_t2 + (q${X}_chi_o3-q${X}_chi_t3)^2/q${X}_chi_t3 + (q${X}_chi_o4-q${X}_chi_t4)^2/q${X}_chi_t4$
q${X}_chi_errwrongdenom: (q${X}_chi_o1-q${X}_chi_t1)^2/q${X}_chi_o1 + (q${X}_chi_o2-q${X}_chi_t2)^2/q${X}_chi_o2 + (q${X}_chi_o3-q${X}_chi_t3)^2/q${X}_chi_o3 + (q${X}_chi_o4-q${X}_chi_t4)^2/q${X}_chi_o4$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _chiVars: _chiVars };
}
