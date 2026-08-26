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

// config-panel-logique.js — capture/restore/reset pour le type "logique"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-logique.js).

function captureState_logique() {
  var s = { type: 'logique' };
      s.bareme=v('lg-bareme');s.text=richVal('lg-text');
      s.scenario=v('lg-scenario')||'table';
      s.nbVars=v('lg-nb-vars')||'2';
      s.expr=v('lg-expr')||'(P and Q) or not(P)';
      s.expr2=v('lg-expr2')||'';
      s.expr3=v('lg-expr3')||'';
      s.expr4=v('lg-expr4')||'';
      s.subexpr1=v('lg-subexpr1')||'';
      s.subexpr2=v('lg-subexpr2')||'';
      s.tans=v('lg-tans')||'';
      s.nbBlanks=v('lg-nb-blanks')||'2';
      s.fbOk=v('lg-fb-ok');s.fbWrong=v('lg-fb-wrong');s.fbGen=v('lg-fbgen');
  return s;
}

function restoreState_logique(s) {
      document.getElementById('lg-bareme').value=s.bareme||1;
      setRichVal('lg-text',s.text||'');
      document.getElementById('lg-scenario').value=s.scenario||'table';
      document.getElementById('lg-nb-vars').value=s.nbVars||'2';
      document.getElementById('lg-expr').value=s.expr||'(P and Q) or not(P)';
      document.getElementById('lg-expr2').value=s.expr2||'';
      document.getElementById('lg-expr3').value=s.expr3||'';
      document.getElementById('lg-expr4').value=s.expr4||'';
      document.getElementById('lg-subexpr1').value=s.subexpr1||'';
      document.getElementById('lg-subexpr2').value=s.subexpr2||'';
      document.getElementById('lg-tans').value=s.tans||'';
      document.getElementById('lg-nb-blanks').value=s.nbBlanks||'2';
      document.getElementById('lg-fb-ok').value=s.fbOk||'';
      document.getElementById('lg-fb-wrong').value=s.fbWrong||'';
      var _lgFbGen=document.getElementById('lg-fbgen');if(_lgFbGen)_lgFbGen.value=s.fbGen||'';
      if(typeof lgFormChange==='function')lgFormChange();
}

function resetForm_logique() {
      setRichVal('lg-text','');
      document.getElementById('lg-bareme').value=1;
      document.getElementById('lg-scenario').value='table';
      document.getElementById('lg-nb-vars').value='2';
      document.getElementById('lg-expr').value='(P and Q) or not(P)';
      document.getElementById('lg-expr2').value='';
      document.getElementById('lg-expr3').value='';
      document.getElementById('lg-expr4').value='';
      document.getElementById('lg-subexpr1').value='';
      document.getElementById('lg-subexpr2').value='';
      document.getElementById('lg-tans').value='';
      document.getElementById('lg-nb-blanks').value='2';
      document.getElementById('lg-fb-ok').value='';
      document.getElementById('lg-fb-wrong').value='';
      var _lgfbGen=document.getElementById('lg-fbgen');if(_lgfbGen)_lgfbGen.value='';
      if(typeof lgFormChange==='function')lgFormChange();
}
