/*
 * StackForge — générateur de questions STACK pour Moodle
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

// zscore-ui.js — contrôleur du panneau "Z-score" (bascule du champ seuil)
// L'aperçu iframe (js/preview-zscore.js) se rafraîchit tout seul sur tout
// événement input/change du panneau (cf. _hsWireSimplePreview) : ce fichier ne
// gère QUE l'affichage conditionnel du champ seuil (utile seulement si
// l'étape "conclusion" est cochée).

function zsConclusionToggle() {
  var checked = !!(document.getElementById('zs-step-conclusion') || {}).checked;
  var wrap = document.getElementById('zs-seuil-wrap');
  if (wrap) wrap.style.display = checked ? '' : 'none';
}

function zsFormChange() {
  zsConclusionToggle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { zsConclusionToggle: zsConclusionToggle, zsFormChange: zsFormChange };
}
