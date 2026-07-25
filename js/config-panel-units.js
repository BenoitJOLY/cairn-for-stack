// config-panel-units.js — capture/restore/reset pour le type "units"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-units.js).

function captureState_units() {
  var s = { type: 'units' };
      s.bareme=v('un-bareme');s.text=richVal('un-text');s.val=v('un-val');s.unit=v('un-unit');
      s.tol=v('un-tol');s.sig=v('un-sig');s.fbc=richVal('un-fbc');s.fbe=richVal('un-fbe');
      s.fbGen=richVal('un-fbgen');
      s.helpCbs=[...document.querySelectorAll('.un-h')].map(function(c){return c.checked;});
  return s;
}

function restoreState_units(s) {
      document.getElementById('un-bareme').value=s.bareme;setRichVal('un-text',s.text);
      document.getElementById('un-val').value=s.val;document.getElementById('un-unit').value=s.unit;
      document.getElementById('un-tol').value=s.tol;document.getElementById('un-sig').value=s.sig;
      setRichVal('un-fbc',s.fbc);setRichVal('un-fbe',s.fbe);
      setRichVal('un-fbgen',s.fbGen||'');
      var unCbs=document.querySelectorAll('.un-h');
      (s.helpCbs||[]).forEach(function(cv,i){if(unCbs[i])unCbs[i].checked=cv;});
      if(typeof updateUnPreview==='function')updateUnPreview();
}

function resetForm_units() {
      ['un-text','un-fbc','un-fbe','un-fbgen'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('un-val').value='';document.getElementById('un-unit').value='';
}
