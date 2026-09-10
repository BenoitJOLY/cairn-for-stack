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

// ── GÉNÉRATEUR "Radiochronologie" (SVT, datation absolue) — helper Maxima pur ──
// Cinquième type SVT de l'app, gabarit suivi : js/gen-horlogemoleculaire-calc.js
// (tirage natif Maxima via rand() sur des listes configurables par l'enseignant,
// pas de tirage JS avant export). Gabarit hand-XML déjà validé : svt-05-radiochronologie.xml.
// Piège classique diagnostiqué : oubli du signe moins devant le logarithme népérien
// (Nfrac < 1 donc ln(Nfrac) < 0, il faut le signe moins pour obtenir un âge positif),
// à la fois sur la formule littérale (a) et sur la valeur numérique (b).
function _rcVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var fracRaw = (g.fracList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var lamaRaw = (g.lamaList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var lambRaw = (g.lambList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (fracRaw.length < 1) throw new Error('Radiochronologie : indiquez au moins une proportion Nfrac possible.');
  if (lamaRaw.length < 1) throw new Error('Radiochronologie : indiquez au moins un coefficient lam_a possible.');
  if (lambRaw.length < 1) throw new Error('Radiochronologie : indiquez au moins un exposant lam_b possible.');

  return `/* Q${X} Radiochronologie - datation absolue (tirage natif Maxima) */
q${X}_rc_fraclist: [${fracRaw.join(',')}]$
q${X}_rc_nfrac: rand(q${X}_rc_fraclist)$
q${X}_rc_lamalist: [${lamaRaw.join(',')}]$
q${X}_rc_lama: rand(q${X}_rc_lamalist)$
q${X}_rc_lamblist: [${lambRaw.join(',')}]$
q${X}_rc_lamb: rand(q${X}_rc_lamblist)$
q${X}_rc_lamval: q${X}_rc_lama*10^(-q${X}_rc_lamb)$
q${X}_rc_taformula: -log(Nfrac)/lam$
q${X}_rc_errsignformula: log(Nfrac)/lam$
q${X}_rc_tval: -log(q${X}_rc_nfrac)/q${X}_rc_lamval$
q${X}_rc_errsignval: log(q${X}_rc_nfrac)/q${X}_rc_lamval$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _rcVars: _rcVars };
}
