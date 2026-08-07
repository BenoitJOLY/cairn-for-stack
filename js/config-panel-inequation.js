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

// config-panel-inequation.js — capture/restore/reset pour le type "inequation"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-inequation.js).

function captureState_inequation() {
  var s = { type: 'inequation' };
      s.bareme=v('ineq-bareme');s.text=richVal('ineq-text');
      s.scenario=v('ineq-scenario')||'lineaire';
      s.mode=(document.querySelector('input[name="ineq-mode-r"]:checked')||{}).value||'aleatoire';
      s.a=v('ineq-a')||'2'; s.b=v('ineq-b')||'-6'; s.c=v('ineq-c')||'0';
      s.op=v('ineq-op')||'>';
      s.tans=v('ineq-tans')||'oo(3,inf)';
      s.fbOk=v('ineq-fb-ok');s.fbWrong=v('ineq-fb-wrong');s.fbGen=v('ineq-fbgen');
  return s;
}

function restoreState_inequation(s) {
      document.getElementById('ineq-bareme').value=s.bareme||1;
      setRichVal('ineq-text',s.text||'');
      document.getElementById('ineq-scenario').value=s.scenario||'lineaire';
      var ineqModeR=document.querySelector('input[name="ineq-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(ineqModeR) ineqModeR.checked=true;
      document.getElementById('ineq-a').value=s.a||'2';
      document.getElementById('ineq-b').value=s.b||'-6';
      document.getElementById('ineq-c').value=s.c||'0';
      document.getElementById('ineq-op').value=s.op||'>';
      document.getElementById('ineq-tans').value=s.tans||'oo(3,inf)';
      document.getElementById('ineq-fb-ok').value=s.fbOk||'';
      document.getElementById('ineq-fb-wrong').value=s.fbWrong||'';
      var _ineqFbGen=document.getElementById('ineq-fbgen');if(_ineqFbGen)_ineqFbGen.value=s.fbGen||'';
      if(typeof ineqFormChange==='function')ineqFormChange();
}

function resetForm_inequation() {
      setRichVal('ineq-text','');
      document.getElementById('ineq-bareme').value=1;
      document.getElementById('ineq-scenario').value='lineaire';
      var ineqModeRReset=document.querySelector('input[name="ineq-mode-r"][value="aleatoire"]');
      if(ineqModeRReset) ineqModeRReset.checked=true;
      document.getElementById('ineq-a').value='2';
      document.getElementById('ineq-b').value='-6';
      document.getElementById('ineq-c').value='0';
      document.getElementById('ineq-op').value='>';
      document.getElementById('ineq-tans').value='oo(3,inf)';
      document.getElementById('ineq-fb-ok').value='';
      document.getElementById('ineq-fb-wrong').value='';
      var _ineqfbGen=document.getElementById('ineq-fbgen');if(_ineqfbGen)_ineqfbGen.value='';
      if(typeof ineqFormChange==='function')ineqFormChange();
}
