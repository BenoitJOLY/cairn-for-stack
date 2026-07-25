function renderPreviewHTML_comp(state) {
  return _hsSimplePreviewHTML({
    badge: I18N.t('badge.composition'), badgeColor: '#6d28d9', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'comp', bareme: state.bareme || 4,
    text: _hsRenderMath(state.text || '<p><em>Rédigez ici l\'énoncé de la question.</em></p>'),
    exampleHTML: '<p style="padding:10px 14px;background:#f5f3ff;border:1.5px dashed #a78bfa;border-radius:8px;font-size:.82rem;color:#5b21b6;text-align:center;">📝 Éditeur de réponse élève (visible dans Moodle uniquement)</p>',
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
}
window.compRefreshPreview = _hsWireSimplePreview('composition', 'comp', 'comp-preview-container', 'fp-composition', renderPreviewHTML_comp);
