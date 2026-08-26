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

// config-panel-statistiques.js — capture/restore/reset pour le type "statistiques"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-statistiques.js).

function captureState_statistiques() {
  var s = { type: 'statistiques' };
      s.bareme=v('stat-bareme');s.text=richVal('stat-text');
      s.scenario=v('stat-scenario')||'moyenne';
      s.mode=v('stat-mode')||'fixe';
      s.data=v('stat-data')||'2,5,8,3,7,4,6';
      s.vals=v('stat-vals')||'10,20,30,40';
      s.effs=v('stat-effs')||'3,5,2,4';
      s.display=v('stat-display')||'liste';
      s.dataDecimals=v('stat-data-decimals')||'1';
      s.varName=v('stat-varname')||'x';
      s.randFormat=(function(){ var r=document.querySelector('input[name="stat-rand-format-radio"]:checked'); return r?r.value:'decimal'; })();
      s.fbOk=richVal('stat-fb-ok');s.fbWrong=richVal('stat-fb-wrong');s.fbGen=richVal('stat-fbgen');
  return s;
}

function restoreState_statistiques(s) {
      document.getElementById('stat-bareme').value=s.bareme||1;
      setRichVal('stat-text',s.text||'');
      document.getElementById('stat-scenario').value=s.scenario||'moyenne';
      document.getElementById('stat-mode').value=s.mode||'fixe';
      document.querySelectorAll('input[name="stat-mode-radio"]').forEach(function(r){ r.checked=(r.value===(s.mode||'fixe')); });
      document.getElementById('stat-data').value=s.data||'2,5,8,3,7,4,6';
      document.getElementById('stat-vals').value=s.vals||'10,20,30,40';
      document.getElementById('stat-effs').value=s.effs||'3,5,2,4';
      document.getElementById('stat-display').value=s.display||'liste';
      document.getElementById('stat-data-decimals').value=s.dataDecimals||'1';
      document.getElementById('stat-varname').value=s.varName||'x';
      document.querySelectorAll('input[name="stat-rand-format-radio"]').forEach(function(r){ r.checked=(r.value===(s.randFormat||'decimal')); });
      document.querySelectorAll('input[name="stat-display-radio"]').forEach(function(r){ r.checked=(r.value===(s.display||'liste')); });
      setRichVal('stat-fb-ok',s.fbOk||'');
      setRichVal('stat-fb-wrong',s.fbWrong||'');
      setRichVal('stat-fbgen',s.fbGen||'');
      if(typeof statFormChange==='function')statFormChange();
}

function resetForm_statistiques() {
      setRichVal('stat-text','');
      document.getElementById('stat-bareme').value=1;
      document.getElementById('stat-scenario').value='moyenne';
      document.getElementById('stat-mode').value='fixe';
      document.querySelectorAll('input[name="stat-mode-radio"]').forEach(function(r){ r.checked=(r.value==='fixe'); });
      document.getElementById('stat-data').value='2,5,8,3,7,4,6';
      document.getElementById('stat-vals').value='10,20,30,40';
      document.getElementById('stat-effs').value='3,5,2,4';
      document.getElementById('stat-display').value='liste';
      document.getElementById('stat-data-decimals').value='1';
      document.getElementById('stat-varname').value='x';
      document.querySelectorAll('input[name="stat-rand-format-radio"]').forEach(function(r){ r.checked=(r.value==='decimal'); });
      document.querySelectorAll('input[name="stat-display-radio"]').forEach(function(r){ r.checked=(r.value==='liste'); });
      setRichVal('stat-fb-ok','');
      setRichVal('stat-fb-wrong','');
      setRichVal('stat-fbgen','');
      if(typeof statFormChange==='function')statFormChange();
}
