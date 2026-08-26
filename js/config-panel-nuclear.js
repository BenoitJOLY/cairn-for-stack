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

// config-panel-nuclear.js — capture/restore/reset pour le type "nuclear"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-nuclear.js).

function captureState_nuclear() {
  var s = { type: 'nuclear' };
      s.bareme=v('nuc-bareme');s.text=richVal('nuc-text');
      s.equation=document.getElementById('nuc-editor')?document.getElementById('nuc-editor').innerText:'';
      s.fbGen=v('nuc-fbgen');
  return s;
}

function restoreState_nuclear(s) {
      document.getElementById('nuc-bareme').value=s.bareme||1;setRichVal('nuc-text',s.text||'');
      if(document.getElementById('nuc-editor'))document.getElementById('nuc-editor').innerText=s.equation||'';
      if(typeof nucUpdateLock==='function')nucUpdateLock();
      if(typeof nucRenderPreview==='function')nucRenderPreview();
      var _nucFbGen=document.getElementById('nuc-fbgen');if(_nucFbGen)_nucFbGen.value=s.fbGen||'';
}

function resetForm_nuclear() {
      setRichVal('nuc-text','');
      if(document.getElementById('nuc-editor'))document.getElementById('nuc-editor').innerText='';
      document.getElementById('nuc-bareme').value=1;
      if(typeof nucUpdateLock==='function')nucUpdateLock();
      if(typeof nucRenderPreview==='function')nucRenderPreview();
      var _nucfbGen=document.getElementById('nuc-fbgen');if(_nucfbGen)_nucfbGen.value='';
}
