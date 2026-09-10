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

// ── GÉNÉRATEUR "Croisements mono/dihybridisme" (SVT, génétique) — helper Maxima pur ──
// Deuxième type SVT de l'app (après "hardyweinberg", cf. js/gen-hardyweinberg-calc.js,
// même gabarit : tirage natif Maxima via rand(), pas de tirage JS avant export).
// Deux gènes indépendants tirés séparément : un gène AUTOSOMAL (ratio phénotypique
// 1/4 pour un croisement hétérozygote×hétérozygote, ou 1/2 pour un test-cross) et un
// gène LIÉ À L'X (même dualité de ratio, mais la probabilité "mâle ET récessif" ne se
// factorise PAS naïvement en P(mâle)=1/2 fois le ratio autosomal — piège classique
// diagnostiqué par gen-croisements.js). Gabarit hand-XML déjà validé :
// svt-02-croisements.xml. Les libellés (espèce, noms de phénotypes, lettres d'allèles)
// sont configurables ; la génétique elle-même (les 2 types de croisement par gène, les
// probabilités associées, l'erreur de confusion diagnostiquée) reste celle du gabarit.
function _crVars(X, p, deps) {
  deps = deps || {};
  var escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var g = p.grandeurs || {};

  var Da = ((g.autoDomLetter || 'V').trim().charAt(0) || 'V').toUpperCase();
  var da = Da.toLowerCase();
  var Ds = ((g.sexDomLetter || 'W').trim().charAt(0) || 'W').toUpperCase();
  var ds = Ds.toLowerCase();
  var autoDomName = htmlEsc_D(g.autoDomName || 'ailes normales');
  var sexDomName = htmlEsc_D(g.sexDomName || 'yeux normaux');
  var sexRecName = htmlEsc_D(g.sexRecName || 'yeux blancs');

  var descHet = '<i>' + Da + da + '</i> (hétérozygote) &times; <i>' + Da + da + '</i> (hétérozygote)';
  var descTest = '<i>' + Da + da + '</i> (hétérozygote) &times; <i>' + da + da + '</i> (homozygote récessif, test-cross)';
  var descSex1 = 'une mère porteuse (X<sup>' + Ds + '</sup>X<sup>' + ds + '</sup>) et un père aux ' + sexDomName + ' (X<sup>' + Ds + '</sup>Y)';
  var descSex2 = 'une mère aux ' + sexRecName + ' (X<sup>' + ds + '</sup>X<sup>' + ds + '</sup>) et un père aux ' + sexDomName + ' (X<sup>' + Ds + '</sup>Y)';

  return `/* Q${X} Croisements mono/dihybridisme - gène autosomal + gène lié à l'X (tirage natif Maxima) */
q${X}_cr_autotypes: ["${escapeMaximaString_D(descHet)}","${escapeMaximaString_D(descTest)}"]$
q${X}_cr_autoprobs: [1/4,1/2]$
q${X}_cr_idxauto: 1+rand(2)$
q${X}_cr_autodesc: q${X}_cr_autotypes[q${X}_cr_idxauto]$
q${X}_cr_pauto: q${X}_cr_autoprobs[q${X}_cr_idxauto]$
q${X}_cr_sextypes: ["${escapeMaximaString_D(descSex1)}","${escapeMaximaString_D(descSex2)}"]$
q${X}_cr_sexprobs: [1/4,1/2]$
q${X}_cr_idxsex: 1+rand(2)$
q${X}_cr_sexdesc: q${X}_cr_sextypes[q${X}_cr_idxsex]$
q${X}_cr_psex: q${X}_cr_sexprobs[q${X}_cr_idxsex]$
q${X}_cr_errnaive: (1/2)*(1/4)$
q${X}_cr_ptotal: q${X}_cr_pauto*q${X}_cr_psex$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _crVars: _crVars };
}
