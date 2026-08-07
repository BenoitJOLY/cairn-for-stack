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

// config-panel-oscilloscope.js — capture/restore/reset pour le type "oscilloscope"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-oscilloscope.js).

function captureState_oscilloscope() {
  var s = { type: 'oscilloscope' };
      s.bareme=v('osc-bareme');s.text=richVal('osc-text');
      s.mode=v('osc-mode')||'periode_frequence';
      s.pedMode=v('osc-ped-mode')||'guide';
      s.forme=v('osc-forme')||'aleatoire';
      s.freqMode=v('osc-freq-mode')||'fixed';
      s.ffreq=v('osc-ffreq')||'500';s.umax=v('osc-umax')||'3';
      s.evoltBase=v('osc-evolt-base')||'2000';s.evoltRange=v('osc-evolt-range')||'1000';
      s.tauBase=v('osc-tau-base')||'1000';s.tauRange=v('osc-tau-range')||'1000';
      s.fcarrier=v('osc-fcarrier')||'4000000';s.fmod=v('osc-fmod')||'2000';
      s.dtMin=v('osc-dt-min')||'4';s.dtMax=v('osc-dt-max')||'8';
      s.shIdx=document.getElementById('osc-sh-idx').value;
      s.svIdx=document.getElementById('osc-sv-idx').value;
      s.shAuto=document.getElementById('osc-sh-auto').checked;
      s.svAuto=document.getElementById('osc-sv-auto').checked;
      s.fbGen=v('osc-fbgen');
  return s;
}

function restoreState_oscilloscope(s) {
      document.getElementById('osc-bareme').value=s.bareme||1;
      setRichVal('osc-text',s.text||'');
      document.getElementById('osc-mode').value=s.mode||'periode_frequence';
      var _oscPedMode=document.getElementById('osc-ped-mode');if(_oscPedMode)_oscPedMode.value=s.pedMode||'guide';
      document.getElementById('osc-forme').value=s.forme||'aleatoire';
      document.getElementById('osc-freq-mode').value=s.freqMode||'fixed';
      document.getElementById('osc-ffreq').value=s.ffreq||'500';
      document.getElementById('osc-umax').value=s.umax||'3';
      document.getElementById('osc-evolt-base').value=s.evoltBase||'2000';
      document.getElementById('osc-evolt-range').value=s.evoltRange||'1000';
      document.getElementById('osc-tau-base').value=s.tauBase||'1000';
      document.getElementById('osc-tau-range').value=s.tauRange||'1000';
      document.getElementById('osc-fcarrier').value=s.fcarrier||'4000000';
      document.getElementById('osc-fmod').value=s.fmod||'2000';
      document.getElementById('osc-dt-min').value=s.dtMin||'4';
      document.getElementById('osc-dt-max').value=s.dtMax||'8';
      document.getElementById('osc-sh-auto').checked=s.shAuto!==false;
      document.getElementById('osc-sv-auto').checked=s.svAuto!==false;
      if(!s.shAuto) document.getElementById('osc-sh-idx').value=s.shIdx||'10';
      if(!s.svAuto) document.getElementById('osc-sv-idx').value=s.svIdx||'7';
      document.getElementById('osc-sh-idx').disabled=document.getElementById('osc-sh-auto').checked;
      document.getElementById('osc-sv-idx').disabled=document.getElementById('osc-sv-auto').checked;
      var _oscFbGen=document.getElementById('osc-fbgen');if(_oscFbGen)_oscFbGen.value=s.fbGen||'';
      if(typeof oscModeChange==='function')oscModeChange();
      if(typeof oscFreqModeChange==='function')oscFreqModeChange();
      if(typeof oscUpdateShSvAuto==='function')oscUpdateShSvAuto();
}

function resetForm_oscilloscope() {
      setRichVal('osc-text','');
      document.getElementById('osc-bareme').value=1;
      document.getElementById('osc-mode').value='periode_frequence';
      var _oscPedModeReset=document.getElementById('osc-ped-mode');if(_oscPedModeReset)_oscPedModeReset.value='guide';
      document.getElementById('osc-forme').value='aleatoire';
      document.getElementById('osc-freq-mode').value='fixed';
      document.getElementById('osc-ffreq').value='500';
      document.getElementById('osc-umax').value='3';
      document.getElementById('osc-evolt-base').value='2000';
      document.getElementById('osc-evolt-range').value='1000';
      document.getElementById('osc-tau-base').value='1000';
      document.getElementById('osc-tau-range').value='1000';
      document.getElementById('osc-fcarrier').value='4000000';
      document.getElementById('osc-fmod').value='2000';
      document.getElementById('osc-dt-min').value='4';
      document.getElementById('osc-dt-max').value='8';
      document.getElementById('osc-sh-auto').checked=true;
      document.getElementById('osc-sv-auto').checked=true;
      document.getElementById('osc-sh-idx').disabled=true;
      document.getElementById('osc-sv-idx').disabled=true;
      var _oscfbGen=document.getElementById('osc-fbgen');if(_oscfbGen)_oscfbGen.value='';
      if(typeof oscModeChange==='function')oscModeChange();
      if(typeof oscFreqModeChange==='function')oscFreqModeChange();
      if(typeof oscUpdateShSvAuto==='function')oscUpdateShSvAuto();
}
