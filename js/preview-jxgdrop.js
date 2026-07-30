// {@expr@} : jetons STACK non calculables côté JS (ex: {@pct_1@} dans le
// feedback faux) — affichés en <code> plutôt que laissés bruts, même
// principe simplifié que _oscTokenizeStack pour l'oscilloscope.
function _jdTokenizeStack(html) {
  return String(html || '').replace(/\{@\s*([\s\S]+?)\s*@\}/g, function (full, expr) {
    return '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">' + String(expr).replace(/</g, '&lt;') + '</code>';
  });
}

function renderPreviewHTML_jxgdrop(state) {
  var jd = window._jdState || {};
  var realParts = null;
  try {
    if (typeof genJxgDropCore === 'function' && typeof genJxgDropParams === 'function' && jd.bgData && jd.proposals && jd.proposals.length && jd.zones && jd.zones.length) {
      realParts = genJxgDropCore(1, genJxgDropParams());
    }
  } catch (e) { console.error('[preview] jxgdrop build error:', e); realParts = null; }

  var boardId = 'jdLiveBoard';
  var exampleHTML;
  if (realParts && realParts.kbdRaw) {
    var dims = (realParts.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
    var dispW = dims ? parseInt(dims[1], 10) : 480;
    var dispH = dims ? parseInt(dims[2], 10) : 448;
    var refStubs = '';
    for (var zi = 1; zi <= jd.zones.length; zi++) refStubs += 'var refAns1z' + zi + ';';
    // width:100% + une hauteur fixe en px déforme l'image dès que le conteneur
    // réel est plus étroit que dispW (cas courant du panneau de config) —
    // aspect-ratio garde les proportions quelle que soit la largeur rendue.
    exampleHTML = '<div id="' + boardId + '" style="position:relative;width:100%;max-width:' + dispW + 'px;aspect-ratio:' + dispW + '/' + dispH + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
      + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
      + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; '
      + 'var stack_jxg = { bind_point: function(){} }; ' + refStubs + ' '
      + realParts.kbdRaw
      + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
  } else {
    exampleHTML = '<p style="color:#475569;font-style:italic;">Chargez une image de fond, ajoutez au moins une proposition et une zone de dépôt pour voir l\'aperçu interactif.</p>';
  }

  var node0 = realParts && realParts.prt && realParts.prt.nodes && realParts.prt.nodes[0];

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.jxgdrop') + ' JSXGraph', badgeColor: '#b45309', noteBg: '#fffbeb', noteColor: '#92400e',
    prefix: 'jd', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : glisser les propositions vers les bonnes zones.</em></p>'),
    exampleLabel: '',
    exampleHTML: exampleHTML,
    fbOk: node0 ? _jdTokenizeStack(node0.truefeedback) : '',
    fbWrong: node0 ? _jdTokenizeStack(node0.falsefeedback) : '',
    fbGenAuto: realParts ? realParts.solutionImg : '',
    fbGen: state.fbGen
  });
}
window.jdRefreshPreview = _hsWireSimplePreview('jxgdrop', 'jd', 'jd-preview-container', 'fp-jxgdrop', renderPreviewHTML_jxgdrop, true);
