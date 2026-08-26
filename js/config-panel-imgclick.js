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

// config-panel-imgclick.js — capture/restore/reset pour le type "imgclick"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-imgclick.js).

function captureState_imgclick() {
  var s = { type: 'imgclick' };
      s.bareme=v('ic-bareme');
      s.text=richVal('ic-text');
      var icModeEl=document.querySelector('input[name="ic-mode"]:checked');
      s.mode=icModeEl?icModeEl.value:'single';
      s.fbOk=v('ic-fb-ok');s.fbWrong=v('ic-fb-wrong');s.fbGen=v('ic-fbgen');
      s.seqTime=v('ic-seq-time');
      var icst=window._icState||{};
      s.seqBgName=icst.bgName||'';s.seqBgData=icst.bgData||'';s.seqBgW=icst.bgW||0;s.seqBgH=icst.bgH||0;
      s.seqZones=JSON.parse(JSON.stringify(icst.zones||[]));
      s.seqNextZoneId=icst.nextZoneId||1;
  return s;
}

function restoreState_imgclick(s) {
      document.getElementById('ic-bareme').value=s.bareme||1;
      setRichVal('ic-text',s.text||'');
      document.getElementById('ic-fb-ok').value=s.fbOk||'';document.getElementById('ic-fb-wrong').value=s.fbWrong||'';
      var _icFbGen=document.getElementById('ic-fbgen');if(_icFbGen)_icFbGen.value=s.fbGen||'';
      var icModeR=document.querySelector('input[name="ic-mode"][value="'+(s.mode||'single')+'"]');
      if(icModeR)icModeR.checked=true;
      document.getElementById('ic-seq-time').value=s.seqTime||5;
      if(typeof icRestoreState==='function')icRestoreState({
        bgName:s.seqBgName,bgData:s.seqBgData,bgW:s.seqBgW,bgH:s.seqBgH,
        zones:s.seqZones,nextZoneId:s.seqNextZoneId
      });
      if(typeof icToggleMode==='function')icToggleMode();
}

function resetForm_imgclick() {
      setRichVal('ic-text','');
      document.getElementById('ic-fb-ok').value='';document.getElementById('ic-fb-wrong').value='';
      var _icfbGen=document.getElementById('ic-fbgen');if(_icfbGen)_icfbGen.value='';
      document.getElementById('ic-bareme').value=1;
      var icModeDef=document.querySelector('input[name="ic-mode"][value="single"]');
      if(icModeDef)icModeDef.checked=true;
      document.getElementById('ic-seq-time').value=5;
      if(typeof icReset==='function')icReset();
      if(typeof icToggleMode==='function')icToggleMode();
}
