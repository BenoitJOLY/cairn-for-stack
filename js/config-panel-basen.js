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

// config-panel-basen.js — capture/restore/reset pour le type "basen"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-basen.js).

function captureState_basen() {
  var s = { type: 'basen' };
      s.bareme=v('bn-bareme');s.text=richVal('bn-text');
      s.format=v('bn-format')||'S';
      s.fromBase=v('bn-from-base')||'10';
      s.toBase=v('bn-to-base')||'2';
      s.valueMode=v('bn-value-mode')||'fixe';
      s.valueBase=v('bn-value-base')||'depart';
      s.value=v('bn-value')||'42';
      s.valueMin=v('bn-value-min')||'10';
      s.valueMax=v('bn-value-max')||'99';
      s.fbOk=v('bn-fb-ok');s.fbWrong=v('bn-fb-wrong');s.fbGen=v('bn-fbgen');
  return s;
}

function restoreState_basen(s) {
      document.getElementById('bn-bareme').value=s.bareme||1;
      setRichVal('bn-text',s.text||'');
      document.getElementById('bn-format').value=s.format||'S';
      document.getElementById('bn-from-base').value=s.fromBase||'10';
      document.getElementById('bn-to-base').value=s.toBase||'2';
      document.getElementById('bn-value-mode').value=s.valueMode||'fixe';
      document.getElementById('bn-value-base').value=s.valueBase||'depart';
      document.getElementById('bn-value').value=s.value||'42';
      document.getElementById('bn-value-min').value=s.valueMin||'10';
      document.getElementById('bn-value-max').value=s.valueMax||'99';
      if(typeof bnValueModeChange==='function')bnValueModeChange();
      document.getElementById('bn-fb-ok').value=s.fbOk||'';
      document.getElementById('bn-fb-wrong').value=s.fbWrong||'';
      var _bnFbGen=document.getElementById('bn-fbgen');if(_bnFbGen)_bnFbGen.value=s.fbGen||'';
      if(typeof bnFormChange==='function')bnFormChange();
}

function resetForm_basen() {
      setRichVal('bn-text','');
      document.getElementById('bn-bareme').value=1;
      document.getElementById('bn-format').value='S';
      document.getElementById('bn-from-base').value='10';
      document.getElementById('bn-to-base').value='2';
      document.getElementById('bn-value-mode').value='fixe';
      document.getElementById('bn-value-base').value='depart';
      document.getElementById('bn-value').value='42';
      document.getElementById('bn-value-min').value='10';
      document.getElementById('bn-value-max').value='99';
      document.getElementById('bn-fb-ok').value='';
      document.getElementById('bn-fb-wrong').value='';
      var _bnfbGen=document.getElementById('bn-fbgen');if(_bnfbGen)_bnfbGen.value='';
      if(typeof bnValueModeChange==='function')bnValueModeChange();
}
