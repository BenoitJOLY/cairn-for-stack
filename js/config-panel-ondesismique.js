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

// config-panel-ondesismique.js — capture/restore/reset pour le type "ondesismique"
// Même découpage que config-panel-radiochronologie.js. Deux scénarios (sis-scenario) :
//  - 'delai-ps' (par défaut) : champs sis-dlist/sis-vplist/sis-vslist.
//  - 'vitesse-onde' (lecture de sismogramme JSXGraph) : champs sis-dlist2/sis-arrlist.
// sisFormChange() (callback onchange du <select>) bascule l'affichage des deux
// groupes de champs — gabarit suivi : limFormChange() dans js/limites-ui.js,
// mais ici la fonction reste dans ce fichier (pas de -ui.js dédié pour ce type).

var SIS_DEFAULTS = {
  bareme: 1, intro: '', scenario: 'delai-ps',
  dList: '80,120,150,200,240,300', vpList: '6,7,8', vsList: '3,7/2,4,9/2',
  dList2: '210,340,411,480,560,620,710', arrList: '40,60,80,100,120,140,160,180',
  fbGen: ''
};

function captureState_ondesismique() {
  var s = { type: 'ondesismique' };
  s.bareme = v('sis-bareme');
  s.intro = richVal('sis-intro');
  s.scenario = v('sis-scenario') || 'delai-ps';
  s.dList = v('sis-dlist');
  s.vpList = v('sis-vplist');
  s.vsList = v('sis-vslist');
  s.dList2 = v('sis-dlist2');
  s.arrList = v('sis-arrlist');
  s.fbGen = richVal('sis-fbgen');
  return s;
}

function restoreState_ondesismique(s) {
  document.getElementById('sis-bareme').value = s.bareme || SIS_DEFAULTS.bareme;
  setRichVal('sis-intro', s.intro || SIS_DEFAULTS.intro);
  document.getElementById('sis-scenario').value = s.scenario || SIS_DEFAULTS.scenario;
  document.getElementById('sis-dlist').value = s.dList || SIS_DEFAULTS.dList;
  document.getElementById('sis-vplist').value = s.vpList || SIS_DEFAULTS.vpList;
  document.getElementById('sis-vslist').value = s.vsList || SIS_DEFAULTS.vsList;
  document.getElementById('sis-dlist2').value = s.dList2 || SIS_DEFAULTS.dList2;
  document.getElementById('sis-arrlist').value = s.arrList || SIS_DEFAULTS.arrList;
  setRichVal('sis-fbgen', s.fbGen || SIS_DEFAULTS.fbGen);
  if (typeof sisFormChange === 'function') sisFormChange();
}

function resetForm_ondesismique() {
  document.getElementById('sis-bareme').value = SIS_DEFAULTS.bareme;
  setRichVal('sis-intro', SIS_DEFAULTS.intro);
  document.getElementById('sis-scenario').value = SIS_DEFAULTS.scenario;
  document.getElementById('sis-dlist').value = SIS_DEFAULTS.dList;
  document.getElementById('sis-vplist').value = SIS_DEFAULTS.vpList;
  document.getElementById('sis-vslist').value = SIS_DEFAULTS.vsList;
  document.getElementById('sis-dlist2').value = SIS_DEFAULTS.dList2;
  document.getElementById('sis-arrlist').value = SIS_DEFAULTS.arrList;
  setRichVal('sis-fbgen', SIS_DEFAULTS.fbGen);
  if (typeof sisFormChange === 'function') sisFormChange();
}

// sisFormChange() : bascule l'affichage des champs spécifiques à chaque
// scénario (sis-field-delai vs sis-field-vitesse). Appelé par le onchange
// du <select id="sis-scenario"> (index.html) et par restore/reset ci-dessus.
function sisFormChange() {
  var sel = document.getElementById('sis-scenario');
  var scenario = sel ? sel.value : 'delai-ps';
  var delaiBox = document.getElementById('sis-field-delai');
  var vitesseBox = document.getElementById('sis-field-vitesse');
  if (delaiBox) delaiBox.style.display = (scenario === 'vitesse-onde') ? 'none' : '';
  if (vitesseBox) vitesseBox.style.display = (scenario === 'vitesse-onde') ? '' : 'none';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_ondesismique: captureState_ondesismique, restoreState_ondesismique: restoreState_ondesismique, resetForm_ondesismique: resetForm_ondesismique, sisFormChange: sisFormChange };
}
