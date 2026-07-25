// config-panel-numerical.js — capture/restore/reset pour le type "numerical"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-numerical.js).

function captureState_numerical() {
  var s = { type: 'numerical' };
      s.bareme=v('num-bareme');s.text=richVal('num-text');s.val=v('num-val');s.round=v('num-round');
      s.n=v('num-n');s.tolType=v('num-tol-type');s.tolVal=v('num-tol-val');s.dec=v('num-dec');
      s.fbc=richVal('num-fbc');s.fbe=richVal('num-fbe');s.fbGen=richVal('num-fbgen');
      s.aideOn=document.getElementById('num-aide-on')?.checked||false;
      s.helpCbs=[...document.querySelectorAll('.num-h')].map(function(c){return c.checked;});
  return s;
}

function restoreState_numerical(s) {
      document.getElementById('num-bareme').value=s.bareme;setRichVal('num-text',s.text);
      document.getElementById('num-val').value=s.val;document.getElementById('num-round').value=s.round;
      document.getElementById('num-n-wrap').style.display=s.round==='y'?'block':'none';
      document.getElementById('num-n').value=s.n;
      document.getElementById('num-tol-type').value=s.tolType;document.getElementById('num-tol-val').value=s.tolVal;
      document.getElementById('num-dec').value=s.dec;
      setRichVal('num-fbc',s.fbc);setRichVal('num-fbe',s.fbe);
      if(typeof markErr==='function')markErr('num-val','err-num-val',false);
}

function resetForm_numerical() {
      ['num-text','num-fbc','num-fbe'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('num-val').value='';
}
