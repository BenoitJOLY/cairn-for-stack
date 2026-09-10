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

// ── GÉNÉRATEUR "Malthus" (SVT, croissance exponentielle) — helper Maxima pur ──
// Septième type SVT de l'app, gabarit suivi : js/gen-ondesismique-calc.js
// (tirage natif Maxima via rand() sur des listes configurables par l'enseignant,
// pas de tirage JS avant export). Gabarit hand-XML déjà validé : svt-07-malthus.xml.
// Une seule sous-question (population finale N_t = N0 * q^t). Piège classique
// diagnostiqué : erreur d'une période (t-1 au lieu de t).
//
// Note : contrairement au gabarit hand-XML (qui fige q dans {2,3} pour pouvoir
// afficher "double"/"triple" en toutes lettres), l'énoncé généré ici utilise la
// formulation générique "effectif multiplié par {@q@} toutes les heures", ce qui
// permet à l'enseignant de configurer une liste de facteurs q arbitraire (pas
// seulement 2 ou 3) sans avoir à maintenir une liste de mots alignée dessus.
function _malVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var n0Raw = (g.n0List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var qRaw = (g.qList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var tRaw = (g.tList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (n0Raw.length < 1) throw new Error('Malthus : indiquez au moins une population initiale possible.');
  if (qRaw.length < 1) throw new Error('Malthus : indiquez au moins un facteur multiplicatif possible.');
  if (tRaw.length < 1) throw new Error('Malthus : indiquez au moins une durée possible.');

  return `/* Q${X} Malthus - croissance exponentielle (tirage natif Maxima) */
q${X}_mal_n0list: [${n0Raw.join(',')}]$
q${X}_mal_n0: rand(q${X}_mal_n0list)$
q${X}_mal_qlist: [${qRaw.join(',')}]$
q${X}_mal_q: rand(q${X}_mal_qlist)$
q${X}_mal_tlist: [${tRaw.join(',')}]$
q${X}_mal_t: rand(q${X}_mal_tlist)$
q${X}_mal_tminus1: q${X}_mal_t-1$
q${X}_mal_nfinal: q${X}_mal_n0*q${X}_mal_q^q${X}_mal_t$
q${X}_mal_erroffbyone: q${X}_mal_n0*q${X}_mal_q^q${X}_mal_tminus1$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _malVars: _malVars };
}
