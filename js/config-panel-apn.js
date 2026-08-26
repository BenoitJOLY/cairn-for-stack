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

// config-panel-apn.js — capture/restore/reset pour le type "apn"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-apn.js).

function captureState_apn() {
  var s = { type: 'apn' };
      s.bareme=v('apn-bareme');s.text=richVal('apn-text');
      s.unknown=v('apn-unknown')||'V';
      s.changedD=document.getElementById('apn-changed-D').checked;
      s.changedV=document.getElementById('apn-changed-V').checked;
      s.changedI=document.getElementById('apn-changed-I').checked;
      s.fbOk=v('apn-fb-ok');s.fbWrong=v('apn-fb-wrong');s.fbGen=v('apn-fbgen');
  return s;
}

function restoreState_apn(s) {
      document.getElementById('apn-bareme').value=s.bareme||1;
      setRichVal('apn-text',s.text||'');
      document.getElementById('apn-unknown').value=s.unknown||'V';
      document.getElementById('apn-changed-D').checked=!!s.changedD;
      document.getElementById('apn-changed-V').checked=!!s.changedV;
      document.getElementById('apn-changed-I').checked=!!s.changedI;
      document.getElementById('apn-fb-ok').value=s.fbOk||'';
      document.getElementById('apn-fb-wrong').value=s.fbWrong||'';
      var _apnFbGen=document.getElementById('apn-fbgen');if(_apnFbGen)_apnFbGen.value=s.fbGen||'';
      if(typeof apnUnknownChange==='function')apnUnknownChange();
}

function resetForm_apn() {
      setRichVal('apn-text','');
      document.getElementById('apn-bareme').value=1;
      document.getElementById('apn-unknown').value='V';
      document.getElementById('apn-changed-D').checked=true;
      document.getElementById('apn-changed-V').checked=false;
      document.getElementById('apn-changed-I').checked=false;
      document.getElementById('apn-fb-ok').value='';
      document.getElementById('apn-fb-wrong').value='';
      var _apnfbGen=document.getElementById('apn-fbgen');if(_apnfbGen)_apnfbGen.value='';
      if(typeof apnUnknownChange==='function')apnUnknownChange();
}
