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

// ── GÉNÉRATEUR "Règle du 10%" (SVT, pyramides de biomasse) — helper Maxima pur ──
// Huitième type SVT de l'app, gabarit suivi : js/gen-ondesismique-calc.js (tirage
// natif Maxima via rand() sur des listes configurables par l'enseignant, pas de
// tirage JS avant export). Gabarit hand-XML déjà validé : svt-08-regle-10pourcent.xml.
// Deux sous-questions indépendantes (biomasse à un niveau trophique donné, puis
// nombre maximal de niveaux supplémentaires supportables) : contrairement aux
// autres types SVT, le gabarit hand-XML ne diagnostique pas de piège classique par
// nœud PRT en cascade — chaque sous-question reste donc un PRT à un seul nœud.
function _regVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var b0Raw = (g.b0List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var nPartARaw = (g.nPartAList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var kRaw = (g.kList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var mRaw = (g.mList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (b0Raw.length < 1) throw new Error('Règle du 10% : indiquez au moins une biomasse initiale b0 possible.');
  if (nPartARaw.length < 1) throw new Error('Règle du 10% : indiquez au moins un niveau trophique possible pour la question a).');
  if (kRaw.length < 1) throw new Error('Règle du 10% : indiquez au moins un exposant k possible.');
  if (mRaw.length < 1) throw new Error('Règle du 10% : indiquez au moins un facteur m possible.');

  return `/* Q${X} Regle du 10% - pyramides de biomasse (tirage natif Maxima) */
q${X}_reg_b0list: [${b0Raw.join(',')}]$
q${X}_reg_b0: rand(q${X}_reg_b0list)$
q${X}_reg_npartalist: [${nPartARaw.join(',')}]$
q${X}_reg_npartA: rand(q${X}_reg_npartalist)$
q${X}_reg_biomassea: q${X}_reg_b0*(1/10)^(q${X}_reg_npartA-1)$
q${X}_reg_klist: [${kRaw.join(',')}]$
q${X}_reg_ktarget: rand(q${X}_reg_klist)$
q${X}_reg_mlist: [${mRaw.join(',')}]$
q${X}_reg_mval: rand(q${X}_reg_mlist)$
q${X}_reg_bneed: q${X}_reg_b0*q${X}_reg_mval/10^q${X}_reg_ktarget$
q${X}_reg_xval: q${X}_reg_bneed/q${X}_reg_b0$
q${X}_reg_nmax: floor(float(log(q${X}_reg_xval)/log(0.1)))$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _regVars: _regVars };
}
