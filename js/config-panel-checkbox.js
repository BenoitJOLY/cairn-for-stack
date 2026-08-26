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

// config-panel-checkbox.js — capture/restore/reset pour le type "checkbox"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-checkbox.js).

function captureState_checkbox() {
  var s = { type: 'checkbox' };
      s.bareme=v('cb-bareme');s.text=richVal('cb-text');s.xe=v('cb-xe');s.mXb=v('cb-mode-xb');s.xb=v('cb-xb');
      s.fbGen=richVal('cb-fbgen');
      s.showOubli=document.getElementById('cb-show-oubli')?.checked||false;
      s.fbGenShowFb=document.getElementById('cb-fbgen-showfb')?.checked||false;
      s.props=[];
      document.querySelectorAll('#cb-props .prop-row').forEach(function(r){
        s.props.push({isV:r.querySelector('.p-bool').value==='true',text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value,fb2:r.querySelector('.p-fb2')?.value||''});
      });
  return s;
}

function restoreState_checkbox(s) {
      document.getElementById('cb-bareme').value=s.bareme;setRichVal('cb-text',s.text);
      document.getElementById('cb-xe').value=s.xe;document.getElementById('cb-mode-xb').value=s.mXb;
      document.getElementById('cb-xb').value=s.xb;document.getElementById('cb-xb').disabled=s.mXb==='alea';
      setRichVal('cb-fbgen',s.fbGen||'');
      var cbOubliEl=document.getElementById('cb-show-oubli');if(cbOubliEl)cbOubliEl.checked=s.showOubli||false;
      var cbFbGenShowFbEl=document.getElementById('cb-fbgen-showfb');if(cbFbGenShowFbEl)cbFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('cb-props').innerHTML='';
      (s.props||[]).forEach(function(p){addCBRow(p.isV,p.text,p.fb,p.fb2||'');});
      if(typeof toggleCBOubli==='function')toggleCBOubli();
}

function resetForm_checkbox() {
      var cbOubliReset=document.getElementById('cb-show-oubli');if(cbOubliReset)cbOubliReset.checked=false;
      var cbFbGenShowFbReset=document.getElementById('cb-fbgen-showfb');if(cbFbGenShowFbReset)cbFbGenShowFbReset.checked=false;
      document.getElementById('cb-props').innerHTML='';
      if(typeof addCBRow==='function'){addCBRow(true);addCBRow(false);}
      setRichVal('cb-text','');document.getElementById('cb-bareme').value=1;
      document.getElementById('cb-xe').value=2;document.getElementById('cb-mode-xb').value='fixe';
      document.getElementById('cb-xb').value=1;document.getElementById('cb-xb').disabled=false;
      setRichVal('cb-fbgen','');
      var warnCb=document.getElementById('warn-cb-draw');if(warnCb)warnCb.style.display='none';
}
