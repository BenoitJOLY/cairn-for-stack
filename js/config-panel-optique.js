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

// config-panel-optique.js — capture/restore/reset pour le type "optique"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-optique.js).

function captureState_optique() {
  var s = { type: 'optique' };
      s.scenario=v('opt-scenario')||'lentille-convergente';
      s.bareme=v('opt-bareme');s.text=richVal('opt-text');
      s.f=v('opt-f');s.oa=v('opt-oa');s.ab=v('opt-ab');
      s.mirF=v('opt-mir-f');s.mirSa=v('opt-mir-sa');s.mirAb=v('opt-mir-ab');
      s.mpSa=v('opt-mp-sa');s.mpAb=v('opt-mp-ab');
      s.luF1=v('opt-f1');s.luF2=v('opt-f2');s.luTheta=v('opt-theta');s.luBeamH=v('opt-beam-h');
      s.telF1=v('opt-tel-f1');s.telTheta=v('opt-tel-theta');s.telBeamH=v('opt-tel-beam-h');
      s.micF1=v('opt-mic-f1');s.micF2=v('opt-mic-f2');s.micOa=v('opt-mic-oa');s.micAb=v('opt-mic-ab');
      s.w=v('opt-w');s.h=v('opt-h');
      s.fbGen=v('opt-fbgen');
  return s;
}

function restoreState_optique(s) {
      document.getElementById('opt-scenario').value=s.scenario||'lentille-convergente';
      document.getElementById('opt-bareme').value=s.bareme||1;
      setRichVal('opt-text',s.text||'');
      document.getElementById('opt-f').value=s.f||20;
      document.getElementById('opt-oa').value=s.oa||-30;
      document.getElementById('opt-ab').value=s.ab||2;
      document.getElementById('opt-mir-f').value=s.mirF||3;
      document.getElementById('opt-mir-sa').value=s.mirSa||7;
      document.getElementById('opt-mir-ab').value=s.mirAb||1.5;
      document.getElementById('opt-mp-sa').value=s.mpSa||7;
      document.getElementById('opt-mp-ab').value=s.mpAb||1.5;
      document.getElementById('opt-f1').value=s.luF1||40;
      document.getElementById('opt-f2').value=s.luF2||10;
      document.getElementById('opt-theta').value=s.luTheta||3;
      document.getElementById('opt-beam-h').value=s.luBeamH||3;
      document.getElementById('opt-tel-f1').value=s.telF1||40;
      document.getElementById('opt-tel-theta').value=s.telTheta||3;
      document.getElementById('opt-tel-beam-h').value=s.telBeamH||3;
      document.getElementById('opt-mic-f1').value=s.micF1||1;
      document.getElementById('opt-mic-f2').value=s.micF2||4;
      document.getElementById('opt-mic-oa').value=s.micOa||-1.25;
      document.getElementById('opt-mic-ab').value=s.micAb||0.08;
      document.getElementById('opt-w').value=s.w||700;
      document.getElementById('opt-h').value=s.h||380;
      var _optFbGen=document.getElementById('opt-fbgen');if(_optFbGen)_optFbGen.value=s.fbGen||'';
      if(typeof optScenarioChange==='function')optScenarioChange();
}

function resetForm_optique() {
      setRichVal('opt-text','');
      document.getElementById('opt-scenario').value='lentille-convergente';
      document.getElementById('opt-bareme').value=1;
      document.getElementById('opt-f').value=20;
      document.getElementById('opt-oa').value=-30;
      document.getElementById('opt-ab').value=2;
      document.getElementById('opt-mir-f').value=3;
      document.getElementById('opt-mir-sa').value=7;
      document.getElementById('opt-mir-ab').value=1.5;
      document.getElementById('opt-mp-sa').value=7;
      document.getElementById('opt-mp-ab').value=1.5;
      document.getElementById('opt-f1').value=40;
      document.getElementById('opt-f2').value=10;
      document.getElementById('opt-theta').value=3;
      document.getElementById('opt-beam-h').value=3;
      document.getElementById('opt-tel-f1').value=40;
      document.getElementById('opt-tel-theta').value=3;
      document.getElementById('opt-tel-beam-h').value=3;
      document.getElementById('opt-mic-f1').value=1;
      document.getElementById('opt-mic-f2').value=4;
      document.getElementById('opt-mic-oa').value=-1.25;
      document.getElementById('opt-mic-ab').value=0.08;
      document.getElementById('opt-w').value=700;
      document.getElementById('opt-h').value=380;
      var _optfbGen=document.getElementById('opt-fbgen');if(_optfbGen)_optfbGen.value='';
      if(typeof optScenarioChange==='function')optScenarioChange();
}
