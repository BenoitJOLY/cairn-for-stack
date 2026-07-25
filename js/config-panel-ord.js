// config-panel-ord.js — capture/restore/reset pour le type "ord"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-ord.js).

function captureState_ord() {
  var s = { type: 'ord' };
      s.bareme=v('ord-bareme');s.text=richVal('ord-text');
      s.clone=document.getElementById('ord-clone').checked;s.items=[];
      document.querySelectorAll('#ord-items .ord-row').forEach(function(r){
        s.items.push({text:r.querySelector('.ord-item-text').value});
      });
      s.fbGen=v('ord-fbgen');
  return s;
}

function restoreState_ord(s) {
      document.getElementById('ord-bareme').value=s.bareme||1;setRichVal('ord-text',s.text||'');
      document.getElementById('ord-clone').checked=!!s.clone;
      document.getElementById('ord-items').innerHTML='';
      (s.items||[]).forEach(function(it){if(typeof addOrdRow==='function')addOrdRow(it.text);});
      var _ordFbGen=document.getElementById('ord-fbgen');if(_ordFbGen)_ordFbGen.value=s.fbGen||'';
}

function resetForm_ord() {
      document.getElementById('ord-items').innerHTML='';
      if(typeof addOrdRow==='function'){addOrdRow();addOrdRow();addOrdRow();}
      setRichVal('ord-text','');document.getElementById('ord-bareme').value=1;
      document.getElementById('ord-clone').checked=false;
      var _ordfbGen=document.getElementById('ord-fbgen');if(_ordfbGen)_ordfbGen.value='';
}
