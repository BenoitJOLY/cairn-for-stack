function renderPreviewHTML_calcul(state) {
  var fbGenTab = document.getElementById('calc-fb-gen');
  var fbGenActive = !!(fbGenTab && fbGenTab.classList.contains('on'));
  var realParts = {};
  try { realParts = (typeof genCalculCore === 'function') ? genCalculCore(1, _calcBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="background:#475569;border-left:5px solid #334155;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag
    ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement par Maxima (valeurs al\xe9atoires internes \xe0 chaque affichage) — voir l\'aper\xe7u \xe9l\xe8ve ci-dessous pour un exemple concret.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es par Maxima \xe0 l\'affichage r\xe9el (tirage al\xe9atoire ou calcul symbolique) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es dans l\'exercice (valeurs fixes, expression saisie, bornes) sont affich\xe9es directement ci-dessus.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Calcul / Analyse', badgeColor: '#4338ca', noteBg: '#eef2ff', noteColor: '#4338ca',
    prefix: 'calc', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    onlyFbGen: fbGenActive,
    hideFbGen: !fbGenActive,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.calcRefreshPreview = _hsWireSimplePreview('calcul', 'calc', 'calc-preview-container', 'fp-calcul', renderPreviewHTML_calcul);
