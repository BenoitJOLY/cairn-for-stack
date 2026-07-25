// config-panel-radio.js — capture/restore/reset pour le type "radio"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-radio.js).

function captureState_radio() {
  var s = { type: 'radio' };
      s.bareme=v('ra-bareme');s.text=richVal('ra-text');s.xe=v('ra-xe');s.vrais=[];s.faux=[];
      s.fbGen=richVal('ra-fbgen');
      s.fbGenShowFb=document.getElementById('ra-fbgen-showfb')?.checked||false;
      document.querySelectorAll('#ra-vrais .prop-row').forEach(function(r){s.vrais.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
      document.querySelectorAll('#ra-faux .prop-row').forEach(function(r){s.faux.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
  return s;
}

function restoreState_radio(s) {
      document.getElementById('ra-bareme').value=s.bareme;setRichVal('ra-text',s.text);
      document.getElementById('ra-xe').value=s.xe;
      setRichVal('ra-fbgen',s.fbGen||'');
      var raFbGenShowFbEl=document.getElementById('ra-fbgen-showfb');if(raFbGenShowFbEl)raFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('ra-vrais').innerHTML='';document.getElementById('ra-faux').innerHTML='';
      (s.vrais||[]).forEach(function(p){addPoolRow('ra-vrais',true,p.text,p.fb,true);});
      (s.faux||[]).forEach(function(p){addPoolRow('ra-faux',false,p.text,p.fb,true);});
      if(typeof checkPoolWarn==='function')checkPoolWarn('ra');
}

function resetForm_radio() {
      document.getElementById('ra-vrais').innerHTML='';document.getElementById('ra-faux').innerHTML='';
      if(typeof addPoolRow==='function'){addPoolRow('ra-vrais',true,'','',true);addPoolRow('ra-faux',false,'','',true);}
      setRichVal('ra-text','');document.getElementById('ra-bareme').value=1;document.getElementById('ra-xe').value=2;
      setRichVal('ra-fbgen','');
      var raFbGenShowFbReset=document.getElementById('ra-fbgen-showfb');if(raFbGenShowFbReset)raFbGenShowFbReset.checked=false;
      if(typeof checkPoolWarn==='function')checkPoolWarn('ra');
}
