// config-panel-nuclear.js — capture/restore/reset pour le type "nuclear"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-nuclear.js).

function captureState_nuclear() {
  var s = { type: 'nuclear' };
      s.bareme=v('nuc-bareme');s.text=richVal('nuc-text');
      s.equation=document.getElementById('nuc-editor')?document.getElementById('nuc-editor').innerText:'';
      s.fbGen=v('nuc-fbgen');
  return s;
}

function restoreState_nuclear(s) {
      document.getElementById('nuc-bareme').value=s.bareme||1;setRichVal('nuc-text',s.text||'');
      if(document.getElementById('nuc-editor'))document.getElementById('nuc-editor').innerText=s.equation||'';
      if(typeof nucUpdateLock==='function')nucUpdateLock();
      if(typeof nucRenderPreview==='function')nucRenderPreview();
      var _nucFbGen=document.getElementById('nuc-fbgen');if(_nucFbGen)_nucFbGen.value=s.fbGen||'';
}

function resetForm_nuclear() {
      setRichVal('nuc-text','');
      if(document.getElementById('nuc-editor'))document.getElementById('nuc-editor').innerText='';
      document.getElementById('nuc-bareme').value=1;
      if(typeof nucUpdateLock==='function')nucUpdateLock();
      if(typeof nucRenderPreview==='function')nucRenderPreview();
      var _nucfbGen=document.getElementById('nuc-fbgen');if(_nucfbGen)_nucfbGen.value='';
}
