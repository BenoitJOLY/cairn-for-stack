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

// config-panel-string.js — capture/restore/reset pour le type "string"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-string.js).

function captureState_string() {
  var s = { type: 'string' };
      s.bareme=v('str-bareme');s.text=richVal('str-text');s.ansRich=richVal('str-ans-rich');
      s.size=v('str-size');s.test=v('str-test');s.fbc=richVal('str-fbc');s.fbe=richVal('str-fbe');
      s.sol=richVal('str-sol');s.aideOn=document.getElementById('str-aide-on').checked;
      s.palettes=[...document.querySelectorAll('.str-pal')].map(function(c){return{v:c.value,ch:c.checked};});
      s.alts=(document.getElementById('str-alts')||{value:''}).value||'';
  return s;
}

function restoreState_string(s) {
      document.getElementById('str-bareme').value=s.bareme;setRichVal('str-text',s.text);
      setRichVal('str-ans-rich',s.ansRich||'');document.getElementById('str-size').value=s.size;
      document.getElementById('str-test').value=s.test;
      setRichVal('str-fbc',s.fbc);setRichVal('str-fbe',s.fbe);setRichVal('str-sol',s.sol);
      document.getElementById('str-aide-on').checked=!!s.aideOn;
      if(typeof toggleStrAide==='function')toggleStrAide();
      if(s.palettes)(s.palettes.forEach(function(p){var cb=document.querySelector('.str-pal[value="'+p.v+'"]');if(cb)cb.checked=p.ch;}));
      var strAltsEl=document.getElementById('str-alts');if(strAltsEl)strAltsEl.value=s.alts||'';
      if(typeof updateStrPalettePreview==='function')updateStrPalettePreview();
}

function resetForm_string() {
      ['str-text','str-ans-rich','str-fbc','str-fbe','str-sol'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('str-ans').value='';
      document.getElementById('str-aide-on').checked=false;
      if(typeof toggleStrAide==='function')toggleStrAide();
      var strAltsEl2=document.getElementById('str-alts');if(strAltsEl2)strAltsEl2.value='';
}
