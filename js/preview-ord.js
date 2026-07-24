function renderPreviewHTML_ord(state) {
  var rows = document.querySelectorAll('#ord-items .ord-row');
  var items = [];
  rows.forEach(function(r){ var t=r.querySelector('.ord-item-text'); if(t&&t.value.trim()) items.push(t.value.trim()); });
  var listHTML;
  if (items.length) {
    var chips = items.map(function(it){ return '<div style="background:#fbbf24;color:#78350f;padding:6px 10px;border-radius:4px;margin-bottom:4px;font-size:.9rem;">' + it.replace(/</g,'&lt;') + '</div>'; }).join('');
    listHTML = '<div style="display:flex;gap:14px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:160px;">'
      + '<div style="font-weight:700;font-size:.82rem;color:#475569;border-bottom:2px solid #cbd5e1;padding-bottom:4px;margin-bottom:8px;">Déposez vos éléments ici :</div>'
      + '<div style="min-height:40px;border:1px dashed #cbd5e1;border-radius:6px;"></div>'
      + '</div>'
      + '<div style="flex:1;min-width:160px;">'
      + '<div style="font-weight:700;font-size:.82rem;color:#9a6a00;border-bottom:2px solid #fbbf24;padding-bottom:4px;margin-bottom:8px;">Glissez à partir d\'ici :</div>'
      + chips
      + '</div>'
      + '</div>';
  } else {
    listHTML = '<p style="color:#94a3b8;font-style:italic;">Ajoutez des éléments dans l\'onglet Config pour afficher l\'aperçu.</p>';
  }
  return _hsSimplePreviewHTML({
    badge: 'Classement', badgeColor: '#be185d', noteBg: '#fdf2f8', noteColor: '#9d174d',
    prefix: 'ord', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : remettre les éléments dans le bon ordre.</em></p>'),
    exampleHTML: listHTML,
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
}
window.ordRefreshPreview = _hsWireSimplePreview('ord', 'ord', 'ord-preview-container', 'fp-ord', renderPreviewHTML_ord);
