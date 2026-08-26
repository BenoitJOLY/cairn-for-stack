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

// avancement-ui.js — contrôleur du panneau "Tableau d'avancement"
// (bascule mode teacher/follow_from + rafraîchissement de l'aperçu après
// ajout/suppression/réordonnancement d'une ligne d'espèce — ces mutations DOM
// programmatiques ne déclenchent pas les écouteurs input/change globaux posés
// par _hsWireSimplePreview sur le panneau, cf. addOrdRow/ordRefreshPreview).

function avModeToggle() {
  var mode = document.getElementById('av-mode') ? document.getElementById('av-mode').value : 'teacher';
  var wrap = document.getElementById('av-source-wrap');
  if (wrap) wrap.style.display = mode === 'follow_from' ? '' : 'none';
}

function avFormChange() {
  avModeToggle();
  if (typeof avRefreshPreview === 'function') avRefreshPreview();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { avModeToggle: avModeToggle, avFormChange: avFormChange };
}
