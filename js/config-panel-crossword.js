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

// config-panel-crossword.js — capture/restore/reset pour le type "crossword"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-crossword.js).

function captureState_crossword() {
  var s = { type: 'crossword' };
      s.bareme=v('cw-bareme');s.count=v('cw-count');s.rows=[];
      document.querySelectorAll('#cw-body .cw-row').forEach(function(r){
        var defEl=r.querySelector('.cw-def');s.rows.push({w:(r.querySelector('.cw-word')||{}).value||''  ,d:defEl?defEl.value:''});
      });
      s.gridData=typeof currentGridData!=='undefined'?currentGridData:null;
      s.placedWords=typeof currentPlacedWords!=='undefined'?[...currentPlacedWords]:[];
      s.fbGen=v('cw-fbgen');
  return s;
}

function restoreState_crossword(s) {
      document.getElementById('cw-bareme').value=s.bareme;document.getElementById('cw-count').value=s.count;
      document.getElementById('cw-body').innerHTML='';
      if(s.rows)s.rows.forEach(function(r){if(typeof addCWRow==='function')addCWRow(r.w,r.d);});
      if(typeof currentGridData!=='undefined')currentGridData=s.gridData||null;
      if(typeof currentPlacedWords!=='undefined')currentPlacedWords=new Set(s.placedWords||[]);
      if(s.gridData&&s.gridData.maxX!==undefined){
        document.getElementById('cw-preview-area').style.display='flex';
        document.getElementById('cw-grid-preview').innerHTML=typeof renderCWGridHTML==='function'?renderCWGridHTML(s.gridData.grid,s.gridData.maxX,s.gridData.maxY):'';
        document.getElementById('cw-status-msg').textContent=I18N.t('tpl.grille_sauvegardee');
      }
      var _cwFbGen=document.getElementById('cw-fbgen');if(_cwFbGen)_cwFbGen.value=s.fbGen||'';
}

function resetForm_crossword() {
      document.getElementById('cw-body').innerHTML='';
      if(typeof addCWRow==='function')addCWRow('','');
      setRichVal('cw-text','');
      var _cwfbGen=document.getElementById('cw-fbgen');if(_cwfbGen)_cwfbGen.value='';
}
