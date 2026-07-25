// config-panel-equivalence.js — capture/restore/reset pour le type "equivalence"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-equivalence.js).

function captureState_equivalence() {
  var s = { type: 'equivalence' };
      s.bareme=v('eq-bareme');s.text=richVal('eq-text');
      s.scenario=v('eq-scenario')||'developpement';
      s.formule=v('eq-formule')||'';
      s.variable=v('eq-variable')||'x'; s.variables=v('eq-variables')||'x,y';
      s.resultat=v('eq-resultat')||'';
      s.etapeCheck=!!document.getElementById('eq-etape-check').checked;
      s.etapeVal=v('eq-etape-val')||'';
      s.fbOk=v('eq-fb-ok');s.fbWrong=v('eq-fb-wrong');s.fbGen=v('eq-fbgen');
  return s;
}

function restoreState_equivalence(s) {
      document.getElementById('eq-bareme').value=s.bareme||1;
      setRichVal('eq-text',s.text||'');
      document.getElementById('eq-scenario').value=s.scenario||'developpement';
      document.getElementById('eq-formule').value=s.formule||'';
      document.getElementById('eq-variable').value=s.variable||'x';
      document.getElementById('eq-variables').value=s.variables||'x,y';
      document.getElementById('eq-resultat').value=s.resultat||'';
      document.getElementById('eq-etape-check').checked=!!s.etapeCheck;
      document.getElementById('eq-etape-val').value=s.etapeVal||'';
      document.getElementById('eq-fb-ok').value=s.fbOk||'';
      document.getElementById('eq-fb-wrong').value=s.fbWrong||'';
      document.getElementById('eq-fbgen').value=s.fbGen||'';
      if(typeof eqOnScenarioChange==='function')eqOnScenarioChange();
}

function resetForm_equivalence() {
      setRichVal('eq-text','');
      document.getElementById('eq-bareme').value=1;
      document.getElementById('eq-scenario').value='developpement';
      document.getElementById('eq-formule').value='';
      document.getElementById('eq-variable').value='x';
      document.getElementById('eq-variables').value='x,y';
      document.getElementById('eq-resultat').value='';
      document.getElementById('eq-etape-check').checked=false;
      document.getElementById('eq-etape-val').value='';
      document.getElementById('eq-fb-ok').value='';
      document.getElementById('eq-fb-wrong').value='';
      document.getElementById('eq-fbgen').value='';
      if(typeof eqFormChange==='function')eqFormChange();
}
