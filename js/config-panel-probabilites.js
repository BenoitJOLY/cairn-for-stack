// config-panel-probabilites.js — capture/restore/reset pour le type "probabilites"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-probabilites.js).

function captureState_probabilites() {
  var s = { type: 'probabilites' };
      s.bareme=v('prob-bareme');s.text=richVal('prob-text');
      s.scenario=v('prob-scenario')||'combinaison';
      s.mode=v('prob-mode')||'aleatoire';
      s.n=v('prob-n')||'10'; s.k=v('prob-k')||'3'; s.p=v('prob-p')||'0.5';
      s.pa=v('prob-pa')||'0.3'; s.pb=v('prob-pb')||'0.4'; s.pab=v('prob-pab')||'0.1';
      s.nMin=v('prob-n-min')||'6'; s.nMax=v('prob-n-max')||'12';
      s.kMin=v('prob-k-min')||'1'; s.kMax=v('prob-k-max')||'6';
      s.pMin=v('prob-p-min')||'0.2'; s.pMax=v('prob-p-max')||'0.8';
      s.paMin=v('prob-pa-min')||'0.2'; s.paMax=v('prob-pa-max')||'0.7';
      s.pbMin=v('prob-pb-min')||'0.2'; s.pbMax=v('prob-pb-max')||'0.7';
      s.pabMin=v('prob-pab-min')||'0.05'; s.pabMax=v('prob-pab-max')||'0.25';
      s.fbOk=v('prob-fb-ok');s.fbWrong=v('prob-fb-wrong');s.fbGen=v('prob-fbgen');
  return s;
}

function restoreState_probabilites(s) {
      document.getElementById('prob-bareme').value=s.bareme||1;
      setRichVal('prob-text',s.text||'');
      document.getElementById('prob-scenario').value=s.scenario||'combinaison';
      var _pMode=document.getElementById('prob-mode');if(_pMode)_pMode.value=s.mode||'aleatoire';
      document.getElementById('prob-n').value=s.n||'10';
      document.getElementById('prob-k').value=s.k||'3';
      document.getElementById('prob-p').value=s.p||'0.5';
      document.getElementById('prob-pa').value=s.pa||'0.3';
      document.getElementById('prob-pb').value=s.pb||'0.4';
      document.getElementById('prob-pab').value=s.pab||'0.1';
      var _pB=['n-min','n-max','k-min','k-max','p-min','p-max','pa-min','pa-max','pb-min','pb-max','pab-min','pab-max'];
      var _pBDef={nMin:'6',nMax:'12',kMin:'1',kMax:'6',pMin:'0.2',pMax:'0.8',paMin:'0.2',paMax:'0.7',pbMin:'0.2',pbMax:'0.7',pabMin:'0.05',pabMax:'0.25'};
      _pB.forEach(function(id){
        var camel=id.replace(/-(\w)/,function(_,c){return c.toUpperCase();});
        var e=document.getElementById('prob-'+id);if(e)e.value=s[camel]||_pBDef[camel];
      });
      document.getElementById('prob-fb-ok').value=s.fbOk||'';
      document.getElementById('prob-fb-wrong').value=s.fbWrong||'';
      document.getElementById('prob-fbgen').value=s.fbGen||'';
      if(typeof probFormChange==='function')probFormChange();
}

function resetForm_probabilites() {
      setRichVal('prob-text','');
      document.getElementById('prob-bareme').value=1;
      document.getElementById('prob-scenario').value='combinaison';
      var _prMode=document.getElementById('prob-mode');if(_prMode)_prMode.value='aleatoire';
      document.getElementById('prob-n').value='10';
      document.getElementById('prob-k').value='3';
      document.getElementById('prob-p').value='0.5';
      document.getElementById('prob-pa').value='0.3';
      document.getElementById('prob-pb').value='0.4';
      document.getElementById('prob-pab').value='0.1';
      var _prB={'n-min':'6','n-max':'12','k-min':'1','k-max':'6','p-min':'0.2','p-max':'0.8','pa-min':'0.2','pa-max':'0.7','pb-min':'0.2','pb-max':'0.7','pab-min':'0.05','pab-max':'0.25'};
      Object.keys(_prB).forEach(function(id){var e=document.getElementById('prob-'+id);if(e)e.value=_prB[id];});
      document.getElementById('prob-fb-ok').value='';
      document.getElementById('prob-fb-wrong').value='';
      document.getElementById('prob-fbgen').value='';
      if(typeof probFormChange==='function')probFormChange();
}
