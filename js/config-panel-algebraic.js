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

// config-panel-algebraic.js — capture/restore/reset pour le type "algebraic"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-algebraic.js).

function captureState_algebraic() {
  var s = { type: 'algebraic' };
      s.bareme=v('alg-bareme');s.text=richVal('alg-text');s.formula=v('alg-formula');s.vars=v('alg-vars');
      s.mode=v('alg-mode');s.exprDisplay=document.getElementById('alg-expr-display')?.value||'';s.error=document.getElementById('alg-error')?.value||'';
      s.fbc=richVal('alg-fbc');s.fbe=richVal('alg-fbe');s.sol=richVal('alg-sol');
      s.aideOn=document.getElementById('alg-aide-on')?.checked||false;
      s.helpCbs=[...document.querySelectorAll('.alg-h')].map(function(c){return c.checked;});
      s.helpVars=document.getElementById('alg-h-vars').checked;
      s.fbDetail={};
      if (typeof ALG_FB_DEFS !== 'undefined') { Object.keys(ALG_FB_DEFS).forEach(function(mode){ ALG_FB_DEFS[mode].forEach(function(item){ s.fbDetail[_algFbId(mode,item.key)] = richVal(_algFbId(mode,item.key)); }); }); }
  return s;
}

function restoreState_algebraic(s) {
      document.getElementById('alg-bareme').value=s.bareme;setRichVal('alg-text',s.text);
      document.getElementById('alg-formula').value=s.formula;document.getElementById('alg-vars').value=s.vars;
      if(document.getElementById('alg-mode'))document.getElementById('alg-mode').value=s.mode||'libre';
      if(document.getElementById('alg-expr-display'))document.getElementById('alg-expr-display').value=s.exprDisplay||'';
      if(document.getElementById('alg-error'))document.getElementById('alg-error').value=s.error||'';
      if(typeof toggleAlgMode==='function')toggleAlgMode();
      setRichVal('alg-fbc',s.fbc);setRichVal('alg-fbe',s.fbe);setRichVal('alg-sol',s.sol);
      if (typeof ALG_FB_DEFS !== 'undefined') { Object.keys(ALG_FB_DEFS).forEach(function(mode){ ALG_FB_DEFS[mode].forEach(function(item){ var id=_algFbId(mode,item.key); if(s.fbDetail && s.fbDetail[id]) setRichVal(id, s.fbDetail[id]); }); }); }
      var algCbs=document.querySelectorAll('.alg-h');
      (s.helpCbs||[]).forEach(function(cv,i){if(algCbs[i])algCbs[i].checked=cv;});
      document.getElementById('alg-h-vars').checked=!!s.helpVars;
      if(typeof updateAlgPreview==='function')updateAlgPreview();
      if(typeof markErr==='function')markErr('alg-formula','err-alg-formula',false);
}

function resetForm_algebraic() {
      ['alg-text','alg-fbc','alg-fbe','alg-sol'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('alg-formula').value='';
      if(document.getElementById('alg-mode'))document.getElementById('alg-mode').value='libre';
      if(document.getElementById('alg-expr-display'))document.getElementById('alg-expr-display').value='';
      if(document.getElementById('alg-error'))document.getElementById('alg-error').value='';
      if(typeof toggleAlgMode==='function')toggleAlgMode();
      if (typeof ALG_FB_DEFS !== 'undefined') { Object.keys(ALG_FB_DEFS).forEach(function(mode){ ALG_FB_DEFS[mode].forEach(function(item){ setRichVal(_algFbId(mode,item.key), item.def); }); }); }
}
