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

// config-panel-redox.js — capture/restore/reset pour le type "redox"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-redox.js).

function captureState_redox() {
  var s = { type: 'redox' };
      s.bareme=v('rx-bareme');s.text=richVal('rx-text');
      s.rxFind=v('rx-find')||'equivalence';
      s.e1=v('rx-e1');s.n1=v('rx-n1');
      s.e2=v('rx-e2');s.n2=v('rx-n2');
      s.c1=v('rx-c1');s.c2=v('rx-c2');s.v2=v('rx-v2');
      s.titrantName=v('rx-titrant-name');
      s.tolVol=v('rx-tol-vol');s.tolE=v('rx-tol-e');s.tolC=v('rx-tol-c');
      s.w=v('rx-w');s.h=v('rx-h');
      s.fbOk=v('rx-fb-ok');s.fbWrong=v('rx-fb-wrong');s.fbGen=v('rx-fbgen');
  return s;
}

function restoreState_redox(s) {
      document.getElementById('rx-bareme').value=s.bareme||1;
      setRichVal('rx-text',s.text||'');
      document.getElementById('rx-e1').value=s.e1!=null?s.e1:1.51;
      document.getElementById('rx-n1').value=s.n1||5;
      document.getElementById('rx-e2').value=s.e2!=null?s.e2:0.77;
      document.getElementById('rx-n2').value=s.n2||1;
      document.getElementById('rx-c1').value=s.c1||0.02;
      document.getElementById('rx-c2').value=s.c2||0.1;
      document.getElementById('rx-v2').value=s.v2||20;
      document.getElementById('rx-titrant-name').value=s.titrantName||'KMnO₄';
      document.getElementById('rx-tol-vol').value=s.tolVol||0.5;
      document.getElementById('rx-tol-e').value=s.tolE||0.05;
      var _rxTolC=document.getElementById('rx-tol-c');if(_rxTolC)_rxTolC.value=s.tolC||0.005;
      document.getElementById('rx-w').value=s.w||500;
      document.getElementById('rx-h').value=s.h||400;
      document.getElementById('rx-fb-ok').value=s.fbOk||'';
      document.getElementById('rx-fb-wrong').value=s.fbWrong||'';
      var _rxFbGen=document.getElementById('rx-fbgen');if(_rxFbGen)_rxFbGen.value=s.fbGen||'';
      document.getElementById('rx-find').value=s.rxFind||'equivalence';
      if(typeof rxFormChange==='function')rxFormChange();
}

function resetForm_redox() {
      setRichVal('rx-text','');
      document.getElementById('rx-bareme').value=1;
      document.getElementById('rx-find').value='equivalence';
      document.getElementById('rx-e1').value=1.51;
      document.getElementById('rx-n1').value=5;
      document.getElementById('rx-e2').value=0.77;
      document.getElementById('rx-n2').value=1;
      document.getElementById('rx-c1').value=0.02;
      document.getElementById('rx-c2').value=0.1;
      document.getElementById('rx-v2').value=20;
      document.getElementById('rx-titrant-name').value='KMnO₄';
      document.getElementById('rx-tol-vol').value=0.5;
      document.getElementById('rx-tol-e').value=0.05;
      var _rxTolCReset=document.getElementById('rx-tol-c');if(_rxTolCReset)_rxTolCReset.value=0.005;
      document.getElementById('rx-w').value=500;
      document.getElementById('rx-h').value=400;
      document.getElementById('rx-fb-ok').value='';
      document.getElementById('rx-fb-wrong').value='';
      var _rxfbGen=document.getElementById('rx-fbgen');if(_rxfbGen)_rxfbGen.value='';
      if(typeof rxFormChange==='function')rxFormChange();
}
