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

// config-panel-acide-base.js — capture/restore/reset pour le type "acide-base"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-acide-base.js).

function captureState_acide_base() {
  var s = { type: 'acide-base' };
      s.bareme=v('ab-bareme');s.text=richVal('ab-text');
      s.abMethod=v('ab-method')||'colorimetrie';
      s.abType=v('ab-type')||'af-bf';s.abFind=v('ab-find')||'equivalence';
      s.nProtons=v('ab-n-protons')||'1';
      s.c1=v('ab-c1');s.v1=v('ab-v1');s.c2=v('ab-c2');
      s.pka=v('ab-pka');s.pka2=v('ab-pka2');s.pka3=v('ab-pka3');
      s.tolVol=v('ab-tol-vol');
      s.w=v('ab-w');s.h=v('ab-h');
      s.indicators=Array.prototype.slice.call(document.querySelectorAll('.ab-ind-chk:checked')).map(function(el){return el.dataset.ind;});
      s.fbGen=v('ab-fbgen');
  return s;
}

function restoreState_acide_base(s) {
      document.getElementById('ab-bareme').value=s.bareme||1;
      setRichVal('ab-text',s.text||'');
      document.getElementById('ab-method').value=s.abMethod||'colorimetrie';
      document.getElementById('ab-type').value=s.abType||'af-bf';
      document.getElementById('ab-n-protons').value=s.nProtons||'1';
      document.getElementById('ab-c1').value=s.c1||0.1;
      document.getElementById('ab-v1').value=s.v1||20;
      document.getElementById('ab-c2').value=s.c2||0.1;
      document.getElementById('ab-pka').value=s.pka||4.8;
      document.getElementById('ab-pka2').value=s.pka2||9.2;
      document.getElementById('ab-pka3').value=s.pka3||12.35;
      document.getElementById('ab-tol-vol').value=s.tolVol||0.5;
      document.getElementById('ab-w').value=s.w||500;
      document.getElementById('ab-h').value=s.h||400;
      var _abInds=s.indicators&&s.indicators.length?s.indicators:['hel','bbt','phph'];
      document.querySelectorAll('.ab-ind-chk').forEach(function(el){el.checked=_abInds.indexOf(el.dataset.ind)!==-1;});
      var _abFbGen=document.getElementById('ab-fbgen');if(_abFbGen)_abFbGen.value=s.fbGen||'';
      document.getElementById('ab-find').value=s.abFind||'equivalence';
      if(typeof abFormChange==='function')abFormChange();
}

function resetForm_acide_base() {
      setRichVal('ab-text','');
      document.getElementById('ab-bareme').value=1;
      document.getElementById('ab-method').value='colorimetrie';
      document.getElementById('ab-type').value='af-bf';
      document.getElementById('ab-n-protons').value='1';
      document.getElementById('ab-find').value='equivalence';
      document.getElementById('ab-c1').value=0.1;
      document.getElementById('ab-v1').value=20;
      document.getElementById('ab-c2').value=0.1;
      document.getElementById('ab-pka').value=4.8;
      document.getElementById('ab-pka2').value=9.2;
      document.getElementById('ab-pka3').value=12.35;
      document.getElementById('ab-tol-vol').value=0.5;
      document.getElementById('ab-w').value=500;
      document.getElementById('ab-h').value=400;
      document.querySelectorAll('.ab-ind-chk').forEach(function(el){el.checked=(['hel','bbt','phph'].indexOf(el.dataset.ind)!==-1);});
      var _abfbGen=document.getElementById('ab-fbgen');if(_abfbGen)_abfbGen.value='';
      if(typeof abFormChange==='function')abFormChange();
}
