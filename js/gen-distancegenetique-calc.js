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

// ── GÉNÉRATEUR "Distance génétique (test-cross)" (SVT, génétique) — helper Maxima pur ──
// Troisième type SVT de l'app (après "hardyweinberg" et "croisements"), même gabarit :
// tirage natif Maxima via rand() dans des listes configurées par le prof (effectif
// total de la descendance, pourcentage de recombinaison), pas de tirage JS avant export.
// Gabarit hand-XML déjà validé : svt-03-distance-genetique.xml.
function _dgVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var nRaw = (g.nList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var rRaw = (g.rpctList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (nRaw.length < 1) throw new Error('Distance génétique : indiquez au moins un effectif total possible pour la descendance.');
  if (rRaw.length < 2) throw new Error('Distance génétique : indiquez au moins deux pourcentages de recombinaison possibles, séparés par des virgules.');

  return `/* Q${X} Distance génétique - test-cross (tirage natif Maxima) */
q${X}_dg_nlist: [${nRaw.join(',')}]$
q${X}_dg_ntotal: rand(q${X}_dg_nlist)$
q${X}_dg_rpctlist: [${rRaw.join(',')}]$
q${X}_dg_rpct: rand(q${X}_dg_rpctlist)$
q${X}_dg_recomb: q${X}_dg_ntotal*q${X}_dg_rpct/100$
q${X}_dg_recombhalf: q${X}_dg_recomb/2$
q${X}_dg_parental: q${X}_dg_ntotal-q${X}_dg_recomb$
q${X}_dg_parentalhalf: q${X}_dg_parental/2$
q${X}_dg_tauxrecomb: q${X}_dg_recomb/q${X}_dg_ntotal$
q${X}_dg_distancecm: q${X}_dg_tauxrecomb*100$
q${X}_dg_errforgot: q${X}_dg_tauxrecomb$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _dgVars: _dgVars };
}
