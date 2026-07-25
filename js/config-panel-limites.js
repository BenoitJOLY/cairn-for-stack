// config-panel-limites.js — capture/restore/reset pour le type "limites"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-limites.js).

function captureState_limites() {
  var s = { type: 'limites' };
      s.bareme=v('lim-bareme');s.text=richVal('lim-text');
      s.scenario=v('lim-scenario')||'plus-inf';
      s.mode=(document.querySelector('input[name="lim-mode-r"]:checked')||{}).value||'aleatoire';
      s.expr=v('lim-expr')||'(x^2-1)/(x-1)';
      s.point=v('lim-point')||'1';
      s.tans=v('lim-tans')||'2';
      s.fbOk=v('lim-fb-ok');s.fbWrong=v('lim-fb-wrong');s.fbGen=v('lim-fbgen');
  return s;
}

function restoreState_limites(s) {
      document.getElementById('lim-bareme').value=s.bareme||1;
      setRichVal('lim-text',s.text||'');
      document.getElementById('lim-scenario').value=s.scenario||'plus-inf';
      var limModeR=document.querySelector('input[name="lim-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(limModeR) limModeR.checked=true;
      document.getElementById('lim-expr').value=s.expr||'(x^2-1)/(x-1)';
      document.getElementById('lim-point').value=s.point||'1';
      document.getElementById('lim-tans').value=s.tans||'2';
      document.getElementById('lim-fb-ok').value=s.fbOk||'';
      document.getElementById('lim-fb-wrong').value=s.fbWrong||'';
      document.getElementById('lim-fbgen').value=s.fbGen||'';
      if(typeof limFormChange==='function')limFormChange();
}

function resetForm_limites() {
      setRichVal('lim-text','');
      document.getElementById('lim-bareme').value=1;
      document.getElementById('lim-scenario').value='plus-inf';
      var limModeRReset=document.querySelector('input[name="lim-mode-r"][value="aleatoire"]');
      if(limModeRReset) limModeRReset.checked=true;
      document.getElementById('lim-expr').value='(x^2-1)/(x-1)';
      document.getElementById('lim-point').value='1';
      document.getElementById('lim-tans').value='2';
      document.getElementById('lim-fb-ok').value='';
      document.getElementById('lim-fb-wrong').value='';
      document.getElementById('lim-fbgen').value='';
      if(typeof limFormChange==='function')limFormChange();
}
