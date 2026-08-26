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

// registry.js — Registre multi-pays des référentiels de tags pédagogiques
// (matière → niveau → sous-matière → chapitre). Chaque pays est un fichier
// séparé (js/tags-data/<code>.js) qui s'enregistre via registerCountryTags().
// Voir js/tags-data/_modele.js pour créer un nouveau pays.
var TAGS_COUNTRIES = {};
var CAIRN_FOR_STACK_PAYS_KEY = 'cairnforstack_pays';

function registerCountryTags(code, label, tree) {
  TAGS_COUNTRIES[code] = { label: label, tree: tree };
}

// Le référentiel de tags suit la langue d'interface (I18N) : pas de choix
// manuel indépendant. currentPays() reflète simplement la langue active.
function currentPays() {
  if (window.I18N && typeof I18N.getLang === 'function' && TAGS_COUNTRIES[I18N.getLang()]) {
    return I18N.getLang();
  }
  try { return localStorage.getItem(CAIRN_FOR_STACK_PAYS_KEY) || 'fr'; } catch (e) { return 'fr'; }
}

// tagsArbre reste la variable globale lue par tmInitMat()/tmSelectMat() etc.
// dans js/app.js — applyPays() la fait simplement pointer vers l'arbre du
// pays choisi, sans toucher au reste de la logique des tags.
function applyPays(code) {
  var entry = TAGS_COUNTRIES[code] || TAGS_COUNTRIES['fr'] || { tree: {} };
  window.tagsArbre = entry.tree;
  try { localStorage.setItem(CAIRN_FOR_STACK_PAYS_KEY, code); } catch (e) {}
  if (typeof tmInitMat === 'function' && document.getElementById('tagModal') &&
      document.getElementById('tagModal').style.display !== 'none') {
    tmInitMat();
  }
}

// Différé : les fichiers pays (fr.js, etc.) se chargent APRÈS ce script et
// s'enregistrent via registerCountryTags() au fil du parsing du <script> qui
// suit. DOMContentLoaded ne se déclenche qu'une fois tous ces scripts
// synchrones exécutés, donc TAGS_COUNTRIES est déjà rempli à ce moment-là.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { applyPays(currentPays()); });
} else {
  applyPays(currentPays());
}

// Changement de langue d'interface → le référentiel de tags suit.
document.addEventListener('i18n:changed', function (e) {
  applyPays((e.detail && e.detail.lang) || currentPays());
});
