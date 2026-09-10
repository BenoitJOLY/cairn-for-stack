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

// ── GÉNÉRATEUR "Ondes sismiques" (SVT) — helper Maxima pur ──
// Sixième type SVT de l'app, gabarit suivi : js/gen-radiochronologie-calc.js
// (tirage natif Maxima via rand() sur des listes configurables par l'enseignant,
// pas de tirage JS avant export). Deux scénarios (p.scenario), sélectionnés dans
// le panneau de config (sis-scenario) :
//  - 'delai-ps' (par défaut, gabarit hand-XML svt-06-ondes-sismiques.xml) : une
//    seule sous-question (délai Δt = d/vS - d/vP). Piège classique diagnostiqué :
//    ordre de soustraction inversé (d/vP - d/vS), qui donne un résultat négatif
//    car l'onde P est toujours plus rapide que l'onde S.
//  - 'vitesse-onde' (lecture de sismogramme, cf. js/gen-ondesismique-jsx.js) :
//    l'élève lit l'heure d'arrivée de l'onde sur un sismogramme JSXGraph dont
//    l'axe des temps affiche une VRAIE heure locale (comme un sismogramme réel,
//    pas un axe relatif en secondes depuis 0), soustrait l'heure du séisme
//    (donnée dans l'énoncé) pour obtenir la durée de propagation, puis calcule
//    la célérité en km/s puis en km/h. Piège classique diagnostiqué : confondre
//    1 h = 60 s (conversion en km/min) avec 1 h = 3600 s.
//    q${X}_sis_heureprofils apparie chaque libellé affiché ("06h12min05s") à sa
//    valeur en secondes depuis minuit (22325, etc.) — un seul rand() choisit la
//    paire, ce qui garantit que le texte de l'énoncé et l'origine numérique de
//    l'axe du sismogramme (js/gen-ondesismique-jsx.js:_sisSeismogramJSX) restent
//    synchronisés sans avoir à reformater une heure en Maxima.
function _sisVars(X, p, deps) {
  deps = deps || {};
  var scenario = p.scenario || 'delai-ps';
  var g = p.grandeurs || {};

  if (scenario === 'vitesse-onde') {
    var d2Raw = (g.dList2 || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var arrRaw = (g.arrList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (d2Raw.length < 1) throw new Error('Ondes sismiques : indiquez au moins une distance épicentrale possible.');
    if (arrRaw.length < 1) throw new Error('Ondes sismiques : indiquez au moins une date d\'arrivée (lecture du sismogramme) possible.');

    return `/* Q${X} Ondes sismiques - vitesse lue sur sismogramme (tirage natif Maxima) */
q${X}_sis_dlist2: [${d2Raw.join(',')}]$
q${X}_sis_d2: rand(q${X}_sis_dlist2)$
q${X}_sis_arrlist: [${arrRaw.join(',')}]$
q${X}_sis_tarr: rand(q${X}_sis_arrlist)$
q${X}_sis_stationlist: ["A","B","C","D","E","F","G","H"]$
q${X}_sis_station: rand(q${X}_sis_stationlist)$
q${X}_sis_heureprofils: [["06h12min05s",22325],["10h47min20s",38840],["14h32min10s",52330],["19h05min48s",68748],["22h58min33s",82713]]$
q${X}_sis_heureprofil: rand(q${X}_sis_heureprofils)$
q${X}_sis_heure: q${X}_sis_heureprofil[1]$
q${X}_sis_heuresec: q${X}_sis_heureprofil[2]$
q${X}_sis_vkms: q${X}_sis_d2/q${X}_sis_tarr$
q${X}_sis_vkmh: q${X}_sis_vkms*3600$
q${X}_sis_errmin: q${X}_sis_vkms*60$`;
  }

  var dRaw = (g.dList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var vpRaw = (g.vpList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var vsRaw = (g.vsList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (dRaw.length < 1) throw new Error('Ondes sismiques : indiquez au moins une distance épicentrale possible.');
  if (vpRaw.length < 1) throw new Error('Ondes sismiques : indiquez au moins une vitesse d\'onde P possible.');
  if (vsRaw.length < 1) throw new Error('Ondes sismiques : indiquez au moins une vitesse d\'onde S possible.');

  return `/* Q${X} Ondes sismiques - délai P/S (tirage natif Maxima) */
q${X}_sis_dlist: [${dRaw.join(',')}]$
q${X}_sis_d: rand(q${X}_sis_dlist)$
q${X}_sis_vplist: [${vpRaw.join(',')}]$
q${X}_sis_vp: rand(q${X}_sis_vplist)$
q${X}_sis_vslist: [${vsRaw.join(',')}]$
q${X}_sis_vs: rand(q${X}_sis_vslist)$
q${X}_sis_deltat: q${X}_sis_d/q${X}_sis_vs - q${X}_sis_d/q${X}_sis_vp$
q${X}_sis_errreversed: q${X}_sis_d/q${X}_sis_vp - q${X}_sis_d/q${X}_sis_vs$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _sisVars: _sisVars };
}
