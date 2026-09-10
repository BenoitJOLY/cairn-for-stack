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

// ── GÉNÉRATEUR "Hardy-Weinberg" (SVT, génétique des populations) — helper Maxima pur ──
// PREMIER type de l'app à tirer la valeur aléatoire côté Maxima (rand() natif dans
// questionvariables), et non côté JS avant export : le prof configure une LISTE de
// fréquences possibles pour l'allèle récessif q, Maxima tire dedans à chaque tentative/
// élève — une seule question STACK couvre alors toutes les variantes (cf. décision
// utilisateur, voir svt-01-hardy-weinberg.xml, gabarit hand-XML déjà validé sur Moodle).
// L'export générique (js/app.js) détecte déjà tout seul le motif rand(...) dans les
// variables combinées et déploie les seeds nécessaires (generateDeployedSeeds /
// insertDeployedSeeds) : aucune brique supplémentaire à ajouter ici.
// Noms de variables au format q${X}_nom (convention partagée par TOUS les types de
// l'app, cf. js/gen-zscore-calc.js) : X isole les variables des autres questions du
// même export, et c'est aussi le format que _calcExtractKnownVars/_calcTokenizeForPreview
// (js/preview.js) savent reconnaître pour l'aperçu — un préfixe différent (ex. "hw")
// romprait silencieusement la tokenisation de l'aperçu.
function _hwVars(X, p) {
  var g = p.grandeurs || {};
  var raw = (g.qList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (raw.length < 2) throw new Error('Hardy-Weinberg : indiquez au moins deux valeurs possibles pour q (fréquence de l’allèle récessif), séparées par des virgules.');
  return `/* Q${X} Hardy-Weinberg - équilibre génétique (tirage natif Maxima) */
q${X}_hwlistq: [${raw.join(',')}]$
q${X}_hwq: rand(q${X}_hwlistq)$
q${X}_hwq2: q${X}_hwq^2$
q${X}_hwq2pct: q${X}_hwq2*100$
q${X}_hwp: 1-q${X}_hwq$
q${X}_hwhet: 2*q${X}_hwp*q${X}_hwq$
q${X}_hwerrdom: 1-q${X}_hwq2$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _hwVars: _hwVars };
}
