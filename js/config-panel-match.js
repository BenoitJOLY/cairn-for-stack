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

// config-panel-match.js — capture/restore/reset pour le type "match"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-match.js).

function captureState_match() {
  var s = { type: 'match' };
      s.bareme=v('match-bareme');s.text=richVal('match-text');
      s.left=JSON.parse(JSON.stringify(matchState.left));
      s.right=JSON.parse(JSON.stringify(matchState.right));
      s.connections=JSON.parse(JSON.stringify(matchState.connections));
      s.fbGen=v('match-fbgen');
  return s;
}

function restoreState_match(s) {
      document.getElementById('match-bareme').value=s.bareme;setRichVal('match-text',s.text);
      matchState.left=JSON.parse(JSON.stringify(s.left));
      matchState.right=JSON.parse(JSON.stringify(s.right));
      matchState.connections=JSON.parse(JSON.stringify(s.connections));
      if(typeof renderMatchLists==='function')renderMatchLists();
      var _matchFbGen=document.getElementById('match-fbgen');if(_matchFbGen)_matchFbGen.value=s.fbGen||'';
}

function resetForm_match() {
      matchState={left:[],right:[],connections:[],selectedLeft:null};
      setRichVal('match-text','');
      if(typeof renderMatchLists==='function')renderMatchLists();
      var _matchfbGen=document.getElementById('match-fbgen');if(_matchfbGen)_matchfbGen.value='';
}
