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

// config-panel-geometrie.js — capture/restore/reset pour le type "geometrie"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-geometrie.js).

function captureState_geometrie() {
  var s = { type: 'geometrie' };
      s.bareme=v('geo-bareme');s.text=richVal('geo-text');
      s.scenario=v('geo-scenario')||'distance';
      s.dim=v('geo-dim')||'2d';
      s.mode=v('geo-mode')||'aleatoire';
      s.p1x=v('geo-p1x')||'1';s.p1y=v('geo-p1y')||'2';s.p1z=v('geo-p1z')||'0';
      s.p2x=v('geo-p2x')||'4';s.p2y=v('geo-p2y')||'6';s.p2z=v('geo-p2z')||'1';
      s.p3x=v('geo-p3x')||'0';s.p3y=v('geo-p3y')||'3';s.p3z=v('geo-p3z')||'2';
      s.fbOk=richVal('geo-fb-ok');s.fbWrong=richVal('geo-fb-wrong');s.fbGen=richVal('geo-fbgen');
  return s;
}

function restoreState_geometrie(s) {
      document.getElementById('geo-bareme').value=s.bareme||1;
      setRichVal('geo-text',s.text||'');
      document.getElementById('geo-scenario').value=s.scenario||'distance';
      var _gDim=document.getElementById('geo-dim');if(_gDim)_gDim.value=s.dim||'2d';
      var _gMode=document.getElementById('geo-mode');if(_gMode)_gMode.value=s.mode||'aleatoire';
      var _gP=['p1x','p1y','p1z','p2x','p2y','p2z','p3x','p3y','p3z'];
      _gP.forEach(function(k){var e=document.getElementById('geo-'+k);if(e)e.value=s[k]||'0';});
      setRichVal('geo-fb-ok',s.fbOk||'');
      setRichVal('geo-fb-wrong',s.fbWrong||'');
      setRichVal('geo-fbgen',s.fbGen||'');
      if(typeof geoFormChange==='function')geoFormChange();
}

function resetForm_geometrie() {
      setRichVal('geo-text','');
      document.getElementById('geo-bareme').value=1;
      document.getElementById('geo-scenario').value='distance';
      var _gDimR=document.getElementById('geo-dim');if(_gDimR)_gDimR.value='2d';
      var _gModeR=document.getElementById('geo-mode');if(_gModeR)_gModeR.value='aleatoire';
      setRichVal('geo-fb-ok','');
      setRichVal('geo-fb-wrong','');
      setRichVal('geo-fbgen','');
      if(typeof geoFormChange==='function')geoFormChange();
}
