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

// ── GÉNÉRATEUR "Horloge moléculaire" (SVT, phylogénie) — helper Maxima pur ──
// Quatrième type SVT de l'app, gabarit suivi : js/gen-distancegenetique-calc.js
// (tirage natif Maxima via rand() sur des listes configurables par l'enseignant,
// pas de tirage JS avant export). Gabarit hand-XML déjà validé : svt-04-horloge-moleculaire.xml.
// Piège classique diagnostiqué : oubli du facteur 2 (les mutations s'accumulent
// indépendamment dans CHACUNE des deux lignées depuis la divergence), à la fois
// sur la formule littérale (a) et sur la valeur numérique (b).
function _hmVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var seqRaw = (g.seqList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var tauxRaw = (g.tauxList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var dpctRaw = (g.dpctList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (seqRaw.length < 1) throw new Error('Horloge moléculaire : indiquez au moins une longueur de séquence possible.');
  if (tauxRaw.length < 1) throw new Error('Horloge moléculaire : indiquez au moins un taux de mutation possible.');
  if (dpctRaw.length < 2) throw new Error('Horloge moléculaire : indiquez au moins deux pourcentages de divergence possibles, séparés par des virgules.');

  return `/* Q${X} Horloge moléculaire - phylogénie (tirage natif Maxima) */
q${X}_hm_seqlist: [${seqRaw.join(',')}]$
q${X}_hm_seqval: rand(q${X}_hm_seqlist)$
q${X}_hm_tauxlist: [${tauxRaw.join(',')}]$
q${X}_hm_tauxa: rand(q${X}_hm_tauxlist)$
q${X}_hm_tauxval: q${X}_hm_tauxa*10^(-9)$
q${X}_hm_dpctlist: [${dpctRaw.join(',')}]$
q${X}_hm_dpct: rand(q${X}_hm_dpctlist)$
q${X}_hm_diffval: q${X}_hm_seqval*q${X}_hm_dpct/100$
q${X}_hm_taformula: nbdiff/(2*mu*long_seq)$
q${X}_hm_errno2formula: nbdiff/(mu*long_seq)$
q${X}_hm_tval: q${X}_hm_diffval/(2*q${X}_hm_tauxval*q${X}_hm_seqval)$
q${X}_hm_errno2val: q${X}_hm_diffval/(q${X}_hm_tauxval*q${X}_hm_seqval)$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _hmVars: _hmVars };
}
