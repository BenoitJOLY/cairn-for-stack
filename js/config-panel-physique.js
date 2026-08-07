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

// config-panel-physique.js — capture/restore/reset pour le type "physique"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-physique.js).

function captureState_physique() {
  var s = { type: 'physique' };
      s.bareme=v('phy-bareme');s.text=richVal('phy-text');
      s.scenario=v('phy-scenario')||'mrua-vitesse';
      s.v0=v('phy-v0')||'0'; s.a=v('phy-a')||'9.81'; s.t=v('phy-t')||'3';
      s.m=v('phy-m')||'2'; s.d=v('phy-d')||'5';
      s.fbOk=v('phy-fb-ok');s.fbWrong=v('phy-fb-wrong');s.fbGen=v('phy-fbgen');
  return s;
}

function restoreState_physique(s) {
      document.getElementById('phy-bareme').value=s.bareme||1;
      setRichVal('phy-text',s.text||'');
      document.getElementById('phy-scenario').value=s.scenario||'mrua-vitesse';
      document.getElementById('phy-v0').value=s.v0||'0';
      document.getElementById('phy-a').value=s.a||'9.81';
      document.getElementById('phy-t').value=s.t||'3';
      document.getElementById('phy-m').value=s.m||'2';
      document.getElementById('phy-d').value=s.d||'5';
      document.getElementById('phy-fb-ok').value=s.fbOk||'';
      document.getElementById('phy-fb-wrong').value=s.fbWrong||'';
      document.getElementById('phy-fbgen').value=s.fbGen||'';
      if(typeof phyFormChange==='function')phyFormChange();
}

function resetForm_physique() {
      setRichVal('phy-text','');
      document.getElementById('phy-bareme').value=1;
      document.getElementById('phy-scenario').value='mrua-vitesse';
      document.getElementById('phy-v0').value='0';
      document.getElementById('phy-a').value='9.81';
      document.getElementById('phy-t').value='3';
      document.getElementById('phy-m').value='2';
      document.getElementById('phy-d').value='5';
      document.getElementById('phy-fb-ok').value='';
      document.getElementById('phy-fb-wrong').value='';
      document.getElementById('phy-fbgen').value='';
      if(typeof phyFormChange==='function')phyFormChange();
}
