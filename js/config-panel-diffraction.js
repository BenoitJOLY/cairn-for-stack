// config-panel-diffraction.js — capture/restore/reset pour le type "diffraction"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-diffraction.js).

function captureState_diffraction() {
  var s = { type: 'diffraction' };
      s.bareme=v('diff-bareme');s.text=richVal('diff-text');
      s.difftype=v('diff-type')||'fente_simple';s.diffmode=v('diff-mode')||'ecran';
      s.random=document.getElementById('diff-random')?document.getElementById('diff-random').checked:true;
      s.a=v('diff-a');s.d=v('diff-d');s.b=v('diff-b');s.lambda=v('diff-lambda');
      s.tol=v('diff-tol');
      s.fbOk=v('diff-fb-ok');s.fbWrong=v('diff-fb-wrong');s.fbGen=v('diff-fbgen');
  return s;
}

function restoreState_diffraction(s) {
      document.getElementById('diff-bareme').value=s.bareme||1;
      setRichVal('diff-text',s.text||'');
      document.getElementById('diff-type').value=s.difftype||'fente_simple';
      document.getElementById('diff-mode').value=s.diffmode||'ecran';
      var diffRnd=document.getElementById('diff-random');
      if(diffRnd)diffRnd.checked=!!s.random;
      document.getElementById('diff-a').value=s.a||50;
      document.getElementById('diff-d').value=s.d||2;
      document.getElementById('diff-b').value=s.b||200;
      document.getElementById('diff-lambda').value=s.lambda||532;
      document.getElementById('diff-tol').value=s.tol||10;
      document.getElementById('diff-fb-ok').value=s.fbOk||'';
      document.getElementById('diff-fb-wrong').value=s.fbWrong||'';
      var _diffFbGen=document.getElementById('diff-fbgen');if(_diffFbGen)_diffFbGen.value=s.fbGen||'';
      if(typeof diffTypeChange==='function')diffTypeChange();
      if(typeof diffRandomToggle==='function')diffRandomToggle();
}

function resetForm_diffraction() {
      setRichVal('diff-text','');
      document.getElementById('diff-bareme').value=1;
      document.getElementById('diff-type').value='fente_simple';
      document.getElementById('diff-mode').value='ecran';
      document.getElementById('diff-random').checked=true;
      document.getElementById('diff-a').value=50;
      document.getElementById('diff-d').value=2;
      document.getElementById('diff-b').value=200;
      document.getElementById('diff-lambda').value=532;
      document.getElementById('diff-tol').value=10;
      document.getElementById('diff-fb-ok').value='';
      document.getElementById('diff-fb-wrong').value='';
      var _difffbGen=document.getElementById('diff-fbgen');if(_difffbGen)_difffbGen.value='';
      if(typeof diffTypeChange==='function')diffTypeChange();
      if(typeof diffRandomToggle==='function')diffRandomToggle();
}
