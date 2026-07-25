// config-panel-complexe.js — capture/restore/reset pour le type "complexe"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-complexe.js).

function captureState_complexe() {
  var s = { type: 'complexe' };
      s.bareme=v('cpx-bareme');s.text=richVal('cpx-text');
      s.scenario=v('cpx-scenario')||'forme-alg';
      s.mode=v('cpx-mode')||'fixe';
      s.a=v('cpx-a')||'2'; s.b=v('cpx-b')||'3';
      s.c=v('cpx-c')||'1'; s.d=v('cpx-d')||'-1';
      s.op=v('cpx-op')||'*';
      s.eqb=v('cpx-eq-b')||'-2'; s.eqc=v('cpx-eq-c')||'5';
      s.complexno=v('cpx-complexno')||'i';
      s.randMin=v('cpx-rand-min')||'-5'; s.randMax=v('cpx-rand-max')||'5';
      s.fbGen=richVal('cpx-fbgen');
      s.fbDetail={};
      if (typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn){
          CPX_FB_DEFS[scn].forEach(function(item){
            s.fbDetail[_cpxFbId(scn,item.key)]=richVal(_cpxFbId(scn,item.key));
          });
        });
      }
  return s;
}

function restoreState_complexe(s) {
      document.getElementById('cpx-bareme').value=s.bareme||1;
      setRichVal('cpx-text',s.text||'');
      document.getElementById('cpx-scenario').value=s.scenario||'forme-alg';
      document.getElementById('cpx-mode').value=s.mode||'fixe';
      document.getElementById('cpx-a').value=s.a||'2';
      document.getElementById('cpx-b').value=s.b||'3';
      document.getElementById('cpx-c').value=s.c||'1';
      document.getElementById('cpx-d').value=s.d||'-1';
      document.getElementById('cpx-op').value=s.op||'*';
      document.getElementById('cpx-eq-b').value=s.eqb||'-2';
      document.getElementById('cpx-eq-c').value=s.eqc||'5';
      document.getElementById('cpx-complexno').value=s.complexno||'i';
      document.getElementById('cpx-rand-min').value=s.randMin||'-5';
      document.getElementById('cpx-rand-max').value=s.randMax||'5';
      setRichVal('cpx-fbgen',s.fbGen||'');
      if(typeof cpxFormChange==='function')cpxFormChange();
      if (s.fbDetail && typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn){
          CPX_FB_DEFS[scn].forEach(function(item){
            var id=_cpxFbId(scn,item.key);
            if (s.fbDetail[id]) setRichVal(id, s.fbDetail[id]);
          });
        });
      }
}

function resetForm_complexe() {
      setRichVal('cpx-text','');
      document.getElementById('cpx-bareme').value=1;
      document.getElementById('cpx-scenario').value='forme-alg';
      document.getElementById('cpx-mode').value='fixe';
      document.getElementById('cpx-a').value='2';
      document.getElementById('cpx-b').value='3';
      document.getElementById('cpx-c').value='1';
      document.getElementById('cpx-d').value='-1';
      document.getElementById('cpx-op').value='*';
      document.getElementById('cpx-eq-b').value='-2';
      document.getElementById('cpx-eq-c').value='5';
      document.getElementById('cpx-complexno').value='i';
      document.getElementById('cpx-rand-min').value='-5';
      document.getElementById('cpx-rand-max').value='5';
      setRichVal('cpx-fbgen','');
      if(typeof cpxFormChange==='function')cpxFormChange();
      if (typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn){
          CPX_FB_DEFS[scn].forEach(function(item){
            setRichVal(_cpxFbId(scn,item.key), I18N.t(item.defKey));
          });
        });
      }
}
