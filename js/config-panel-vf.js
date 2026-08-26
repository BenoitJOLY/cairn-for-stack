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

// config-panel-vf.js — capture/restore/reset pour le type "vf"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-vf.js).

function captureState_vf() {
  var s = { type: 'vf' };
      s.bareme=v('vf-bareme');s.text=richVal('vf-text');s.props=[];
      s.xe=v('vf-xe');s.xb=v('vf-xb');s.modeXb=v('vf-mode-xb');
      s.fbGen=richVal('vf-fbgen');
      s.fbGenShowFb=document.getElementById('vf-fbgen-showfb')?.checked||false;
      document.querySelectorAll('#vf-props .vf-row').forEach(function(r){
        var expEl=r.querySelector('.vf-exp:checked');
        s.props.push({text:r.querySelector('.vf-ptext').value,exp:expEl?expEl.value:'v',
          fbIfVrai:r.querySelector('.vf-fb-ifvrai')?.value||'',fbIfFaux:r.querySelector('.vf-fb-iffaux')?.value||''});
      });
  return s;
}

function restoreState_vf(s) {
      document.getElementById('vf-bareme').value=s.bareme||1;setRichVal('vf-text',s.text||'');
      if(document.getElementById('vf-xe'))document.getElementById('vf-xe').value=s.xe||1;
      if(document.getElementById('vf-xb'))document.getElementById('vf-xb').value=s.xb||1;
      if(document.getElementById('vf-mode-xb'))document.getElementById('vf-mode-xb').value=s.modeXb||'fixe';
      if(document.getElementById('vf-xb'))document.getElementById('vf-xb').disabled=(s.modeXb==='alea');
      setRichVal('vf-fbgen',s.fbGen||'');
      var vfFbGenShowFbEl=document.getElementById('vf-fbgen-showfb');if(vfFbGenShowFbEl)vfFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('vf-props').innerHTML='';
      (s.props||[]).forEach(function(p){if(typeof addVFRow==='function')addVFRow(p.text,p.exp,p.fbIfVrai||p.fbVrai||p.fbOk||'',p.fbIfFaux||p.fbFaux||p.fbWrong||'');});
}

function resetForm_vf() {
      document.getElementById('vf-props').innerHTML='';
      if(typeof addVFRow==='function'){addVFRow();}
      setRichVal('vf-text','');document.getElementById('vf-bareme').value=1;
      if(document.getElementById('vf-xe'))document.getElementById('vf-xe').value=1;
      if(document.getElementById('vf-xb')){document.getElementById('vf-xb').value=1;document.getElementById('vf-xb').disabled=false;}
      if(document.getElementById('vf-mode-xb'))document.getElementById('vf-mode-xb').value='fixe';
      setRichVal('vf-fbgen','');
      var vfFbGenShowFbReset=document.getElementById('vf-fbgen-showfb');if(vfFbGenShowFbReset)vfFbGenShowFbReset.checked=false;
}
