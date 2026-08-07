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

// config-panel-geogebra.js — capture/restore/reset pour le type "geogebra"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-geogebra.js).

function captureState_geogebra() {
  var s = { type: 'geogebra' };
      var ggbSt=(typeof ggbCaptureFromForm==='function')?ggbCaptureFromForm():(window._ggbState||{});
      s.bareme=v('ggb-bareme');s.text=richVal('ggb-text');
      s.model=ggbSt.model||'expert';
      s.materialId=ggbSt.materialId||'';s.width=ggbSt.width||700;s.height=ggbSt.height||500;
      s.showToolbar=!!ggbSt.showToolbar;
      s.inputs=JSON.parse(JSON.stringify(ggbSt.inputs||[]));
      s.outputs=JSON.parse(JSON.stringify(ggbSt.outputs||[]));
      s.coeffCfg=JSON.parse(JSON.stringify(ggbSt.coeffCfg||{}));
      s.fbGen=v('ggb-fbgen');
  return s;
}

function restoreState_geogebra(s) {
      document.getElementById('ggb-bareme').value=s.bareme||1;setRichVal('ggb-text',s.text||'');
      if(typeof ggbRestoreState==='function')ggbRestoreState(s);
      var _ggbFbGen=document.getElementById('ggb-fbgen');if(_ggbFbGen)_ggbFbGen.value=s.fbGen||'';
}

function resetForm_geogebra() {
      if(typeof ggbReset==='function')ggbReset();
      var _ggbfbGen=document.getElementById('ggb-fbgen');if(_ggbfbGen)_ggbfbGen.value='';
}
