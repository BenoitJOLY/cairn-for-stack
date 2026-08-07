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

// config-panel-polynomes.js — capture/restore/reset pour le type "polynomes"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-polynomes.js).

function captureState_polynomes() {
  var s = { type: 'polynomes' };
      s.bareme=v('pol-bareme');s.text=richVal('pol-text');
      s.scenario=v('pol-scenario')||'discriminant';
      s.mode=(document.querySelector('input[name="pol-mode-r"]:checked')||{}).value||'aleatoire';
      s.a=v('pol-a')||'1'; s.b=v('pol-b')||'-5'; s.c=v('pol-c')||'6';
      s.deltaMin=v('pol-delta-min')||'1'; s.deltaMax=v('pol-delta-max')||'50';
      s.fbOk=v('pol-fb-ok');s.fbWrong=v('pol-fb-wrong');s.fbGen=v('pol-fbgen');
  return s;
}

function restoreState_polynomes(s) {
      document.getElementById('pol-bareme').value=s.bareme||1;
      setRichVal('pol-text',s.text||'');
      document.getElementById('pol-scenario').value=s.scenario||'discriminant';
      var polModeR=document.querySelector('input[name="pol-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(polModeR) polModeR.checked=true;
      document.getElementById('pol-a').value=s.a||'1';
      document.getElementById('pol-b').value=s.b||'-5';
      document.getElementById('pol-c').value=s.c||'6';
      document.getElementById('pol-delta-min').value=s.deltaMin||'1';
      document.getElementById('pol-delta-max').value=s.deltaMax||'50';
      document.getElementById('pol-fb-ok').value=s.fbOk||'';
      document.getElementById('pol-fb-wrong').value=s.fbWrong||'';
      document.getElementById('pol-fbgen').value=s.fbGen||'';
      if(typeof polOnScenarioChange==='function')polOnScenarioChange();
      else if(typeof polFormChange==='function')polFormChange();
}

function resetForm_polynomes() {
      setRichVal('pol-text','');
      document.getElementById('pol-bareme').value=1;
      document.getElementById('pol-scenario').value='discriminant';
      var polModeRReset=document.querySelector('input[name="pol-mode-r"][value="aleatoire"]');
      if(polModeRReset) polModeRReset.checked=true;
      document.getElementById('pol-a').value='1';
      document.getElementById('pol-b').value='-5';
      document.getElementById('pol-c').value='6';
      document.getElementById('pol-delta-min').value='1';
      document.getElementById('pol-delta-max').value='50';
      document.getElementById('pol-fb-ok').value='';
      document.getElementById('pol-fb-wrong').value='';
      document.getElementById('pol-fbgen').value='';
      if(typeof polFormChange==='function')polFormChange();
}
