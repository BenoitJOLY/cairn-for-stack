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

// config-panel-circuit.js — capture/restore/reset pour le type "circuit"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-circuit.js).

function captureState_circuit() {
  var s = { type: 'circuit' };
      s.bareme=v('cir-bareme');s.text=richVal('cir-text');
      s.checkValues=document.getElementById('cir-check-values')?.checked||false;
      s.fbGen=v('cir-fbgen');
      s.cirModel=(typeof cirReadModelFromCanvas==='function')?cirReadModelFromCanvas():null;
  return s;
}

function restoreState_circuit(s) {
      document.getElementById('cir-bareme').value=s.bareme||1;
      setRichVal('cir-text',s.text||'');
      var _cirChk=document.getElementById('cir-check-values');if(_cirChk)_cirChk.checked=!!s.checkValues;
      var _cirFbGen=document.getElementById('cir-fbgen');if(_cirFbGen)_cirFbGen.value=s.fbGen||'';
}

function resetForm_circuit() {
      setRichVal('cir-text','');
      document.getElementById('cir-bareme').value=1;
      var _circhk=document.getElementById('cir-check-values');if(_circhk)_circhk.checked=false;
      var _cirfbGen=document.getElementById('cir-fbgen');if(_cirfbGen)_cirfbGen.value='';
      if(typeof cirClearCanvas==='function')cirClearCanvas();
}
