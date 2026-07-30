function renderPreviewHTML_probabilites(state) {
  var realParts = {};
  try { realParts = (typeof genProbabilitesCore === 'function') ? genProbabilitesCore(1, _probBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#475569;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.probabilites'), badgeColor: '#0369a1', noteBg: '#eff6ff', noteColor: '#0369a1',
    prefix: 'prob', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.probRefreshPreview = _hsWireSimplePreview('probabilites', 'prob', 'prob-preview-container', 'fp-probabilites', renderPreviewHTML_probabilites);
