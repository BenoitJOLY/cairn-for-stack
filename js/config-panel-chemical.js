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

// config-panel-chemical.js — capture/restore/reset pour le type "chemical"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-chemical.js).

function captureState_chemical() {
  var s = { type: 'chemical' };
      s.bareme=v('chem-bareme');s.text=richVal('chem-text');
      s.eqHtml=document.getElementById('chem-editor-text').innerHTML;
      s.fbGen=v('chem-fbgen');
  return s;
}

function restoreState_chemical(s) {
      document.getElementById('chem-bareme').value=s.bareme;setRichVal('chem-text',s.text);
      document.getElementById('chem-editor-text').innerHTML=s.eqHtml;
      var _chemFbGen=document.getElementById('chem-fbgen');if(_chemFbGen)_chemFbGen.value=s.fbGen||'';
      if(typeof chemUpdateLock==='function')chemUpdateLock();
      if(typeof chemParseAndPreview==='function')chemParseAndPreview();
}

function resetForm_chemical() {
      setRichVal('chem-text','');
      document.getElementById('chem-editor-text').innerHTML='CH<sub>4</sub> + 2 O<sub>2</sub> -&gt; CO<sub>2</sub> + 2 H<sub>2</sub>O';
      var _chemfbGen=document.getElementById('chem-fbgen');if(_chemfbGen)_chemfbGen.value='';
      if(typeof chemUpdateLock==='function')chemUpdateLock();
      if(typeof chemParseAndPreview==='function')chemParseAndPreview();
}
