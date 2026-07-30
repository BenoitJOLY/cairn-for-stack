function renderPreviewHTML_logique(state) {
  var realParts = {};
  try { realParts = (typeof genLogiqueCore === 'function') ? genLogiqueCore(1, genLogiqueParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, désormais bruts (sans encadré, cf. js/fb-box.js) :
  // on applique l'encadré uniquement ici, au point d'affichage de l'aperçu.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#475569;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.logique'), badgeColor: '#7c3aed', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'lg', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen
  });
}
window.lgRefreshPreview = _hsWireSimplePreview('logique', 'lg', 'lg-preview-container', 'fp-logique', renderPreviewHTML_logique);
