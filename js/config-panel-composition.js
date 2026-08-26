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

// config-panel-composition.js — capture/restore/reset pour le type "composition"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-composition.js).

function captureState_composition() {
  var s = { type: 'composition' };
      s.bareme=v('comp-bareme');s.text=richVal('comp-text');s.height=v('comp-height');
      s.msg=document.getElementById('comp-msg')?document.getElementById('comp-msg').value:'';
      s.fbGen=v('comp-fbgen');
  return s;
}

function restoreState_composition(s) {
      document.getElementById('comp-bareme').value=s.bareme||4;setRichVal('comp-text',s.text||'');
      document.getElementById('comp-height').value=s.height||'600px';
      if(document.getElementById('comp-msg'))document.getElementById('comp-msg').value=s.msg||I18N.t('msg.comp_msg_default');
      var _compFbGen=document.getElementById('comp-fbgen');if(_compFbGen)_compFbGen.value=s.fbGen||'';
}

function resetForm_composition() {
      setRichVal('comp-text','');document.getElementById('comp-bareme').value=4;
      document.getElementById('comp-height').value='600px';
      if(document.getElementById('comp-msg'))document.getElementById('comp-msg').value=I18N.t('msg.comp_msg_default');
      var _compfbGen=document.getElementById('comp-fbgen');if(_compfbGen)_compfbGen.value='';
}
