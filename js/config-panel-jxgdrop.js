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

// config-panel-jxgdrop.js — capture/restore/reset pour le type "jxgdrop"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-jxgdrop.js).

function captureState_jxgdrop() {
  var s = { type: 'jxgdrop' };
      var jdst=window._jdState||{};
      s.bareme=v('jd-bareme');s.text=richVal('jd-text');
      s.bgName=jdst.bgName||'';s.bgData=jdst.bgData||'';s.bgW=jdst.bgW||0;s.bgH=jdst.bgH||0;
      s.proposals=JSON.parse(JSON.stringify(jdst.proposals||[]));
      s.zones=JSON.parse(JSON.stringify(jdst.zones||[]));
      s.nextPropId=jdst.nextPropId||1;s.nextZoneId=jdst.nextZoneId||1;
      s.zonesVisible=document.getElementById('jd-zones-visible')?document.getElementById('jd-zones-visible').checked:true;
      s.fbGen=v('jd-fbgen');
  return s;
}

function restoreState_jxgdrop(s) {
      if(typeof jdRestoreState==='function')jdRestoreState(s);
      var _jdFbGen=document.getElementById('jd-fbgen');if(_jdFbGen)_jdFbGen.value=s.fbGen||'';
}

function resetForm_jxgdrop() {
      if(typeof jdReset==='function')jdReset();
      var _jdfbGen=document.getElementById('jd-fbgen');if(_jdfbGen)_jdfbGen.value='';
}
