function renderPreviewHTML_basen(state) {
  var realParts = {};
  try { realParts = (typeof genBasenCore === 'function' && typeof genBasenParams === 'function') ? genBasenCore(1, genBasenParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) {
    // Les valeurs issues d'un appel Maxima (string(...), q1_liststr(...), rand(...)...)
    // ne peuvent pas etre evaluees cote JS : on les retire pour laisser le fallback
    // q_{...} de _calcTokenizeForPreview s'appliquer, sauf recalcul explicite ci-dessous.
    if (/\(/.test(knownVars[k])) delete knownVars[k];
  });
  var bnValueMode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
  if (bnValueMode === 'fixe' && knownVars.hasOwnProperty('val') && /^-?\d+$/.test(knownVars.val)) {
    // En mode "valeur fixe", la valeur decimale est connue a l'avance : on peut donc
    // reproduire cote JS exactement le meme calcul que fera Maxima dans le XML exporte,
    // pour que l'apercu (enonce + feedback general) affiche la vraie valeur attendue.
    var bnDecVal    = parseInt(knownVars.val, 10);
    var bnFormat    = (document.getElementById('bn-format')    || {}).value || 'S';
    var bnFromBase  = parseInt((document.getElementById('bn-from-base') || {}).value || '10');
    var bnToBaseSel = parseInt((document.getElementById('bn-to-base')   || {}).value || '2');
    var bnToFormat  = (bnFormat === 'C' && (bnToBaseSel === 2 || bnToBaseSel === 8 || bnToBaseSel === 16)) ? 'C' : 'S';

    knownVars.srcstr = (bnFromBase === 10) ? String(bnDecVal) : bnDecVal.toString(bnFromBase).toUpperCase();

    if (bnToBaseSel === 10) {
      knownVars.dststr = String(bnDecVal);
    } else {
      var bnRawDst = bnDecVal.toString(bnToBaseSel).toUpperCase();
      if (bnToFormat === 'C') {
        var bnPfx = bnToBaseSel === 2 ? '0b' : bnToBaseSel === 8 ? '0o' : '0x';
        knownVars.dststr = bnPfx + bnRawDst;
      } else {
        knownVars.dststr = bnRawDst;
      }
    }
  }
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '')
    .replace(/\[\[feedback:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Base N', badgeColor: '#1d4ed8', noteBg: '#eff6ff', noteColor: '#1e40af',
    prefix: 'bn', bareme: state.bareme || 1,
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
window.bnRefreshPreview = _hsWireSimplePreview('basen', 'bn', 'bn-preview-container', 'fp-basen', renderPreviewHTML_basen);
