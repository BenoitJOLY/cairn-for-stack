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

// config-panel-matrices.js — capture/restore/reset pour le type "matrices"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-matrices.js).

function captureState_matrices() {
  var s = { type: 'matrices' };
      s.bareme=v('mat-bareme');s.text=richVal('mat-text');
      s.scenario=v('mat-scenario')||'produit-2x2';
      s.randMin=v('mat-rand-min')||'-3';s.randMax=v('mat-rand-max')||'3';
      s.fbOk=v('mat-fb-ok');s.fbWrong=v('mat-fb-wrong');
      s.fbGen=v('mat-fbgen');
  return s;
}

function restoreState_matrices(s) {
      document.getElementById('mat-bareme').value=s.bareme||1;
      setRichVal('mat-text',s.text||'');
      document.getElementById('mat-scenario').value=s.scenario||'produit-2x2';
      var matRMin=document.getElementById('mat-rand-min');if(matRMin)matRMin.value=s.randMin||'-3';
      var matRMax=document.getElementById('mat-rand-max');if(matRMax)matRMax.value=s.randMax||'3';
      var matFbOk=document.getElementById('mat-fb-ok');if(matFbOk)matFbOk.value=s.fbOk||'';
      var matFbWrong=document.getElementById('mat-fb-wrong');if(matFbWrong)matFbWrong.value=s.fbWrong||'';
      document.getElementById('mat-fbgen').value=s.fbGen||'';
      if(typeof matFormChange==='function')matFormChange();
}

function resetForm_matrices() {
      setRichVal('mat-text','');
      document.getElementById('mat-bareme').value=1;
      document.getElementById('mat-scenario').value='produit-2x2';
      var matRMinR=document.getElementById('mat-rand-min');if(matRMinR)matRMinR.value='-3';
      var matRMaxR=document.getElementById('mat-rand-max');if(matRMaxR)matRMaxR.value='3';
      var matFbOkR=document.getElementById('mat-fb-ok');if(matFbOkR)matFbOkR.value='';
      var matFbWrongR=document.getElementById('mat-fb-wrong');if(matFbWrongR)matFbWrongR.value='';
      document.getElementById('mat-fbgen').value='';
      if(typeof matFormChange==='function')matFormChange();
}
