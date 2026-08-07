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

// config-panel-rvbcmj.js — capture/restore/reset pour le type "rvbcmj"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-rvbcmj.js).

function captureState_rvbcmj() {
  var s = { type: 'rvbcmj' };
      s.bareme=v('rvb-bareme');s.imgData=v('rvb-imgdata');
      var rvbModeEl=document.querySelector('input[name="rvb-mode"]:checked');
      s.mode=rvbModeEl?rvbModeEl.value:'rvb';
      s.nb=document.getElementById('rvb-nb').checked;
      s.answer=v('rvb-answer');s.text=richVal('rvb-text');
      s.fbOk=v('rvb-fb-ok');s.fbWrong=v('rvb-fb-wrong');s.fbGen=v('rvb-fbgen');
  return s;
}

function restoreState_rvbcmj(s) {
      document.getElementById('rvb-bareme').value=s.bareme||1;document.getElementById('rvb-imgdata').value=s.imgData||'';
      if(s.imgData&&typeof rvbRestoreImage==='function')rvbRestoreImage(s.imgData);
      var rvbR=document.querySelector('input[name="rvb-mode"][value="'+(s.mode||'rvb')+'"]');
      if(rvbR)rvbR.checked=true;
      document.getElementById('rvb-nb').checked=!!s.nb;
      document.getElementById('rvb-answer').value=s.answer||'';setRichVal('rvb-text',s.text||'');
      document.getElementById('rvb-fb-ok').value=s.fbOk||'';document.getElementById('rvb-fb-wrong').value=s.fbWrong||'';
      var _rvbFbGen=document.getElementById('rvb-fbgen');if(_rvbFbGen)_rvbFbGen.value=s.fbGen||'';
      document.getElementById('rvb-preview-filtered').style.display='none';
}

function resetForm_rvbcmj() {
      document.getElementById('rvb-imgdata').value='';
      if(typeof rvbClearImage==='function')rvbClearImage();
      var rvbFileClear=document.getElementById('rvb-file');if(rvbFileClear)rvbFileClear.value='';
      var rvbFnClear=document.getElementById('rvb-filename');if(rvbFnClear)rvbFnClear.textContent='';
      var rvbRvb=document.querySelector('input[name="rvb-mode"][value="rvb"]');if(rvbRvb)rvbRvb.checked=true;
      document.getElementById('rvb-nb').checked=false;document.getElementById('rvb-answer').value='';
      setRichVal('rvb-text','');document.getElementById('rvb-fb-ok').value='';document.getElementById('rvb-fb-wrong').value='';
      var _rvbfbGen=document.getElementById('rvb-fbgen');if(_rvbfbGen)_rvbfbGen.value='';
      document.getElementById('rvb-bareme').value=1;
      var rvbPF=document.getElementById('rvb-preview-filtered');
      if(rvbPF){rvbPF.style.display='none';rvbPF.innerHTML='';}
}
