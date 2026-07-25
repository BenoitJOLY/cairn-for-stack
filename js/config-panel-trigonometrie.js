// config-panel-trigonometrie.js — capture/restore/reset pour le type "trigonometrie"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-trigonometrie.js).

function captureState_trigonometrie() {
  var s = { type: 'trigonometrie' };
      s.bareme=v('trig-bareme');s.text=richVal('trig-text');
      s.scenario=v('trig-scenario')||'valeur-exacte';
      s.mode=(document.querySelector('input[name="trig-mode-r"]:checked')||{}).value||'aleatoire';
      s.fn=v('trig-fn')||'sin'; s.angle=v('trig-angle')||'%pi/6';
      s.expr=v('trig-expr')||'sin(x)^2 + cos(x)^2';
      s.fbOk=v('trig-fb-ok');s.fbWrong=v('trig-fb-wrong');s.fbGen=v('trig-fbgen');
  return s;
}

function restoreState_trigonometrie(s) {
      document.getElementById('trig-bareme').value=s.bareme||1;
      setRichVal('trig-text',s.text||'');
      document.getElementById('trig-scenario').value=s.scenario||'valeur-exacte';
      var trigModeR=document.querySelector('input[name="trig-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(trigModeR) trigModeR.checked=true;
      document.getElementById('trig-fn').value=s.fn||'sin';
      document.getElementById('trig-angle').value=s.angle||'%pi/6';
      document.getElementById('trig-expr').value=s.expr||'sin(x)^2 + cos(x)^2';
      document.getElementById('trig-fb-ok').value=s.fbOk||'';
      document.getElementById('trig-fb-wrong').value=s.fbWrong||'';
      document.getElementById('trig-fbgen').value=s.fbGen||'';
      if(typeof trigFormChange==='function')trigFormChange();
}

function resetForm_trigonometrie() {
      setRichVal('trig-text','');
      document.getElementById('trig-bareme').value=1;
      document.getElementById('trig-scenario').value='valeur-exacte';
      var trigModeRReset=document.querySelector('input[name="trig-mode-r"][value="aleatoire"]');
      if(trigModeRReset) trigModeRReset.checked=true;
      document.getElementById('trig-fn').value='sin';
      document.getElementById('trig-angle').value='%pi/6';
      document.getElementById('trig-expr').value='sin(x)^2 + cos(x)^2';
      document.getElementById('trig-fb-ok').value='';
      document.getElementById('trig-fb-wrong').value='';
      document.getElementById('trig-fbgen').value='';
      if(typeof trigFormChange==='function')trigFormChange();
}
