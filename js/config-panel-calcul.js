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

// config-panel-calcul.js — capture/restore/reset pour le type "calcul"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-calcul.js).

function captureState_calcul() {
  var s = { type: 'calcul' };
      s.bareme=v('calc-bareme');s.text=richVal('calc-text');
      s.scenario=v('calc-scenario')||'derivee';
      s.expr=v('calc-expr')||'x^2 + sin(x)';
      s.a=v('calc-a')||'0'; s.b=v('calc-b')||'1';
      s.varMode=(document.getElementById('calc-var-mode-hidden')||{}).value||'aleatoire';
      s.vars={};
      (CALC_VAR_SPECS[s.scenario]||[]).forEach(function(vs){
        var ea=document.getElementById('calc-var-'+vs.key+'-alea'), ef=document.getElementById('calc-var-'+vs.key+'-fixe');
        s.vars[vs.key]={alea: ea?ea.value:vs.domain.join(','), fixe: ef?ef.value:String(vs.domain[0])};
      });
      s.fbOk=richVal('calc-fb-ok');s.fbWrong=richVal('calc-fb-wrong');s.fbGen=v('calc-fbgen');
  return s;
}

function restoreState_calcul(s) {
      document.getElementById('calc-bareme').value=s.bareme||1;
      setRichVal('calc-text',s.text||'');
      document.getElementById('calc-scenario').value=s.scenario||'derivee';
      document.getElementById('calc-expr').value=s.expr||'x^2 + sin(x)';
      document.getElementById('calc-a').value=s.a||'0';
      document.getElementById('calc-b').value=s.b||'1';
      setRichVal('calc-fb-ok',s.fbOk||'');
      setRichVal('calc-fb-wrong',s.fbWrong||'');
      setRichVal('calc-fbgen',s.fbGen||'');
      if(typeof calcFormChange==='function')calcFormChange();
      if(s.vars){
        Object.keys(s.vars).forEach(function(key){
          var ea=document.getElementById('calc-var-'+key+'-alea'), ef=document.getElementById('calc-var-'+key+'-fixe');
          if(ea) ea.value=s.vars[key].alea;
          if(ef) ef.value=s.vars[key].fixe;
        });
      }
      if(s.varMode){
        var r=document.querySelector('input[name="calc-var-mode-r"][value="'+s.varMode+'"]');
        if(r){ r.checked=true; if(typeof calcVarModeChange==='function')calcVarModeChange(s.varMode); }
      }
}

function resetForm_calcul() {
      setRichVal('calc-text','');
      document.getElementById('calc-bareme').value=1;
      document.getElementById('calc-scenario').value='derivee';
      document.getElementById('calc-expr').value='x^2 + sin(x)';
      document.getElementById('calc-a').value='0';
      document.getElementById('calc-b').value='1';
      setRichVal('calc-fb-ok','');
      setRichVal('calc-fb-wrong','');
      setRichVal('calc-fbgen','');
      if(typeof calcFormChange==='function')calcFormChange();
}
