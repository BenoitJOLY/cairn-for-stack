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

// config-panel-dropdown.js — capture/restore/reset pour le type "dropdown"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-dropdown.js).

function captureState_dropdown() {
  var s = { type: 'dropdown' };
      s.bareme=v('dd-bareme');s.text=richVal('dd-text');s.xe=v('dd-xe');s.vrais=[];s.faux=[];
      s.fbGen=richVal('dd-fbgen');
      s.fbGenShowFb=document.getElementById('dd-fbgen-showfb')?.checked||false;
      document.querySelectorAll('#dd-vrais .prop-row').forEach(function(r){s.vrais.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
      document.querySelectorAll('#dd-faux .prop-row').forEach(function(r){s.faux.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
  return s;
}

function restoreState_dropdown(s) {
      document.getElementById('dd-bareme').value=s.bareme;setRichVal('dd-text',s.text);
      document.getElementById('dd-xe').value=s.xe;
      setRichVal('dd-fbgen',s.fbGen||'');
      var ddFbGenShowFbEl=document.getElementById('dd-fbgen-showfb');if(ddFbGenShowFbEl)ddFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('dd-vrais').innerHTML='';document.getElementById('dd-faux').innerHTML='';
      (s.vrais||[]).forEach(function(p){addPoolRow('dd-vrais',true,p.text,p.fb,true);});
      (s.faux||[]).forEach(function(p){addPoolRow('dd-faux',false,p.text,p.fb,true);});
      if(typeof checkPoolWarn==='function')checkPoolWarn('dd');
}

function resetForm_dropdown() {
      document.getElementById('dd-vrais').innerHTML='';document.getElementById('dd-faux').innerHTML='';
      if(typeof addPoolRow==='function'){addPoolRow('dd-vrais',true,'','',true);addPoolRow('dd-faux',false,'','',true);}
      setRichVal('dd-text','');document.getElementById('dd-bareme').value=1;document.getElementById('dd-xe').value=2;
      setRichVal('dd-fbgen','');
      var ddFbGenShowFbReset=document.getElementById('dd-fbgen-showfb');if(ddFbGenShowFbReset)ddFbGenShowFbReset.checked=false;
      if(typeof checkPoolWarn==='function')checkPoolWarn('dd');
}
