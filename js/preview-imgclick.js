function renderPreviewHTML_imgclick(state) {
  var modeEl = document.querySelector('input[name="ic-mode"]:checked');
  var mode = modeEl ? modeEl.value : 'single';
  var icst = window._icState || {};
  var exampleHTML;
  if (mode === 'sequence') {
    var realParts = null;
    try {
      if (typeof genImgClickSequenceCore === 'function' && typeof genImgClickParams === 'function' && icst.bgData && icst.zones && icst.zones.length) {
        realParts = genImgClickSequenceCore(1, genImgClickParams());
      }
    } catch (e) { console.error('[preview] imgclick sequence build error:', e); realParts = null; }

    if (realParts && realParts.kbdRaw) {
      var boardId = 'icLiveBoard';
      var dims = (realParts.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
      var dispW = dims ? parseInt(dims[1], 10) : 480;
      var dispH = dims ? parseInt(dims[2], 10) : 360;
      exampleHTML = '<div id="' + boardId + '" style="position:relative;width:100%;max-width:' + dispW + 'px;aspect-ratio:' + dispW + '/' + dispH + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
        + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
        + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; '
        + 'var stack_jxg = { bind_point: function(){} }; var refAns1; '
        + realParts.kbdRaw
        + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
    } else {
      exampleHTML = '<p style="color:#475569;font-style:italic;">Chargez une image et ajoutez au moins une zone (onglet Config) pour voir l\'aperçu interactif.</p>';
    }
  } else {
    var realPartsSingle = null;
    try {
      if (typeof genImgClickCore === 'function' && typeof genImgClickParams === 'function' && icst.bgData && icst.zones && icst.zones.length) {
        realPartsSingle = genImgClickCore(1, genImgClickParams());
      }
    } catch (e) { console.error('[preview] imgclick single build error:', e); realPartsSingle = null; }

    if (realPartsSingle && realPartsSingle.kbdRaw) {
      var boardIdS = 'icLiveBoardSingle';
      var dimsS = (realPartsSingle.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
      var dispWS = dimsS ? parseInt(dimsS[1], 10) : 480;
      var dispHS = dimsS ? parseInt(dimsS[2], 10) : 360;
      exampleHTML = '<div id="' + boardIdS + '" style="position:relative;width:100%;max-width:' + dispWS + 'px;aspect-ratio:' + dispWS + '/' + dispHS + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
        + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
        + '<script>(function(){ try { var divid = ' + JSON.stringify(boardIdS) + '; '
        + 'var stack_jxg = { bind_point: function(){} }; var ans1; '
        + realPartsSingle.kbdRaw
        + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardIdS) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
    } else {
      exampleHTML = '<p style="color:#475569;font-style:italic;">Chargez une image et posez la zone (onglet Config) pour voir l\'aperçu interactif.</p>';
    }
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.imgclick'), badgeColor: '#047C6A', noteBg: '#f0fdfa', noteColor: '#0f766e',
    prefix: 'ic', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : cliquer sur la bonne zone de l\'image.</em></p>'),
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.icRefreshPreview = _hsWireSimplePreview('imgclick', 'ic', 'ic-preview-container', 'fp-imgclick', renderPreviewHTML_imgclick, true);
