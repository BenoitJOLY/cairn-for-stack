// config-panel-doi.js — capture/restore/reset pour le type "doi"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-doi.js).

function captureState_doi() {
  var s = { type: 'doi' };
      s.bareme=v('doi-bareme');s.text=richVal('doi-text');s.mainObj=v('doi-main-obj');s.extra=v('doi-extra');s.rows=[];
      document.querySelectorAll('.doi-obj-row').forEach(function(r){
        s.rows.push({n:r.querySelector('.doi-name').value,t:r.querySelector('.doi-type').value});
      });
      s.fbGen=v('doi-fbgen');
  return s;
}

function restoreState_doi(s) {
      document.getElementById('doi-bareme').value=s.bareme;setRichVal('doi-text',s.text);
      document.getElementById('doi-main-obj').value=s.mainObj;document.getElementById('doi-extra').value=s.extra;
      document.getElementById('doi-objects-list').innerHTML='';
      if(s.rows)s.rows.forEach(function(r){if(typeof doiAddRow==='function')doiAddRow(r.n,r.t);});
      var _doiFbGen=document.getElementById('doi-fbgen');if(_doiFbGen)_doiFbGen.value=s.fbGen||'';
      if(typeof doiRefresh==='function')doiRefresh();
}

function resetForm_doi() {
      document.getElementById('doi-objects-list').innerHTML='';
      if(typeof doiAddRow==='function')doiAddRow(I18N.t('doi.default_obj_terre'),'gravitationnel');
      setRichVal('doi-text','');
      document.getElementById('doi-main-obj').value=I18N.t('doi.default_main_obj_generic');document.getElementById('doi-extra').value='1';
      var _doifbGen=document.getElementById('doi-fbgen');if(_doifbGen)_doifbGen.value='';
      if(typeof doiRefresh==='function')doiRefresh();
}
