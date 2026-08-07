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

// config-panel-suites.js — capture/restore/reset pour le type "suites"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-suites.js).

function captureState_suites() {
  var s = { type: 'suites' };
      s.bareme=v('sui-bareme');s.text=richVal('sui-text');
      s.scenario=v('sui-scenario')||'terme-arith';
      s.mode=v('sui-mode')||'aleatoire';
      s.u0=v('sui-u0')||'3'; s.r=v('sui-r')||'2'; s.q=v('sui-q')||'2'; s.k=v('sui-k')||'5';
      s.u0Min=v('sui-u0-min')||'-5'; s.u0Max=v('sui-u0-max')||'5';
      s.rMin=v('sui-r-min')||'-5'; s.rMax=v('sui-r-max')||'5';
      s.qMin=v('sui-q-min')||'-3'; s.qMax=v('sui-q-max')||'3';
      s.kMin=v('sui-k-min')||'3'; s.kMax=v('sui-k-max')||'6';
      s.fbOk=v('sui-fb-ok');s.fbWrong=v('sui-fb-wrong');s.fbGen=v('sui-fbgen');
  return s;
}

function restoreState_suites(s) {
      document.getElementById('sui-bareme').value=s.bareme||1;
      setRichVal('sui-text',s.text||'');
      document.getElementById('sui-scenario').value=s.scenario||'terme-arith';
      var _sMode=document.getElementById('sui-mode');if(_sMode)_sMode.value=s.mode||'aleatoire';
      document.getElementById('sui-u0').value=s.u0||'3';
      document.getElementById('sui-r').value=s.r||'2';
      document.getElementById('sui-q').value=s.q||'2';
      var _sK=document.getElementById('sui-k');if(_sK)_sK.value=s.k||'5';
      var _sB=['u0-min','u0-max','r-min','r-max','q-min','q-max','k-min','k-max'];
      var _sBDef={u0Min:'-5',u0Max:'5',rMin:'-5',rMax:'5',qMin:'-3',qMax:'3',kMin:'3',kMax:'6'};
      _sB.forEach(function(id){
        var camel=id.replace(/-(\w)/,function(_,c){return c.toUpperCase();});
        var e=document.getElementById('sui-'+id);if(e)e.value=s[camel]||_sBDef[camel];
      });
      document.getElementById('sui-fb-ok').value=s.fbOk||'';
      document.getElementById('sui-fb-wrong').value=s.fbWrong||'';
      document.getElementById('sui-fbgen').value=s.fbGen||'';
      if(typeof suiFormChange==='function')suiFormChange();
}

function resetForm_suites() {
      setRichVal('sui-text','');
      document.getElementById('sui-bareme').value=1;
      document.getElementById('sui-scenario').value='terme-arith';
      var _srMode=document.getElementById('sui-mode');if(_srMode)_srMode.value='aleatoire';
      document.getElementById('sui-u0').value='3';
      document.getElementById('sui-r').value='2';
      document.getElementById('sui-q').value='2';
      var _srK=document.getElementById('sui-k');if(_srK)_srK.value='5';
      var _srB={'u0-min':'-5','u0-max':'5','r-min':'-5','r-max':'5','q-min':'-3','q-max':'3','k-min':'3','k-max':'6'};
      Object.keys(_srB).forEach(function(id){var e=document.getElementById('sui-'+id);if(e)e.value=_srB[id];});
      document.getElementById('sui-fb-ok').value='';
      document.getElementById('sui-fb-wrong').value='';
      document.getElementById('sui-fbgen').value='';
      if(typeof suiFormChange==='function')suiFormChange();
}
