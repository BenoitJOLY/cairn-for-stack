// config-panel-apn.js — capture/restore/reset pour le type "apn"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-apn.js).

function captureState_apn() {
  var s = { type: 'apn' };
      s.bareme=v('apn-bareme');s.text=richVal('apn-text');
      s.unknown=v('apn-unknown')||'V';
      s.changedD=document.getElementById('apn-changed-D').checked;
      s.changedV=document.getElementById('apn-changed-V').checked;
      s.changedI=document.getElementById('apn-changed-I').checked;
      s.fbOk=v('apn-fb-ok');s.fbWrong=v('apn-fb-wrong');s.fbGen=v('apn-fbgen');
  return s;
}

function restoreState_apn(s) {
      document.getElementById('apn-bareme').value=s.bareme||1;
      setRichVal('apn-text',s.text||'');
      document.getElementById('apn-unknown').value=s.unknown||'V';
      document.getElementById('apn-changed-D').checked=!!s.changedD;
      document.getElementById('apn-changed-V').checked=!!s.changedV;
      document.getElementById('apn-changed-I').checked=!!s.changedI;
      document.getElementById('apn-fb-ok').value=s.fbOk||'';
      document.getElementById('apn-fb-wrong').value=s.fbWrong||'';
      var _apnFbGen=document.getElementById('apn-fbgen');if(_apnFbGen)_apnFbGen.value=s.fbGen||'';
      if(typeof apnUnknownChange==='function')apnUnknownChange();
}

function resetForm_apn() {
      setRichVal('apn-text','');
      document.getElementById('apn-bareme').value=1;
      document.getElementById('apn-unknown').value='V';
      document.getElementById('apn-changed-D').checked=true;
      document.getElementById('apn-changed-V').checked=false;
      document.getElementById('apn-changed-I').checked=false;
      document.getElementById('apn-fb-ok').value='';
      document.getElementById('apn-fb-wrong').value='';
      var _apnfbGen=document.getElementById('apn-fbgen');if(_apnfbGen)_apnfbGen.value='';
      if(typeof apnUnknownChange==='function')apnUnknownChange();
}
