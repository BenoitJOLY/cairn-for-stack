function renderPreviewHTML_statistiques(state) {
  var realParts = {};
  try { realParts = (typeof genStatistiquesCore === 'function') ? genStatistiquesCore(1, _statBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  // ri(a,b) est un alias local de rand() défini dans gen-math-statistiques.js : toute
  // valeur qui en dépend encore requiert un tirage Maxima réel, donc n'est pas "connue".
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="background:#0284c7;border-left:5px solid #0369a1;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag
    ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement (s\xe9rie statistique) — voir l\'aper\xe7u \xe9l\xe8ve ci-dessous pour un exemple concret.</em>';
  var prtBoxes = _hsPrtBoxes(realParts);
  var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.statistiques'), badgeColor: '#0f766e', noteBg: '#f0fdfa', noteColor: '#0f766e',
    prefix: 'stat', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen
  });
}
window.statRefreshPreview = _hsWireSimplePreview('statistiques', 'stat', 'stat-preview-container', 'fp-statistiques', renderPreviewHTML_statistiques);
