// config-panel-chemical_topo.js — capture/restore/reset pour le type "chemical_topo"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-chemical_topo.js).

function captureState_chemical_topo() {
  var s = { type: 'chemical_topo' };
      s.bareme=v('topo-bareme');s.text=richVal('topo-text');
      s.equation=document.getElementById('topo-editor').innerText;
      s.w_prt1=v('topo-w_prt1');s.w_n0=v('topo-w_n0');s.w_n1=v('topo-w_n1');
      s.w_n2=v('topo-w_n2');s.w_n3=v('topo-w_n3');s.w_n4=v('topo-w_n4');s.w_n5=v('topo-w_n5');
      s.fbGen=v('topo-fbgen');
  return s;
}

function restoreState_chemical_topo(s) {
      document.getElementById('topo-bareme').value=s.bareme;setRichVal('topo-text',s.text);
      document.getElementById('topo-editor').innerText=s.equation;
      document.getElementById('topo-w_prt1').value=s.w_prt1;document.getElementById('topo-w_n0').value=s.w_n0;
      document.getElementById('topo-w_n1').value=s.w_n1;document.getElementById('topo-w_n2').value=s.w_n2;
      document.getElementById('topo-w_n3').value=s.w_n3;document.getElementById('topo-w_n4').value=s.w_n4;
      document.getElementById('topo-w_n5').value=s.w_n5;
      var _topoFbGen=document.getElementById('topo-fbgen');if(_topoFbGen)_topoFbGen.value=s.fbGen||'';
      if(typeof topoRenderPreview==='function')topoRenderPreview();
      if(typeof checkTopoScores==='function')checkTopoScores();
}

function resetForm_chemical_topo() {
      setRichVal('topo-text','');
      document.getElementById('topo-editor').innerText='CCCl + [OH-] -> CCO + [Cl-]';
      document.getElementById('topo-w_prt1').value=5;document.getElementById('topo-w_n0').value=20;
      document.getElementById('topo-w_n1').value=10;document.getElementById('topo-w_n2').value=40;
      document.getElementById('topo-w_n3').value=50;document.getElementById('topo-w_n4').value=25;
      document.getElementById('topo-w_n5').value=50;
      var _topofbGen=document.getElementById('topo-fbgen');if(_topofbGen)_topofbGen.value='';
}
