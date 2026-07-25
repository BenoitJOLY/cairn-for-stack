function renderPreviewHTML_imageMesure(state) {
  var imgEl = document.getElementById('imm-img');
  var hasImg = imgEl && imgEl.src && document.getElementById('imm-preview-wrap') && document.getElementById('imm-preview-wrap').style.display !== 'none';

  var imgData = (document.getElementById('imm-image-data') || {}).value;
  var imgW = parseFloat((document.getElementById('imm-img-w') || {}).value);
  var imgH = parseFloat((document.getElementById('imm-img-h') || {}).value);
  var r1x = parseFloat((document.getElementById('imm-r1x') || {}).value);
  var r1y = parseFloat((document.getElementById('imm-r1y') || {}).value);
  var r1v  = parseFloat((document.getElementById('imm-r1v') || {}).value);
  var r2x = parseFloat((document.getElementById('imm-r2x') || {}).value);
  var r2y = parseFloat((document.getElementById('imm-r2y') || {}).value);
  var r2v  = parseFloat((document.getElementById('imm-r2v') || {}).value);
  var unit = ((document.getElementById('imm-unit') || {}).value || '').replace(/'/g, "\\'");

  var hasCalib = hasImg && imgData && !isNaN(imgW) && !isNaN(imgH) &&
    !isNaN(r1x) && !isNaN(r1y) && !isNaN(r1v) && !isNaN(r2x) && !isNaN(r2y) && !isNaN(r2v) && (r1x !== r2x || r1y !== r2y);

  var boardId = 'immLiveBoard';
  var exampleHTML;
  if (hasCalib && typeof immBuildBoardJS === 'function') {
    var dispH = Math.round(imgH * Math.min(700, imgW) / imgW);
    var jsBody = '';
    try { jsBody = immBuildBoardJS(JSON.stringify(boardId), imgData, imgW, imgH); } catch (e) { jsBody = ''; }
    exampleHTML = jsBody
      ? '<div id="' + boardId + '" class="jxgbox" style="width:100%;max-width:700px;height:' + dispH + 'px;margin:0 auto;"></div>'
        + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
        + '<script>(function(){ try { ' + jsBody + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>'
      : '<img src="' + imgEl.src + '" style="max-width:100%;border-radius:8px;">';
  } else if (hasImg) {
    exampleHTML = '<img src="' + imgEl.src + '" style="max-width:100%;border-radius:8px;">'
      + '<p style="color:#94a3b8;font-style:italic;margin-top:6px;">Complétez l\'étalonnage (2 repères + valeurs) pour afficher le curseur JSXGraph interactif.</p>';
  } else {
    exampleHTML = '<p style="color:#94a3b8;font-style:italic;">Chargez une image dans l\'onglet Config pour afficher l\'aperçu.</p>';
  }

  // Feedback général réel : on appelle le vrai générateur (comme oscilloscope/basen/etc.)
  // plutôt que de reconstruire un résumé à part, pour ne jamais afficher un aperçu qui
  // diverge du XML réellement exporté. genImageMesure() utilise alert() pour signaler une
  // config incomplète (pas d'image, pas d'étalonnage, aucune cible) — inacceptable en
  // aperçu live où l'on rappelle la fonction à chaque frappe : on neutralise alert()
  // pendant l'appel et on se rabat sur un message neutre si la génération échoue.
  var realGeneralFeedback = '';
  if (hasCalib && typeof genImageMesureCore === 'function') {
    var _immOrigAlert = window.alert;
    window.alert = function () {};
    try {
      var _immP = genImageMesureParams();
      var realParts = _immP ? genImageMesureCore(1, _immP) : null;
      realGeneralFeedback = (realParts && realParts.generalFeedback) || '';
    } catch (e) {
      realGeneralFeedback = '';
    } finally {
      window.alert = _immOrigAlert;
    }
  }
  var fbGenAuto = realGeneralFeedback
    ? _hsRenderMath(realGeneralFeedback)
    : '<p style="color:#94a3b8;font-style:italic;">Complétez l\'étalonnage et ajoutez au moins une cible mesurée pour afficher le feedback général réel.</p>';

  return _hsSimplePreviewHTML({
    badge: I18N.t('badge.image_mesure'), badgeColor: '#0891b2', noteBg: '#ecfeff', noteColor: '#0e7490',
    prefix: 'imm', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : mesure par proportionnalité sur une image (spectre, microscope, règle…).</em></p>'),
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong,
    fbGenAuto: fbGenAuto,
    fbGen: state.fbGen
  });
}
window.immRefreshPreview = _hsWireSimplePreview('image-mesure', 'imm', 'imm-preview-container', 'fp-image-mesure', renderPreviewHTML_imageMesure, true);
